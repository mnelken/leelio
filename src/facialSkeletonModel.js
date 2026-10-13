/**
 * FacialSkeletonModel: 52 FACS / Apple ARKit Blendshape Skeletal Topology
 * Extended to 118 Landmarks covering Full Head, Peaked Cap, Hair, Torso & 21-Joint Hand
 */

export const ARKIT_52_PARAMETERS = [
  "eyeBlinkLeft", "eyeLookDownLeft", "eyeLookInLeft", "eyeLookOutLeft", "eyeLookUpLeft", "eyeSquintLeft", "eyeWideLeft",
  "eyeBlinkRight", "eyeLookDownRight", "eyeLookInRight", "eyeLookOutRight", "eyeLookUpRight", "eyeSquintRight", "eyeWideRight",
  "jawForward", "jawLeft", "jawRight", "jawOpen",
  "mouthClose", "mouthFunnel", "mouthPucker", "mouthLeft", "mouthRight",
  "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight",
  "mouthDimpleLeft", "mouthDimpleRight", "mouthStretchLeft", "mouthStretchRight",
  "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
  "mouthPressLeft", "mouthPressRight", "mouthLowerDownLeft", "mouthLowerDownRight",
  "mouthUpperUpLeft", "mouthUpperUpRight",
  "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
  "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
  "noseSneerLeft", "noseSneerRight", "tongueOut"
];

