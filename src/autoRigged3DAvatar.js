/**
 * AutoRigged3DAvatar.js
 * 
 * Auto-Rigging & Kinematic Deformation Engine for 3D Photorealistic Avatars (e.g. Crimson Commandress GLB).
 * Automatically converts an unrigged 3D mesh into a hardware-accelerated THREE.SkinnedMesh:
 *   1. Builds anatomical bone armature (Root -> Spine -> Chest -> Neck -> Head).
 *   2. Generates smooth GPU skin indices and weights with rigid cranial preservation.
 *   3. Synthesizes facial speech & expression morph targets (jawOpen, mouthSmile, browLift, eyeBlink).
 *   4. Drives 1:1 kinematic synchronization matching target video telemetry.
 */

export class AutoRigged3DAvatar {
  constructor(options = {}) {
    this.modelUrl = options.modelUrl || 'crimson_153.glb';
    this.onLoaded = options.onLoaded || null;
    this.onError = options.onError || null;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = "AutoRiggedAvatarRoot";

    this.bones = {
      root: null,
      spine: null,
      chest: null,
      neck: null,
      head: null
    };

    this.skeleton = null;
    this.skinnedMesh = null;
    this.originalMesh = null;
    this.isReady = false;

    // Morph target name indices
    this.morphIndices = {
      jawOpen: -1,
      mouthSmile: -1,
      browLift: -1,
      eyeBlink: -1
    };
  }

  load(scene, progressCallback) {
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.error("[AutoRigged3D] THREE.GLTFLoader is not loaded!");
      if (this.onError) this.onError(new Error("THREE.GLTFLoader not available"));
      return;
    }

    const loader = new THREE.GLTFLoader();
    console.log("[AutoRigged3D] Loading 3D model:", this.modelUrl);

