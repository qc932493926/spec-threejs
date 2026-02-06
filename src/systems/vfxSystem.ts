import * as THREE from 'three';

/**
 * 粒子接口
 */
export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  opacity: number;
  lifespan: number; // 总生命周期（秒）
  age: number;      // 当前年龄（秒）
}

/**
 * 创建拖尾粒子
 * @param position 忍术位置
 * @param color 忍术颜色
 * @returns 粒子数组
 */
export function createTrailParticles(position: THREE.Vector3, color: THREE.Color): Particle[] {
  const count = 10 + Math.floor(Math.random() * 11); // 10-20个
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );

    particles.push({
      position: position.clone().add(offset),
      velocity: offset.multiplyScalar(2), // 向外扩散
      color: color.clone(),
      size: 0.05 + Math.random() * 0.05,
      opacity: 1.0,
      lifespan: 0.5,
      age: 0
    });
  }

  return particles;
}

/**
 * 创建爆炸粒子
 * @param position 爆炸中心位置
 * @param color 爆炸颜色
 * @returns 粒子数组
 */
export function createExplosion(position: THREE.Vector3, color: THREE.Color): Particle[] {
  const count = 15;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    // 径向分布
    const angle = (Math.PI * 2 * i) / count;
    const speed = 3 + Math.random() * 2;

    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      (Math.random() - 0.5) * speed
    );

    particles.push({
      position: position.clone(),
      velocity: velocity,
      color: color.clone(),
      size: 0.1 + Math.random() * 0.1,
      opacity: 1.0,
      lifespan: 1.0,
      age: 0
    });
  }

  return particles;
}

/**
 * 更新粒子系统
 * @param particles 粒子数组
 * @param deltaTime 增量时间（秒）
 * @returns 仍然存活的粒子
 */
export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  const alive: Particle[] = [];

  for (const particle of particles) {
    particle.age += deltaTime;

    // 超过生命周期则移除
    if (particle.age >= particle.lifespan) {
      continue;
    }

    // 更新位置
    particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

    // 衰减opacity
    const lifeRatio = particle.age / particle.lifespan;
    particle.opacity = 1.0 - lifeRatio;

    alive.push(particle);
  }

  return alive;
}
