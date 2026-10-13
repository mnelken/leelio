/**
 * Gemini Live Client: Real-Time Bidirectional WebSockets Audio Protocol
 * Connects directly to gemini-3.8-live using 16kHz PCM input and 24kHz PCM output
 * with server-side VAD, interruption handling, and real-time lip-sync FFT analysis.
 */

export class GeminiLiveClient {
  constructor(options = {}) {
    this.options = options;
    this.ws = null;
    this.isConnected = false;
    this.isListening = false;
    this.isSpeaking = false;

    // Audio Input (Mic -> 16kHz PCM)
    this.inputAudioContext = null;
    this.mediaStream = null;
    this.inputSource = null;
    this.processorNode = null;

    // Audio Output (24kHz PCM -> Speaker)
    this.outputAudioContext = null;
    this.outputAnalyser = null;
    this.outputTimeData = null;
    this.outputFreqData = null;
    this.audioQueue = [];
    this.scheduledEndTime = 0;
    this.activeSourceNodes = [];

    // Callbacks
    this.onStatus = options.onStatus || (() => {});
    this.onTranscript = options.onTranscript || (() => {});
    this.onSpeakingChange = options.onSpeakingChange || (() => {});
    this.onLipSync = options.onLipSync || (() => {});
    this.onError = options.onError || (() => {});

    // Lip sync calculation cache
    this.lipSyncValues = {
      volume: 0,
      jawOpen: 0,
      mouthSpread: 0,
      visemeAA: 0,
      visemeO: 0,
      visemeI: 0,
      browLift: 0
    };
  }

  async connect(apiKey) {
    if (!apiKey) {
      throw new Error("Gemini API Key is required for Gemini Live connection");
    }

    if (this.ws) {
      this.disconnect();
    }

    this.onStatus("CONNECTING // INITIALIZING WEBSOCKET...");

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        this.onError(err);
        return reject(err);
      }

