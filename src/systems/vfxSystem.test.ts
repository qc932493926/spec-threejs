import { describe, test, expect } from 'vitest';
import { createTrailParticles, createExplosion, updateParticles, type Particle } from './vfxSystem';
import * as THREE from 'three';

describe('VFXSystem - 技能特效系统', () => {
  describe('createTrailParticles - 拖尾粒子', () => {
    test('创建10-20个拖尾粒子', () => {
      const position = new THREE.Vector3(5, 0, 0);
      const color = new THREE.Color(0xff4500);
      const particles = createTrailParticles(position, color);

      expect(particles.length).toBeGreaterThanOrEqual(10);
      expect(particles.length).toBeLessThanOrEqual(20);
    });

    test('粒子初始opacity为1', () => {
      const particles = createTrailParticles(new THREE.Vector3(0, 0, 0), new THREE.Color(0xff0000));
      particles.forEach(p => {
        expect(p.opacity).toBe(1);
      });
    });

    test('粒子有生命周期', () => {
      const particles = createTrailParticles(new THREE.Vector3(0, 0, 0), new THREE.Color(0xff0000));
      particles.forEach(p => {
        expect(p.lifespan).toBeGreaterThan(0);
        expect(p.age).toBe(0);
      });
    });
  });

  describe('createExplosion - 爆炸特效', () => {
    test('创建15个爆炸粒子', () => {
      const position = new THREE.Vector3(5, 0, 0);
      const color = new THREE.Color(0xff6600);
      const particles = createExplosion(position, color);

      expect(particles.length).toBe(15);
    });

    test('粒子径向扩散', () => {
      const particles = createExplosion(new THREE.Vector3(0, 0, 0), new THREE.Color(0xff0000));
      const speeds = particles.map(p => p.velocity.length());
      const allMoving = speeds.every(s => s > 0);

      expect(allMoving).toBe(true);
    });

    test('爆炸粒子生命周期1秒', () => {
      const particles = createExplosion(new THREE.Vector3(0, 0, 0), new THREE.Color(0xff0000));
      particles.forEach(p => {
        expect(p.lifespan).toBeCloseTo(1.0, 1);
      });
    });
  });

  describe('updateParticles - 更新粒子', () => {
    test('粒子随时间衰减opacity', () => {
      const particles: Particle[] = [{
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(1, 0, 0),
        color: new THREE.Color(0xff0000),
        size: 0.1,
        opacity: 1.0,
        lifespan: 1.0,
        age: 0
      }];

      const alive = updateParticles(particles, 0.5);
      expect(alive[0].opacity).toBeLessThan(1.0);
    });

    test('粒子超过lifespan被移除', () => {
      const particles: Particle[] = [{
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(1, 0, 0),
        color: new THREE.Color(0xff0000),
        size: 0.1,
        opacity: 1.0,
        lifespan: 1.0,
        age: 0
      }];

      const alive = updateParticles(particles, 1.1);
      expect(alive.length).toBe(0);
    });

    test('粒子位置随velocity更新', () => {
      const particles: Particle[] = [{
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(2, 0, 0),
        color: new THREE.Color(0xff0000),
        size: 0.1,
        opacity: 1.0,
        lifespan: 1.0,
        age: 0
      }];

      const alive = updateParticles(particles, 0.5);
      expect(alive[0].position.x).toBeCloseTo(1.0, 1); // 2 * 0.5 = 1
    });
  });
});
