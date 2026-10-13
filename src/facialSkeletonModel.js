/**
 * Canonical 52 ARKit / FACS Facial Parameter Rig & 3D Skeleton Model
 * 
 * Provides:
 * 1. Standard 52 ARKit / FACS Facial Blendshape Channels
 * 2. 6-DOF Cervical Head Pose (Roll, Pitch, Yaw, Translation)
 * 3. Anatomical 3D Landmark Skeleton Topology (Jaw, Lips, Eyes, Brows, Nose, Neck)
 * 4. Real-time deformation mapping from target video kinematics
 */

export const ARKIT_52_PARAMETERS = [
  // Eyebrows (5)
  "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
  // Cheeks & Nose (5)
  "cheekPuff", "cheekSquintLeft", "cheekSquintRight", "noseSneerLeft", "noseSneerRight",
  // Eyes & Gaze (14)
  "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight",
  "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight",
  "eyeLookUpLeft", "eyeLookUpRight", "eyeSquintLeft", "eyeSquintRight",
  "eyeWideLeft", "eyeWideRight",
  // Mandible / Jaw (4)
  "jawForward", "jawLeft", "jawOpen", "jawRight",
  // Mouth & Lips (23)
  "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft", "mouthFrownRight",
  "mouthFunnel", "mouthLeft", "mouthLowerDownLeft", "mouthLowerDownRight",
  "mouthPressLeft", "mouthPressRight", "mouthPucker", "mouthRight",
  "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
  "mouthSmileLeft", "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight",
  "mouthUpperUpLeft", "mouthUpperUpRight",
  // Tongue (1)
  "tongueOut"
];

// Canonical Neutral 3D Facial Landmark Positions (68 points normalized around skull center)
export const NEUTRAL_LANDMARKS_3D = [
  // 0-16: Jawline contour (17 points, left ear to right ear)
  [-0.68, 0.32, -0.25], [-0.67, 0.12, -0.20], [-0.65, -0.08, -0.16], [-0.61, -0.28, -0.12],
  [-0.52, -0.46, -0.08], [-0.40, -0.62, -0.04], [-0.26, -0.74, -0.01], [-0.13, -0.82,  0.02],
  [ 0.00, -0.85,  0.03], // 8: Chin tip
  [ 0.13, -0.82,  0.02], [ 0.26, -0.74, -0.01], [ 0.40, -0.62, -0.04], [ 0.52, -0.46, -0.08],
  [ 0.61, -0.28, -0.12], [ 0.65, -0.08, -0.16], [ 0.67, 0.12, -0.20], [ 0.68, 0.32, -0.25],

  // 17-21: Left Eyebrow (5 points, viewer's left = subject's right)
  [-0.52, 0.44, 0.04], [-0.42, 0.52, 0.08], [-0.28, 0.54, 0.10], [-0.15, 0.50, 0.10], [-0.05, 0.42, 0.09],

  // 22-26: Right Eyebrow (5 points)
  [ 0.05, 0.42, 0.09], [ 0.15, 0.50, 0.10], [ 0.28, 0.54, 0.10], [ 0.42, 0.52, 0.08], [ 0.52, 0.44, 0.04],

  // 27-30: Nose Bridge (4 points)
  [ 0.00, 0.36, 0.12], [ 0.00, 0.24, 0.17], [ 0.00, 0.12, 0.22], [ 0.00, 0.00, 0.27],

  // 31-35: Nose Base (5 points)
  [-0.14, -0.08, 0.17], [-0.07, -0.10, 0.22], [ 0.00, -0.11, 0.25], [ 0.07, -0.10, 0.22], [ 0.14, -0.08, 0.17],

  // 36-41: Left Eye Socket (6 points)
  [-0.44, 0.30, 0.04], [-0.36, 0.35, 0.07], [-0.24, 0.35, 0.07], [-0.16, 0.29, 0.05], [-0.24, 0.25, 0.06], [-0.36, 0.25, 0.06],

  // 42-47: Right Eye Socket (6 points)
  [ 0.16, 0.29, 0.05], [ 0.24, 0.35, 0.07], [ 0.36, 0.35, 0.07], [ 0.44, 0.30, 0.04], [ 0.36, 0.25, 0.06], [ 0.24, 0.25, 0.06],

  // 48-59: Outer Lips Loop (12 points)
  [-0.26, -0.32, 0.12], // 48: Left mouth corner
  [-0.18, -0.24, 0.16], [-0.09, -0.22, 0.19], [ 0.00, -0.23, 0.20], // Philtrum
  [ 0.09, -0.22, 0.19], [ 0.18, -0.24, 0.16],
  [ 0.26, -0.32, 0.12], // 54: Right mouth corner
  [ 0.18, -0.38, 0.15], [ 0.09, -0.42, 0.17], [ 0.00, -0.43, 0.18], // Lower vermilion
  [-0.09, -0.42, 0.17], [-0.18, -0.38, 0.15],

  // 60-67: Inner Lips / Oral Aperture (8 points)
  [-0.20, -0.32, 0.11], [-0.10, -0.28, 0.14], [ 0.00, -0.28, 0.15], [ 0.10, -0.28, 0.14],
  [ 0.20, -0.32, 0.11], [ 0.10, -0.35, 0.13], [ 0.00, -0.36, 0.14], [-0.10, -0.35, 0.13],

  // 68-71: Cervical Spine & Cranium Landmarks
  [ 0.00, -1.15, -0.20], // 68: Cervical Neck Pivot Bone
  [ 0.00,  0.88, -0.15], // 69: Skull Crown
  [-0.68,  0.32, -0.25], // 70: Left Ear pivot
  [ 0.68,  0.32, -0.25]  // 71: Right Ear pivot
];

