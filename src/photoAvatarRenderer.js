/**
 * PhotoAvatarRenderer: 2.5D Real-Time GPU Neural Avatar Engine
 * Faithfully mimics the animation mechanics of the HeyGen target video stream:
 * - 2.5D Cervical Pivot Rotation (Roll) around neck base (548, 310)
 * - 2.5D Head Pitch (Nod) with perspective foreshortening
 * - 2.5D Head Yaw (Turn) with facial feature depth parallax
 * - Zygomaticus Major cheek lift & lower eyelid smile squint (Duchenne smile)
 * - Mouth corner upward elevation into Jessica's signature radiant smile
 * - Anatomical curved maxilla dental arch with enamel specular sheen
 * - Dynamic human eye micro-saccades, blinks & iris gaze tracking
 * - Pre-computed Target Mimic trajectory perfectly syncing with "Hello Jessica" audio
 * Runs locked at 60 FPS on standard integrated GPUs via Three.js GLSL.
 */

const THREE = window.THREE;
import { targetSyncTrajectory } from "./targetSyncTrajectory.js";

export class PhotoAvatarRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.onFpsUpdate = options.onFpsUpdate || (() => {});

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.material = null;
    this.texture = null;
    this.isReady = false;

    // Animation & Speech State
    this.time = 0;
    this.isSpeaking = false;
    this.speechPhase = 0;

    // Lip Sync & Facial Targets
    this.jawTarget = 0;
    this.jawCurrent = 0;
    this.spreadTarget = 0;
    this.spreadCurrent = 0;
    this.browTarget = 0;
    this.browCurrent = 0;

    // Jessica Signature Smile & Cheek Targets (Resting warm baseline ~0.20)
    this.smileTarget = 0.20;
    this.smileCurrent = 0.20;
    this.cheekSquintTarget = 0.12;
    this.cheekSquintCurrent = 0.12;

    // 2.5D Skeletal Head Motion Targets
    this.headRollTarget = 0;
    this.headRollCurrent = 0;
    this.headPitchTarget = 0;
    this.headPitchCurrent = 0;
    this.headYawTarget = 0;
    this.headYawCurrent = 0;

    // Target Video Mimic Sequence State
    this.isMimicActive = false;
    this.mimicStartTime = 0;
    this.mimicDuration = 4.46; // 4.46 seconds duration of Jessica target video
    this.mimicCallback = null;

    // Video Phase-Lock State (Master-Slave Sync to Target Video)
    this.videoSyncSource = null;
    this.isSyncedToVideo = false;
    this.lastSyncVideoTime = -1;
    this.targetSync = targetSyncTrajectory;

    // Skeleton Phase-Lock State (Facial Skeleton Rig Driver)
    this.skeletonSource = null;
    this.isSyncedToSkeleton = false;

    // Eyelid Blinking State
    this.blinkLeft = 0;
    this.nextBlinkTime = 2.0 + Math.random() * 2.0;
    this.isBlinking = false;
    this.blinkPhase = 0;

    // Micro-Saccades (Human involuntary eye movements)
    this.nextSaccadeTime = 1.8;
    this.saccadeOffset = { x: 0, y: 0 };

    // Mouse Tracking / Gaze Parallax
    this.mouseTarget = { x: 0, y: 0 };
    this.mouseCurrent = { x: 0, y: 0 };

    // Performance
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // 2. 2D Fullscreen Quad Scene & Ortho Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 3. Load Avatar Texture
    const loader = new THREE.TextureLoader();
    const avatarUrl = new URL("../avatar.jpg", import.meta.url).href;
    loader.load(avatarUrl, (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      this.texture = tex;
      this.setupShader(width, height);
      this.isReady = true;
      console.log("[PhotoAvatarRenderer] 2.5D HeyGen Neural Shader Avatar ready.");
    });

    // 4. Event Listeners
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));

    // 5. Start Render Loop
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  setupShader(width, height) {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform vec2 u_imageSize;
      uniform float u_time;
      uniform float u_jawOpen;
      uniform float u_mouthSpread;
      uniform float u_smile;
      uniform float u_cheekSquint;
      uniform float u_blink;
      uniform float u_browLift;
      uniform float u_headRoll;
      uniform float u_headPitch;
      uniform float u_headYaw;
      uniform vec2 u_mouse;
      uniform float u_breathing;

      varying vec2 vUv;

      void main() {
        // 1. VIEWPORT ASPECT FRAMING (Texture: 1024x559, aspect ~1.8318)
        float screenAspect = u_resolution.x / u_resolution.y;
        float imageAspect = u_imageSize.x / u_imageSize.y;

        vec2 scale;
        vec2 center = vec2(548.0 / 1024.0, 0.50);
        float edgeFade = 1.0;

        if (screenAspect >= imageAspect) {
          scale = vec2(1.0, imageAspect / screenAspect);
        } else if (screenAspect >= 1.0) {
          scale = vec2(screenAspect / imageAspect, 1.0);
        } else {
          float portraitWidth = 0.82;
          scale.x = portraitWidth;
          scale.y = portraitWidth * (imageAspect / screenAspect);
          center = vec2(548.0 / 1024.0, 0.44);

          vec2 checkUv = (vUv - 0.5) * scale + center;
          if (checkUv.y < 0.0 || checkUv.y > 1.0) {
            float distY = max(-checkUv.y, checkUv.y - 1.0);
            edgeFade = smoothstep(0.12, 0.0, distY);
          }
        }

        vec2 baseUv = (vUv - 0.5) * scale + center;

        // Subtle ambient camera drift & mouse parallax
        float camDriftX = sin(u_time * 0.6) * 0.0014 + u_mouse.x * 0.008;
        float camDriftY = cos(u_time * 0.8) * 0.0012 + u_mouse.y * 0.006 + u_breathing * 0.0016;
        baseUv -= vec2(camDriftX, -camDriftY);
        baseUv = clamp(baseUv, vec2(0.002), vec2(0.998));

        // Convert UV to image pixel space (px: 0..1024, py: 0..559 from top)
        vec2 P = vec2(baseUv.x * u_imageSize.x, (1.0 - baseUv.y) * u_imageSize.y);

        // 2. 2.5D CERVICAL SKELETAL ROTATION & HEAD DYNAMICS (HEYGEN STYLE)
        // Cervical pivot at base of neck: (548.0, 310.0)
        vec2 pivot = vec2(548.0, 310.0);

        // Head mask: Hat (y 35-125), Face (y 125-265), Neck (y 265-325)
        // Wider at cap (radius ~92px), tapering down neck (radius ~50px)
        float headRadiusX = mix(94.0, 52.0, smoothstep(115.0, 305.0, P.y));
        float headNormX = abs(P.x - 548.0) / headRadiusX;
        float headMaskH = smoothstep(1.08, 0.72, headNormX);
        float headMaskV = smoothstep(22.0, 55.0, P.y) * smoothstep(345.0, 275.0, P.y);
        float headWeight = headMaskH * headMaskV;

        // A. Roll (Tilt): rotation around cervical pivot
        float effectiveRoll = u_headRoll * headWeight;
        float cR = cos(effectiveRoll);
        float sR = sin(effectiveRoll);
        vec2 rel = P - pivot;
        P = pivot + vec2(rel.x * cR - rel.y * sR, rel.x * sR + rel.y * cR);

        // B. Pitch (Nod): forward nod with vertical perspective foreshortening
        float pitchDist = max(0.0, pivot.y - P.y);
        float nodDispY = u_headPitch * (pitchDist * 0.045 + 1.8) * headWeight;
        P.y += nodDispY;

        // C. Yaw (Turn) & Feature Depth Parallax: facial features sit forward in 3D
        float featureDepth = exp(-pow((P.x - 548.0) / 44.0, 2.0) - pow((P.y - 195.0) / 60.0, 2.0));
        float effectiveYaw = u_headYaw * (headWeight * 4.6 + featureDepth * 3.8);
        P.x += effectiveYaw;

        // D. Torso / Shoulder Counter-balance
        float shoulderWeight = smoothstep(310.0, 480.0, P.y) * smoothstep(130.0, 0.0, abs(P.x - 548.0));
        P.x -= u_headRoll * 1.6 * shoulderWeight;

        // 3. ZYGOMATIC CHEEK LIFT & LOWER EYELID SMILE SQUINT (DUCHENNE SMILE)
        // Left cheek: (508, 202), Right cheek: (584, 204)
        float cheekDistL2 = pow((P.x - 508.0) / 28.0, 2.0) + pow((P.y - 202.0) / 22.0, 2.0);
        float cheekDistR2 = pow((P.x - 584.0) / 28.0, 2.0) + pow((P.y - 204.0) / 22.0, 2.0);
        float cheekTotal = (exp(-cheekDistL2) + exp(-cheekDistR2));
        float cheekLift = cheekTotal * (u_smile * 3.5 + u_cheekSquint * 2.2);
        P.y += cheekLift; // In inverse mapping, +y raises cheeks UP on screen!
        P.x += (P.x - 548.0) * 0.030 * (u_smile + u_cheekSquint) * cheekTotal;

        // Lower Eyelid Squint (Smiling Eyes)
        float eyeUnderL = exp(-pow((P.x - 518.0) / 14.0, 2.0) - pow((P.y - 173.0) / 6.5, 2.0));
        float eyeUnderR = exp(-pow((P.x - 571.0) / 14.0, 2.0) - pow((P.y - 174.0) / 6.5, 2.0));
        P.y += (u_smile * 2.0 + u_cheekSquint * 1.5) * (eyeUnderL + eyeUnderR);

        // 4. EYEBROW INFLECTION ANIMATION
        // Left eyebrow at (515, 148), Right eyebrow at (572, 149)
        if (u_browLift > 0.01) {
          float browL = exp(-pow((P.x - 515.0) / 18.0, 2.0) - pow((P.y - 148.0) / 9.0, 2.0));
          float browR = exp(-pow((P.x - 572.0) / 18.0, 2.0) - pow((P.y - 149.0) / 9.0, 2.0));
          float browTotal = (browL * 2.8 + browR * 3.2) * u_browLift;
          P.y += browTotal; // Raises eyebrows UP on screen
        }

        // 5. NATURAL EYE BLINKING & GAZE TRACKING
        // Left eye: (518, 166), rx=13.0, ry=7.0 | Right eye: (571, 167), rx=12.0, ry=7.0
        float blinkAmt = u_blink;
        float eyelashL = 0.0;
        float eyelashR = 0.0;

        // Left Eye
        vec2 dL = vec2((P.x - 518.0) / 13.0, (P.y - 166.0) / 7.0);
        float distL2 = dot(dL, dL);
        if (distL2 < 1.0) {
          float archL = sqrt(max(0.0, 1.0 - dL.x * dL.x));
          float topL = 166.0 - 7.0 * archL;
          float botL = 166.0 + 7.0 * archL;

          if (blinkAmt > 0.005) {
            float lidY = mix(topL, botL, blinkAmt);
            if (P.y < lidY) {
              float norm = (P.y - topL) / max(0.1, lidY - topL);
              P.y = mix(topL - 2.5, 158.0, norm);
            }
            eyelashL = smoothstep(1.6, 0.0, abs(P.y - lidY)) * blinkAmt;
          } else {
            P.x -= u_mouse.x * 1.3 * (1.0 - distL2);
            P.y -= u_mouse.y * 0.9 * (1.0 - distL2);
          }
        }

        // Right Eye
        vec2 dR = vec2((P.x - 571.0) / 12.0, (P.y - 167.0) / 7.0);
        float distR2 = dot(dR, dR);
        if (distR2 < 1.0) {
          float archR = sqrt(max(0.0, 1.0 - dR.x * dR.x));
          float topR = 167.0 - 7.0 * archR;
          float botR = 167.0 + 7.0 * archR;

          if (blinkAmt > 0.005) {
            float lidY = mix(topR, botR, blinkAmt);
            if (P.y < lidY) {
              float norm = (P.y - topR) / max(0.1, lidY - topR);
              P.y = mix(topR - 2.5, 159.0, norm);
            }
            eyelashR = smoothstep(1.6, 0.0, abs(P.y - lidY)) * blinkAmt;
          } else {
            P.x -= u_mouse.x * 1.3 * (1.0 - distR2);
            P.y -= u_mouse.y * 0.9 * (1.0 - distR2);
          }
        }

        // 6. HIGH-FIDELITY MOUTH & RADIANT SMILE ARTICULATION
        float mouthCx = 552.0;
        float mouthHw = 20.0 * (1.0 + 0.16 * u_mouthSpread + 0.14 * u_smile);
        float tx = (P.x - mouthCx) / mouthHw;
        bool inMouthSpan = abs(tx) <= 1.0;

        // Signature upward corner smile arch
        float cornerLift = (u_smile * 3.8 + max(0.0, u_mouthSpread) * 1.5) * (tx * tx);
        float lipSeamY = 229.0 - 1.8 * (tx * tx) - cornerLift;

        if (inMouthSpan && P.y >= 200.0 && P.y <= 275.0) {
          float arch = sqrt(max(0.0, 1.0 - tx * tx));
          float openGap = (12.0 * u_jawOpen + 4.0 * u_smile) * arch;
          float yUpper = lipSeamY - openGap * (0.16 + 0.14 * u_smile);
          float yLower = lipSeamY + openGap * 0.84;

          // Inside oral cavity
          if (openGap > 0.4 && P.y >= yUpper && P.y <= yLower) {
            float gap = max(0.1, yLower - yUpper);
            float t = (P.y - yUpper) / gap;

            // Deep natural oral cavity tones (throat / buccal cavity)
            vec3 cavityCol = vec3(
              (48.0 + 16.0 * sin(t * 3.14159)) / 255.0,
              (14.0 + 5.0 * sin(t * 3.14159)) / 255.0,
              (12.0 + 4.0 * sin(t * 3.14159)) / 255.0
            );

            // Natural radiant incisor enamel sheen
            if (t > 0.02 && t < 0.68 && openGap > 2.0) {
              float teethT = sin(clamp((t - 0.02) / 0.64, 0.0, 1.0) * 3.14159);
              float toothGroove = sin(tx * 30.0) * 0.06;
              float teethWeight = clamp((teethT - toothGroove), 0.0, 1.0) * (0.60 + 0.38 * u_smile) * smoothstep(0.85, 0.20, abs(tx));
              vec3 toothColor = vec3(218.0 / 255.0, 212.0 / 255.0, 204.0 / 255.0);
              // Shadow under upper lip
              float lipShadow = smoothstep(0.02, 0.14, t);
              cavityCol = mix(cavityCol, toothColor * lipShadow, teethWeight);
            }

            // Lip rim occlusion shadow
            float edgeShadow = sqrt(max(0.0, sin(t * 3.14159)));
            cavityCol *= (0.60 + 0.40 * edgeShadow);

            gl_FragColor = vec4(cavityCol, 1.0);
            return;
          }

          // Outside cavity: lower lip vermilion & chin descent
          if (P.y > lipSeamY && openGap > 0.4) {
            float yRim = lipSeamY + openGap * 0.84;
            if (P.y >= yRim) {
              float lowerLipThick = 10.0;
              float lowerDisp = (yRim - lipSeamY);
              if (P.y <= yRim + lowerLipThick) {
                float lipProgress = (P.y - yRim) / lowerLipThick;
                // Sample from lower lip vermilion rather than dark seam crevice
                P.y = (lipSeamY + 2.2) + lipProgress * (lowerLipThick - 2.2);
              } else {
                float chinDist = P.y - (yRim + lowerLipThick);
                float chinRange = 275.0 - (yRim + lowerLipThick);
                float falloff = clamp(1.0 - chinDist / max(1.0, chinRange), 0.0, 1.0);
                falloff = falloff * falloff * (3.0 - 2.0 * falloff);
                P.y -= lowerDisp * falloff;
              }
            }
          } else if (P.y < lipSeamY && openGap > 0.4) {
            float yRim = lipSeamY - openGap * (0.16 + 0.14 * u_smile);
            if (P.y <= yRim) {
              float dist = yRim - P.y;
              float falloff = clamp(1.0 - dist / 14.0, 0.0, 1.0);
              falloff = falloff * (3.0 - 2.0 * falloff);
              // Sample from upper lip vermilion rather than dark seam crevice
              P.y += (openGap * (0.16 + 0.14 * u_smile) - 1.2) * falloff;
            }
          }

          // Lateral mouth spread modulation
          if (abs(u_mouthSpread) > 0.01 && P.y >= 222.0 && P.y <= 245.0) {
            float spreadInfluence = clamp(1.0 - abs(P.y - 229.0) / 12.0, 0.0, 1.0);
            float spreadDisp = tx * u_mouthSpread * 2.5 * spreadInfluence;
            P.x -= spreadDisp;
          }
        }

        // 8. CHEST & BREATHING MOTION
        float chestWeight = smoothstep(320.0, 520.0, P.y);
        P.y += sin(u_time * 1.6) * 1.4 * chestWeight;
        P.x -= (P.x - 512.0) * 0.003 * sin(u_time * 1.6) * chestWeight;

        // 9. Sample Original Texture at Deformed Coordinates
        vec2 sampleUv = vec2(P.x / u_imageSize.x, 1.0 - (P.y / u_imageSize.y));
        sampleUv = clamp(sampleUv, vec2(0.001), vec2(0.999));
        vec4 col = texture2D(u_texture, sampleUv);

        // Apply dark eyelash rim during blink
        float lashTotal = max(eyelashL, eyelashR);
        if (lashTotal > 0.01) {
          col.rgb *= (1.0 - 0.58 * lashTotal);
        }

        // Ambient edge fade for portrait screens
        vec3 finalBg = vec3(0.043, 0.051, 0.075);
        col.rgb = mix(finalBg, col.rgb, edgeFade);

        // Subtle cinematic lighting & vignette
        vec2 vigUv = (vUv - 0.5) * 1.30;
        float vig = clamp(1.0 - dot(vigUv, vigUv) * 0.35, 0.0, 1.0);
        col.rgb *= vig;

        gl_FragColor = col;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        u_texture: { value: this.texture },
        u_resolution: { value: new THREE.Vector2(width, height) },
        u_imageSize: { value: new THREE.Vector2(1024.0, 559.0) },
        u_time: { value: 0.0 },
        u_jawOpen: { value: 0.0 },
        u_mouthSpread: { value: 0.0 },
        u_smile: { value: 0.20 },
        u_cheekSquint: { value: 0.12 },
        u_blink: { value: 0.0 },
        u_browLift: { value: 0.0 },
        u_headRoll: { value: 0.0 },
        u_headPitch: { value: 0.0 },
        u_headYaw: { value: 0.0 },
        u_mouse: { value: new THREE.Vector2(0.0, 0.0) },
        u_breathing: { value: 0.0 }
      },
      depthWrite: false,
      depthTest: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, this.material);
    this.scene.add(quad);
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    if (this.material && this.material.uniforms.u_resolution) {
      this.material.uniforms.u_resolution.value.set(width, height);
    }
  }

  onMouseMove(e) {
    const normX = (e.clientX / window.innerWidth - 0.5) * 2;
    const normY = (e.clientY / window.innerHeight - 0.5) * 2;
    this.mouseTarget.x = normX;
    this.mouseTarget.y = normY;
  }

  /**
   * Set real-time lip-sync & expression parameters from audio engine / Gemini Live
   */
  setAudioLipSync(values) {
    if (!values) return;
    this.jawTarget = Math.min(1.0, Math.max(0.0, values.jawOpen || 0));
    this.spreadTarget = Math.min(1.0, Math.max(-1.0, values.mouthSpread || 0));

    // Smile & Cheek Squint
    if (values.smile !== undefined) {
      this.smileTarget = Math.min(1.0, Math.max(0.18, values.smile));
    } else {
      // Automatic conversational smile enhancement based on phonemes
      this.smileTarget = this.isSpeaking
        ? 0.25 + (this.spreadTarget > 0 ? this.spreadTarget * 0.45 : 0.0) + this.jawTarget * 0.20
        : 0.20;
    }

    if (values.cheekSquint !== undefined) {
      this.cheekSquintTarget = Math.min(1.0, Math.max(0.0, values.cheekSquint));
    } else {
      this.cheekSquintTarget = this.smileTarget * 0.75;
    }

    if (values.browLift !== undefined) {
      this.browTarget = Math.min(1.0, Math.max(0.0, values.browLift));
    } else {
      this.browTarget = this.isSpeaking ? Math.min(1.0, this.jawTarget * 0.60) : 0;
    }
  }

  setSpeakingState(isSpeaking) {
    this.isSpeaking = isSpeaking;
    if (!isSpeaking && !this.isMimicActive) {
      this.jawTarget = 0;
      this.spreadTarget = 0;
      this.browTarget = 0;
      this.smileTarget = 0.20;
      this.cheekSquintTarget = 0.12;
      this.headRollTarget = 0;
      this.headPitchTarget = 0;
      this.headYawTarget = 0;
    }
  }

  /**
   * Phase-lock the real-time neural avatar directly to a video element's timeline.
   * @param {HTMLVideoElement} videoElement
   */
  syncWithVideo(videoElement) {
    this.videoSyncSource = videoElement;
    this.isSyncedToVideo = true;
    this.isSyncedToSkeleton = false;
    this.lastSyncVideoTime = -1;
    this.setSpeakingState(true);
    console.log("[PhotoAvatarRenderer] Phase-locked to target video stream.");
  }

  /**
   * Phase-lock the real-time neural avatar directly to a FacialSkeletonModel instance.
   * @param {FacialSkeletonModel} skeletonModel
   */
  syncWithSkeleton(skeletonModel) {
    this.skeletonSource = skeletonModel;
    this.isSyncedToSkeleton = true;
    this.isSyncedToVideo = false;
    this.setSpeakingState(true);
    console.log("[PhotoAvatarRenderer] Phase-locked to 52-parameter Facial Skeleton Model.");
  }

  /**
   * Disconnect skeleton synchronization.
   */
  unsyncSkeleton() {
    this.skeletonSource = null;
    this.isSyncedToSkeleton = false;
    this.setSpeakingState(false);
    console.log("[PhotoAvatarRenderer] Disconnected skeleton phase-lock.");
  }

  /**
   * Disconnect video synchronization and resume natural conversational/idle physics.
   */
  unsyncVideo() {
    this.videoSyncSource = null;
    this.isSyncedToVideo = false;
    this.lastSyncVideoTime = -1;
    this.setSpeakingState(false);
    console.log("[PhotoAvatarRenderer] Disconnected video phase-lock.");
  }

  /**
   * Execute exact Target Video Mimic trajectory (Jessica: "Hello, I'm Jessica. I fell from the sky...")
   */
  playTargetMimicSequence(onComplete) {
    this.isMimicActive = true;
    this.mimicStartTime = performance.now();
    this.mimicCallback = onComplete || null;
    this.setSpeakingState(true);
  }

  getMimicPose(elapsedSec) {
    // Evaluated directly from ground-truth target video kinematics
    return this.targetSync.evaluate(elapsedSec, false);
  }

  renderLoop(currentTime) {
    requestAnimationFrame((t) => this.renderLoop(t));

    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.time += delta;

    // FPS Meter
    this.frameCount++;
    if (currentTime - this.fpsTimer >= 1000) {
      this.onFpsUpdate(this.frameCount);
      this.frameCount = 0;
      this.fpsTimer = currentTime;
    }

    if (!this.isReady || !this.material) return;

    // 1. Process Skeleton Model Phase-Lock OR Video Phase-Lock OR Mimic OR Conversational Dynamics
    if (this.isSyncedToSkeleton && this.skeletonSource) {
      const p = this.skeletonSource.parameters;
      const pose = this.skeletonSource.pose;

      this.jawTarget = p.jawOpen || 0.0;
      this.spreadTarget = (p.mouthStretchLeft || 0.0) - (p.mouthPucker || 0.0);
      this.smileTarget = Math.max(0.18, ((p.mouthSmileLeft || 0.0) + (p.mouthSmileRight || 0.0)) * 0.5);
      this.cheekSquintTarget = Math.max(0.12, ((p.cheekSquintLeft || 0.0) + (p.cheekSquintRight || 0.0)) * 0.5);
      this.browTarget = p.browInnerUp || 0.0;
      this.headRollTarget = pose.headRoll || 0.0;
      this.headPitchTarget = pose.headPitch || 0.0;
      this.headYawTarget = pose.headYaw || 0.0;
      this.blinkLeft = p.eyeBlinkLeft || 0.0;
    } else if (this.isSyncedToVideo && this.videoSyncSource) {
      const videoTime = this.videoSyncSource.currentTime || 0;
      const pose = this.targetSync.evaluate(videoTime, true);

      this.jawTarget = pose.jaw;
      this.spreadTarget = pose.spread;
      this.smileTarget = pose.smile;
      this.cheekSquintTarget = pose.cheekSquint;
      this.browTarget = pose.browLift;
      this.headRollTarget = pose.roll;
      this.headPitchTarget = pose.pitch;
      this.headYawTarget = pose.yaw;

      // Handle seeking / looping jumps smoothly
      const timeJump = Math.abs(videoTime - this.lastSyncVideoTime);
      const isJump = this.lastSyncVideoTime < 0 || timeJump > 0.35;
      this.lastSyncVideoTime = videoTime;

      if (isJump) {
        this.jawCurrent = this.jawTarget;
        this.spreadCurrent = this.spreadTarget;
        this.smileCurrent = this.smileTarget;
        this.cheekSquintCurrent = this.cheekSquintTarget;
        this.browCurrent = this.browTarget;
        this.headRollCurrent = this.headRollTarget;
        this.headPitchCurrent = this.headPitchTarget;
        this.headYawCurrent = this.headYawTarget;
      }
    } else if (this.isMimicActive) {
      const elapsed = (currentTime - this.mimicStartTime) / 1000;
      if (elapsed <= this.mimicDuration) {
        const pose = this.targetSync.evaluate(elapsed, false);
        this.jawTarget = pose.jaw;
        this.spreadTarget = pose.spread;
        this.smileTarget = pose.smile;
        this.cheekSquintTarget = pose.cheekSquint;
        this.headRollTarget = pose.roll;
        this.headPitchTarget = pose.pitch;
        this.headYawTarget = pose.yaw;
        this.browTarget = pose.browLift;
      } else {
        this.isMimicActive = false;
        this.setSpeakingState(false);
        if (this.mimicCallback) {
          const cb = this.mimicCallback;
          this.mimicCallback = null;
          cb();
        }
      }
    } else if (this.isSpeaking) {
      // Conversational Cadence Physics (HeyGen Style)
      this.speechPhase += delta;
      // Syllable nod rhythms
      this.headPitchTarget = Math.sin(this.speechPhase * 5.6) * 0.022 * this.jawCurrent;
      // Lateral conversational tilt
      this.headRollTarget = Math.cos(this.speechPhase * 2.4) * 0.030 + (this.spreadCurrent * 0.015);
      // Subtle depth turn
      this.headYawTarget = Math.sin(this.speechPhase * 1.5) * 0.018;
    } else {
      // Idle natural breathing & micro-sway
      this.headRollTarget = Math.sin(this.time * 0.8) * 0.010;
      this.headPitchTarget = Math.cos(this.time * 1.1) * 0.006;
      this.headYawTarget = Math.sin(this.time * 0.5) * 0.008;
    }

    // 2. Snappy Physics Interpolation (Attack & Decay)
    const lerpSpeed = (this.isSyncedToVideo || this.isSyncedToSkeleton) ? 38.0 : ((this.isSpeaking || this.isMimicActive) ? 24.0 : 12.0);
    const rotSpeed = (this.isSyncedToVideo || this.isSyncedToSkeleton) ? 32.0 : 10.0;

    this.jawCurrent += (this.jawTarget - this.jawCurrent) * lerpSpeed * delta;
    this.spreadCurrent += (this.spreadTarget - this.spreadCurrent) * lerpSpeed * delta;
    this.smileCurrent += (this.smileTarget - this.smileCurrent) * 18.0 * delta;
    this.cheekSquintCurrent += (this.cheekSquintTarget - this.cheekSquintCurrent) * 18.0 * delta;
    this.browCurrent += (this.browTarget - this.browCurrent) * 18.0 * delta;

    // Head Skeletal Rotation Interpolation
    this.headRollCurrent += (this.headRollTarget - this.headRollCurrent) * rotSpeed * delta;
    this.headPitchCurrent += (this.headPitchTarget - this.headPitchCurrent) * rotSpeed * delta;
    this.headYawCurrent += (this.headYawTarget - this.headYawCurrent) * rotSpeed * delta;

    // 3. Eye Blinking Lifecycle (Human curve + double blinks)
    if (!this.isBlinking && this.time >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkPhase = 0;
    }

    if (this.isBlinking) {
      this.blinkPhase += delta * 7.5; // ~130ms blink
      if (this.blinkPhase < 0.42) {
        this.blinkLeft = Math.sin((this.blinkPhase / 0.42) * (Math.PI / 2));
      } else if (this.blinkPhase <= 1.0) {
        const openProgress = (this.blinkPhase - 0.42) / 0.58;
        this.blinkLeft = Math.cos(openProgress * (Math.PI / 2));
      } else {
        this.isBlinking = false;
        this.blinkLeft = 0;
        if (Math.random() < 0.22) {
          this.nextBlinkTime = this.time + 0.14; // Quick double blink
        } else {
          this.nextBlinkTime = this.time + 2.2 + Math.random() * 2.8;
        }
      }
    } else {
      this.blinkLeft = 0;
    }

    // 4. Involuntary Micro-Saccades (Human subtle eye darts)
    if (this.time >= this.nextSaccadeTime) {
      this.nextSaccadeTime = this.time + 1.6 + Math.random() * 1.8;
      this.saccadeOffset.x = (Math.random() - 0.5) * 0.08;
      this.saccadeOffset.y = (Math.random() - 0.5) * 0.05;
    }

    // Smooth Mouse Gaze Lerp
    const targetGazeX = this.mouseTarget.x + this.saccadeOffset.x;
    const targetGazeY = this.mouseTarget.y + this.saccadeOffset.y;
    this.mouseCurrent.x += (targetGazeX - this.mouseCurrent.x) * 5.0 * delta;
    this.mouseCurrent.y += (targetGazeY - this.mouseCurrent.y) * 5.0 * delta;

    // 5. Update Shader Uniforms
    const u = this.material.uniforms;
    u.u_time.value = this.time;
    u.u_jawOpen.value = Math.max(0.0, this.jawCurrent);
    u.u_mouthSpread.value = this.spreadCurrent;
    u.u_smile.value = Math.max(0.0, this.smileCurrent);
    u.u_cheekSquint.value = Math.max(0.0, this.cheekSquintCurrent);
    u.u_blink.value = this.blinkLeft;
    u.u_browLift.value = Math.max(0.0, this.browCurrent);
    u.u_headRoll.value = this.headRollCurrent;
    u.u_headPitch.value = this.headPitchCurrent;
    u.u_headYaw.value = this.headYawCurrent;
    u.u_mouse.value.set(this.mouseCurrent.x, this.mouseCurrent.y);
    u.u_breathing.value = Math.sin(this.time * 1.6);

    // 6. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.isReady = false;
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