// 118 Ground-Truth Calibrated 3D Landmarks
export const NEUTRAL_LANDMARKS_3D = [
  [-0.635, -0.077, -0.22], // 0
  [-0.599, -0.193, -0.12], // 1
  [-0.546, -0.3, -0.08], // 2
  [-0.474, -0.39, -0.04], // 3
  [-0.385, -0.479, -0.04], // 4
  [-0.295, -0.56, -0.01], // 5
  [-0.197, -0.613, 0.02], // 6
  [-0.098, -0.64, 0.05], // 7
  [0, -0.658, 0.08], // 8
  [0.098, -0.64, 0.05], // 9
  [0.197, -0.613, 0.02], // 10
  [0.295, -0.56, -0.01], // 11
  [0.385, -0.479, -0.04], // 12
  [0.474, -0.39, -0.04], // 13
  [0.546, -0.3, -0.08], // 14
  [0.599, -0.193, -0.12], // 15
  [0.635, -0.077, -0.22], // 16
  [-0.474, 0.308, 0.06], // 17
  [-0.367, 0.362, 0.06], // 18
  [-0.259, 0.388, 0.06], // 19
  [-0.152, 0.371, 0.06], // 20
  [-0.063, 0.326, 0.06], // 21
  [0.098, 0.326, 0.06], // 22
  [0.188, 0.371, 0.06], // 23
  [0.295, 0.388, 0.06], // 24
  [0.403, 0.353, 0.06], // 25
  [0.492, 0.281, 0.06], // 26
  [0.018, 0.272, 0.14], // 27
  [0.009, 0.165, 0.17], // 28
  [0, 0.04, 0.2], // 29
  [0, -0.059, 0.23], // 30
  [-0.152, -0.103, 0.18], // 31
  [-0.072, -0.13, 0.18], // 32
  [0, -0.121, 0.24], // 33
  [0.072, -0.13, 0.18], // 34
  [0.152, -0.103, 0.18], // 35
  [-0.385, 0.165, 0.04], // 36
  [-0.304, 0.201, 0.04], // 37
  [-0.188, 0.201, 0.04], // 38
  [-0.107, 0.174, 0.04], // 39
  [-0.188, 0.138, 0.04], // 40
  [-0.304, 0.138, 0.04], // 41
  [0.134, 0.165, 0.04], // 42
  [0.215, 0.201, 0.04], // 43
  [0.331, 0.201, 0.04], // 44
  [0.42, 0.165, 0.04], // 45
  [0.331, 0.138, 0.04], // 46
  [0.215, 0.138, 0.04], // 47
  [-0.259, -0.399, 0.14], // 48
  [-0.152, -0.372, 0.14], // 49
  [-0.054, -0.363, 0.14], // 50
  [0, -0.372, 0.14], // 51
  [0.054, -0.363, 0.14], // 52
  [0.152, -0.372, 0.14], // 53
  [0.259, -0.408, 0.14], // 54
  [0.17, -0.47, 0.14], // 55
  [0.072, -0.506, 0.14], // 56
  [0, -0.515, 0.14], // 57
  [-0.072, -0.506, 0.14], // 58
  [-0.17, -0.47, 0.14], // 59
  [-0.206, -0.408, 0.1], // 60
  [-0.063, -0.399, 0.1], // 61
  [0, -0.408, 0.1], // 62
  [0.063, -0.399, 0.1], // 63
  [0.206, -0.408, 0.1], // 64
  [0.063, -0.434, 0.1], // 65
  [0, -0.443, 0.1], // 66
  [-0.063, -0.434, 0.1], // 67
  [0, -1.15, -0.18], // 68
  [-0.537, 1.417, -0.05], // 69
  [-0.894, 0.102, -0.2], // 70
  [0.626, 0.013, -0.2], // 71
  [0, -1.418, -0.1], // 72
  [-0.76, -1.642, -0.12], // 73
  [0.76, -1.642, -0.12], // 74
  [-1.726, -1.955, -0.18], // 75
  [1.476, -1.955, -0.18], // 76
  [0, -2.134, -0.04], // 77
  [-1.565, -2.715, -0.12], // 78
  [1.565, -2.715, -0.12], // 79
  [0, -3.386, -0.12], // 80
  [-2.013, -2.536, -0.15], // 81
  [1.744, -2.536, -0.15], // 82
  [0.447, -3.028, 0.18], // 83
  [-0.85, -2.715, 0.18], // 84
  [0.492, -3.055, 0.22], // 85
  [0.626, -2.849, 0.22], // 86
  [0.742, -2.715, 0.22], // 87
  [0.832, -2.626, 0.22], // 88
  [0.903, -2.554, 0.22], // 89
  [1.118, -2.805, 0.22], // 90
  [1.315, -2.823, 0.22], // 91
  [1.476, -2.849, 0.22], // 92
  [1.61, -2.876, 0.22], // 93
  [1.163, -2.984, 0.22], // 94
  [1.342, -3.002, 0.22], // 95
  [1.494, -3.028, 0.22], // 96
  [1.61, -3.073, 0.22], // 97
  [1.118, -3.145, 0.22], // 98
  [1.279, -3.145, 0.22], // 99
  [1.404, -3.18, 0.22], // 100
  [1.512, -3.207, 0.22], // 101
  [1.029, -3.27, 0.22], // 102
  [1.163, -3.27, 0.22], // 103
  [1.279, -3.297, 0.22], // 104
  [1.369, -3.315, 0.22], // 105
  [-1.029, -0.345, 0.16], // 106
  [-1.163, 0.684, 0], // 107
  [-0.089, 0.907, 0.18], // 108
  [-1.342, 0.058, -0.08], // 109
  [-0.894, 1.176, -0.04], // 110
  [0, 1.31, -0.04], // 111
  [0.492, 0.907, -0.08], // 112
  [0.716, -0.479, 0.16], // 113
  [-1.118, -0.882, -0.15], // 114
  [0.894, -0.3, 0.05], // 115
  [0.984, -0.747, 0], // 116
  [0.805, -1.195, -0.05] // 117

];

