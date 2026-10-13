/**
 * 3D Avatar WebGL Engine: Operative Lyra
 * High-performance 3D Humanoid Polygonal Mesh with ARKit & Viseme Morph Targets,
 * Skeletal Animation Mixing, Dynamic PBR Lighting, Natural Blinking & Head Tracking.
 * Optimized for 60 FPS on standard laptop integrated GPUs.
 */

const THREE = window.THREE;

export class AvatarRenderer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Avatar References
    this.avatarGroup = null;
    this.headMesh = null;
    this.teethMesh = null;
    this.eyeLeftMesh = null;
    this.eyeRightMesh = null;
    this.mixer = null;
    this.actions = {};
    this.currentActionName = "Idle";

    // Speech & Lip Sync State
    this.isSpeaking = false;
    this.lipTargets = {
      jawOpen: 0,
      viseme_aa: 0,
      viseme_O: 0,
      viseme_I: 0,
      viseme_E: 0,
      viseme_SS: 0,
      mouthSmileLeft: 0.14,
      mouthSmileRight: 0.14,
      browInnerUp: 0.05
    };
    this.currentMorphs = { ...this.lipTargets };

    // Blinking State
    this.blinkTimer = 0;
    this.nextBlinkTime = 3.0;
    this.blinkDuration = 0.16;
    this.blinkProgress = 0;
    this.isBlinking = false;

    // Interaction & Camera Parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.headBone = null;
    this.neckBone = null;

    // Performance
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
    this.scene.background = new THREE.Color(0x0e1117);

    // 2. Camera: Medium close-up framing head and upper torso
    this.camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 50);
    this.camera.position.set(0, 1.44, 1.22);
    this.cameraTarget = new THREE.Vector3(0, 1.40, 0);
    this.camera.lookAt(this.cameraTarget);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (THREE.ACESFilmicToneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
    }
    if (THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    // 4. Studio Lighting for Flattering Portrait
    this.setupLighting();

    // 5. Event Listeners
    window.addEventListener("resize", () => this.onWindowResize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("touchmove", (e) => this.onTouchMove(e));

    // 6. Load 3D Model and Animations
    this.loadAvatarModel();

    // 7. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient light: Soft overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Key Light: Warm directional light from upper front-right
    const keyLight = new THREE.DirectionalLight(0xfff3e6, 1.25);
    keyLight.position.set(1.4, 2.3, 2.0);
    this.scene.add(keyLight);

    // Fill Light: Soft neutral light from front-left
    const fillLight = new THREE.DirectionalLight(0xe0ebff, 0.7);
    fillLight.position.set(-1.6, 1.4, 1.5);
    this.scene.add(fillLight);

    // Subtle Rim Light: Highlights hair and shoulders softly
    const rimLight = new THREE.DirectionalLight(0xbfdbfe, 1.1);
    rimLight.position.set(0, 2.2, -1.8);
    this.scene.add(rimLight);

    // Subtle Chest Warm Fill
    const chestFill = new THREE.PointLight(0xffedd5, 0.5, 2.5);
    chestFill.position.set(0, 1.1, 0.7);
    this.scene.add(chestFill);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onTouchMove(e) {
    if (e.touches.length > 0) {
      this.mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }

  loadAvatarModel() {
    const loader = new THREE.GLTFLoader();

    console.log("[AvatarRenderer] Loading 3D model: operative.glb...");

    loader.load(
      "operative.glb",
      (gltf) => {
        this.avatarGroup = gltf.scene;
        this.scene.add(this.avatarGroup);

        // Position avatar
        this.avatarGroup.position.set(0, 0, 0);

        // Locate skinned meshes, morph targets, and bones
        this.avatarGroup.traverse((child) => {
          if (child.isMesh || child.isSkinnedMesh) {
            child.castShadow = false;
            child.receiveShadow = false;

            if (child.material) {
              child.material.roughness = Math.min(child.material.roughness, 0.85);
            }

            if (child.name === "Wolf3D_Head") {
              this.headMesh = child;
              console.log("[AvatarRenderer] Found Head mesh with morph targets:", Object.keys(child.morphTargetDictionary || {}).length);
            } else if (child.name === "Wolf3D_Teeth") {
              this.teethMesh = child;
            } else if (child.name === "EyeLeft") {
              this.eyeLeftMesh = child;
            } else if (child.name === "EyeRight") {
              this.eyeRightMesh = child;
            }
          }

          if (child.isBone) {
            if (child.name === "Head") this.headBone = child;
            if (child.name === "Neck") this.neckBone = child;
          }
        });

        // Initialize AnimationMixer
        this.mixer = new THREE.AnimationMixer(this.avatarGroup);

        // Load animation library
        this.loadAnimations(loader);
      },
      (xhr) => {
        const percent = (xhr.loaded / (xhr.total || 2991116)) * 100;
        console.log(`[AvatarRenderer] Loading 3D Avatar: ${Math.round(percent)}%`);
      },
      (error) => {
        console.error("[AvatarRenderer] Failed to load operative.glb:", error);
      }
    );
  }

  loadAnimations(loader) {
    console.log("[AvatarRenderer] Loading animations: animations.glb...");

    loader.load(
      "animations.glb",
      (animGltf) => {
        console.log(`[AvatarRenderer] Loaded ${animGltf.animations.length} skeletal animations`);

        animGltf.animations.forEach((clip) => {
          const action = this.mixer.clipAction(clip);
          this.actions[clip.name] = action;
        });

        // Play Idle by default
        if (this.actions["Idle"]) {
          this.actions["Idle"].play();
          this.currentActionName = "Idle";
        }
      },
      undefined,
      (error) => {
        console.warn("[AvatarRenderer] Could not load animations.glb:", error);
      }
    );
  }

  setSpeakingState(isSpeaking) {
    if (this.isSpeaking === isSpeaking) return;
    this.isSpeaking = isSpeaking;

    if (!this.mixer) return;

    // Pick talking animation when speaking, return to Idle when done
    if (isSpeaking) {
      const talkOptions = ["Talking_0", "Talking_1", "Talking_2"];
      const nextTalk = talkOptions[Math.floor(Math.random() * talkOptions.length)];

      if (this.actions[nextTalk] && this.actions[this.currentActionName]) {
        const prevAction = this.actions[this.currentActionName];
        const nextAction = this.actions[nextTalk];

        nextAction.reset();
        nextAction.fadeIn(0.35);
        nextAction.play();
        prevAction.fadeOut(0.35);

        this.currentActionName = nextTalk;
      }
    } else {
      if (this.actions["Idle"] && this.actions[this.currentActionName]) {
        const prevAction = this.actions[this.currentActionName];
        const nextAction = this.actions["Idle"];

        nextAction.reset();
        nextAction.fadeIn(0.4);
        nextAction.play();
        prevAction.fadeOut(0.4);

        this.currentActionName = "Idle";
      }

      // Reset lip targets to neutral rest pose
      this.resetLipTargets();
    }
  }

  setAudioLipSync(lipValues) {
    if (!lipValues) return;

    const jaw = Math.min(1.0, lipValues.jawOpen || 0);
    const spread = Math.min(1.0, lipValues.mouthSpread || 0);
    const smile = Math.min(1.0, lipValues.smile !== undefined ? lipValues.smile : 0.20);
    const aa = Math.min(1.0, lipValues.visemeAA || 0);
    const o = Math.min(1.0, lipValues.visemeO || 0);
    const i = Math.min(1.0, lipValues.visemeI || 0);

    this.lipTargets.jawOpen = jaw * 0.72;
    this.lipTargets.viseme_aa = aa * 0.75;
    this.lipTargets.viseme_O = o * 0.65;
    this.lipTargets.viseme_I = i * 0.55;
    this.lipTargets.mouthSmileLeft = 0.16 + smile * 0.55 + spread * 0.20;
    this.lipTargets.mouthSmileRight = 0.16 + smile * 0.55 + spread * 0.20;

    // Subtle brow expressiveness during speech
    this.lipTargets.browInnerUp = (lipValues.browLift !== undefined ? lipValues.browLift * 0.5 : 0.05) + Math.min(0.2, jaw * 0.3);
  }

  resetLipTargets() {
    this.lipTargets.jawOpen = 0;
    this.lipTargets.viseme_aa = 0;
    this.lipTargets.viseme_O = 0;
    this.lipTargets.viseme_I = 0;
    this.lipTargets.viseme_E = 0;
    this.lipTargets.viseme_SS = 0;
    this.lipTargets.mouthSmileLeft = 0.14;
    this.lipTargets.mouthSmileRight = 0.14;
    this.lipTargets.browInnerUp = 0.05;
  }

  setMorphInfluence(mesh, targetName, value) {
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
    const index = mesh.morphTargetDictionary[targetName];
    if (index !== undefined) {
      mesh.morphTargetInfluences[index] = value;
    }
  }

  updateBlinking(delta) {
    this.blinkTimer += delta;

    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 0;
      this.nextBlinkTime = 2.2 + Math.random() * 3.5;
    }

    let blinkVal = 0;
    if (this.isBlinking) {
      this.blinkProgress += delta / this.blinkDuration;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        blinkVal = 0;
      } else {
        // Quick smooth sine closure
        blinkVal = Math.sin(this.blinkProgress * Math.PI);
      }
    }

    if (this.headMesh) {
      this.setMorphInfluence(this.headMesh, "eyeBlinkLeft", blinkVal);
      this.setMorphInfluence(this.headMesh, "eyeBlinkRight", blinkVal);
    }
  }

  updateLipSync(delta) {
    // Smooth lerp toward targets
    const lerpFactor = Math.min(1.0, delta * 22);

    for (const key in this.lipTargets) {
      this.currentMorphs[key] += (this.lipTargets[key] - this.currentMorphs[key]) * lerpFactor;

      if (this.headMesh) {
        this.setMorphInfluence(this.headMesh, key, this.currentMorphs[key]);
      }
      if (this.teethMesh) {
        this.setMorphInfluence(this.teethMesh, key, this.currentMorphs[key]);
      }
    }
  }

  updateHeadAndEyeTracking(delta) {
    // Smooth mouse position
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * (delta * 4.5);
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * (delta * 4.5);

    // Subtle head tracking
    if (this.headBone) {
      const targetRotY = this.mouse.x * 0.18;
      const targetRotX = -this.mouse.y * 0.12;

      this.headBone.rotation.y += (targetRotY - this.headBone.rotation.y) * (delta * 4.0);
      this.headBone.rotation.x += (targetRotX - this.headBone.rotation.x) * (delta * 4.0);
    }

    // Subtle camera parallax
    this.camera.position.x += (this.mouse.x * 0.06 - this.camera.position.x) * (delta * 3.0);
    this.camera.position.y += (1.45 + this.mouse.y * 0.04 - this.camera.position.y) * (delta * 3.0);
    this.camera.lookAt(this.cameraTarget);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Skeletal Animation Mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 2. Update Eyelid Blinking
    this.updateBlinking(delta);

    // 3. Update Real-Time Lip Sync
    this.updateLipSync(delta);

    // 4. Update Head and Eye tracking
    this.updateHeadAndEyeTracking(delta);

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);

    // 6. Track FPS
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
}