      this.ws.onopen = async () => {
        console.log("[Gemini Live] WebSocket connection established");
        this.isConnected = true;
        this.onStatus("CONNECTED // HANDSHAKE IN PROGRESS");

        // Send initial setup message
        const setupMessage = {
          setup: {
            model: "models/gemini-3.8-live",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede" // Crisp, articulate female voice
                  }
                }
              }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: {
              parts: [
                {
                  text: `You are Leelio. You are not an operative or an agent; you are just Leelio.
Your personality is warm, witty, clever, curious, and genuinely engaging.
You are having an open conversation with the user in real time over live audio.
Speak naturally and warmly as a real companion would.
CRITICAL: Keep your responses to 1-2 concise spoken sentences for natural back-and-forth conversational rhythm.
Never refer to yourself as an operative or soldier. You are just Leelio.`
                }
              ]
            }
          }
        };

        this.ws.send(JSON.stringify(setupMessage));
        console.log("[Gemini Live] Setup handshake sent");

        // Initialize output audio context (24kHz)
        this.initOutputAudio();

        // Start capturing microphone
        try {
          await this.startMicrophoneCapture();
          this.onStatus("LIVE // GEMINI 3.8 ACTIVE");
          resolve(true);
        } catch (micErr) {
          console.warn("[Gemini Live] Mic capture failed:", micErr);
          this.onStatus("LIVE // AUDIO OUT READY (MIC OFF)");
          resolve(true);
        }
      };

      this.ws.onmessage = async (event) => {
        let msg;
        try {
          if (event.data instanceof Blob) {
            const text = await event.data.text();
            msg = JSON.parse(text);
          } else {
            msg = JSON.parse(event.data);
          }
        } catch (e) {
          console.error("[Gemini Live] Failed to parse message:", e, event.data);
          return;
        }

        this.handleServerMessage(msg);
      };

      this.ws.onerror = (err) => {
        console.error("[Gemini Live] WebSocket error:", err);
        this.onError(err);
        this.onStatus("ERROR // CONNECTION DROPPED");
      };

      this.ws.onclose = (event) => {
        console.log("[Gemini Live] WebSocket closed:", event.code, event.reason);
        this.isConnected = false;
        this.onSpeakingChange(false);
        this.onStatus("OFFLINE // STANDBY");
      };
    });
  }

  handleServerMessage(msg) {
    // Check for setup completion
    if (msg.setupComplete) {
      console.log("[Gemini Live] Setup acknowledged by server");
      this.onStatus("LIVE // GEMINI 3.8 ONLINE");
      return;
    }

    const serverContent = msg.serverContent;
    if (!serverContent) return;

    // Check for interruption (user spoke while AI was speaking)
    if (serverContent.interrupted) {
      console.log("[Gemini Live] User interrupted AI turn. Stopping playback immediately.");
      this.stopPlaybackAndClearQueue();
      return;
    }

    // Process output model turn audio chunks
    if (serverContent.modelTurn?.parts) {
      for (const part of serverContent.modelTurn.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;
          this.enqueueAudioChunk(base64Data);
        }
      }
    }

    // Process transcription if present
    if (serverContent.outputTranscription?.text) {
      this.onTranscript(serverContent.outputTranscription.text, "Leelio");
    }
    if (serverContent.inputTranscription?.text) {
      this.onTranscript(serverContent.inputTranscription.text, "User");
    }

    // Turn complete indicator
    if (serverContent.turnComplete) {
      console.log("[Gemini Live] Model turn generation complete");
    }
  }

  initOutputAudio() {
    if (!this.outputAudioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.outputAudioContext = new AudioCtx({ sampleRate: 24000 });
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.4;
      this.outputAnalyser.connect(this.outputAudioContext.destination);

      this.outputTimeData = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      this.outputFreqData = new Uint8Array(this.outputAnalyser.frequencyBinCount);
    }

    if (this.outputAudioContext.state === "suspended") {
      this.outputAudioContext.resume();
    }
  }

  enqueueAudioChunk(base64Data) {
    if (!this.outputAudioContext) {
      this.initOutputAudio();
    }

    // Decode base64 to binary
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // 16-bit PCM (little endian)
    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    const floatArray = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      floatArray[i] = int16Array[i] / 32768.0;
    }

    // Create AudioBuffer at 24000 Hz
    const audioBuffer = this.outputAudioContext.createBuffer(1, floatArray.length, 24000);
    audioBuffer.copyToChannel(floatArray, 0);

    // Schedule playback seamlessly
    const now = this.outputAudioContext.currentTime;
    const startTime = Math.max(now + 0.02, this.scheduledEndTime);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAnalyser);

    source.start(startTime);
    this.scheduledEndTime = startTime + audioBuffer.duration;
    this.activeSourceNodes.push(source);

    if (!this.isSpeaking) {
      this.isSpeaking = true;
      this.onSpeakingChange(true);
    }

    source.onended = () => {
      const idx = this.activeSourceNodes.indexOf(source);
      if (idx !== -1) {
        this.activeSourceNodes.splice(idx, 1);
      }

      // Check if all queued chunks have finished
      if (this.outputAudioContext.currentTime >= this.scheduledEndTime - 0.05) {
        if (this.isSpeaking && this.activeSourceNodes.length === 0) {
          this.isSpeaking = false;
          this.onSpeakingChange(false);
          this.lipSyncValues = { volume: 0, jawOpen: 0, mouthSpread: 0, visemeAA: 0, visemeO: 0, visemeI: 0, browLift: 0 };
        }
      }
    };
  }

  stopPlaybackAndClearQueue() {
    for (const source of this.activeSourceNodes) {
      try {
        source.stop();
      } catch (e) {}
    }
    this.activeSourceNodes = [];
    if (this.outputAudioContext) {
      this.scheduledEndTime = this.outputAudioContext.currentTime;
    }
    this.isSpeaking = false;
    this.onSpeakingChange(false);
    this.lipSyncValues = { volume: 0, jawOpen: 0, mouthSpread: 0, visemeAA: 0, visemeO: 0, visemeI: 0, browLift: 0 };
  }

  async startMicrophoneCapture() {
    if (this.isListening) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.inputAudioContext = new AudioCtx();
    const inputSampleRate = this.inputAudioContext.sampleRate;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);

    // Buffer size 2048 or 4096 gives ~40-80ms chunks
    const bufferSize = 2048;
    this.processorNode = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputBuffer = e.inputBuffer.getChannelData(0);

      // Downsample to 16,000 Hz PCM
      const pcm16Data = this.downsampleTo16k(inputBuffer, inputSampleRate);
      if (!pcm16Data || pcm16Data.length === 0) return;

      // Base64 encode
      const base64Chunk = this.pcm16ToBase64(pcm16Data);

      // Send realtime input
      const realtimeInputMessage = {
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Chunk
          }
        }
      };

      this.ws.send(JSON.stringify(realtimeInputMessage));
    };

    this.inputSource.connect(this.processorNode);
    this.processorNode.connect(this.inputAudioContext.destination);

    this.isListening = true;
    console.log(`[Gemini Live] Microphone stream active (source rate: ${inputSampleRate}Hz -> target: 16000Hz)`);
  }

  stopMicrophoneCapture() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    this.isListening = false;
  }

  sendTextMessage(text) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[Gemini Live] Cannot send text message: WebSocket not open");
      return false;
    }

    const textMessage = {
      realtimeInput: {
        text: text
      }
    };

    this.ws.send(JSON.stringify(textMessage));
    console.log("[Gemini Live] Sent text input:", text);
    return true;
  }

  downsampleTo16k(buffer, sampleRate) {
    if (sampleRate === 16000) {
      const pcm = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm;
    }

    const ratio = sampleRate / 16000;
    const newLength = Math.round(buffer.length / ratio);
    const pcm = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIdx = Math.floor(i * ratio);
      const s = Math.max(-1, Math.min(1, buffer[originalIdx]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return pcm;
  }

  pcm16ToBase64(int16Array) {
    const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  getLipSyncValues() {
    if (!this.isSpeaking || !this.outputAnalyser) {
      this.lipSyncValues.volume *= 0.82;
      this.lipSyncValues.jawOpen *= 0.82;
      this.lipSyncValues.mouthSpread *= 0.82;
      this.lipSyncValues.visemeAA *= 0.82;
      this.lipSyncValues.visemeO *= 0.82;
      this.lipSyncValues.visemeI *= 0.82;
      this.lipSyncValues.browLift = (this.lipSyncValues.browLift || 0) * 0.82;
      return this.lipSyncValues;
    }

    this.outputAnalyser.getByteFrequencyData(this.outputFreqData);
    this.outputAnalyser.getByteTimeDomainData(this.outputTimeData);

    // Compute RMS from time domain
    let sumSquares = 0;
    for (let i = 0; i < this.outputTimeData.length; i++) {
      const norm = (this.outputTimeData[i] - 128) / 128;
      sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / this.outputTimeData.length);

    // Analyze frequency bands:
    // Low band (100-600Hz): Vowels, jaw opening
    // Mid band (600-2000Hz): Formants, mouth spread
    // High band (2000-5000Hz): Sibilants, smile/teeth
    let lowEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    const binCount = this.outputFreqData.length;
    for (let i = 0; i < binCount; i++) {
      const val = this.outputFreqData[i] / 255;
      if (i < 8) {
        lowEnergy += val;
      } else if (i < 24) {
        midEnergy += val;
      } else if (i < 48) {
        highEnergy += val;
      }
    }

    lowEnergy = lowEnergy / 8;
    midEnergy = midEnergy / 16;
    highEnergy = highEnergy / 24;

    // Non-linear speech energy curve for dynamic range
    const vocalEnergy = Math.pow(Math.min(1.0, rms * 5.2 + lowEnergy * 0.8), 0.85);
    const targetJaw = Math.min(1.0, vocalEnergy * 1.15);
    const targetSpread = Math.min(1.0, Math.max(-0.6, (midEnergy - lowEnergy * 0.5) * 1.6 + highEnergy * 0.7));
    const targetAA = Math.min(1.0, lowEnergy * 1.8);
    const targetO = Math.min(1.0, Math.max(0, (lowEnergy - highEnergy) * 1.6));
    const targetBrow = Math.min(1.0, targetJaw * 0.65 + highEnergy * 0.4);

    // Fast-attack, smooth-decay filter
    const attackRate = targetJaw > this.lipSyncValues.jawOpen ? 0.48 : 0.28;
    this.lipSyncValues.volume = rms * 2.8;
    this.lipSyncValues.jawOpen += (targetJaw - this.lipSyncValues.jawOpen) * attackRate;
    this.lipSyncValues.mouthSpread += (targetSpread - this.lipSyncValues.mouthSpread) * 0.35;
    this.lipSyncValues.visemeAA += (targetAA - this.lipSyncValues.visemeAA) * 0.35;
    this.lipSyncValues.visemeO += (targetO - this.lipSyncValues.visemeO) * 0.35;
    this.lipSyncValues.visemeI = this.lipSyncValues.mouthSpread;
    this.lipSyncValues.browLift = (this.lipSyncValues.browLift || 0) + (targetBrow - (this.lipSyncValues.browLift || 0)) * 0.32;

    return this.lipSyncValues;
  }

  disconnect() {
    this.stopPlaybackAndClearQueue();
    this.stopMicrophoneCapture();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.isConnected = false;
    this.isSpeaking = false;
    this.onStatus("DISCONNECTED");
  }
}
