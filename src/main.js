/**
 * Main Application Controller: Leelio 3D Avatar
 * Integrates:
 * - 3D Polygonal Mesh Engine (Three.js WebGL, ARKit & Oculus Visemes)
 * - Gemini Live API Protocol (WebSockets bidirectional 16k/24k PCM, Server VAD)
 * - Local Leelio Brain & Snappy Web Speech VAD
 * - Real-Time Audio Reactive Visualizer & HUD
 */

import { PhotoAvatarRenderer } from "./photoAvatarRenderer.js";
import { AvatarRenderer } from "./avatarRenderer.js";
import { GeminiLiveClient } from "./geminiLiveClient.js";
import { AudioEngine } from "./audioEngine.js";
import { ConversationBrain } from "./conversationBrain.js";

// DOM Elements
const canvasContainer = document.getElementById("canvas-container");
const photoCanvas = document.getElementById("photo-canvas");
const videoAvatar = document.getElementById("video-avatar");
const webglCanvas = document.getElementById("webgl-canvas");
const splitBadgeLeft = document.getElementById("split-badge-left");
const splitBadgeRight = document.getElementById("split-badge-right");
const avatarModeBtn = document.getElementById("avatar-mode-btn");
const avatarModeVal = document.getElementById("avatar-mode-val");
const mainActionBtn = document.getElementById("main-action-btn");
const micBtn = document.getElementById("mic-btn");
const micLabel = document.getElementById("mic-label");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const dialogueBubble = document.getElementById("dialogue-bubble");
const userTranscript = document.getElementById("user-transcript");
const fpsVal = document.getElementById("fps-val");
const protocolVal = document.getElementById("protocol-val");
const visualizerCanvas = document.getElementById("visualizer");
const visualizerCtx = visualizerCanvas.getContext("2d");
const micMeterContainer = document.getElementById("mic-meter-container");
const micMeterFill = document.getElementById("mic-meter-fill");
const diagnosticBanner = document.getElementById("diagnostic-banner");

