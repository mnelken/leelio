/**
 * Canonical 52 ARKit / FACS Facial Parameter Rig & 3D Holistic Skeleton Model
 * 
 * Provides:
 * 1. Standard 52 ARKit / FACS Facial Blendshape Channels
 * 2. 6-DOF Cervical Head Pose (Roll, Pitch, Yaw, Translation)
 * 3. Standard Anatomical Torso Model (Neck, Clavicles, Epaulets, Sternum, Ribcage, Lumbar)
 * 4. Standard 21-Joint Articulated Hand Model (MediaPipe / Leap Motion Topology)
 * 5. 118 Articulated 3D Landmarks & Biomechanical Edge Chains
 * 6. High-Precision UV Mapping onto photographic avatar texture
 * 7. Continuous 3D Surface Mesh Triangulation for real-time textured mesh animation
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

// Canonical Neutral 3D Landmarks (118 points normalized around skull center)
export const NEUTRAL_LANDMARKS_3D = [
  // 0-16: Jawline contour (17 points, left ear to right ear)
  [-0.68,  0.32, -0.25], [-0.67,  0.12, -0.20], [-0.65, -0.08, -0.16], [-0.61, -0.28, -0.12],
  [-0.52, -0.46, -0.08], [-0.40, -0.62, -0.04], [-0.26, -0.74, -0.01], [-0.13, -0.82,  0.02],
  [ 0.00, -0.85,  0.03], // 8: Chin tip
  [ 0.13, -0.82,  0.02], [ 0.26, -0.74, -0.01], [ 0.40, -0.62, -0.04], [ 0.52, -0.46, -0.08],
  [ 0.61, -0.28, -0.12], [ 0.65, -0.08, -0.16], [ 0.67,  0.12, -0.20], [ 0.68,  0.32, -0.25],

  // 17-21: Left Eyebrow (5 points, viewer's left)
  [-0.52,  0.44,  0.04], [-0.42,  0.52,  0.08], [-0.28,  0.54,  0.10], [-0.15,  0.50,  0.10], [-0.05,  0.42,  0.09],

  // 22-26: Right Eyebrow (5 points)
  [ 0.05,  0.42,  0.09], [ 0.15,  0.50,  0.10], [ 0.28,  0.54,  0.10], [ 0.42,  0.52,  0.08], [ 0.52,  0.44,  0.04],

  // 27-30: Nose Bridge (4 points)
  [ 0.00,  0.36,  0.12], [ 0.00,  0.24,  0.17], [ 0.00,  0.12,  0.22], [ 0.00,  0.00,  0.27],

  // 31-35: Nose Base (5 points)
  [-0.14, -0.08,  0.17], [-0.07, -0.10,  0.22], [ 0.00, -0.11,  0.25], [ 0.07, -0.10,  0.22], [ 0.14, -0.08,  0.17],

  // 36-41: Left Eye Socket (6 points)
  [-0.44,  0.30,  0.04], [-0.36,  0.35,  0.07], [-0.24,  0.35,  0.07], [-0.16,  0.29,  0.05], [-0.24,  0.25,  0.06], [-0.36,  0.25,  0.06],

  // 42-47: Right Eye Socket (6 points)
  [ 0.16,  0.29,  0.05], [ 0.24,  0.35,  0.07], [ 0.36,  0.35,  0.07], [ 0.44,  0.30,  0.04], [ 0.36,  0.25,  0.06], [ 0.24,  0.25,  0.06],

  // 48-59: Outer Lips Loop (12 points)
  [-0.26, -0.32,  0.12], // 48: Left mouth corner
  [-0.18, -0.24,  0.16], [-0.09, -0.22,  0.19], [ 0.00, -0.23,  0.20], // Philtrum
  [ 0.09, -0.22,  0.19], [ 0.18, -0.24,  0.16],
  [ 0.26, -0.32,  0.12], // 54: Right mouth corner
  [ 0.18, -0.38,  0.15], [ 0.09, -0.42,  0.17], [ 0.00, -0.43,  0.18], // Lower vermilion
  [-0.09, -0.42,  0.17], [-0.18, -0.38,  0.15],

  // 60-67: Inner Lips / Oral Aperture (8 points)
  [-0.20, -0.32,  0.11], [-0.10, -0.28,  0.14], [ 0.00, -0.28,  0.15], [ 0.10, -0.28,  0.14],
  [ 0.20, -0.32,  0.11], [ 0.10, -0.35,  0.13], [ 0.00, -0.36,  0.14], [-0.10, -0.35,  0.13],

  // 68-71: Cervical Spine & Cranium
  [ 0.00, -1.15, -0.20], // 68: Cervical Neck Pivot Bone
  [ 0.00,  0.88, -0.15], // 69: Skull Crown
  [-0.68,  0.32, -0.25], // 70: Left Ear pivot
  [ 0.68,  0.32, -0.25], // 71: Right Ear pivot

  // 72-84: Standard Torso & Upper Limbs (13 points)
  [ 0.00, -1.35, -0.10], // 72: Suprasternal Notch (Clavicle Center / Collar)
  [-0.65, -1.42, -0.12], // 73: Left Clavicle Midpoint
  [ 0.65, -1.42, -0.12], // 74: Right Clavicle Midpoint
  [-1.45, -1.50, -0.18], // 75: Left Shoulder / Epaulet (Acromion)
  [ 1.45, -1.50, -0.18], // 76: Right Shoulder / Epaulet (Acromion)
  [ 0.00, -1.82, -0.05], // 77: Mid-Sternum / Medals Center (Xiphoid)
  [-1.15, -2.35, -0.10], // 78: Left Ribcage / Lateral Torso Contour
  [ 1.15, -2.35, -0.10], // 79: Right Ribcage / Lateral Torso Contour
  [ 0.00, -2.55, -0.12], // 80: Lumbar Spine / Waist Center
  [-1.68, -2.15, -0.15], // 81: Left Elbow
  [ 1.65, -2.15, -0.15], // 82: Right Elbow
  [ 0.32, -2.48,  0.15], // 83: Left Wrist / Smartwatch (Crossed across chest)
  [-0.45, -2.38,  0.08], // 84: Right Forearm folded across abdomen

  // 85-105: Standard 21-Joint Hand Model (MediaPipe / Leap Motion Topology)
  [ 0.38, -2.44,  0.18], // 85: Wrist Root (Carpal Joint 0)
  // Thumb (Joints 1..4)
  [ 0.48, -2.32,  0.20], // 86: Thumb CMC (Joint 1)
  [ 0.58, -2.24,  0.21], // 87: Thumb MCP (Joint 2)
  [ 0.66, -2.18,  0.21], // 88: Thumb IP  (Joint 3)
  [ 0.72, -2.12,  0.22], // 89: Thumb Tip (Joint 4)
  // Index Finger (Joints 5..8)
  [ 0.60, -2.36,  0.20], // 90: Index MCP (Knuckle, Joint 5)
  [ 0.72, -2.32,  0.21], // 91: Index PIP (Joint 6)
  [ 0.82, -2.28,  0.21], // 92: Index DIP (Joint 7)
  [ 0.90, -2.25,  0.20], // 93: Index Tip (Joint 8)
  // Middle Finger (Joints 9..12)
  [ 0.62, -2.42,  0.19], // 94: Middle MCP (Joint 9)
  [ 0.75, -2.38,  0.20], // 95: Middle PIP (Joint 10)
  [ 0.86, -2.34,  0.19], // 96: Middle DIP (Joint 11)
  [ 0.94, -2.31,  0.18], // 97: Middle Tip (Joint 12)
  // Ring Finger (Joints 13..16)
  [ 0.59, -2.48,  0.17], // 98: Ring MCP (Joint 13)
  [ 0.71, -2.44,  0.18], // 99: Ring PIP (Joint 14)
  [ 0.81, -2.41,  0.17], // 100: Ring DIP (Joint 15)
  [ 0.88, -2.38,  0.16], // 101: Ring Tip (Joint 16)
  // Pinky Finger (Joints 17..20)
  [ 0.54, -2.52,  0.16], // 102: Pinky MCP (Joint 17)
  [ 0.64, -2.49,  0.16], // 103: Pinky PIP (Joint 18)
  [ 0.72, -2.46,  0.15], // 104: Pinky DIP (Joint 19)
  [ 0.78, -2.44,  0.14], // 105: Pinky Tip (Joint 20)

  // 106-117: Peaked Military Cap & Portrait Boundary Framework (12 points)
  [-0.75,  0.55,  0.10], // 106: Cap Visor Outer Left
  [ 0.75,  0.55,  0.10], // 107: Cap Visor Outer Right
  [ 0.00,  0.52,  0.22], // 108: Cap Visor Center Arch
  [ 0.00,  0.92,  0.08], // 109: Cap Eagle Emblem
  [-0.88,  1.10, -0.15], // 110: Cap Flare Peak Left
  [ 0.88,  1.10, -0.15], // 111: Cap Flare Peak Right
  [-2.20,  1.55, -0.40], // 112: Frame Top-Left Anchor
  [ 2.20,  1.55, -0.40], // 113: Frame Top-Right Anchor
  [-2.20, -2.75, -0.40], // 114: Frame Bottom-Left Anchor
  [ 2.20, -2.75, -0.40], // 115: Frame Bottom-Right Anchor
  [-2.20, -0.55, -0.35], // 116: Frame Mid-Left Anchor
  [ 2.20, -0.55, -0.35]  // 117: Frame Mid-Right Anchor
];

// High-Precision Photographic UV Mapping for avatar.jpg (1024x559, u in [0,1], v in [0,1])
export const LANDMARK_UVS = [
  // 0-16: Jawline contour
  [0.465, 0.642], [0.469, 0.610], [0.474, 0.585], [0.480, 0.562],
  [0.490, 0.542], [0.502, 0.528], [0.514, 0.519], [0.525, 0.513],
  [0.537, 0.512], // 8: Chin tip
  [0.549, 0.513], [0.561, 0.519], [0.572, 0.528], [0.584, 0.542],
  [0.594, 0.562], [0.601, 0.585], [0.605, 0.610], [0.609, 0.642],

  // 17-21: Left Eyebrow
  [0.486, 0.728], [0.496, 0.739], [0.506, 0.741], [0.516, 0.735], [0.523, 0.725],

  // 22-26: Right Eyebrow
  [0.545, 0.725], [0.553, 0.735], [0.563, 0.741], [0.572, 0.739], [0.582, 0.728],

  // 27-30: Nose Bridge
  [0.534, 0.710], [0.534, 0.689], [0.534, 0.667], [0.534, 0.646],

  // 31-35: Nose Base
  [0.521, 0.631], [0.528, 0.628], [0.535, 0.626], [0.542, 0.628], [0.549, 0.631],

  // 36-41: Left Eye Socket
  [0.493, 0.703], [0.501, 0.712], [0.511, 0.712], [0.519, 0.701], [0.511, 0.694], [0.501, 0.694],

  // 42-47: Right Eye Socket
  [0.550, 0.701], [0.558, 0.712], [0.567, 0.712], [0.575, 0.703], [0.567, 0.694], [0.558, 0.694],

  // 48-59: Outer Lips Loop
  [0.518, 0.590], [0.526, 0.599], [0.533, 0.603], [0.539, 0.601], [0.545, 0.603], [0.552, 0.599],
  [0.561, 0.590], [0.552, 0.576], [0.545, 0.569], [0.539, 0.567], [0.533, 0.569], [0.526, 0.576],

  // 60-67: Inner Lips Loop
  [0.522, 0.590], [0.533, 0.596], [0.539, 0.594], [0.545, 0.596],
  [0.556, 0.590], [0.545, 0.583], [0.539, 0.581], [0.533, 0.583],

  // 68-71: Cervical Spine & Cranium
  [0.535, 0.454], [0.535, 0.920], [0.465, 0.642], [0.609, 0.642],

  // 72-84: Standard Torso & Upper Limbs
  [0.535, 0.419], // 72: Collar center
  [0.464, 0.406], // 73: Left Clavicle
  [0.605, 0.406], // 74: Right Clavicle
  [0.352, 0.401], // 75: Left Shoulder Epaulet
  [0.703, 0.395], // 76: Right Shoulder Epaulet
  [0.535, 0.293], // 77: Mid-Sternum Medals
  [0.381, 0.141], // 78: Left Ribcage
  [0.664, 0.141], // 79: Right Ribcage
  [0.535, 0.025], // 80: Lumbar Waist
  [0.322, 0.177], // 81: Left Elbow
  [0.718, 0.177], // 82: Right Elbow
  [0.581, 0.043], // 83: Left Wrist / Smartwatch
  [0.449, 0.106], // 84: Right Forearm fold

  // 85-105: Standard 21-Joint Hand Model
  [0.591, 0.061], // 85: Wrist Root
  [0.605, 0.097], [0.619, 0.120], [0.630, 0.138], [0.640, 0.156], // 86-89: Thumb
  [0.627, 0.084], [0.645, 0.097], [0.660, 0.109], [0.672, 0.120], // 90-93: Index
  [0.630, 0.066], [0.650, 0.079], [0.668, 0.091], [0.682, 0.102], // 94-97: Middle
  [0.625, 0.052], [0.645, 0.061], [0.662, 0.070], [0.676, 0.079], // 98-101: Ring
  [0.617, 0.041], [0.635, 0.048], [0.649, 0.055], [0.662, 0.063], // 102-105: Pinky

  // 106-117: Peaked Military Cap & Canvas Boundaries
  [0.444, 0.758], // 106: Visor Left
  [0.620, 0.758], // 107: Visor Right
  [0.535, 0.750], // 108: Visor Center
  [0.535, 0.848], // 109: Eagle Emblem
  [0.430, 0.884], // 110: Crown Left
  [0.625, 0.884], // 111: Crown Right
  [0.000, 1.000], // 112: Frame Top-Left
  [1.000, 1.000], // 113: Frame Top-Right
  [0.000, 0.000], // 114: Frame Bottom-Left
  [1.000, 0.000], // 115: Frame Bottom-Right
  [0.000, 0.500], // 116: Frame Mid-Left
  [1.000, 0.500]  // 117: Frame Mid-Right
];

// Skeletal Connection Pairs (bone lines between vertices)
export const SKELETON_EDGES = [
  // --- Facial Skeleton Bones ---
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
  [17,36],[21,27],[22,27],[26,45],
  [39,27],[42,27],
  [36,0],[45,16],
  [31,48],[35,54],
  [33,51],
  [48,5],[54,11],
  [57,8],

  // Cervical Neck & Head Rig Bones
  [8,68],[0,68],[16,68],
  [19,69],[24,69],
  [0,70],[16,71],

  // --- Standard Torso & Upper Limb Bones ---
  [68,72], [8,72], // Cervical to collar
  [72,73], [73,75], // Left clavicle to shoulder
  [72,74], [74,76], // Right clavicle to shoulder
  [73,77], [74,77], // Clavicle inner struts to sternum
  [72,77], // Midline thoracic spine (T1-T4)
  [77,78], [77,79], // Sternum to ribcage
  [78,80], [79,80], // Ribcage to lumbar waist
  [77,80], // Midline lumbar spine
  [75,81], [81,83], // Left arm: Shoulder -> Elbow -> Wrist (Watch)
  [76,82], [82,84], // Right arm: Shoulder -> Elbow -> Forearm
  [84,83], // Folded forearms crossing
  [83,85], // Wrist to Hand root

  // --- Standard 21-Joint Hand Bones (MediaPipe Topology) ---
  // Palm Metacarpal Rays
  [85,86], [85,90], [85,94], [85,98], [85,102],
  // Knuckles Transverse Arch
  [90,94], [94,98], [98,102],
  // Digit 1: Thumb
  [86,87], [87,88], [88,89],
  // Digit 2: Index Finger
  [90,91], [91,92], [92,93],
  // Digit 3: Middle Finger
  [94,95], [95,96], [96,97],
  // Digit 4: Ring Finger
  [98,99], [99,100], [100,101],
  // Digit 5: Pinky Finger
  [102,103], [103,104], [104,105],

  // --- Peaked Military Cap Skeleton ---
  [106,108], [108,107],
  [106,17], [107,26], [108,27],
  [106,110], [110,69], [69,111], [111,107],
  [108,109], [109,69]
];

// Continuous 3D Surface Triangulation (Covering Head, Face, Cheeks, Torso, Hand, Cap & Frame)
export const MESH_TRIANGLES = [
  // --- 1. Forehead & Eyebrows to Cap Visor ---
  [106, 17, 18], [106, 18, 19], [106, 19, 108], [19, 20, 108], [20, 21, 108],
  [21, 27, 108], [27, 22, 108],
  [22, 23, 108], [23, 24, 108], [24, 107, 108], [24, 25, 107], [25, 26, 107],

  // --- 2. Eyebrows to Orbital Sockets ---
  // Left Brow to Eye
  [17, 36, 18], [18, 36, 37], [18, 37, 19], [19, 37, 38], [19, 38, 20], [20, 38, 39], [20, 39, 21],
  // Glabella (between eyes)
  [21, 39, 27], [27, 42, 22],
  // Right Brow to Eye
  [22, 42, 23], [23, 42, 43], [23, 43, 24], [24, 43, 44], [24, 44, 25], [25, 44, 45], [25, 45, 26],

  // --- 3. Eye Aperture Interior Fills ---
  [36, 37, 41], [37, 38, 40], [37, 40, 41], [38, 39, 40],
  [42, 43, 47], [43, 44, 46], [43, 46, 47], [44, 45, 46],

  // --- 4. Nose Bridge, Flanks & Tip ---
  // Left Flank
  [27, 39, 28], [28, 39, 29], [29, 39, 31], [29, 31, 30],
  // Right Flank
  [27, 28, 42], [28, 29, 42], [29, 42, 35], [29, 35, 30],
  // Nostrils & Tip
  [30, 31, 32], [30, 32, 33], [30, 33, 34], [30, 34, 35],

  // --- 5. Cheeks (Infraorbital & Zygomatic) ---
  // Left Cheek (Lower eyelid 36,41,40,39 to nose 31, mouth 48, jaw 0,1,2,3)
  [39, 40, 31], [40, 48, 31], [40, 41, 48],
  [36, 41, 48], [36, 48, 2], [36, 2, 1], [36, 1, 0],
  [17, 0, 36], [106, 70, 17], [70, 0, 17],

  // Right Cheek (Lower eyelid 42,47,46,45 to nose 35, mouth 54, jaw 13,14,15,16)
  [42, 35, 47], [47, 35, 54], [47, 54, 46],
  [45, 46, 54], [45, 54, 14], [45, 14, 15], [45, 15, 16],
  [26, 45, 16], [107, 26, 71], [71, 26, 16],

  // --- 6. Philtrum (Nose to Upper Lip) ---
  [31, 48, 49], [31, 49, 32], [32, 49, 50], [32, 50, 33],
  [33, 50, 51], [33, 51, 52], [33, 52, 34],
  [34, 52, 53], [34, 53, 35], [35, 53, 54],

  // --- 7. Vermilion Lips & Oral Aperture ---
  // Upper Lip Vermilion (Outer to Inner)
  [48, 49, 60], [49, 50, 61], [49, 61, 60], [50, 51, 62], [50, 62, 61],
  [51, 52, 63], [51, 63, 62], [52, 53, 64], [52, 64, 63], [53, 54, 64],
  // Lower Lip Vermilion (Outer to Inner)
  [54, 55, 64], [55, 65, 64], [55, 56, 65], [56, 66, 65], [56, 57, 66],
  [57, 67, 66], [57, 58, 67], [58, 60, 67], [58, 59, 60], [59, 48, 60],
  // Oral Cavity (Teeth / Oral Aperture)
  [60, 61, 67], [61, 62, 66], [61, 66, 67], [62, 63, 65], [62, 65, 66], [63, 64, 65],

  // --- 8. Lower Lip to Mandible & Chin ---
  // Left of Chin
  [2, 48, 3], [3, 48, 4], [4, 48, 5], [48, 59, 5],
  [59, 5, 6], [59, 6, 58], [58, 6, 7], [58, 7, 57], [57, 7, 8],
  // Right of Chin
  [54, 14, 13], [54, 13, 12], [54, 12, 11], [54, 11, 55],
  [55, 11, 10], [55, 10, 56], [56, 10, 9], [56, 9, 57], [57, 9, 8],

  // --- 9. Peaked Military Cap ---
  [106, 108, 109], [108, 107, 109],
  [106, 109, 110], [107, 111, 109],
  [110, 109, 69], [109, 111, 69],
  [110, 106, 70], [111, 71, 107],

  // --- 10. Cybernetic High Collar & Neck ---
  [70, 75, 0], [71, 16, 76],
  // Left Jaw to Shoulder & Clavicle
  [0, 75, 1], [1, 75, 2], [2, 75, 3], [3, 75, 4], [4, 75, 5],
  [5, 75, 73], [5, 73, 6], [6, 73, 7], [7, 73, 72],
  // Chin to Collar Center
  [7, 72, 8], [8, 72, 9],
  // Right Jaw to Clavicle & Shoulder
  [9, 72, 74], [9, 74, 10], [10, 74, 11], [11, 74, 76],
  [11, 76, 12], [12, 76, 13], [13, 76, 14], [14, 76, 15], [15, 76, 16],

  // --- 11. Torso, Epaulets, Medals, Ribcage & Waist ---
  [72, 73, 77], [72, 77, 74],
  [73, 75, 77], [74, 77, 76],
  [75, 78, 77], [76, 77, 79],
  [78, 80, 77], [77, 80, 79],

  // --- 12. Arms & Crossed Forearms ---
  [75, 81, 78], [76, 79, 82],
  [81, 83, 78], [78, 83, 80],
  [82, 79, 84], [79, 80, 84],
  [84, 80, 83],

  // --- 13. Standard 21-Joint Articulated Hand ---
  [83, 85, 86], [83, 80, 85],
  [85, 90, 86], [85, 94, 90], [85, 98, 94], [85, 102, 98],
  // Thumb (86..89)
  [86, 87, 90], [87, 88, 89],
  // Index (90..93)
  [90, 91, 94], [91, 92, 95], [92, 93, 96],
  // Middle (94..97)
  [94, 95, 98], [95, 96, 99], [96, 97, 100],
  // Ring (98..101)
  [98, 99, 102], [99, 100, 103], [100, 101, 104],
  // Pinky (102..105)
  [102, 103, 104], [103, 104, 105],

  // --- 14. Frame / Canvas Anchors (Seamless Portrait Background Fill) ---
  // Top
  [112, 110, 69], [112, 69, 113], [113, 69, 111],
  // Left
  [112, 116, 110], [110, 116, 70], [70, 116, 75], [116, 81, 75], [116, 114, 81],
  [114, 83, 81], [114, 80, 83],
  // Right
  [113, 111, 117], [111, 71, 117], [71, 76, 117], [117, 76, 82], [117, 82, 115],
  [115, 82, 84], [115, 84, 80]
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

    // Respiration & Torso Dynamics Phase
    this.torsoPhase = 0.0;

    // Cache of deformed 3D landmark positions (118 points)
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
   * Map movement from continuous trajectory evaluator into the skeleton
   */
  updateFromTrajectory(evaluator, currentTime) {
    if (!evaluator) return;
    const sample = evaluator.evaluate(currentTime);
    if (!sample) return;

    // Helper to safely get finite number or fallback
    const safeNum = (v, fallback = 0.0) => (Number.isFinite(v) ? v : fallback);
    const clamp01 = (v) => Math.max(0.0, Math.min(1.0, safeNum(v, 0.0)));

    // 1. Cervical Head Pose
    const roll = safeNum(sample.roll, safeNum(sample.rollRad, 0.0));
    const pitch = safeNum(sample.pitch, safeNum(sample.nodY, 0.0) * 0.14);
    const yaw = safeNum(sample.yaw, safeNum(sample.yawX, 0.0) * 0.18);

    this.pose.headRoll = roll;
    this.pose.headPitch = pitch;
    this.pose.headYaw = yaw;
    this.pose.headPosX = safeNum(sample.posX, yaw * 0.08);
    this.pose.headPosY = safeNum(sample.posY, pitch * 0.05);
    this.pose.headPosZ = safeNum(sample.posZ, 0.0);

    // 2. Mandible / Jaw Parameters
    const jawVal = clamp01(sample.jaw !== undefined ? sample.jaw : sample.jawOpen);
    this.parameters.jawOpen = jawVal;
    this.parameters.mouthLowerDownLeft = jawVal * 0.55;
    this.parameters.mouthLowerDownRight = jawVal * 0.55;
    this.parameters.mouthFunnel = jawVal * 0.25;

    // 3. Zygomaticus / Smile & Cheek Parameters
    const smileVal = clamp01(sample.smile);
    const cheekSquintVal = clamp01(sample.cheekSquint !== undefined ? sample.cheekSquint : smileVal * 0.50);
    this.parameters.mouthSmileLeft = smileVal;
    this.parameters.mouthSmileRight = smileVal;
    this.parameters.mouthDimpleLeft = smileVal * 0.45;
    this.parameters.mouthDimpleRight = smileVal * 0.45;
    this.parameters.cheekSquintLeft = cheekSquintVal;
    this.parameters.cheekSquintRight = cheekSquintVal;
    this.parameters.cheekPuff = clamp01(smileVal * 0.22);

    // 4. Frontalis / Eyebrow Parameters
    const browVal = clamp01(sample.browLift);
    this.parameters.browInnerUp = browVal * 0.85;
    this.parameters.browOuterUpLeft = browVal * 0.50;
    this.parameters.browOuterUpRight = browVal * 0.50;

    // 5. Palpebral / Eye Blink Parameters
    const blinkVal = clamp01(sample.blink);
    this.parameters.eyeBlinkLeft = blinkVal;
    this.parameters.eyeBlinkRight = blinkVal;
    this.parameters.eyeSquintLeft = Math.max(blinkVal * 0.3, cheekSquintVal * 0.35);
    this.parameters.eyeSquintRight = Math.max(blinkVal * 0.3, cheekSquintVal * 0.35);

    // 6. Mouth Spread, Pucker & Teeth Exposure
    const spreadVal = safeNum(sample.spread, safeNum(sample.mouthSpread, 0.0));
    const puckerVal = clamp01(sample.pucker);
    if (spreadVal > 0) {
      this.parameters.mouthStretchLeft = clamp01(spreadVal * 0.7);
      this.parameters.mouthStretchRight = clamp01(spreadVal * 0.7);
      this.parameters.mouthPucker = puckerVal;
    } else {
      this.parameters.mouthPucker = Math.max(puckerVal, clamp01(-spreadVal * 0.8));
      this.parameters.mouthStretchLeft = 0.0;
      this.parameters.mouthStretchRight = 0.0;
    }

    const teethVal = clamp01(sample.teethExposure);
    this.parameters.mouthUpperUpLeft = teethVal * 0.40;
    this.parameters.mouthUpperUpRight = teethVal * 0.40;

    // Advance Respiration Dynamics
    this.torsoPhase = (currentTime || 0) * 1.6;

    // Recompute deformed 3D skeletal landmarks
    this.computeDeformedLandmarks();
  }

  /**
   * Deform the 3D landmark skeleton points using the 52 parameters, pose, torso & hand kinematics
   */
  computeDeformedLandmarks() {
    const p = this.parameters;
    const pose = this.pose;

    // Ensure all pose values are finite numbers
    const safeNum = (v, fallback = 0.0) => (Number.isFinite(v) ? v : fallback);
    const headRoll = safeNum(pose.headRoll, 0.0);
    const headPitch = safeNum(pose.headPitch, 0.0);
    const headYaw = safeNum(pose.headYaw, 0.0);
    const headPosX = safeNum(pose.headPosX, 0.0);
    const headPosY = safeNum(pose.headPosY, 0.0);
    const headPosZ = safeNum(pose.headPosZ, 0.0);

    // Cervical pivot at base of skull: [0, -1.15, -0.20]
    const pivot = [0.0, -1.15, -0.20];
    const cosR = Math.cos(headRoll);
    const sinR = Math.sin(headRoll);
    const cosP = Math.cos(headPitch);
    const sinP = Math.sin(headPitch);
    const cosY = Math.cos(headYaw);
    const sinY = Math.sin(headYaw);

    // Respiration displacement for chest/torso
    const breathY = Math.sin(this.torsoPhase) * 0.012;
    const breathZ = Math.sin(this.torsoPhase) * 0.018;

    for (let i = 0; i < NEUTRAL_LANDMARKS_3D.length; i++) {
      const base = NEUTRAL_LANDMARKS_3D[i];
      let x = base[0];
      let y = base[1];
      let z = base[2];

      // --- Group A: Head, Face, Eyes, Brows, Lips & Peaked Cap (0..71, 106..111) ---
      const isHeadOrCap = (i <= 71) || (i >= 106 && i <= 111);

      if (isHeadOrCap) {
        // --- Facial Muscle Deformations ---
        // Mandible Drop (Jaw Open) affecting lower face
        if ((i >= 4 && i <= 12) || (i >= 55 && i <= 59) || (i >= 64 && i <= 67)) {
          const dropFactor = (i >= 7 && i <= 9) ? 0.28 : (i >= 56 && i <= 58) ? 0.22 : 0.16;
          y -= p.jawOpen * dropFactor;
          z -= p.jawOpen * 0.04;
        }

        // Zygomaticus Major Smile Lift
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

        // Eyelid Blinking (upper eyelids 37, 38 and 43, 44 descend)
        if (i === 37 || i === 38) {
          y -= p.eyeBlinkLeft * 0.08;
        }
        if (i === 43 || i === 44) {
          y -= p.eyeBlinkRight * 0.08;
        }

        // Cheek Puff / Squint
        if (i === 1 || i === 2) { x -= p.cheekPuff * 0.05; }
        if (i === 14 || i === 15) { x += p.cheekPuff * 0.05; }

        // --- Cervical Head Pose 3D Rotation ---
        let dx = x - pivot[0];
        let dy = y - pivot[1];
        let dz = z - pivot[2];

        // Roll (Z axis rotation)
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

        x = x3 + pivot[0] + headPosX;
        y = y3 + pivot[1] + headPosY;
        z = z3 + pivot[2] + headPosZ;
      }

      // --- Group B: Torso & Limbs (72..84) ---
      else if (i >= 72 && i <= 84) {
        // Clavicle & Collar coupling to neck tilt
        if (i === 72 || i === 73 || i === 74) {
          x -= headRoll * 0.08;
          y += breathY * 0.6;
          z += breathZ * 0.6;
        }
        // Shoulders counter-balance
        else if (i === 75 || i === 76) {
          const sign = i === 75 ? -1 : 1;
          x -= headRoll * 0.06;
          y += breathY * 0.8 + (sign * headRoll * 0.04);
          z += breathZ * 0.8;
        }
        // Chest & Sternum breathing
        else if (i === 77 || i === 78 || i === 79) {
          y += breathY;
          z += breathZ;
        }
        // Forearms & Wrist
        else if (i >= 81 && i <= 84) {
          y += breathY * 0.4;
          z += breathZ * 0.4;
        }
      }

      // --- Group C: Standard 21-Joint Hand (85..105) ---
      else if (i >= 85 && i <= 105) {
        // Resting hand follows forearm & chest respiration micro-movements
        y += breathY * 0.45;
        z += breathZ * 0.45;
      }

      // Safeguard against non-finite values
      this.deformedLandmarks[i][0] = Number.isFinite(x) ? x : base[0];
      this.deformedLandmarks[i][1] = Number.isFinite(y) ? y : base[1];
      this.deformedLandmarks[i][2] = Number.isFinite(z) ? z : base[2];
    }
  }

  /**
   * Return list of active parameters
   */
  getActiveParameters(threshold = 0.02) {
    const list = [];
    for (const [name, val] of Object.entries(this.parameters)) {
      if (val > threshold) {
        list.push({ name, value: val });
      }
    }
    list.sort((a, b) => b.value - a.value);
    return list;
  }
}
