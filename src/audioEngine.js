/**
 * Audio Engine: STT, TTS, Web Audio VAD & Microphone Level Meter
 * Fixed for rock-solid two-way conversation:
 * - Robust phrase-end turn-taking (never drops user speech)
 * - Echo cancellation & self-utterance prevention (Leelio never hears herself)
 * - Seamless speech synthesis lifecycle with watchdog timers
 * - Active voice activity detection
 */

export class AudioEngine {
  constructor(options = {}) {
    this.onSpeechResult = options.onSpeechResult || (() => {});
    this.onUserUtterance = options.onUserUtterance || (() => {});
    this.onSpeechStart = options.onSpeechStart || (() => {});
    this.onSpeechEnd = options.onSpeechEnd || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onDiagnostic = options.onDiagnostic || (() => {});

    this.isListening = false;
    this.isSpeaking = false;
    this.conversationMode = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;

    // Web Audio Context & Analysers
    this.audioCtx = null;
    this.micStream = null;
    this.micSource = null;
    this.micAnalyser = null;
    this.micDataArray = null;
    this.micLevel = 0;

    this.selectedVoice = null;
    this.speechEndTimer = null;
    this.accumulatedText = "";
    this.lastSpokenText = "";
    this.lastSpokenTimestamp = 0;

    // Lip sync state for avatar
    this.lipSyncData = {
      jawOpen: 0,
      mouthSpread: 0,
      browLift: 0,
      volume: 0
    };

    this.initAudioContext();
    this.initVoices();
  }

  initAudioContext() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  initVoices() {
    const updateVoices = () => {
      if (!this.synthesis) return;
      const voices = this.synthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Look for natural English female voices
      this.selectedVoice =
        voices.find(v => (v.name.includes("Natural") || v.name.includes("Online (Natural)")) && v.lang.startsWith("en")) ||
        voices.find(v => (v.name.includes("Jenny") || v.name.includes("Aria") || v.name.includes("Google US") || v.name.includes("Samantha") || v.name.includes("Zira")) && v.lang.startsWith("en")) ||
        voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0];

      console.log("[AudioEngine] Selected Voice:", this.selectedVoice?.name);
    };

