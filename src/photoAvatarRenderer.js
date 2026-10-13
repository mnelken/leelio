/**
 * PhotoAvatarRenderer: 2.5D Real-Time GPU Face Deformation Engine
 * High-performance WebGL GLSL shader system:
 * - Anatomical jaw drop & oral cavity synthesis with teeth
 * - Real upper and lower lip separation using original photo pixels
 * - Dynamic eyelid descent using her actual skin texture & eyelash line
 * - Gaze parallax, micro-head drift, and natural breathing
 * Runs at locked 60 FPS on integrated laptop GPUs via Three.js WebGL.
 */

const THREE = window.THREE;

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
    this.jawTarget = 0;
    this.jawCurrent = 0;
    this.spreadTarget = 0;
    this.spreadCurrent = 0;
    this.browTarget = 0;
    this.browCurrent = 0;
    this.headNod = 0;
    this.headTilt = 0;

    // Eyelid Blinking State
    this.blinkLeft = 0;
    this.blinkRight = 0;
    this.blinkTimer = 0;
    this.nextBlinkTime = 2.5 + Math.random() * 2.0;
    this.isBlinking = false;
    this.blinkPhase = 0; // 0 to 1

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
    loader.load("avatar.jpg", (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      this.texture = tex;
      this.setupShader(width, height);
      this.isReady = true;
      console.log("[PhotoAvatarRenderer] GPU Shader Avatar armed and ready.");
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
      uniform float u_blink;
      uniform float u_browLift;
      uniform float u_headNod;
      uniform float u_headTilt;
      uniform vec2 u_mouse;
      uniform float u_breathing;

      varying vec2 vUv;

      void main() {
        // 1. VIEWPORT ASPECT FRAMING: RESTORE FULL SCENE WITH SOLDIERS
        // Texture: 1024x559 (aspect ~1.8318)
        // Leelio is centered at (548, 235), soldiers are visible on left and right flanks
        float screenAspect = u_resolution.x / u_resolution.y;
        float imageAspect = u_imageSize.x / u_imageSize.y;

        vec2 scale;
        vec2 center = vec2(548.0 / 1024.0, 0.50);
        float edgeFade = 1.0;

        if (screenAspect >= imageAspect) {
          // Extra-wide screens (e.g. 21:9): fit width, slight crop top/bottom
          scale = vec2(1.0, imageAspect / screenAspect);
        } else if (screenAspect >= 1.0) {
          // Standard landscape laptops/monitors (e.g. 16:9 = 1.778):
          // Fits height, minimal width crop (~3%). Both soldiers on left & right are 100% visible!
          scale = vec2(screenAspect / imageAspect, 1.0);
        } else {
          // Portrait screens (phones held vertically):
          // Width scale 0.82 shows both soldiers and banners cleanly flanking Leelio!
          float portraitWidth = 0.82;
          scale.x = portraitWidth;
          scale.y = portraitWidth * (imageAspect / screenAspect);
          center = vec2(548.0 / 1024.0, 0.44); // Frame her face nicely in upper screen above HUD

          // Ambient fade for out-of-bounds coordinates
          vec2 checkUv = (vUv - 0.5) * scale + center;
          if (checkUv.y < 0.0 || checkUv.y > 1.0) {
            float distY = max(-checkUv.y, checkUv.y - 1.0);
            edgeFade = smoothstep(0.12, 0.0, distY);
          }
        }

        vec2 baseUv = (vUv - 0.5) * scale + center;

        // 2. CONVERSATIONAL MICRO-HEAD DRIFT & SPEECH NODS
        float driftX = sin(u_time * 0.7) * 0.0020 + u_mouse.x * 0.010;
        float driftY = cos(u_time * 0.9) * 0.0018 + u_mouse.y * 0.007 + u_breathing * 0.0022;
        driftY += u_headNod;
        driftX += u_headTilt;

        baseUv -= vec2(driftX, -driftY);
        baseUv = clamp(baseUv, vec2(0.002), vec2(0.998));

        // Convert UV to image pixel space (px: 0..1024, py: 0..559 from top)
        vec2 P = vec2(baseUv.x * u_imageSize.x, (1.0 - baseUv.y) * u_imageSize.y);

        // 3. EYEBROW INFLECTION ANIMATION
        // Left eyebrow at (515, 148), Right eyebrow at (572, 149)
        if (u_browLift > 0.01) {
          float browL = exp(-pow((P.x - 515.0) / 18.0, 2.0) - pow((P.y - 148.0) / 9.0, 2.0));
          float browR = exp(-pow((P.x - 572.0) / 18.0, 2.0) - pow((P.y - 149.0) / 9.0, 2.0));
          float browTotal = (browL + browR) * u_browLift * 2.8;
          P.y += browTotal; // In backward UV sampling, +y samples lower skin, moving brow UP on screen!
        }

        // 4. NATURAL EYE BLINKING & GAZE TRACKING
        // Left eye (her right eye): center (518, 166), rx=13.0, ry=7.0
        // Right eye (her left eye): center (571, 167), rx=12.0, ry=7.0
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
            // Subtle iris gaze tracking when open
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

        // 5. HIGH-FIDELITY MOUTH ARTICULATION & JAW DYNAMICS
        // Mouth center: (551.0, 233.0)
        // Natural lips span: left corner 530, right corner 573 (half-width 21.5)
        float mouthCx = 551.0;
        float mouthCy = 233.0;
        float mouthHw = 21.5 * (1.0 + 0.18 * u_mouthSpread);

        float tx = (P.x - mouthCx) / mouthHw;
        bool inMouthSpan = abs(tx) <= 1.0;

        // Expressive vertical opening up to 24px
        float maxAperture = 24.0 * u_jawOpen * (1.0 - 0.20 * abs(u_mouthSpread));

        // Check if inside opened oral aperture
        if (inMouthSpan && u_jawOpen > 0.01) {
          float arch = sqrt(max(0.0, 1.0 - tx * tx)) * (1.0 - 0.10 * tx * tx);
          float hOpen = maxAperture * arch;

          float yUpper = mouthCy - hOpen * 0.18;
          float yLower = mouthCy + hOpen * 0.82;

          // PIXEL INSIDE ORAL CAVITY
          if (P.y >= yUpper && P.y <= yLower) {
            float relY = (P.y - yUpper) / max(0.01, yLower - yUpper);

            // Upper teeth band anchored to maxilla
            float upperTeethH = min(hOpen * 0.42, 6.2);
            bool inUpperTeeth = (P.y <= yUpper + upperTeethH) && (abs(tx) < 0.74);

            // Lower teeth band emerges when jaw opens wide
            float lowerTeethH = min(hOpen * 0.25, 4.0) * smoothstep(0.35, 0.65, u_jawOpen);
            bool inLowerTeeth = (P.y >= yLower - lowerTeethH) && (abs(tx) < 0.68) && (u_jawOpen > 0.35);

            vec3 cavityCol = vec3(0.08, 0.015, 0.015); // Deep throat rich crimson cavity

            if (inUpperTeeth) {
              float toothGrad = smoothstep(yUpper, yUpper + upperTeethH, P.y);
              float toothGroove = sin(tx * 34.0) * 0.06;
              vec3 toothColor = vec3(0.95, 0.92, 0.88) - vec3(toothGrad * 0.15 + toothGroove);
              float topLipShadow = smoothstep(yUpper, yUpper + 1.4, P.y);
              cavityCol = mix(vec3(0.25, 0.08, 0.08), toothColor, topLipShadow);
            } else if (inLowerTeeth) {
              float toothGrad = smoothstep(yLower, yLower - lowerTeethH, P.y);
              float toothGroove = sin(tx * 34.0) * 0.06;
              vec3 toothColor = vec3(0.92, 0.89, 0.85) - vec3(toothGrad * 0.15 + toothGroove);
              cavityCol = mix(cavityCol, toothColor, 0.85);
            } else if (relY > 0.55) {
              // Warm fleshy tongue floor
              float tongueGrad = smoothstep(0.55, 1.0, relY);
              cavityCol = mix(cavityCol, vec3(0.50, 0.18, 0.18), tongueGrad * 0.75);
            }

            // Soft lip rim occlusion shadow
            float edgeDist = min(P.y - yUpper, yLower - P.y);
            float rimShadow = smoothstep(0.0, 1.8, edgeDist);
            cavityCol *= (0.45 + 0.55 * rimShadow);

            gl_FragColor = vec4(cavityCol, 1.0);
            return;
          }
        }

        // 6. CONTINUOUS FACIAL SKIN & JAW DEFORMATION (OUTSIDE APERTURE)
        if (u_jawOpen > 0.01) {
          // A. Mandibular Jaw Drop: Moves chin & jawline naturally down
          // Chin center at (551, 258), fading out by golden collar (275)
          float chinH = smoothstep(45.0, 0.0, abs(P.x - mouthCx));
          float chinV = smoothstep(234.0, 256.0, P.y) * smoothstep(276.0, 260.0, P.y);
          float jawDisplacement = (maxAperture * 0.52) * chinH * chinV;
          P.y -= jawDisplacement;

          // B. Lower Lip Skin Descent (seamless texture match at aperture rim)
          if (P.y >= mouthCy && inMouthSpan) {
            float arch = sqrt(max(0.0, 1.0 - tx * tx)) * (1.0 - 0.10 * tx * tx);
            float hOpen = maxAperture * arch;
            float yLower = mouthCy + hOpen * 0.82;

            if (P.y >= yLower) {
              // Smooth descent of lower lip vermilion towards chin
              float lipFalloff = smoothstep(262.0, yLower, P.y);
              float lipDescent = (hOpen * 0.82) * lipFalloff;
              P.y -= lipDescent;

              // Lateral mouth spread modulation
              float spreadDisp = tx * u_mouthSpread * 2.2 * smoothstep(255.0, yLower, P.y);
              P.x -= spreadDisp;
            }
          }
          // C. Upper Lip Subtle Lift
          else if (P.y < mouthCy && inMouthSpan) {
            float arch = sqrt(max(0.0, 1.0 - tx * tx)) * (1.0 - 0.10 * tx * tx);
            float hOpen = maxAperture * arch;
            float yUpper = mouthCy - hOpen * 0.18;

            if (P.y <= yUpper) {
              float liftFalloff = smoothstep(216.0, yUpper, P.y);
              float lipLift = (hOpen * 0.18) * liftFalloff;
              P.y += lipLift;

              float spreadDisp = tx * u_mouthSpread * 1.5 * smoothstep(216.0, yUpper, P.y);
              P.x -= spreadDisp;
            }
          }
        }

        // 7. CHEST & BREATHING MOTION
        float chestWeight = smoothstep(320.0, 520.0, P.y);
        P.y += sin(u_time * 1.6) * 1.4 * chestWeight;
        P.x -= (P.x - 512.0) * 0.003 * sin(u_time * 1.6) * chestWeight;

        // 8. Sample Original Texture at Deformed Coordinates
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

        // Subtle cinematic lighting
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
        u_blink: { value: 0.0 },
        u_browLift: { value: 0.0 },
        u_headNod: { value: 0.0 },
        u_headTilt: { value: 0.0 },
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

  setAudioLipSync(values) {
    if (!values) return;
    this.jawTarget = Math.min(1.0, Math.max(0.0, values.jawOpen || 0));
    this.spreadTarget = Math.min(1.0, Math.max(-1.0, values.mouthSpread || 0));
    if (values.browLift !== undefined) {
      this.browTarget = Math.min(1.0, Math.max(0.0, values.browLift));
    } else {
      this.browTarget = this.isSpeaking ? Math.min(1.0, this.jawTarget * 0.65) : 0;
    }
  }

  setSpeakingState(isSpeaking) {
    this.isSpeaking = isSpeaking;
    if (!isSpeaking) {
      this.jawTarget = 0;
      this.spreadTarget = 0;
      this.browTarget = 0;
      this.headNod = 0;
      this.headTilt = 0;
    }
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

    // 1. Snappy Lip-Sync Interpolation
    const lerpSpeed = this.isSpeaking ? 26.0 : 14.0;
    this.jawCurrent += (this.jawTarget - this.jawCurrent) * lerpSpeed * delta;
    this.spreadCurrent += (this.spreadTarget - this.spreadCurrent) * lerpSpeed * delta;
    this.browCurrent += (this.browTarget - this.browCurrent) * 12.0 * delta;

    // 2. Speech Head Dynamics: Conversational Nods & Tilts
    if (this.isSpeaking) {
      this.headNod = Math.sin(this.time * 6.5) * 0.0028 * this.jawCurrent;
      this.headTilt = Math.cos(this.time * 3.2) * 0.0020 * (0.3 + 0.7 * this.jawCurrent);
    } else {
      this.headNod *= 0.90;
      this.headTilt *= 0.90;
    }

    // 3. Eye Blinking Lifecycle (natural human blink curve with occasional double-blink)
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
        // 20% chance of quick double blink
        if (Math.random() < 0.20) {
          this.nextBlinkTime = this.time + 0.12;
        } else {
          this.nextBlinkTime = this.time + 2.5 + Math.random() * 2.8;
        }
      }
    } else {
      this.blinkLeft = 0;
    }

    // 4. Smooth Mouse Parallax Lerp
    this.mouseCurrent.x += (this.mouseTarget.x - this.mouseCurrent.x) * 4.0 * delta;
    this.mouseCurrent.y += (this.mouseTarget.y - this.mouseCurrent.y) * 4.0 * delta;

    // 5. Update Shader Uniforms
    const u = this.material.uniforms;
    u.u_time.value = this.time;
    u.u_jawOpen.value = Math.max(0.0, this.jawCurrent);
    u.u_mouthSpread.value = this.spreadCurrent;
    u.u_blink.value = this.blinkLeft;
    u.u_browLift.value = Math.max(0.0, this.browCurrent);
    u.u_headNod.value = this.headNod;
    u.u_headTilt.value = this.headTilt;
    u.u_mouse.value.set(this.mouseCurrent.x, this.mouseCurrent.y);
    u.u_breathing.value = Math.sin(this.time * 1.5);

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
