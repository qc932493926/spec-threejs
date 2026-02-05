import * as THREE from 'three';
import type { GestureType, NormalizedLandmark, SealType } from '../types/index.ts';
import { gestureMapping } from '../types/index.ts';

// 平滑滤波器
class SmoothFilter {
  private history: THREE.Vector2[] = [];
  private windowSize = 5;

  smooth(newPosition: THREE.Vector2): THREE.Vector2 {
    this.history.push(newPosition.clone());
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // 加权平均
    const sum = new THREE.Vector2();
    let totalWeight = 0;

    this.history.forEach((pos, i) => {
      const weight = (i + 1) / this.history.length;
      sum.add(pos.clone().multiplyScalar(weight));
      totalWeight += weight;
    });

    return sum.divideScalar(totalWeight);
  }

  reset() {
    this.history = [];
  }
}

export const smoothFilter = new SmoothFilter();

// 检测手势类型
export function detectNinjaSeal(landmarks: NormalizedLandmark[]): GestureType {
  if (!landmarks || landmarks.length < 21) {
    return 'None';
  }

  const fingers = [
    landmarks[8],  // 食指
    landmarks[12], // 中指
    landmarks[16], // 无名指
    landmarks[20]  // 小指
  ];

  const palm = landmarks[0];
  const thumb = landmarks[4];
  const indexTip = landmarks[8];

  // 计算手指展开度
  const fingerDistance = fingers.reduce((sum, finger) => {
    const dist = Math.hypot(finger.x - palm.x, finger.y - palm.y);
    return sum + dist;
  }, 0) / fingers.length;

  // 判断手势类型
  // Open_Palm: 所有手指张开
  if (fingerDistance > 0.15) {
    return 'Open_Palm';
  }

  // Closed_Fist: 所有手指握拳
  if (fingerDistance < 0.05) {
    return 'Closed_Fist';
  }

  // Pointing_Up: 食指向上
  const indexPointingUp = indexTip.y < palm.y - 0.1 &&
                          landmarks[12].y > palm.y - 0.05; // 其他手指未伸出
  if (indexPointingUp) {
    return 'Pointing_Up';
  }

  // Thumb_Up: 拇指向上
  const thumbUp = thumb.y < palm.y - 0.08 && fingerDistance < 0.08;
  if (thumbUp) {
    return 'Thumb_Up';
  }

  // Victory: V字手势（食指和中指伸出）
  const indexExtended = indexTip.y < palm.y - 0.08;
  const middleExtended = landmarks[12].y < palm.y - 0.08;
  const othersDown = landmarks[16].y > palm.y - 0.03;

  if (indexExtended && middleExtended && othersDown) {
    return 'Victory';
  }

  return 'None';
}

// 获取手势对应的手印类型
export function getSealType(gestureType: GestureType): SealType | null {
  return gestureMapping[gestureType];
}

// 获取手部中心位置（归一化坐标）
export function getHandCenter(landmarks: NormalizedLandmark[]): THREE.Vector2 {
  if (!landmarks || landmarks.length < 21) {
    return new THREE.Vector2(0.5, 0.5);
  }

  const palm = landmarks[0];
  return new THREE.Vector2(palm.x, palm.y);
}

// 将归一化坐标映射到3D世界坐标
export function mapGestureToWorldCoords(
  gestureX: number,  // MediaPipe归一化坐标 [0,1]
  gestureY: number,
  camera: THREE.Camera,
  distance: number = 10 // 从相机到投影平面的距离
): THREE.Vector3 {
  // 转换到NDC（Normalized Device Coordinates）
  const x = (gestureX * 2) - 1;
  const y = -(gestureY * 2) + 1; // Y轴翻转

  // 从屏幕空间投射到3D世界
  const vector = new THREE.Vector3(x, y, 0.5);
  vector.unproject(camera);

  // 计算从相机到投影点的方向
  const dir = vector.sub(camera.position).normalize();

  // 沿着方向移动指定距离
  return camera.position.clone().add(dir.multiplyScalar(distance));
}

// 计算两个关键点之间的距离
export function getDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

// 检测捏合手势（用于触发忍术）
export function detectPinch(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) {
    return false;
  }

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const distance = getDistance(thumbTip, indexTip);
  return distance < 0.05; // 捏合阈值
}