const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const geminiKeyInput = document.getElementById("gemini-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const textInput = document.getElementById("text-input");
const sendTextBtn = document.getElementById("send-text-btn");

// App State
let photoRenderer = null;
let meshRenderer = null;
let activeAvatarMode = "photo"; // "photo" (neural mimic), "split" (side-by-side), "video" (target stream), or "mesh" (3D)
let geminiLive = null;
let localAudioEngine = null;
let localBrain = null;
let isConversationActive = false;
let currentMode = "gemini-live"; // "gemini-live" or "local"

// Load saved key from localStorage or input default
const savedKey = localStorage.getItem("GEMINI_API_KEY") || "";
geminiKeyInput.value = savedKey;

function initApp() {
  // 1. Initialize Original Photo Avatar Engine (Default 2.5D HeyGen-style portrait)
  photoRenderer = new PhotoAvatarRenderer(photoCanvas, {
    onFpsUpdate: (fps) => {
      if (fpsVal && (activeAvatarMode === "photo" || activeAvatarMode === "split")) fpsVal.textContent = `${fps} FPS`;
    }
  });

  // 2. Initialize Gemini Live Protocol Client
  geminiLive = new GeminiLiveClient({
    onStatus: (status) => {
      console.log("[Gemini Live Status]", status);
      statusText.textContent = status;
      if (status.includes("LIVE")) {
        statusDot.style.background = "#2ed573";
        if (protocolVal) protocolVal.textContent = "Gemini 3.8 Live";
      } else if (status.includes("CONNECTING")) {
        statusDot.style.background = "#ffa502";
      } else if (status.includes("ERROR")) {
        statusDot.style.background = "#e74c3c";
      }
    },
    onTranscript: (text, speaker) => {
      if (speaker === "Leelio" || speaker === "Operative Lyra") {
        dialogueBubble.textContent = text;
      } else {
        userTranscript.textContent = `"${text}"`;
      }
    },
    onSpeakingChange: (isSpeaking) => {
      if (photoRenderer) photoRenderer.setSpeakingState(isSpeaking);
      if (meshRenderer) meshRenderer.setSpeakingState(isSpeaking);
      if (videoAvatar && (activeAvatarMode === "video" || activeAvatarMode === "split")) {
        if (isSpeaking) {
          videoAvatar.play().catch(() => {});
        } else {
          videoAvatar.pause();
        }
      }
      if (isSpeaking) {
        micBtn.classList.add("speaking");
        micLabel.textContent = "Speaking";
        statusText.textContent = "LEELIO SPEAKING";
        statusDot.style.background = "#00d2d3";
      } else {
        micBtn.classList.remove("speaking");
        if (isConversationActive) {
          micLabel.textContent = "Listening";
          statusText.textContent = "GEMINI LIVE // LISTENING";
          statusDot.style.background = "#2ed573";
        }
      }
    },
    onError: (err) => {
      console.error("[Gemini Live Error]", err);
      showDiagnostic(`Gemini Live connection error: ${err.message || "Failed to reach WebSocket endpoint"}`);
    }
  });

  // 3. Initialize Local Persona Fallback
  localBrain = new ConversationBrain();
  localAudioEngine = new AudioEngine({
    onDiagnostic: (msg) => showDiagnostic(msg),
    onSpeechStart: () => {
      micBtn.classList.add("listening");
      micLabel.textContent = "Listening";
      statusDot.style.background = "#2ed573";
      statusText.textContent = "LISTENING // SPEAK FREELY";
    },
    onSpeechResult: ({ current }) => {
      if (current) userTranscript.textContent = `"${current}"`;
    },
    onUserUtterance: (committedText) => {
      handleLocalUserSpeech(committedText);
    },
    onSpeechEnd: () => {
      micBtn.classList.remove("listening");
      micLabel.textContent = isConversationActive ? "Active" : "Tap to Talk";
    },
    onStateChange: (state) => {
      if (state.isSpeaking) {
        photoRenderer?.setSpeakingState(true);
        meshRenderer?.setSpeakingState(true);
        if (videoAvatar && (activeAvatarMode === "video" || activeAvatarMode === "split")) {
          videoAvatar.play().catch(() => {});
        }
        micBtn.classList.add("speaking");
        micLabel.textContent = "Speaking";
        statusDot.style.background = "#00d2d3";
      } else {
        photoRenderer?.setSpeakingState(false);
        meshRenderer?.setSpeakingState(false);
        if (videoAvatar && (activeAvatarMode === "video" || activeAvatarMode === "split")) {
          videoAvatar.pause();
        }
        micBtn.classList.remove("speaking");
        if (isConversationActive) {
          statusDot.style.background = "#2ed573";
          micLabel.textContent = "Listening";
        }
      }
    }
  });

  // 4. Start visualizer & lip-sync loop
  requestAnimationFrame(renderLoop);

  // 5. Setup UI Event Handlers
  setupEvents();

  // Check URL query parameter (e.g. ?mode=split)
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get("mode");
  if (initialMode && ["photo", "split", "video", "mesh"].includes(initialMode)) {
    setAvatarMode(initialMode);
  }

  // Initial greeting
  dialogueBubble.textContent = "Hey! I'm Leelio. Great to meet you! How's your day going?";
  if (protocolVal) protocolVal.textContent = savedKey ? "Gemini 3.8 Live" : "Leelio Brain";
}

function showDiagnostic(msg) {
  if (diagnosticBanner) {
    diagnosticBanner.textContent = msg;
    diagnosticBanner.style.display = "block";
    setTimeout(() => {
      diagnosticBanner.style.display = "none";
    }, 6000);
  }
}

// Unified Render & Lip-Sync Loop
function renderLoop() {
  requestAnimationFrame(renderLoop);

  const w = visualizerCanvas.width;
  const h = visualizerCanvas.height;
  visualizerCtx.clearRect(0, 0, w, h);

  let displayEnergy = 0;
  let lipValues = null;

  if (currentMode === "gemini-live" && geminiLive && geminiLive.isConnected) {
    lipValues = geminiLive.getLipSyncValues();
    if (geminiLive.isSpeaking) {
      displayEnergy = lipValues.volume || 0;
    } else if (geminiLive.isListening) {
      // Show listening pulse
      displayEnergy = 0.15;
    }
  } else if (localAudioEngine) {
    lipValues = localAudioEngine.getLipSyncValues();
    if (localAudioEngine.isSpeaking) {
      displayEnergy = lipValues.volume || 0;
    } else if (localAudioEngine.isListening) {
      displayEnergy = localAudioEngine.getMicLevel();
      if (micMeterFill) {
        micMeterFill.style.width = `${Math.min(100, Math.round(displayEnergy * 100))}%`;
      }
    }
  }

  // Update Avatar Face Lip-Sync & Morph Targets
  if (lipValues) {
    if (photoRenderer) photoRenderer.setAudioLipSync(lipValues);
    if (meshRenderer) meshRenderer.setAudioLipSync(lipValues);
  }

  // Draw HUD Visualizer Waveform
  const bars = 9;
  const barWidth = 4;
  const gap = 5;
  const startX = (w - (bars * (barWidth + gap))) / 2;

  const isSpeaking = (currentMode === "gemini-live" && geminiLive?.isSpeaking) || localAudioEngine?.isSpeaking;
  const isListening = (currentMode === "gemini-live" && geminiLive?.isListening) || localAudioEngine?.isListening;

  for (let i = 0; i < bars; i++) {
    const factor = Math.sin((i / (bars - 1)) * Math.PI);
    const barHeight = Math.max(3, factor * (displayEnergy * (h - 4) + 4));
    const x = startX + i * (barWidth + gap);
    const y = (h - barHeight) / 2;

    if (isSpeaking) {
      visualizerCtx.fillStyle = "#00d2d3"; // Cyan for AI speaking
    } else if (isListening && displayEnergy > 0.08) {
      visualizerCtx.fillStyle = "#2ed573"; // Bright green for hearing voice
    } else if (isListening) {
      visualizerCtx.fillStyle = "#ffa502"; // Amber standby
    } else {
      visualizerCtx.fillStyle = "#747d8c";
    }
    visualizerCtx.fillRect(x, y, barWidth, barHeight);
  }
}

function setAvatarMode(mode) {
  activeAvatarMode = mode;
  if (mode === "photo") {
    if (canvasContainer) canvasContainer.classList.remove("split-mode");
    photoCanvas.style.display = "block";
    if (photoRenderer) photoRenderer.unsyncVideo();
    if (videoAvatar) {
      videoAvatar.style.display = "none";
      videoAvatar.pause();
    }
    webglCanvas.style.display = "none";
    if (splitBadgeLeft) splitBadgeLeft.style.display = "none";
    if (splitBadgeRight) splitBadgeRight.style.display = "none";
    if (avatarModeVal) avatarModeVal.textContent = "🌟 Neural Mimic";
    if (photoRenderer) photoRenderer.resize();
  } else if (mode === "split") {
    if (canvasContainer) canvasContainer.classList.add("split-mode");
    photoCanvas.style.display = "block";
    if (videoAvatar) {
      videoAvatar.style.display = "block";
      videoAvatar.loop = true;
      if (photoRenderer) {
        photoRenderer.syncWithVideo(videoAvatar);
      }
      videoAvatar.play().catch(() => {});
    }
    webglCanvas.style.display = "none";
    if (splitBadgeLeft) {
      splitBadgeLeft.style.display = "block";
      splitBadgeLeft.innerHTML = '🌟 Real-Time Neural Mimic <span style="font-size:0.75em; color:#2ed573;">● PHASE-LOCKED</span>';
    }
    if (splitBadgeRight) {
      splitBadgeRight.style.display = "block";
      splitBadgeRight.innerHTML = '🎯 Target Stream (HeyGen) <span style="font-size:0.75em; color:#f39c12;">● GROUND TRUTH</span>';
    }
    if (avatarModeVal) avatarModeVal.textContent = "🎯 Side-by-Side";
    if (photoRenderer) photoRenderer.resize();
  } else if (mode === "video") {
    if (canvasContainer) canvasContainer.classList.remove("split-mode");
    photoCanvas.style.display = "none";
    if (photoRenderer) photoRenderer.unsyncVideo();
    if (videoAvatar) {
      videoAvatar.style.display = "block";
      videoAvatar.currentTime = 0;
      videoAvatar.play().catch(e => console.log("Video playback waiting for user gesture:", e));
    }
    webglCanvas.style.display = "none";
    if (splitBadgeLeft) splitBadgeLeft.style.display = "none";
    if (splitBadgeRight) splitBadgeRight.style.display = "none";
    if (avatarModeVal) avatarModeVal.textContent = "🎥 Target Stream";
    if (fpsVal) fpsVal.textContent = "60 FPS";
  } else if (mode === "mesh") {
    if (canvasContainer) canvasContainer.classList.remove("split-mode");
    photoCanvas.style.display = "none";
    if (photoRenderer) photoRenderer.unsyncVideo();
    if (videoAvatar) {
      videoAvatar.style.display = "none";
      videoAvatar.pause();
    }
    webglCanvas.style.display = "block";
    if (splitBadgeLeft) splitBadgeLeft.style.display = "none";
    if (splitBadgeRight) splitBadgeRight.style.display = "none";
    if (avatarModeVal) avatarModeVal.textContent = "🤖 3D Mesh";
    if (!meshRenderer) {
      meshRenderer = new AvatarRenderer(webglCanvas, {
        onFpsUpdate: (fps) => {
          if (fpsVal && activeAvatarMode === "mesh") fpsVal.textContent = `${fps} FPS`;
        }
      });
    } else {
      meshRenderer.onWindowResize();
    }
  }
}

function playJessicaTargetAnimation() {
  const quote = "Hello, I'm Jessica. I fell from the sky and I'm here to cause havoc.";
  dialogueBubble.textContent = quote;
  statusText.textContent = "TARGET ANIMATION // JESSICA HAVOC (SYNCED)";
  statusDot.style.background = "#f39c12";

  // If in 3D mesh mode, default to split mode so user can compare side-by-side
  if (activeAvatarMode === "mesh") {
    setAvatarMode("split");
  }

  // Phase-lock neural photo avatar to the video timeline
  if (videoAvatar) {
    videoAvatar.currentTime = 0;
    videoAvatar.muted = false;

    if (photoRenderer) {
      photoRenderer.syncWithVideo(videoAvatar);
    }

    videoAvatar.play().then(() => {
      micBtn.classList.add("speaking");
      micLabel.textContent = "Speaking";
      showDiagnostic("Phase-locked neural avatar to Jessica target video stream (kinematic ground truth)!");
    }).catch(err => {
      console.warn("Audio autoplay blocked by browser policy, falling back to muted video + TTS:", err);
      videoAvatar.muted = true;
      videoAvatar.play().catch(() => {});
      localAudioEngine.speak(quote);
    });

    videoAvatar.onended = () => {
      micBtn.classList.remove("speaking");
      micLabel.textContent = isConversationActive ? "Listening" : "Tap to Talk";
      statusText.textContent = isConversationActive ? "LISTENING // SPEAK FREELY" : "ONLINE // READY";
      statusDot.style.background = "#2ed573";
      if (activeAvatarMode !== "split" && photoRenderer) {
        photoRenderer.unsyncVideo();
      }
    };
  } else if (photoRenderer) {
    photoRenderer.playTargetMimicSequence();
    localAudioEngine.speak(quote);
  }
}

function setupEvents() {
  // Avatar Mode Toggle: 🌟 Neural Mimic <-> 🎯 Side-by-Side <-> 🎥 Target Stream <-> 🤖 3D Mesh
  if (avatarModeBtn) {
    avatarModeBtn.addEventListener("click", () => {
      if (activeAvatarMode === "photo") {
        setAvatarMode("split");
      } else if (activeAvatarMode === "split") {
        setAvatarMode("video");
      } else if (activeAvatarMode === "video") {
        setAvatarMode("mesh");
      } else {
        setAvatarMode("photo");
      }
    });
  }

  // Tap video to toggle play/pause
  if (videoAvatar) {
    videoAvatar.addEventListener("click", () => {
      if (videoAvatar.paused) {
        videoAvatar.play().catch(() => {});
      } else {
        videoAvatar.pause();
      }
    });
  }

  // Main hands-free action button
  mainActionBtn.addEventListener("click", async () => {
    if (!isConversationActive) {
      startConversation();
    } else {
      stopConversation();
    }
  });

  // Secondary circular mic button
  micBtn.addEventListener("click", () => {
    mainActionBtn.click();
  });

  // Text message submission
  sendTextBtn.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (!text) return;
    textInput.value = "";
    userTranscript.textContent = `"${text}"`;

    if (currentMode === "gemini-live" && geminiLive && geminiLive.isConnected) {
      geminiLive.sendTextMessage(text);
    } else {
      handleLocalUserSpeech(text);
    }
  });

  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendTextBtn.click();
    }
  });

  // Config Settings Panel
  settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("open");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsPanel.classList.remove("open");
  });

  saveKeyBtn.addEventListener("click", () => {
    const key = geminiKeyInput.value.trim();
    if (key) {
      localStorage.setItem("GEMINI_API_KEY", key);
      localBrain.setApiKey(key);
      showDiagnostic("Gemini API Key saved. Gemini 3.8 Live protocol armed!");
      if (protocolVal) protocolVal.textContent = "Gemini 3.8 Live";
    } else {
      localStorage.removeItem("GEMINI_API_KEY");
      showDiagnostic("Using local persona fallback mode.");
      if (protocolVal) protocolVal.textContent = "Local Persona";
    }
    settingsPanel.classList.remove("open");
  });

  // Quick Action Chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      userTranscript.textContent = `"${prompt}"`;

      if (prompt === "Hello Jessica") {
        playJessicaTargetAnimation();
        return;
      }

      if (currentMode === "gemini-live" && geminiLive && geminiLive.isConnected) {
        geminiLive.sendTextMessage(prompt);
      } else {
        handleLocalUserSpeech(prompt);
      }
    });
  });

  // Handle window resizing across all renderers & split mode
  window.addEventListener("resize", () => {
    if (photoRenderer) photoRenderer.resize();
    if (meshRenderer) meshRenderer.onWindowResize();
  });
}