// Skeletal Connection Pairs (bone lines between vertices)
export const SKELETON_EDGES = [
  // Jawline arc (0 -> 16)
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],

  // Left Eyebrow
  [17,18],[18,19],[19,20],[20,21],

  // Right Eyebrow
  [22,23],[23,24],[24,25],[25,26],

  // Nose Ridge & Base
  [27,28],[28,29],[29,30],[30,33],
  [31,32],[32,33],[33,34],[34,35],
  [30,31],[30,35],

  // Left Eye loop
  [36,37],[37,38],[38,39],[39,40],[40,41],[41,36],

  // Right Eye loop
  [42,43],[43,44],[44,45],[45,46],[46,47],[47,42],

  // Outer Lips loop
  [48,49],[49,50],[50,51],[51,52],[52,53],[53,54],
  [54,55],[55,56],[56,57],[57,58],[58,59],[59,48],

  // Inner Lips loop (Oral aperture)
  [60,61],[61,62],[62,63],[63,64],[64,65],[65,66],[66,67],[67,60],

  // Facial Struts / Biomechanical Muscle Connections
  [17,36],[21,27],[22,27],[26,45], // Brow to bridge/eyes
  [39,27],[42,27], // Inner cantus to bridge
  [36,0],[45,16], // Outer cantus to jaw/ears
  [31,48],[35,54], // Nasolabial fold: nose wings to mouth corners
  [33,51], // Philtrum strut
  [48,5],[54,11], // Depressor anguli oris to jaw
  [57,8], // Mentalis chin strut

  // Cervical Neck & Head Rig Bones
  [8,68],[0,68],[16,68], // Jaw to neck pivot
  [19,69],[24,69], // Brows to crown
  [0,70],[16,71] // Ear anchors
];

export class FacialSkeletonModel {
  constructor() {
    // 52 ARKit Blendshape Values (0.0 to 1.0)
    this.parameters = {};
    for (const name of ARKIT_52_PARAMETERS) {
      this.parameters[name] = 0.0;
    }

    // 6-DOF Cervical Pose Parameters
    this.pose = {
      headRoll: 0.0,   // Radians lateral cervical tilt
      headPitch: 0.0,  // Radians nod flexion/extension
      headYaw: 0.0,    // Radians axial rotation
      headPosX: 0.0,
      headPosY: 0.0,
      headPosZ: 0.0
    };

    // Cache of deformed 3D landmark positions
    this.deformedLandmarks = NEUTRAL_LANDMARKS_3D.map(p => [...p]);
  }

