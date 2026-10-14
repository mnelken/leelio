/**
 * 3D Avatar WebGL Engine: Auto-Rigged Crimson Commandress
 * 
 * Hardware-accelerated 3D avatar engine powered by AutoRigged3DAvatar.
 * Features:
 *   - Automatic anatomical bone armature & cranial-locked skin weighting
 *   - Synthesized speech viseme morph targets (jawOpen, mouthSmile, browLift, eyeBlink)
 *   - Real-time Gemini Live / Web Speech audio reactivity & conversational visemes
 *   - Natural idle breathing, periodic eyelid blinking & interactive head tracking
 *   - Phase-locked video synchronization with target trajectory telemetry
 *   - Studio PBR lighting & authentic arched doorway background plate
 */

import { AutoRigged3DAvatar } from "./autoRigged3DAvatar.js";

const THREE = window.THREE;

export class AvatarRenderer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Auto-Rigged Avatar Instance
    this.autoRig = null;
    this.isReady = false;

    // Speech & Lip-Sync State
    this.isSpeaking = false;
    this.lipTargets = {
      jawOpen: 0,
      mouthSmile: 0.12,
      browLift: 0.05
    };
    this.currentMorphs = {
      jawOpen: 0,
      mouthSmile: 0.12,
      browLift: 0.05,
      eyeBlink: 0
    };

    // Blinking State
    this.blinkTimer = 0;
    this.nextBlinkTime = 3.0;
    this.blinkDuration = 0.16;
    this.blinkProgress = 0;
    this.isBlinking = false;

    // Interaction & Mouse Head Tracking
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Video Phase-Lock Telemetry
    this.syncedVideo = null;
    this.syncData = null;

    // Performance & FPS Tracking
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101014);

    // 2. Camera: Framed to match reference portrait (waist to peaked cap)
    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
    this.camera.position.set(0.0, 0.42, 2.05);
    this.cameraTarget = new THREE.Vector3(0.0, 0.42, 0.0);
    this.camera.lookAt(this.cameraTarget);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    if (this.renderer.outputColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    // 4. Background Plate (Arched Mahogany Doorway from Target Video)
    const bgLoader = new THREE.TextureLoader();
    bgLoader.load('background_plate.jpg', (bgTex) => {
      if (THREE.sRGBEncoding) bgTex.encoding = THREE.sRGBEncoding;
      const bgGeom = new THREE.PlaneGeometry(2.8, 2.1);
      const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false });
      const bgMesh = new THREE.Mesh(bgGeom, bgMat);
      bgMesh.position.set(0.0, 0.42, -0.65);
      this.scene.add(bgMesh);
    }, undefined, (err) => {
      console.warn("[AvatarRenderer] background_plate.jpg not found, using clean backdrop:", err);
    });

    // 5. Studio Lighting
    this.setupLighting();

    // 6. Load Synchronized Trajectory Data
    fetch('src/targetSyncData.json')
      .then(res => res.json())
      .then(data => {
        this.syncData = data;
        console.log(`[AvatarRenderer] Loaded target trajectory with ${data.frames?.length || 0} frames.`);
      })
      .catch(err => console.warn("[AvatarRenderer] Could not load targetSyncData.json:", err));

    // 7. Initialize Auto-Rigged 3D Character Mesh
    const modelUrl = this.options.modelUrl || 'crimson_153.glb';
    this.autoRig = new AutoRigged3DAvatar({
      modelUrl: modelUrl,
      onLoaded: () => {
        this.isReady = true;
        console.log("[AvatarRenderer] Auto-Rigged 3D Avatar loaded and ready!");
        if (this.options.onLoaded) this.options.onLoaded(this);
      },
      onError: (err) => {
        console.error("[AvatarRenderer] Auto-Rigged 3D Avatar failed to load:", err);
        if (this.options.onError) this.options.onError(err);
      }
    });

    this.autoRig.load(this.scene);

    // 8. Event Listeners
    window.addEventListener("resize", () => this.onWindowResize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: true });

    // 9. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient light: Soft overall illumination
    const ambientLight = new THREE.AmbientLight(0xfff5ee, 1.3);
    this.scene.add(ambientLight);

    // Key Light: Warm directional light from upper front-right
    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.6);
    keyLight.position.set(0.8, 1.2, 1.2);
    this.scene.add(keyLight);

    // Fill Light: Soft neutral-cool light from front-left
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.8);
    fillLight.position.set(-0.8, 0.8, 1.0);
    this.scene.add(fillLight);

    // Rim Light: Backlight for crisp hair, shoulder, and cap silhouette
    const rimLight = new THREE.DirectionalLight(0xaaccff, 0.9);
    rimLight.position.set(0.0, 1.2, -1.2);
    this.scene.add(rimLight);
  }

  onWindowResize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      this.mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }

  syncWithVideo(videoElement) {
    this.syncedVideo = videoElement;
  }

  unsyncVideo() {
    this.syncedVideo = null;
    this.resetLipTargets();
  }

  setSpeakingState(isSpeaking) {
    if (this.isSpeaking === isSpeaking) return;
    this.isSpeaking = isSpeaking;

    if (!isSpeaking) {
      this.resetLipTargets();
    }
  }

  setAudioLipSync(lipValues) {
    if (!lipValues) return;

    const volume = lipValues.volume || 0;
    const jaw = Math.min(1.0, lipValues.jawOpen !== undefined ? lipValues.jawOpen : volume * 1.6);
    const smile = Math.min(1.0, lipValues.smile !== undefined ? lipValues.smile : 0.14);
    const brow = Math.min(1.0, lipValues.browLift !== undefined ? lipValues.browLift : (volume > 0.1 ? 0.25 : 0.05));

    this.lipTargets.jawOpen = jaw;
    this.lipTargets.mouthSmile = 0.12 + smile * 0.45;
    this.lipTargets.browLift = brow;
  }

  resetLipTargets() {
    this.lipTargets.jawOpen = 0;
    this.lipTargets.mouthSmile = 0.12;
    this.lipTargets.browLift = 0.05;
  }

  getInterpolatedFrame(t) {
    if (!this.syncData || !this.syncData.frames || this.syncData.frames.length === 0) {
      return { roll: 0, pitch: 0, yaw: 0, mouthOpen: 0, mouthSmile: 0, browLift: 0, eyeBlink: 0 };
    }
    const frames = this.syncData.frames;
    if (t <= frames[0].t) return frames[0];
    if (t >= frames[frames.length - 1].t) return frames[frames.length - 1];

    let idx = 0;
    while (idx < frames.length - 1 && frames[idx + 1].t <= t) {
      idx++;
    }
    const fA = frames[idx];
    const fB = frames[idx + 1];
    const span = fB.t - fA.t;
    const alpha = span > 0 ? (t - fA.t) / span : 0;

    const lerp = (a, b) => (a || 0) + ((b || 0) - (a || 0)) * alpha;

    return {
      roll: lerp(fA.roll, fB.roll),
      pitch: lerp(fA.pitch, fB.pitch),
      yaw: lerp(fA.yaw, fB.yaw),
      mouthOpen: lerp(fA.mouthOpen, fB.mouthOpen),
      mouthSmile: lerp(fA.mouthSmile, fB.mouthSmile),
      browLift: lerp(fA.browLift, fB.browLift),
      eyeBlink: lerp(fA.eyeBlink || 0, fB.eyeBlink || 0),
      audioRms: lerp(fA.audioRms || 0, fB.audioRms || 0)
    };
  }

  updateInteractiveMotion(delta) {
    if (!this.autoRig || !this.autoRig.isReady) return;

    // 1. Natural Breathing Sway
    const elapsed = this.clock.getElapsedTime();
    const breath = Math.sin(elapsed * 1.5) * 0.012;
    if (this.autoRig.bones.chest) {
      this.autoRig.bones.chest.rotation.x = breath;
    }

    // 2. Interactive Head & Neck Tracking
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * Math.min(1.0, delta * 4.5);
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * Math.min(1.0, delta * 4.5);

    if (this.autoRig.bones.head && this.autoRig.bones.neck) {
      const rotY = this.mouse.x * 0.20;
      const rotX = -this.mouse.y * 0.12;

      this.autoRig.bones.head.rotation.set(rotX * 0.8, rotY * 0.8, 0, 'YXZ');
      this.autoRig.bones.neck.rotation.set(rotX * 0.2, rotY * 0.2, 0, 'YXZ');
    }

    // 3. Eyelid Blinking
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 0;
      this.nextBlinkTime = 2.4 + Math.random() * 3.6;
    }

    let blinkVal = 0;
    if (this.isBlinking) {
      this.blinkProgress += delta / this.blinkDuration;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        blinkVal = 0;
      } else {
        blinkVal = Math.sin(this.blinkProgress * Math.PI);
      }
    }

    // 4. Smooth Lip-Sync & Expression Lerp
    const lerpRate = Math.min(1.0, delta * 24);
    this.currentMorphs.jawOpen += (this.lipTargets.jawOpen - this.currentMorphs.jawOpen) * lerpRate;
    this.currentMorphs.mouthSmile += (this.lipTargets.mouthSmile - this.currentMorphs.mouthSmile) * lerpRate;
    this.currentMorphs.browLift += (this.lipTargets.browLift - this.currentMorphs.browLift) * lerpRate;
    this.currentMorphs.eyeBlink = blinkVal;

    // Apply to hardware morph target influences
    if (this.autoRig.skinnedMesh && this.autoRig.skinnedMesh.morphTargetInfluences) {
      const inf = this.autoRig.skinnedMesh.morphTargetInfluences;
      if (this.autoRig.morphIndices.jawOpen >= 0) inf[this.autoRig.morphIndices.jawOpen] = this.currentMorphs.jawOpen;
      if (this.autoRig.morphIndices.mouthSmile >= 0) inf[this.autoRig.morphIndices.mouthSmile] = this.currentMorphs.mouthSmile;
      if (this.autoRig.morphIndices.browLift >= 0) inf[this.autoRig.morphIndices.browLift] = this.currentMorphs.browLift;
      if (this.autoRig.morphIndices.eyeBlink >= 0) inf[this.autoRig.morphIndices.eyeBlink] = this.currentMorphs.eyeBlink;
    }

    // 5. Subtle Camera Parallax
    this.camera.position.x += (this.mouse.x * 0.06 - this.camera.position.x) * Math.min(1.0, delta * 3.0);
    this.camera.position.y += (0.42 + this.mouse.y * 0.04 - this.camera.position.y) * Math.min(1.0, delta * 3.0);
    this.camera.lookAt(this.cameraTarget);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.syncedVideo && !this.syncedVideo.paused && this.syncData) {
      // Phase-locked trajectory evaluation matching target video timeline
      const t = this.syncedVideo.currentTime;
      const frame = this.getInterpolatedFrame(t);
      if (this.autoRig && this.autoRig.isReady) {
        this.autoRig.applyKinematics(frame);
      }
    } else {
      // Real-time conversational AI & interactive tracking mode
      this.updateInteractiveMotion(delta);
    }

    // Render WebGL Scene
    this.renderer.render(this.scene, this.camera);

    // Track FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
      if (this.options.onFpsUpdate) {
        this.options.onFpsUpdate(this.fps);
      }
    }
  }

  destroy() {
    if (this.autoRig) {
      this.autoRig.destroy();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