    loader.load(
      this.modelUrl,
      (gltf) => {
        try {
          if (typeof window !== 'undefined' && window.report) window.report('load_success', 'GLTF parsed, starting rig build');
          this.buildRiggedModel(gltf);
          scene.add(this.rootGroup);
          this.isReady = true;
          if (typeof window !== 'undefined' && window.report) window.report('rig_ready', 'Successfully auto-rigged and added to scene');
          console.log("[AutoRigged3D] Successfully auto-rigged and added to scene!");
          if (this.onLoaded) this.onLoaded(this);
        } catch (err) {
          if (typeof window !== 'undefined' && window.report) window.report('rig_error', err.stack || err.message || err);
          console.error("[AutoRigged3D] Failed to auto-rig model:", err);
          if (this.onError) this.onError(err);
        }
      },
      (xhr) => {
        if (progressCallback && xhr.total) {
          progressCallback(xhr.loaded / xhr.total);
        }
      },
      (err) => {
        if (typeof window !== 'undefined' && window.report) window.report('gltf_load_error', err ? (err.message || String(err)) : 'unknown error');
        console.error("[AutoRigged3D] GLTF load error:", err);
        if (this.onError) this.onError(err);
      }
    );
  }

  buildRiggedModel(gltf) {
    let sourceMesh = null;
    gltf.scene.traverse((child) => {
      if (!sourceMesh && child.isMesh) {
        sourceMesh = child;
      }
    });

    if (!sourceMesh) {
      throw new Error("No mesh found inside GLB scene!");
    }

    this.originalMesh = sourceMesh;

    // Clone geometry so we can augment with skinning & morph targets
    const geometry = sourceMesh.geometry.clone();
    let material = sourceMesh.material;

    if (material) {
      material = material.clone();
      material.skinning = true;
      material.morphTargets = true;
      material.roughness = Math.max(material.roughness || 0, 0.45);
      material.metalness = Math.min(material.metalness || 0, 0.30);
      material.needsUpdate = true;
    }

    // 1. Build anatomical bone hierarchy
    const rootBone = new THREE.Bone();
    rootBone.name = "Armature_Root";
    rootBone.position.set(0, 0, 0);

    const spineBone = new THREE.Bone();
    spineBone.name = "Armature_Spine";
    spineBone.position.set(0, 0.25, 0);
    rootBone.add(spineBone);

    const chestBone = new THREE.Bone();
    chestBone.name = "Armature_Chest";
    chestBone.position.set(0, 0.17, 0); // world Y = 0.42
    spineBone.add(chestBone);

    const neckBone = new THREE.Bone();
    neckBone.name = "Armature_Neck";
    neckBone.position.set(0, 0.07, -0.04); // world Y = 0.49, Z = -0.04
    chestBone.add(neckBone);

    const headBone = new THREE.Bone();
    headBone.name = "Armature_Head";
    headBone.position.set(0, 0.09, -0.02); // world Y = 0.58, Z = -0.06 (cervical base pivot)
    neckBone.add(headBone);

    this.bones.root = rootBone;
    this.bones.spine = spineBone;
    this.bones.chest = chestBone;
    this.bones.neck = neckBone;
    this.bones.head = headBone;

    const boneList = [rootBone, spineBone, chestBone, neckBone, headBone];
    const skeleton = new THREE.Skeleton(boneList);
    this.skeleton = skeleton;

    // 2. Compute skin indices & skin weights per vertex
    const posAttr = geometry.attributes.position;
    const vertexCount = posAttr.count;

    const skinIndices = new Uint16Array(vertexCount * 4);
    const skinWeights = new Float32Array(vertexCount * 4);

    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      let b0 = 0, w0 = 1.0;
      let b1 = 0, w1 = 0.0;

      if (vy >= 0.52) {
        // Skull, Face, Ears, Hair, and Military Cap crown/brim/visor
        // 100% rigid binding to Head bone (boneIndex = 4)
        b0 = 4;
        w0 = 1.0;
      } else if (vy >= 0.44) {
        // Neck to Head anatomical transition zone
        const t = (vy - 0.44) / (0.52 - 0.44);
        const smoothT = t * t * (3 - 2 * t);
        b0 = 4; // Head
        w0 = smoothT;
        b1 = 3; // Neck
        w1 = 1.0 - smoothT;
      } else if (vy >= 0.35) {
        // Upper Chest to Neck transition zone
        const t = (vy - 0.35) / (0.44 - 0.35);
        const smoothT = t * t * (3 - 2 * t);
        b0 = 3; // Neck
        w0 = smoothT;
        b1 = 2; // Chest
        w1 = 1.0 - smoothT;
      } else if (vy >= 0.20) {
        // Spine to Chest zone
        const t = (vy - 0.20) / (0.35 - 0.20);
        const smoothT = t * t * (3 - 2 * t);
        b0 = 2; // Chest
        w0 = smoothT;
        b1 = 1; // Spine
        w1 = 1.0 - smoothT;
      } else {
        // Lower torso and hips
        b0 = 0; // Root
        w0 = 1.0;
      }

      const offset = i * 4;
      skinIndices[offset + 0] = b0;
      skinWeights[offset + 0] = w0;

      skinIndices[offset + 1] = b1;
      skinWeights[offset + 1] = w1;

      skinIndices[offset + 2] = 0;
      skinWeights[offset + 2] = 0.0;

      skinIndices[offset + 3] = 0;
      skinWeights[offset + 3] = 0.0;
    }

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    // 3. Synthesize Speech & Expression Morph Targets (Blendshapes)
    const morphPositions = [];
    const targetNames = ['jawOpen', 'mouthSmile', 'browLift', 'eyeBlink'];

    const jawOpenDeltas = new Float32Array(vertexCount * 3);
    const smileDeltas = new Float32Array(vertexCount * 3);
    const browDeltas = new Float32Array(vertexCount * 3);
    const blinkDeltas = new Float32Array(vertexCount * 3);

    const faceCenterX = 0.015;
    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const relX = vx - faceCenterX;
      const absRelX = Math.abs(relX);
      const vOffset = i * 3;

      // --- Morph 0: jawOpen (Lower lip & chin drop) ---
      // Located at Y in [0.49, 0.555], |relX| <= 0.05, Z >= 0.07
      if (vy >= 0.49 && vy <= 0.555 && absRelX <= 0.05 && vz >= 0.07) {
        const falloffY = 1.0 - Math.abs((vy - 0.525) / 0.035);
        const falloffX = 1.0 - (absRelX / 0.05);
        const weight = Math.max(0, falloffY * falloffX);
        jawOpenDeltas[vOffset + 0] = 0.0;
        jawOpenDeltas[vOffset + 1] = -0.024 * weight;
        jawOpenDeltas[vOffset + 2] = -0.007 * weight;
      }

      // --- Morph 1: mouthSmile (Lip corners lift and stretch) ---
      // Located at Y in [0.525, 0.565], |relX| in [0.012, 0.055], Z >= 0.075
      if (vy >= 0.525 && vy <= 0.565 && absRelX >= 0.012 && absRelX <= 0.055 && vz >= 0.075) {
        const spanX = (absRelX - 0.012) / 0.043;
        const weight = Math.sin(spanX * Math.PI);
        const signX = relX >= 0 ? 1.0 : -1.0;
        smileDeltas[vOffset + 0] = signX * 0.012 * weight;
        smileDeltas[vOffset + 1] = +0.009 * weight;
        smileDeltas[vOffset + 2] = +0.003 * weight;
      }

      // --- Morph 2: browLift (Eyebrows & forehead raise) ---
      // Located at Y in [0.66, 0.72], |relX| <= 0.065, Z >= 0.075
      if (vy >= 0.66 && vy <= 0.72 && absRelX <= 0.065 && vz >= 0.075) {
        const falloff = 1.0 - (absRelX / 0.065);
        const weight = Math.max(0, falloff);
        browDeltas[vOffset + 0] = 0.0;
        browDeltas[vOffset + 1] = +0.012 * weight;
        browDeltas[vOffset + 2] = +0.003 * weight;
      }

      // --- Morph 3: eyeBlink (Upper eyelids lower) ---
      // Located at Y in [0.625, 0.67], |relX| in [0.015, 0.055], Z in [0.068, 0.105]
      if (vy >= 0.625 && vy <= 0.67 && absRelX >= 0.015 && absRelX <= 0.055 && vz >= 0.068 && vz <= 0.105) {
        const span = (absRelX - 0.015) / 0.040;
        const weight = Math.sin(span * Math.PI);
        blinkDeltas[vOffset + 0] = 0.0;
        blinkDeltas[vOffset + 1] = -0.014 * weight;
        blinkDeltas[vOffset + 2] = +0.002 * weight;
      }
    }

    geometry.morphAttributes.position = [
      new THREE.Float32BufferAttribute(jawOpenDeltas, 3),
      new THREE.Float32BufferAttribute(smileDeltas, 3),
      new THREE.Float32BufferAttribute(browDeltas, 3),
      new THREE.Float32BufferAttribute(blinkDeltas, 3)
    ];

    geometry.morphTargetsRelative = true;

    // 4. Create and bind SkinnedMesh
    const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
    skinnedMesh.name = "AutoRiggedCharacterMesh";
    skinnedMesh.castShadow = false;
    skinnedMesh.receiveShadow = false;

    skinnedMesh.add(rootBone);
    skinnedMesh.updateMatrixWorld(true);
    skinnedMesh.bind(skeleton);

    this.morphIndices.jawOpen = 0;
    this.morphIndices.mouthSmile = 1;
    this.morphIndices.browLift = 2;
    this.morphIndices.eyeBlink = 3;

    // Initialize influences to 0
    skinnedMesh.morphTargetInfluences = [0, 0, 0, 0];

    this.skinnedMesh = skinnedMesh;
    this.rootGroup.add(skinnedMesh);

    // Compute bounding sphere to prevent any NaN issues
    geometry.computeBoundingSphere();
  }

  /**
   * Apply frame telemetry matching the target video animation
   * @param {Object} frame Frame data { roll, pitch, yaw, mouthOpen, mouthSmile, browLift, eyeBlink }
   */
  applyKinematics(frame) {
    if (!this.isReady || !this.bones.head) return;

    // Head rotation (degrees to radians)
    // roll: head tilt left/right (Z axis)
    // pitch: nod down/up (X axis)
    // yaw: turn left/right (Y axis)
    const rollRad = THREE.MathUtils.degToRad(frame.roll || 0);
    const pitchRad = (frame.pitch || 0) * 0.45;
    const yawRad = (frame.yaw || 0) * 0.55;

    // 80% of rotation to Head bone, 20% to Neck bone for organic spinal flexure
    this.bones.head.rotation.set(pitchRad * 0.8, yawRad * 0.8, rollRad * 0.8, 'YXZ');
    this.bones.neck.rotation.set(pitchRad * 0.2, yawRad * 0.2, rollRad * 0.2, 'YXZ');

    // Slight organic clavicle / chest lean with head roll
    if (this.bones.chest) {
      this.bones.chest.rotation.z = rollRad * 0.05;
    }

    // Apply speech & facial expression morph targets
    if (this.skinnedMesh && this.skinnedMesh.morphTargetInfluences) {
      const influences = this.skinnedMesh.morphTargetInfluences;

      let effectiveMouthOpen = 0.0;
      if (frame.audioRms !== undefined && frame.audioRms > 0.005) {
        effectiveMouthOpen = Math.min(1.0, frame.audioRms * 4.0);
      } else if (frame.mouthOpen !== undefined && frame.mouthOpen < 0.99) {
        effectiveMouthOpen = frame.mouthOpen;
      }

      if (this.morphIndices.jawOpen >= 0) {
        influences[this.morphIndices.jawOpen] = Math.max(0, Math.min(1.0, effectiveMouthOpen));
      }
      if (this.morphIndices.mouthSmile >= 0) {
        influences[this.morphIndices.mouthSmile] = Math.max(0, Math.min(1.0, frame.mouthSmile || 0));
      }
      if (this.morphIndices.browLift >= 0) {
        influences[this.morphIndices.browLift] = Math.max(0, Math.min(1.0, frame.browLift || 0));
      }
      if (this.morphIndices.eyeBlink >= 0) {
        influences[this.morphIndices.eyeBlink] = Math.max(0, Math.min(1.0, frame.eyeBlink || 0));
      }
    }
  }

  destroy() {
    if (this.skinnedMesh) {
      if (this.skinnedMesh.geometry) this.skinnedMesh.geometry.dispose();
      this.rootGroup.remove(this.skinnedMesh);
    }
    this.isReady = false;
  }
}