// High-Precision Photographic UV Mapping for avatar.jpg (1024x559)
export const LANDMARK_UVS = [
  [0.4629, 0.6691], // 0
  [0.4668, 0.6458], // 1
  [0.4727, 0.6243], // 2
  [0.4805, 0.6064], // 3
  [0.4902, 0.5886], // 4
  [0.5, 0.5725], // 5
  [0.5107, 0.5617], // 6
  [0.5215, 0.5564], // 7
  [0.5322, 0.5528], // 8
  [0.543, 0.5564], // 9
  [0.5537, 0.5617], // 10
  [0.5645, 0.5725], // 11
  [0.5742, 0.5886], // 12
  [0.584, 0.6064], // 13
  [0.5918, 0.6243], // 14
  [0.5977, 0.6458], // 15
  [0.6016, 0.6691], // 16
  [0.4805, 0.746], // 17
  [0.4922, 0.7567], // 18
  [0.5039, 0.7621], // 19
  [0.5156, 0.7585], // 20
  [0.5254, 0.7496], // 21
  [0.543, 0.7496], // 22
  [0.5527, 0.7585], // 23
  [0.5645, 0.7621], // 24
  [0.5762, 0.7549], // 25
  [0.5859, 0.7406], // 26
  [0.5342, 0.7388], // 27
  [0.5332, 0.7174], // 28
  [0.5322, 0.6923], // 29
  [0.5322, 0.6726], // 30
  [0.5156, 0.6637], // 31
  [0.5244, 0.6583], // 32
  [0.5322, 0.6601], // 33
  [0.54, 0.6583], // 34
  [0.5488, 0.6637], // 35
  [0.4902, 0.7174], // 36
  [0.499, 0.7245], // 37
  [0.5117, 0.7245], // 38
  [0.5205, 0.7191], // 39
  [0.5117, 0.712], // 40
  [0.499, 0.712], // 41
  [0.5469, 0.7174], // 42
  [0.5557, 0.7245], // 43
  [0.5684, 0.7245], // 44
  [0.5781, 0.7174], // 45
  [0.5684, 0.712], // 46
  [0.5557, 0.712], // 47
  [0.5039, 0.6047], // 48
  [0.5156, 0.61], // 49
  [0.5264, 0.6118], // 50
  [0.5322, 0.61], // 51
  [0.5381, 0.6118], // 52
  [0.5488, 0.61], // 53
  [0.5605, 0.6029], // 54
  [0.5508, 0.5903], // 55
  [0.54, 0.5832], // 56
  [0.5322, 0.5814], // 57
  [0.5244, 0.5832], // 58
  [0.5137, 0.5903], // 59
  [0.5098, 0.6029], // 60
  [0.5254, 0.6047], // 61
  [0.5322, 0.6029], // 62
  [0.5391, 0.6047], // 63
  [0.5547, 0.6029], // 64
  [0.5391, 0.5975], // 65
  [0.5322, 0.5957], // 66
  [0.5254, 0.5975], // 67
  [0.5322, 0.4544], // 68
  [0.4736, 0.9678], // 69
  [0.4346, 0.7048], // 70
  [0.6006, 0.6869], // 71
  [0.5322, 0.4007], // 72
  [0.4492, 0.356], // 73
  [0.6152, 0.356], // 74
  [0.3438, 0.2934], // 75
  [0.6934, 0.2934], // 76
  [0.5322, 0.2576], // 77
  [0.3613, 0.1413], // 78
  [0.7031, 0.1413], // 79
  [0.5322, 0.0072], // 80
  [0.3125, 0.1771], // 81
  [0.7227, 0.1771], // 82
  [0.5811, 0.0787], // 83
  [0.4395, 0.1413], // 84
  [0.5859, 0.0733], // 85
  [0.6006, 0.1145], // 86
  [0.6133, 0.1413], // 87
  [0.623, 0.1592], // 88
  [0.6309, 0.1735], // 89
  [0.6543, 0.1234], // 90
  [0.6758, 0.1199], // 91
  [0.6934, 0.1145], // 92
  [0.708, 0.1091], // 93
  [0.6592, 0.0877], // 94
  [0.6787, 0.0841], // 95
  [0.6953, 0.0787], // 96
  [0.708, 0.0698], // 97
  [0.6543, 0.0555], // 98
  [0.6719, 0.0555], // 99
  [0.6855, 0.0483], // 100
  [0.6973, 0.0429], // 101
  [0.6445, 0.0304], // 102
  [0.6592, 0.0304], // 103
  [0.6719, 0.025], // 104
  [0.6816, 0.0215], // 105
  [0.4199, 0.6154], // 106
  [0.4053, 0.8211], // 107
  [0.5225, 0.8658], // 108
  [0.3857, 0.6959], // 109
  [0.4346, 0.9195], // 110
  [0.5322, 0.9463], // 111
  [0.5859, 0.8658], // 112
  [0.6104, 0.5886], // 113
  [0.4102, 0.5081], // 114
  [0.6299, 0.6243], // 115
  [0.6396, 0.5349], // 116
  [0.6201, 0.4454] // 117

];

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
  [85,86], [85,90], [85,94], [85,98], [85,102],
  [90,94], [94,98], [98,102],
  // Thumb
  [86,87], [87,88], [88,89],
  // Index Finger
  [90,91], [91,92], [92,93],
  // Middle Finger
  [94,95], [95,96], [96,97],
  // Ring Finger
  [98,99], [99,100], [100,101],
  // Pinky Finger
  [102,103], [103,104], [104,105],

  // --- Peaked Military Cap & Hair Contour ---
  [69,110], [110,107], [107,109], [109,106], [106,108], [108,111], [111,69],
  [111,112], [112,113], [113,108],
  [106,70], [113,71],
  [109,114], [114,0],
  [112,115], [115,116], [116,117], [117,16],
  [108,27]
];

