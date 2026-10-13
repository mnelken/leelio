/**
 * FacialSkeletonRenderer: 3D Anatomical Landmark Wireframe & FACS Parameter Rig
 * 
 * Renders:
 * 1. 3D Anatomical Landmark Skeleton (72 articulated facial nodes)
 * 2. 88 Skeletal Bone Connections with anatomical region color coding:
 *    - Cyan: Mandible & Chin contour
 *    - Hot Pink: Outer & Inner Vermilion (Lips & Oral Aperture)
 *    - Amber: Orbital Eye Sockets
 *    - Gold: Frontalis Eyebrows
 *    - Mint: Nasal Bridge & Septum
 *    - Lavender: Cervical Spine & Cranium Vault
 * 3. 3D Cervical Coordinate Gimbal (Roll, Pitch, Yaw axes)
 * 4. Interactive 3D Orbit: Drag with mouse to inspect 3D facial depth
 * 5. High-speed buffer geometry updates running locked at 60 FPS
 */

import { SKELETON_EDGES, NEUTRAL_LANDMARKS_3D } from "./facialSkeletonModel.js";

const THREE = window.THREE;

export class FacialSkeletonRenderer {
  constructor(canvas, skeletonModel = null, options = {}) {
    this.canvas = canvas;
    this.skeleton = skeletonModel;
    this.options = options;

    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // 3D Objects
    this.linesMesh = null;
    this.pointsMesh = null;
    this.gimbalGroup = null;
    this.headPivotMesh = null;

    // Buffer Attributes
    this.linePosAttr = null;
    this.pointPosAttr = null;

    // Mouse Orbit State
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.orbitRotation = { x: 0.05, y: 0.0 }; // slight default 3D isometric tilt
    this.targetOrbit = { x: 0.05, y: 0.0 };

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || this.canvas.width || 480;
    const height = this.canvas.clientHeight || this.canvas.height || 480;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x060911, 1.0);

    // 2. Scene & Perspective Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(0, -0.15, 3.2);
    this.camera.lookAt(0, -0.15, 0);

    // Root group for user orbit rotation
    this.rigGroup = new THREE.Group();
    this.scene.add(this.rigGroup);

    // 3. Build 3D Line Wireframe
    this.buildWireframe();

    // 4. Build Landmark Nodes
    this.buildLandmarkPoints();

    // 5. Build Cervical Gimbal / Coordinate Axes
    this.buildGimbal();

    // 6. Setup Interactive Orbit Drag
    this.setupInteractivity();