async function startConversation() {
  const apiKey = geminiKeyInput.value.trim() || localStorage.getItem("GEMINI_API_KEY");

  isConversationActive = true;
  mainActionBtn.textContent = "⏹ End Conversation";
  mainActionBtn.classList.add("active");
  micMeterContainer.style.display = "flex";

  if (apiKey) {
    currentMode = "gemini-live";
    statusText.textContent = "CONNECTING GEMINI 3.8 LIVE PROTOCOL...";
    dialogueBubble.textContent = "Connecting to Gemini 3.8 Live bidirectional audio stream...";

    try {
      await geminiLive.connect(apiKey);
      console.log("[App] Gemini Live connected successfully");
    } catch (err) {
      console.warn("[App] Gemini Live connection failed, falling back to local engine:", err);
      showDiagnostic("Live WebSocket connection failed. Switching to Leelio's local brain.");
      currentMode = "local";
      await startLocalConversation();
    }
  } else {
    // No API key saved: chat instantly with Leelio's built-in conversational brain
    currentMode = "local";
    await startLocalConversation();
  }
}

async function startLocalConversation() {
  if (protocolVal) protocolVal.textContent = "Leelio Brain";
  statusText.textContent = "LISTENING // SPEAK FREELY";
  dialogueBubble.textContent = "Hey! I'm listening...";
  await localAudioEngine.startConversation();
  const greeting = "Hey there! I'm Leelio. What's on your mind today?";
  dialogueBubble.textContent = greeting;
  localAudioEngine.speak(greeting);
}

