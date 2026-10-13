# Conversational AI Avatar WebGL Studio 🚀

An interactive WebGL 3D/2D conversational AI avatar powered by Three.js, Web Audio API, and Speech Recognition. Built to run at a solid **60 FPS on standard Intel UHD/Iris integrated graphics** with zero GPU overhead.

---

## ✨ Features

- **High-Performance WebGL Engine**: Runs at 60 FPS in any standard browser (Chrome, Edge, Firefox) using Three.js hardware acceleration.
- **True 3D Parallax & Depth**: Perspective tracking that moves with your mouse or touch input.
- **Lifelike Idle Animation**: Natural chest breathing and head drift so the avatar feels alive.
- **Dynamic Eye Blinking**: Organic, randomized blink intervals.
- **Audio-Reactive Lip-Sync**: Real-time mouth and jaw articulation mapped to voice speech frequencies and volume via the Web Audio API.
- **Conversational Voice Engine (STT & TTS)**:
  - Phone-style circular **Tap to Talk** microphone button.
  - Native Web Speech recognition (STT) and voice synthesis (TTS).
  - Built-in tactical persona (*Operative Lyra*).
  - Optional **Gemini API** integration for open-ended generative AI conversations.
- **Zero Heavy Dependencies**: Runs with zero installation via the included lightweight PowerShell server, or standard Vite/npm.

---

## 🚀 Quick Start

### Method 1: Instant Server (No install required)
Just run in PowerShell:
```powershell
.\start-server.ps1
```
This automatically launches your default browser to `http://localhost:5173/`.

### Method 2: Standard Vite / Node.js
If you have Node.js installed:
```bash
npm install
npm run dev
```

---

## 🎙️ How to Talk to Your Avatar

1. **Tap the Microphone Button**: Click the orange circular button at the bottom of the screen (or use the quick question chips).
2. **Speak**: The app captures your voice in real-time.
3. **Listen & Watch**: Operative Lyra responds aloud while her mouth, jaw, and facial expressions animate in sync!

---

## ⚙️ Configuration & Customization

- **Change Avatar Image**: Replace `public/avatar.jpg` with any portrait image.
- **Gemini API Key**: Click **⚙ Config** in the top right and enter your Gemini API key for full AI intelligence.