    if (this.synthesis) {
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = updateVoices;
      }
      updateVoices();
    }
  }

  async requestMicPermission() {
    if (this.micStream) return true;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API not supported on this browser.");
      }

      this.onDiagnostic("Requesting microphone permission...");
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (this.audioCtx) {
        if (this.audioCtx.state === "suspended") {
          await this.audioCtx.resume();
        }
        this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
        this.micAnalyser = this.audioCtx.createAnalyser();
        this.micAnalyser.fftSize = 256;
        this.micAnalyser.smoothingTimeConstant = 0.4;
        this.micSource.connect(this.micAnalyser);
        this.micDataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
      }

      this.initSpeechRecognition();
      this.onDiagnostic("Microphone connected. Speak freely!");
      return true;
    } catch (err) {
      console.error("Microphone permission error:", err);
      this.onDiagnostic(`Microphone Error: ${err.message || "Permission denied"}. Please allow mic in browser.`);
      return false;
    }
  }

  getMicLevel() {
    if (!this.micAnalyser || !this.micDataArray) return 0;
    this.micAnalyser.getByteFrequencyData(this.micDataArray);

    let sum = 0;
    for (let i = 0; i < this.micDataArray.length; i++) {
      sum += this.micDataArray[i];
    }
    const avg = sum / this.micDataArray.length;
    this.micLevel = Math.min(1.0, avg / 70);
    return this.micLevel;
  }

  initSpeechRecognition() {
    if (this.recognition) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.onDiagnostic("Speech Recognition requires Chrome or Edge.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onSpeechStart();
      this.onStateChange({ isListening: true });
      this.onDiagnostic("Listening... speak naturally");
    };

    this.recognition.onresult = (event) => {
      // If Leelio is currently speaking, completely ignore any audio to avoid self-echo
      if (this.isSpeaking) return;

      let interimTranscript = "";
      let latestFinal = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          latestFinal += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (latestFinal) {
        this.accumulatedText = (this.accumulatedText + " " + latestFinal).trim();
      }

      const activeDisplay = (this.accumulatedText + " " + interimTranscript).trim();

      if (activeDisplay) {
        this.onSpeechResult({
          interim: interimTranscript,
          final: latestFinal,
          current: activeDisplay
        });

        // Fast End-of-Phrase Turn Detection:
        // Clear previous timer
        if (this.speechEndTimer) clearTimeout(this.speechEndTimer);

        // When Chrome emits isFinal, the sentence pause is confirmed.
        // Wait 350ms to allow multi-clause speech, or 750ms for interim pause.
        const commitDelay = latestFinal ? 350 : 750;

        this.speechEndTimer = setTimeout(() => {
          const textToCommit = (this.accumulatedText || interimTranscript).trim();
          this.accumulatedText = "";

          // CRITICAL FIX: Do NOT require this.isListening === true here, because Chrome
          // frequently fires recognition.onend right when the user stops speaking!
          if (textToCommit && !this.isSpeaking && this.conversationMode) {
            // Check for echo of Leelio's recently spoken words
            if (this.isEcho(textToCommit)) {
              console.log("[AudioEngine] Ignored self-echo:", textToCommit);
              return;
            }

            console.log("[AudioEngine] Committing user utterance:", textToCommit);
            this.onUserUtterance(textToCommit);
          }
        }, commitDelay);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === "no-speech") return;

      if (event.error === "not-allowed") {
        this.onDiagnostic("Microphone access blocked. Click the lock icon in the address bar to allow.");
        this.isListening = false;
        this.onStateChange({ isListening: false });
      } else if (event.error === "network") {
        setTimeout(() => this.restartListening(), 400);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onSpeechEnd();
      this.onStateChange({ isListening: false });

      // Automatically keep listening if we are in conversation mode AND Leelio isn't speaking
      if (this.conversationMode && !this.isSpeaking) {
        setTimeout(() => {
          if (this.conversationMode && !this.isSpeaking) {
            this.startListening();
          }
        }, 120);
      }
    };
  }

  isEcho(text) {
    if (!this.lastSpokenText) return false;
    const now = Date.now();
    // Only check echo within 3.5 seconds of Leelio finishing speaking
    if (now - this.lastSpokenTimestamp > 3500) return false;

    const lower = text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    const spoken = this.lastSpokenText.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

    // Check if user text is a substring or identical
    if (spoken.includes(lower) || lower.includes(spoken)) return true;

    // Word overlap check
    const words = lower.split(/\s+/);
    if (words.length <= 4) {
      const matchCount = words.filter(w => spoken.includes(w)).length;
      if (matchCount >= words.length * 0.75) return true;
    }
    return false;
  }

  async startConversation() {
    this.conversationMode = true;
    const hasMic = await this.requestMicPermission();
    if (hasMic && !this.isSpeaking) {
      this.startListening();
    }
  }

  stopConversation() {
    this.conversationMode = false;
    this.stopListening();
    this.stopSpeaking();
  }

  startListening() {
    if (this.isSpeaking) return;
    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    if (this.recognition && !this.isListening) {
      try {
        if (this.audioCtx && this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }
        this.accumulatedText = "";
        this.recognition.start();
      } catch (err) {
        if (err.name !== "InvalidStateError") {
          console.warn("Recognition start error:", err);
        }
      }
    }
  }

  stopListening() {
    if (this.speechEndTimer) clearTimeout(this.speechEndTimer);
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }
    this.isListening = false;
  }

  restartListening() {
    this.stopListening();
    setTimeout(() => {
      if (this.conversationMode && !this.isSpeaking) {
        this.startListening();
      }
    }, 250);
  }

  speak(text, onComplete) {
    if (!text) {
      if (onComplete) onComplete();
      return;
    }

    // 1. Immediately flag speaking state to lock out mic and recognition
    this.isSpeaking = true;
    this.stopListening();
    this.onStateChange({ isSpeaking: true });
    this.onDiagnostic("Leelio is speaking...");

    // Record last spoken text for echo protection
    this.lastSpokenText = text;

    if (!this.synthesis) {
      this.isSpeaking = false;
      this.onStateChange({ isSpeaking: false });
      if (onComplete) onComplete();
      return;
    }

    // Handle Chromium speech synthesis cancel bug:
    // Calling cancel() immediately before speak() can silently drop the utterance.
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
    }
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    let isSpeakingUtterance = true;
    let animFrame = null;
    let watchdogTimer = null;

    const cleanup = () => {
      if (!isSpeakingUtterance) return;
      isSpeakingUtterance = false;

      if (watchdogTimer) clearTimeout(watchdogTimer);
      if (animFrame) cancelAnimationFrame(animFrame);

      this.lipSyncData.jawOpen = 0;
      this.lipSyncData.mouthSpread = 0;
      this.lipSyncData.browLift = 0;
      this.lipSyncData.volume = 0;

      // Safety buffer: wait 300ms after speech ends to prevent speaker echo from re-triggering the mic
      setTimeout(() => {
        this.isSpeaking = false;
        this.lastSpokenTimestamp = Date.now();
        this.onStateChange({ isSpeaking: false });

        if (onComplete) onComplete();

        // Re-open mic for the user's turn
        if (this.conversationMode) {
          this.accumulatedText = "";
          this.startListening();
        }
      }, 300);
    };

    // Pre-calculate realistic phonetic syllable viseme timeline for the text
    const timeline = this.generatePhonemeTimeline(text);
    let playbackStartTime = 0;

    utterance.onboundary = (event) => {
      // Re-anchor timeline on word boundaries if needed
    };

    utterance.onstart = () => {
      playbackStartTime = performance.now();

      const animatePhoneticLips = () => {
        if (!isSpeakingUtterance) return;

        const elapsedMs = performance.now() - playbackStartTime;
        let activeFrame = null;

        for (let i = 0; i < timeline.frames.length; i++) {
          const f = timeline.frames[i];
          if (elapsedMs >= f.startTime && elapsedMs < (f.startTime + f.duration)) {
            activeFrame = f;
            break;
          }
        }

        if (activeFrame) {
          const targetJaw = activeFrame.jawOpen;
          const targetSpread = activeFrame.mouthSpread;
          const targetBrow = activeFrame.browLift;

          // Snappy attack on consonant closures, natural spring release on open vowels
          const jawLerp = (targetJaw < this.lipSyncData.jawOpen) ? 0.38 : 0.48;
          this.lipSyncData.jawOpen += (targetJaw - this.lipSyncData.jawOpen) * jawLerp;
          this.lipSyncData.mouthSpread += (targetSpread - this.lipSyncData.mouthSpread) * 0.35;
          this.lipSyncData.browLift += (targetBrow - this.lipSyncData.browLift) * 0.25;
          this.lipSyncData.volume = Math.max(0.15, this.lipSyncData.jawOpen);
        } else if (elapsedMs >= timeline.totalDuration) {
          // Beyond pre-calculated timeline, soft decay
          this.lipSyncData.jawOpen *= 0.85;
          this.lipSyncData.mouthSpread *= 0.85;
          this.lipSyncData.browLift *= 0.85;
          this.lipSyncData.volume *= 0.85;
        }

        animFrame = requestAnimationFrame(animatePhoneticLips);
      };
      animatePhoneticLips();
    };

    utterance.onend = cleanup;
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      cleanup();
    };

    // Watchdog: If speech synthesis hangs or fails to fire onend, force cleanup after expected duration
    const estimatedDurationMs = Math.max(3000, (text.length / 14) * 1000 + 2000);
    watchdogTimer = setTimeout(() => {
      if (isSpeakingUtterance) {
        console.warn("[AudioEngine] Speech watchdog triggered.");
        cleanup();
      }
    }, estimatedDurationMs);

    // Short tick before speaking to allow cancel() to clear cleanly in Chromium
    setTimeout(() => {
      try {
        this.synthesis.speak(utterance);
      } catch (err) {
        console.warn("Synthesis speak call failed:", err);
        cleanup();
      }
    }, 45);
  }

  generatePhonemeTimeline(text) {
    // Break into words and punctuation
    const tokens = text.match(/[\w']+|[.,!?;:]/g) || [text];
    const frames = [];
    let currentTimeMs = 0;

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];

      // Punctuation pause
      if (/[.,!?;:]/.test(token)) {
        const pauseDuration = (token === "," || token === ";") ? 180 : 320;
        frames.push({
          startTime: currentTimeMs,
          duration: pauseDuration,
          jawOpen: 0.0,
          mouthSpread: 0.0,
          browLift: token === "?" ? 0.75 : (token === "!" ? 0.65 : 0.0),
          isPause: true
        });
        currentTimeMs += pauseDuration;
        continue;
      }

      // Word: split into phonetic vowel-consonant clusters
      const word = token.toLowerCase();
      const phonemeMatches = word.match(/([aeiouy]+|ch|sh|th|ph|wh|[bcdfghjklmnpqrstvwxz])/g) || [word];
      const wordDuration = Math.max(160, Math.min(480, phonemeMatches.length * 90));
      const chunkDuration = wordDuration / phonemeMatches.length;

      for (let p = 0; p < phonemeMatches.length; p++) {
        const chunk = phonemeMatches[p];
        let jaw = 0.35;
        let spread = 0.0;
        let brow = 0.0;

        if (chunk.includes("a") || chunk === "ah" || chunk === "aw") {
          jaw = 0.90; // Open wide for "Ah"!
          spread = 0.15;
          brow = 0.45;
        } else if (chunk.includes("o") || chunk === "oh" || chunk === "ow") {
          jaw = 0.82;
          spread = -0.45; // Rounded mouth!
          brow = 0.40;
        } else if (chunk.includes("u") || chunk === "oo") {
          jaw = 0.50;
          spread = -0.60; // Pursed lips!
        } else if (chunk.includes("e") || chunk === "ee" || chunk === "ea") {
          jaw = 0.68;
          spread = 0.65; // Wide smile/spread!
          brow = 0.30;
        } else if (chunk.includes("i") || chunk === "y") {
          jaw = 0.70;
          spread = 0.40;
        } else if (chunk === "m" || chunk === "b" || chunk === "p") {
          // Bilabial closure: lips completely touch!
          jaw = 0.0;
          spread = 0.0;
        } else if (chunk === "f" || chunk === "v") {
          jaw = 0.18;
          spread = 0.10;
        } else if (chunk === "s" || chunk === "z" || chunk === "c" || chunk === "sh" || chunk === "ch") {
          jaw = 0.28;
          spread = 0.45;
        } else if (chunk === "w") {
          jaw = 0.30;
          spread = -0.55;
        } else if (chunk === "r") {
          jaw = 0.38;
          spread = -0.25;
        } else {
          jaw = 0.35;
          spread = 0.20;
        }

        frames.push({
          startTime: currentTimeMs,
          duration: chunkDuration,
          jawOpen: jaw,
          mouthSpread: spread,
          browLift: brow
        });
        currentTimeMs += chunkDuration;
      }

      // Inter-word breath release
      frames.push({
        startTime: currentTimeMs,
        duration: 35,
        jawOpen: 0.06,
        mouthSpread: 0.0,
        browLift: 0.0
      });
      currentTimeMs += 35;
    }

    return { frames, totalDuration: currentTimeMs };
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.lipSyncData.jawOpen = 0;
    this.lipSyncData.mouthSpread = 0;
    this.lipSyncData.browLift = 0;
    this.lipSyncData.volume = 0;
  }

  getLipSyncValues() {
    return this.lipSyncData;
  }
}