function stopConversation() {
  isConversationActive = false;
  mainActionBtn.textContent = "🎙️ Start Voice Conversation";
  mainActionBtn.classList.remove("active");
  micMeterContainer.style.display = "none";

  if (geminiLive && geminiLive.isConnected) {
    geminiLive.disconnect();
  }
  if (localAudioEngine) {
    localAudioEngine.stopConversation();
  }

  if (photoRenderer) photoRenderer.setSpeakingState(false);
  if (meshRenderer) meshRenderer.setSpeakingState(false);
  if (videoAvatar && (activeAvatarMode === "video" || activeAvatarMode === "split")) {
    videoAvatar.pause();
  }

  statusText.textContent = "STANDBY // READY";
  statusDot.style.background = "#ffa502";
  userTranscript.textContent = "";
}

async function handleLocalUserSpeech(text) {
  if (!text || !text.trim()) return;

  statusDot.style.background = "#ffa502";
  statusText.textContent = "THINKING...";

  try {
    const response = await localBrain.respond(text);
    dialogueBubble.textContent = response;
    localAudioEngine.speak(response);
  } catch (err) {
    console.error("Local brain error:", err);
    const errReply = "Sorry, I didn't quite catch that. Could you say that again?";
    dialogueBubble.textContent = errReply;
    localAudioEngine.speak(errReply);
  }
}

// Boot application
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