export const MESH_TRIANGLES = [
  [70, 17, 18],
  [70, 19, 18],
  [70, 27, 19],
  [70, 71, 27],
  [71, 24, 27],
  [71, 25, 24],
  [71, 26, 25],
  [70, 0, 17],
  [0, 36, 17],
  [71, 26, 16],
  [17, 36, 18],
  [18, 36, 37],
  [18, 37, 19],
  [19, 37, 38],
  [19, 38, 20],
  [20, 38, 39],
  [20, 39, 21],
  [21, 39, 27],
  [36, 41, 37],
  [37, 40, 38],
  [37, 41, 40],
  [38, 40, 39],
  [22, 27, 42],
  [22, 42, 43],
  [22, 43, 23],
  [23, 43, 44],
  [23, 44, 24],
  [24, 44, 45],
  [24, 45, 25],
  [25, 46, 45],
  [25, 46, 26],
  [26, 46, 16],
  [42, 47, 43],
  [43, 46, 44],
  [43, 47, 46],
  [44, 46, 45],
  [27, 21, 28],
  [27, 28, 22],
  [21, 39, 28],
  [22, 28, 42],
  [28, 39, 31],
  [28, 35, 42],
  [28, 31, 29],
  [28, 29, 35],
  [29, 31, 30],
  [29, 30, 35],
  [30, 31, 32],
  [30, 32, 33],
  [30, 33, 34],
  [30, 34, 35],
  [0, 41, 36],
  [0, 1, 41],
  [1, 40, 41],
  [1, 2, 40],
  [40, 31, 39],
  [2, 31, 40],
  [2, 48, 31],
  [2, 3, 48],
  [3, 4, 48],
  [4, 5, 48],
  [5, 59, 48],
  [16, 45, 46],
  [16, 46, 15],
  [15, 46, 47],
  [15, 47, 14],
  [47, 42, 35],
  [14, 47, 35],
  [14, 35, 54],
  [14, 54, 13],
  [13, 54, 12],
  [12, 54, 11],
  [11, 54, 55],
  [31, 48, 49],
  [31, 49, 50],
  [31, 50, 32],
  [32, 50, 51],
  [32, 51, 33],
  [33, 51, 52],
  [33, 52, 34],
  [34, 52, 35],
  [35, 52, 53],
  [35, 53, 54],
  [48, 60, 49],
  [49, 61, 50],
  [49, 60, 61],
  [50, 62, 51],
  [50, 61, 62],
  [51, 62, 52],
  [52, 62, 63],
  [52, 63, 53],
  [53, 64, 54],
  [53, 63, 64],
  [48, 59, 60],
  [59, 67, 60],
  [59, 58, 67],
  [58, 66, 67],
  [58, 57, 66],
  [57, 65, 66],
  [57, 56, 65],
  [56, 64, 65],
  [56, 55, 64],
  [55, 54, 64],
  [60, 67, 61],
  [61, 66, 62],
  [61, 67, 66],
  [62, 65, 63],
  [62, 66, 65],
  [63, 65, 64],
  [59, 5, 6],
  [59, 6, 58],
  [58, 6, 7],
  [58, 7, 57],
  [57, 7, 8],
  [57, 8, 9],
  [57, 9, 56],
  [56, 9, 10],
  [56, 10, 55],
  [55, 10, 11],
  [69, 110, 107],
  [69, 107, 108],
  [69, 108, 111],
  [111, 108, 112],
  [107, 109, 108],
  [109, 106, 108],
  [108, 70, 106],
  [108, 70, 71],
  [108, 113, 71],
  [108, 113, 112],
  [109, 114, 106],
  [106, 114, 0],
  [70, 106, 0],
  [112, 113, 115],
  [113, 116, 115],
  [113, 116, 71],
  [71, 16, 116],
  [116, 16, 117],
  [70, 75, 0],
  [71, 16, 76],
  [0, 75, 1],
  [1, 75, 2],
  [2, 75, 3],
  [3, 75, 4],
  [4, 75, 5],
  [5, 75, 73],
  [5, 73, 6],
  [6, 73, 7],
  [7, 73, 72],
  [7, 72, 8],
  [8, 72, 9],
  [9, 72, 74],
  [9, 74, 10],
  [10, 74, 11],
  [11, 74, 76],
  [11, 76, 12],
  [12, 76, 13],
  [13, 76, 14],
  [14, 76, 15],
  [15, 76, 16],
  [114, 75, 0],
  [16, 117, 76],
  [72, 73, 77],
  [72, 77, 74],
  [73, 75, 77],
  [74, 77, 76],
  [75, 78, 77],
  [76, 77, 79],
  [78, 80, 77],
  [77, 80, 79],
  [75, 81, 78],
  [76, 79, 82],
  [81, 78, 83],
  [78, 80, 83],
  [82, 84, 79],
  [79, 84, 80],
  [84, 80, 83],
  [83, 85, 86],
  [83, 80, 85],
  [85, 90, 86],
  [85, 94, 90],
  [85, 98, 94],
  [85, 102, 98],
  [86, 90, 87],
  [87, 89, 88],
  [90, 94, 91],
  [91, 95, 92],
  [92, 96, 93],
  [94, 98, 95],
  [95, 99, 96],
  [96, 100, 97],
  [98, 102, 99],
  [99, 103, 100],
  [100, 104, 101],
  [102, 104, 103],
  [103, 104, 105]
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

  setParameter(name, value) {
    if (this.parameters[name] !== undefined) {
      this.parameters[name] = Math.max(0.0, Math.min(1.0, value));
    }
  }

  getParameter(name) {
    return this.parameters[name] || 0.0;
  }

  updateFromTrajectory(evaluator, currentTime) {
    if (!evaluator) return;
    const sample = evaluator.evaluate(currentTime);
    if (!sample) return;

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

    // 6. Mouth Spread & Pucker
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

    this.torsoPhase = (currentTime || 0) * 1.6;

    this.computeDeformedLandmarks();
  }

  computeDeformedLandmarks() {
    const p = this.parameters;
    const pose = this.pose;

    const safeNum = (v, fallback = 0.0) => (Number.isFinite(v) ? v : fallback);
    const headRoll = safeNum(pose.headRoll, 0.0);
    const headPitch = safeNum(pose.headPitch, 0.0);
    const headYaw = safeNum(pose.headYaw, 0.0);
    const headPosX = safeNum(pose.headPosX, 0.0);
    const headPosY = safeNum(pose.headPosY, 0.0);
    const headPosZ = safeNum(pose.headPosZ, 0.0);

    // Cervical pivot at base of skull: [0, -1.15, -0.18]
    const pivot = [0.0, -1.15, -0.18];
    const cosR = Math.cos(headRoll);
    const sinR = Math.sin(headRoll);
    const cosP = Math.cos(headPitch);
    const sinP = Math.sin(headPitch);
    const cosY = Math.cos(headYaw);
    const sinY = Math.sin(headYaw);

    const breathY = Math.sin(this.torsoPhase) * 0.012;
    const breathZ = Math.sin(this.torsoPhase) * 0.018;

    for (let i = 0; i < NEUTRAL_LANDMARKS_3D.length; i++) {
      const base = NEUTRAL_LANDMARKS_3D[i];
      let x = base[0];
      let y = base[1];
      let z = base[2];

      // --- Group A: Full Head, Face, Eyes, Brows, Lips, Cap & Hair (0..71, 106..117) ---
      const isHead = (i <= 71) || (i >= 106 && i <= 117);

      if (isHead) {
        // Mandible Drop (Jaw Open) affecting lower face
        if ((i >= 4 && i <= 12) || (i >= 55 && i <= 59) || (i >= 64 && i <= 67)) {
          const dropFactor = (i >= 7 && i <= 9) ? 0.055 : (i >= 56 && i <= 58) ? 0.048 : (i >= 55 && i <= 59) ? 0.035 : 0.022;
          y -= p.jawOpen * dropFactor;
          z -= p.jawOpen * 0.015;
        }

        // Zygomaticus Major Smile Lift
        if (i === 48 || i === 60) {
          x -= p.mouthSmileLeft * 0.025 + (p.mouthStretchLeft || 0) * 0.015;
          y += p.mouthSmileLeft * 0.038;
          z += p.mouthSmileLeft * 0.012;
        }
        if (i === 54 || i === 64) {
          x += p.mouthSmileRight * 0.025 + (p.mouthStretchRight || 0) * 0.015;
          y += p.mouthSmileRight * 0.038;
          z += p.mouthSmileRight * 0.012;
        }

        // Eyebrow Elevation (17-26)
        if (i >= 17 && i <= 21) {
          y += p.browInnerUp * 0.035 + p.browOuterUpLeft * 0.025 - (p.browDownLeft || 0) * 0.025;
        }
        if (i >= 22 && i <= 26) {
          y += p.browInnerUp * 0.035 + p.browOuterUpRight * 0.025 - (p.browDownRight || 0) * 0.025;
        }

        // Eyelid Blinking
        if (i === 37 || i === 38) {
          y -= p.eyeBlinkLeft * 0.045;
        }
        if (i === 43 || i === 44) {
          y -= p.eyeBlinkRight * 0.045;
        }

        // Cheek Puff
        if (i === 1 || i === 2) { x -= p.cheekPuff * 0.02; }
        if (i === 14 || i === 15) { x += p.cheekPuff * 0.02; }

        // --- Cervical Head Pose 3D Rotation ---
        let dx = x - pivot[0];
        let dy = y - pivot[1];
        let dz = z - pivot[2];

        // Roll
        let x1 = dx * cosR - dy * sinR;
        let y1 = dx * sinR + dy * cosR;
        let z1 = dz;

        // Pitch
        let x2 = x1;
        let y2 = y1 * cosP - z1 * sinP;
        let z2 = y1 * sinP + z1 * cosP;

        // Yaw
        let x3 = x2 * cosY + z2 * sinY;
        let y3 = y2;
        let z3 = -x2 * sinY + z2 * cosY;

        x = x3 + pivot[0] + headPosX;
        y = y3 + pivot[1] + headPosY;
        z = z3 + pivot[2] + headPosZ;
      }

      // --- Group B: Torso & Limbs (72..84) ---
      else if (i >= 72 && i <= 84) {
        if (i === 72 || i === 73 || i === 74) {
          x -= headRoll * 0.08;
          y += breathY * 0.6;
          z += breathZ * 0.6;
        } else if (i === 75 || i === 76) {
          const sign = i === 75 ? -1 : 1;
          x -= headRoll * 0.06;
          y += breathY * 0.8 + (sign * headRoll * 0.04);
          z += breathZ * 0.8;
        } else if (i === 77 || i === 78 || i === 79) {
          y += breathY;
          z += breathZ;
        } else if (i >= 81 && i <= 84) {
          y += breathY * 0.4;
          z += breathZ * 0.4;
        }
      }

      // --- Group C: Standard 21-Joint Hand (85..105) ---
      else if (i >= 85 && i <= 105) {
        y += breathY * 0.45;
        z += breathZ * 0.45;
      }

      this.deformedLandmarks[i][0] = Number.isFinite(x) ? x : base[0];
      this.deformedLandmarks[i][1] = Number.isFinite(y) ? y : base[1];
      this.deformedLandmarks[i][2] = Number.isFinite(z) ? z : base[2];
    }
  }

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