    // Handle Resize
    window.addEventListener("resize", () => this.handleResize());
  }

  getRegionColor(p1, p2) {
    // Determine color based on anatomical region of connected vertices
    const maxIdx = Math.max(p1, p2);
    const minIdx = Math.min(p1, p2);

    // Outer & Inner Lips
    if (minIdx >= 48 && maxIdx <= 67) {
      return [1.0, 0.18, 0.48]; // Hot Pink / Vermilion
    }
    // Eyes
    if ((minIdx >= 36 && maxIdx <= 41) || (minIdx >= 42 && maxIdx <= 47)) {
      return [1.0, 0.72, 0.05]; // Electric Amber
    }
    // Eyebrows
    if (minIdx >= 17 && maxIdx <= 26) {
      return [1.0, 0.88, 0.20]; // Bright Gold
    }
    // Nose Bridge & Base
    if (minIdx >= 27 && maxIdx <= 35) {
      return [0.08, 0.88, 0.65]; // Mint / Emerald
    }
    // Jawline
    if (maxIdx <= 16) {
      return [0.0, 0.85, 1.0]; // Bright Cyan
    }
    // Cervical spine & Cranium
    if (maxIdx >= 68) {
      return [0.55, 0.40, 0.95]; // Lavender
    }
    // Facial biomechanical struts
    return [0.25, 0.45, 0.75]; // Subdued Steel Blue
  }

  buildWireframe() {
    const edgeCount = SKELETON_EDGES.length;
    const vertexCount = edgeCount * 2;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);

    for (let e = 0; e < edgeCount; e++) {
      const [idxA, idxB] = SKELETON_EDGES[e];
      const posA = NEUTRAL_LANDMARKS_3D[idxA];
      const posB = NEUTRAL_LANDMARKS_3D[idxB];
      const col = this.getRegionColor(idxA, idxB);

      const offsetA = (e * 2) * 3;
      const offsetB = (e * 2 + 1) * 3;

      // Vertex A
      positions[offsetA] = posA[0];
      positions[offsetA + 1] = posA[1];
      positions[offsetA + 2] = posA[2];
      colors[offsetA] = col[0];
      colors[offsetA + 1] = col[1];
      colors[offsetA + 2] = col[2];

      // Vertex B
      positions[offsetB] = posB[0];
      positions[offsetB + 1] = posB[1];
      positions[offsetB + 2] = posB[2];
      colors[offsetB] = col[0];
      colors[offsetB + 1] = col[1];
      colors[offsetB + 2] = col[2];
    }

    const geometry = new THREE.BufferGeometry();
    this.linePosAttr = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute("position", this.linePosAttr);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.92
    });

    this.linesMesh = new THREE.LineSegments(geometry, material);
    this.rigGroup.add(this.linesMesh);
  }

  buildLandmarkPoints() {
    const count = NEUTRAL_LANDMARKS_3D.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const p = NEUTRAL_LANDMARKS_3D[i];
      positions[i * 3] = p[0];
      positions[i * 3 + 1] = p[1];
      positions[i * 3 + 2] = p[2];

      // Key landmark highlights
      if (i === 8) { // Chin tip
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.9;
      } else if (i === 48 || i === 54) { // Mouth corners
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.5;
      } else if (i === 33) { // Nose tip
        colors[i * 3] = 0.1; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.7;
      } else if (i === 68) { // Cervical neck pivot
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.4; colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
      }
    }

    const geometry = new THREE.BufferGeometry();
    this.pointPosAttr = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute("position", this.pointPosAttr);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Circular point styling via Canvas texture
    const pointTexture = this.createPointTexture();

    const material = new THREE.PointsMaterial({
      size: 10,
      map: pointTexture,
      transparent: true,
      vertexColors: true,
      alphaTest: 0.05,
      depthWrite: false
    });

    this.pointsMesh = new THREE.Points(geometry, material);
    this.rigGroup.add(this.pointsMesh);
  }

  createPointTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
    grad.addColorStop(0.0, "rgba(255,255,255,1.0)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.7, "rgba(255,255,255,0.3)");
    grad.addColorStop(1.0, "rgba(255,255,255,0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  buildGimbal() {
    this.gimbalGroup = new THREE.Group();
    // Position at Cervical Neck Pivot (0, -1.15, -0.2)
    this.gimbalGroup.position.set(0, -1.15, -0.2);

    // RGB Axes Helper (X=Pitch Red, Y=Yaw Green, Z=Roll Blue)
    const axes = new THREE.AxesHelper(0.35);
    this.gimbalGroup.add(axes);

    // Pivot ring indicator
    const ringGeo = new THREE.RingGeometry(0.12, 0.14, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8338ec,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    this.gimbalGroup.add(ringMesh);

    this.rigGroup.add(this.gimbalGroup);
  }

  setupInteractivity() {
    const c = this.canvas;

    c.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.prevMouse.x = e.clientX;
      this.prevMouse.y = e.clientY;
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.prevMouse.x = e.clientX;
      this.prevMouse.y = e.clientY;

      this.targetOrbit.y += dx * 0.008;
      this.targetOrbit.x += dy * 0.008;
      // Clamp vertical tilt
      this.targetOrbit.x = Math.max(-0.6, Math.min(0.6, this.targetOrbit.x));
    });

    // Touch support
    c.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMouse.x = e.touches[0].clientX;
        this.prevMouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      this.isDragging = false;
    });

    window.addEventListener("touchmove", (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.prevMouse.x;
      const dy = e.touches[0].clientY - this.prevMouse.y;
      this.prevMouse.x = e.touches[0].clientX;
      this.prevMouse.y = e.touches[0].clientY;

      this.targetOrbit.y += dx * 0.010;
      this.targetOrbit.x += dy * 0.010;
      this.targetOrbit.x = Math.max(-0.6, Math.min(0.6, this.targetOrbit.x));
    }, { passive: true });
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth || 480;
    const height = this.canvas.clientHeight || 480;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setModel(model) {
    this.skeleton = model;
  }

  render() {
    if (!this.skeleton || !this.renderer) return;

    // Smooth orbit dampening
    this.orbitRotation.x += (this.targetOrbit.x - this.orbitRotation.x) * 0.15;
    this.orbitRotation.y += (this.targetOrbit.y - this.orbitRotation.y) * 0.15;
    this.rigGroup.rotation.x = this.orbitRotation.x;
    this.rigGroup.rotation.y = this.orbitRotation.y;

    // Update 3D Landmark Positions
    const landmarks = this.skeleton.deformedLandmarks;
    const pointPos = this.pointPosAttr.array;
    const linePos = this.linePosAttr.array;

    const safeNum = (v) => (Number.isFinite(v) ? v : 0.0);

    // 1. Update Points
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i] || [0, 0, 0];
      pointPos[i * 3] = safeNum(p[0]);
      pointPos[i * 3 + 1] = safeNum(p[1]);
      pointPos[i * 3 + 2] = safeNum(p[2]);
    }
    this.pointPosAttr.needsUpdate = true;

    // 2. Update Lines
    const edgeCount = SKELETON_EDGES.length;
    for (let e = 0; e < edgeCount; e++) {
      const [idxA, idxB] = SKELETON_EDGES[e];
      const pA = landmarks[idxA] || [0, 0, 0];
      const pB = landmarks[idxB] || [0, 0, 0];

      const offA = (e * 2) * 3;
      const offB = (e * 2 + 1) * 3;

      linePos[offA] = safeNum(pA[0]);
      linePos[offA + 1] = safeNum(pA[1]);
      linePos[offA + 2] = safeNum(pA[2]);

      linePos[offB] = safeNum(pB[0]);
      linePos[offB + 1] = safeNum(pB[1]);
      linePos[offB + 2] = safeNum(pB[2]);
    }
    this.linePosAttr.needsUpdate = true;

    // Safe recomputation of geometry bounding spheres to avoid NaN warnings
    if (this.pointGeom) this.pointGeom.computeBoundingSphere();
    if (this.lineGeom) this.lineGeom.computeBoundingSphere();

    // 3. Update Gimbal Orientation
    const pose = this.skeleton.pose || {};
    this.gimbalGroup.rotation.z = safeNum(pose.headRoll);
    this.gimbalGroup.rotation.x = safeNum(pose.headPitch);
    this.gimbalGroup.rotation.y = safeNum(pose.headYaw);

    // 4. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
