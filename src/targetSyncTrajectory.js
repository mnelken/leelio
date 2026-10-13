import { TARGET_SYNC_DATA } from "./targetSyncData.js";

/**
 * TargetSyncTrajectory
 * Evaluates ground-truth facial kinematics extracted frame-by-frame from Avatar IV Video.mp4
 * (Jessica: "Hello, I'm Jessica. I fell from the sky and I'm here to cause havoc.")
 */
export class TargetSyncTrajectory {
  constructor(syncData = TARGET_SYNC_DATA) {
    this.data = syncData;
    this.frames = syncData.frames || [];
    this.duration = syncData.duration || 4.460;
    this.totalFrames = this.frames.length;
    this.fps = syncData.fps || 30;
  }

  /**
   * Evaluate kinematic pose at given time in seconds.
   * @param {number} timeInSeconds - Timeline position in seconds.
   * @param {boolean} loop - Whether to loop within duration.
   * @returns {Object} Evaluated kinematics (roll, pitch, yaw, jaw, spread, smile, cheekSquint, browLift, teethExposure, audioRms)
   */
  evaluate(timeInSeconds, loop = true) {
    if (!this.totalFrames) {
      return {
        roll: 0, pitch: 0, yaw: 0,
        jaw: 0, spread: 0, smile: 0.20,
        cheekSquint: 0.12, browLift: 0,
        teethExposure: 0, pucker: 0, audioRms: 0
      };
    }

    let t = Number(timeInSeconds) || 0;
    if (loop && this.duration > 0) {
      t = ((t % this.duration) + this.duration) % this.duration;
    } else {
      t = Math.max(0, Math.min(this.duration, t));
    }

    // Direct approximate frame index
    let idx = Math.floor(t * this.fps);
    if (idx < 0) idx = 0;
    if (idx >= this.totalFrames - 1) idx = this.totalFrames - 2;

    const f0 = this.frames[idx];
    const f1 = this.frames[idx + 1] || f0;

    const dt = (f1.t - f0.t) || (1.0 / this.fps);
    let alpha = (t - f0.t) / dt;
    alpha = Math.max(0.0, Math.min(1.0, alpha));

    // Smooth Hermite (S-curve) interpolation for continuous sub-frame kinematics
    const s = alpha * alpha * (3.0 - 2.0 * alpha);

    // Linear/Hermite lerp helper
    const lerp = (a, b) => a + (b - a) * s;

    // Ground-truth extracted values
    const rawRoll = lerp(f0.roll, f1.roll); // in degrees
    const rawPitch = lerp(f0.pitch, f1.pitch);
    const rawYaw = lerp(f0.yaw, f1.yaw);
    const smile = lerp(f0.mouthSmile, f1.mouthSmile);
    const cheekSquint = lerp(f0.cheekSquint, f1.cheekSquint);
    const browLift = lerp(f0.browLift, f1.browLift);
    const teethExposure = lerp(f0.teethExposure, f1.teethExposure);
    const pucker = lerp(f0.pucker, f1.pucker);
    const audioRms = lerp(f0.audioRms, f1.audioRms);

    // 1. Head Roll: convert degrees to radians for cervical rotation
    const roll = rawRoll * (Math.PI / 180.0);

    // 2. Head Pitch: vertical nodding displacement factor
    const pitch = rawPitch * 0.042;

    // 3. Head Yaw: depth parallax lateral displacement factor
    const yaw = rawYaw * 0.85;

    // 4. Jaw / Mouth Opening: driven by ground-truth acoustic RMS envelope & teeth arch
    let jaw = 0;
    if (audioRms > 0.005) {
      jaw = Math.min(1.0, audioRms * 3.2 + teethExposure * 0.50 + Math.max(0, smile - 0.3) * 0.25);
    } else {
      // Resting smile with teeth arch exposure
      jaw = Math.min(0.40, teethExposure * 0.65 + Math.max(0, smile - 0.5) * 0.20);
    }

    // 5. Mouth Spread: horizontal widening on smile, narrowing on pucker
    const spread = (smile - 0.25) * 0.70 - pucker * 0.50;

    return {
      t,
      roll,
      pitch,
      yaw,
      jaw,
      spread,
      smile,
      cheekSquint,
      browLift,
      teethExposure,
      pucker,
      audioRms
    };
  }
}

export const targetSyncTrajectory = new TargetSyncTrajectory();