  /**
   * Set an individual blendshape parameter
   */
  setParameter(name, value) {
    if (this.parameters[name] !== undefined) {
      this.parameters[name] = Math.max(0.0, Math.min(1.0, value));
    }
  }

  /**
   * Get an individual parameter value
   */
  getParameter(name) {
    return this.parameters[name] || 0.0;
  }

  /**
   * Map movement from continuous trajectory evaluator into the 52-parameter skeleton
   */
  updateFromTrajectory(evaluator, currentTime) {
    if (!evaluator) return;
    const sample = evaluator.evaluate(currentTime);

    // 1. Cervical Head Pose
    this.pose.headRoll = sample.rollRad;
    this.pose.headPitch = sample.nodY * 0.14;
    this.pose.headYaw = sample.yawX * 0.18;
    this.pose.headPosX = sample.yawX * 0.08;
    this.pose.headPosY = sample.nodY * 0.05;

    // 2. Mandible / Jaw Parameters
    const jawVal = Math.min(1.0, sample.jawOpen);
    this.parameters.jawOpen = jawVal;
    this.parameters.mouthLowerDownLeft = jawVal * 0.55;
    this.parameters.mouthLowerDownRight = jawVal * 0.55;
    this.parameters.mouthFunnel = jawVal * 0.25;

    // 3. Zygomaticus / Smile & Cheek Parameters
    const smileVal = Math.min(1.0, sample.smile);
    this.parameters.mouthSmileLeft = smileVal;
    this.parameters.mouthSmileRight = smileVal;
    this.parameters.mouthDimpleLeft = smileVal * 0.45;
    this.parameters.mouthDimpleRight = smileVal * 0.45;
    this.parameters.cheekSquintLeft = smileVal * 0.50;
    this.parameters.cheekSquintRight = smileVal * 0.50;
    this.parameters.cheekPuff = smileVal * 0.22;

    // 4. Frontalis / Eyebrow Parameters
    const browVal = Math.min(1.0, sample.browLift);
    this.parameters.browInnerUp = browVal * 0.85;
    this.parameters.browOuterUpLeft = browVal * 0.50;
    this.parameters.browOuterUpRight = browVal * 0.50;

    // 5. Palpebral / Eye Blink Parameters
    const blinkVal = sample.blink || 0.0;
    this.parameters.eyeBlinkLeft = blinkVal;
    this.parameters.eyeBlinkRight = blinkVal;
    this.parameters.eyeSquintLeft = Math.max(blinkVal * 0.3, smileVal * 0.35);
    this.parameters.eyeSquintRight = Math.max(blinkVal * 0.3, smileVal * 0.35);

    // 6. Mouth Spread & Pucker
    if (sample.mouthSpread !== undefined) {
      if (sample.mouthSpread > 0) {
        this.parameters.mouthStretchLeft = Math.min(1.0, sample.mouthSpread * 0.7);
        this.parameters.mouthStretchRight = Math.min(1.0, sample.mouthSpread * 0.7);
        this.parameters.mouthPucker = 0.0;
      } else {
        this.parameters.mouthPucker = Math.min(1.0, -sample.mouthSpread * 0.8);
        this.parameters.mouthStretchLeft = 0.0;
        this.parameters.mouthStretchRight = 0.0;
      }
    }

    // Recompute deformed 3D skeletal landmarks
    this.computeDeformedLandmarks();
  }

  /**
   * Deform the 3D landmark skeleton points using the 52 parameters & head pose
   */
  computeDeformedLandmarks() {
    const p = this.parameters;
    const pose = this.pose;

    // Head rotation matrix around cervical pivot (0, -1.15, -0.20)
    const pivot = [0.0, -1.15, -0.20];
    const cosR = Math.cos(pose.headRoll);
    const sinR = Math.sin(pose.headRoll);
    const cosP = Math.cos(pose.headPitch);
    const sinP = Math.sin(pose.headPitch);
    const cosY = Math.cos(pose.headYaw);
    const sinY = Math.sin(pose.headYaw);

    for (let i = 0; i < NEUTRAL_LANDMARKS_3D.length; i++) {
      const base = NEUTRAL_LANDMARKS_3D[i];
      let x = base[0];
      let y = base[1];
      let z = base[2];

      // --- Facial Muscle Deformations ---
      // Mandible Drop (Jaw Open) affecting lower face (indices 4-12, 55-59, 64-67)
      if ((i >= 4 && i <= 12) || (i >= 55 && i <= 59) || (i >= 64 && i <= 67)) {
        const dropFactor = (i >= 7 && i <= 9) ? 0.28 : (i >= 56 && i <= 58) ? 0.22 : 0.16;
        y -= p.jawOpen * dropFactor;
        z -= p.jawOpen * 0.04; // TMJ arc slight posterior displacement
      }

      // Zygomaticus Major Smile Lift (mouth corners 48, 54, and adjacent lips)
      if (i === 48 || i === 60) { // Left mouth corner
        x -= p.mouthSmileLeft * 0.06 + (p.mouthStretchLeft || 0) * 0.04;
        y += p.mouthSmileLeft * 0.09;
        z += p.mouthSmileLeft * 0.03;
      }
      if (i === 54 || i === 64) { // Right mouth corner
        x += p.mouthSmileRight * 0.06 + (p.mouthStretchRight || 0) * 0.04;
        y += p.mouthSmileRight * 0.09;
        z += p.mouthSmileRight * 0.03;
      }

      // Eyebrow Elevation (17-26)
      if (i >= 17 && i <= 21) {
        y += p.browInnerUp * 0.08 + p.browOuterUpLeft * 0.05 - p.browDownLeft * 0.05;
      }
      if (i >= 22 && i <= 26) {
        y += p.browInnerUp * 0.08 + p.browOuterUpRight * 0.05 - p.browDownRight * 0.05;
      }

      // Eyelid Blinking (upper eyelids 37, 38 and 43, 44 descend to meet lower lids)
      if (i === 37 || i === 38) {
        y -= p.eyeBlinkLeft * 0.08;
      }
      if (i === 43 || i === 44) {
        y -= p.eyeBlinkRight * 0.08;
      }

      // Cheek Puff / Squint
      if (i === 1 || i === 2) { x -= p.cheekPuff * 0.05; }
      if (i === 14 || i === 15) { x += p.cheekPuff * 0.05; }

      // --- Apply Cervical Head Pose Rotation around Pivot ---
      let dx = x - pivot[0];
      let dy = y - pivot[1];
      let dz = z - pivot[2];

      // Roll (Z axis rotation in portrait plane)
      let x1 = dx * cosR - dy * sinR;
      let y1 = dx * sinR + dy * cosR;
      let z1 = dz;

      // Pitch (X axis flexion)
      let x2 = x1;
      let y2 = y1 * cosP - z1 * sinP;
      let z2 = y1 * sinP + z1 * cosP;

      // Yaw (Y axis rotation)
      let x3 = x2 * cosY + z2 * sinY;
      let y3 = y2;
      let z3 = -x2 * sinY + z2 * cosY;

      // Translate back + head translation
      this.deformedLandmarks[i][0] = x3 + pivot[0] + pose.headPosX;
      this.deformedLandmarks[i][1] = y3 + pivot[1] + pose.headPosY;
      this.deformedLandmarks[i][2] = z3 + pivot[2] + pose.headPosZ;
    }
  }

  /**
   * Return list of parameters currently greater than threshold for live telemetry
   */
  getActiveParameters(threshold = 0.02) {
    const list = [];
    for (const [name, val] of Object.entries(this.parameters)) {
      if (val > threshold) {
        list.push({ name, value: val });
      }
    }
    // Sort descending by intensity
    list.sort((a, b) => b.value - a.value);
    return list;
  }
}
