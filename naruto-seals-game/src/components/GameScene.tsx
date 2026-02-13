import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Enemy, GameState, Jutsu, JutsuInstance } from '../types/index.ts';
import { jutsuList } from '../types/index.ts';
import { audioService } from '../services/audioService';

interface GameSceneProps {
  gameState: GameState;
  onGameStateUpdate: (state: Partial<GameState>) => void;
}

// 动态星空背景组件
function Starfield() {
  const starsRef = useRef<THREE.Points>(null);
  const nebulaRef = useRef<THREE.Points>(null);

  const { starGeometry, nebulaGeometry } = useMemo(() => {
    // 主星星
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(2000 * 3);
    const starCols = new Float32Array(2000 * 3);

    for (let i = 0; i < 2000; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 150;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 150;
      starPositions[i3 + 2] = (Math.random() - 0.5) * 100 - 20;

      // 随机星星颜色（白色、淡蓝、淡黄、淡橙）
      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        // 白色
        starCols[i3] = 1;
        starCols[i3 + 1] = 1;
        starCols[i3 + 2] = 1;
      } else if (colorChoice < 0.7) {
        // 淡蓝
        starCols[i3] = 0.7;
        starCols[i3 + 1] = 0.85;
        starCols[i3 + 2] = 1;
      } else if (colorChoice < 0.85) {
        // 淡黄
        starCols[i3] = 1;
        starCols[i3 + 1] = 0.95;
        starCols[i3 + 2] = 0.7;
      } else {
        // 淡橙
        starCols[i3] = 1;
        starCols[i3 + 1] = 0.8;
        starCols[i3 + 2] = 0.6;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));

    // 星云粒子
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPositions = new Float32Array(500 * 3);
    const nebulaCols = new Float32Array(500 * 3);

    for (let i = 0; i < 500; i++) {
      const i3 = i * 3;
      nebulaPositions[i3] = (Math.random() - 0.5) * 80;
      nebulaPositions[i3 + 1] = (Math.random() - 0.5) * 60;
      nebulaPositions[i3 + 2] = -30 - Math.random() * 30;

      // 星云颜色（紫、蓝、粉）
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        // 紫色
        nebulaCols[i3] = 0.5;
        nebulaCols[i3 + 1] = 0.2;
        nebulaCols[i3 + 2] = 0.8;
      } else if (colorChoice < 0.7) {
        // 蓝色
        nebulaCols[i3] = 0.2;
        nebulaCols[i3 + 1] = 0.4;
        nebulaCols[i3 + 2] = 0.9;
      } else {
        // 粉色
        nebulaCols[i3] = 0.9;
        nebulaCols[i3 + 1] = 0.3;
        nebulaCols[i3 + 2] = 0.5;
      }
    }

    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaCols, 3));

    return {
      starGeometry: starGeo,
      nebulaGeometry: nebulaGeo,
      starColors: starCols,
      nebulaColors: nebulaCols
    };
  }, []);

  // 动画效果
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // 星星缓慢移动
    if (starsRef.current) {
      starsRef.current.rotation.y = time * 0.01;
      starsRef.current.rotation.x = Math.sin(time * 0.005) * 0.1;
    }

    // 星云移动
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y = time * 0.02;
      nebulaRef.current.rotation.z = Math.sin(time * 0.01) * 0.1;
    }
  });

  return (
    <>
      {/* 主星星 */}
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>
      {/* 星云 */}
      <points ref={nebulaRef} geometry={nebulaGeometry}>
        <pointsMaterial
          size={0.8}
          vertexColors
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>
    </>
  );
}

// 敌人组件 - 更炫酷的外观
function EnemyMesh({ enemy }: { enemy: Enemy }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // 获取敌人颜色
  const enemyColor = useMemo(() => {
    const baseColor = enemy.mesh.material instanceof THREE.MeshStandardMaterial
      ? enemy.mesh.material.color
      : new THREE.Color(0xff0000);
    return baseColor;
  }, [enemy.mesh.material]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // 更新位置
    enemy.position.add(enemy.velocity.clone().multiplyScalar(delta));
    meshRef.current.position.copy(enemy.position);
    if (glowRef.current) {
      glowRef.current.position.copy(enemy.position);
    }

    // 边界反弹
    if (Math.abs(enemy.position.x) > 12) {
      enemy.velocity.x *= -1;
    }
    if (Math.abs(enemy.position.y) > 8) {
      enemy.velocity.y *= -1;
    }

    // 旋转
    meshRef.current.rotation.y += delta * 2;
    meshRef.current.rotation.x += delta * 0.5;

    // 脉冲效果
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    meshRef.current.scale.setScalar(pulse);
  });

  // 清理资源
  useEffect(() => {
    return () => {
      if (enemy.mesh) {
        enemy.mesh.geometry?.dispose();
        if (enemy.mesh.material instanceof THREE.Material) {
          enemy.mesh.material.dispose();
        }
      }
    };
  }, [enemy.mesh]);

  return (
    <group>
      {/* 主几何体 - 八面体更有动感 */}
      <mesh ref={meshRef} position={enemy.position.toArray() as [number, number, number]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color={enemyColor}
          emissive={enemyColor}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* 外层光晕 */}
      <mesh ref={glowRef} position={enemy.position.toArray() as [number, number, number]}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial
          color={enemyColor}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// 忍术发射物组件 - 带发光轨迹效果
function JutsuMesh({ jutsuInstance }: { jutsuInstance: JutsuInstance }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const trailPositionsRef = useRef<THREE.Vector3[]>([]);
  const maxTrailLength = 15;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // 更新位置
    jutsuInstance.position.add(jutsuInstance.velocity.clone().multiplyScalar(delta));
    meshRef.current.position.copy(jutsuInstance.position);

    // 旋转效果
    meshRef.current.rotation.x += delta * 5;
    meshRef.current.rotation.y += delta * 3;

    // 脉冲缩放效果
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    meshRef.current.scale.setScalar(pulse);

    // 更新轨迹
    trailPositionsRef.current.unshift(jutsuInstance.position.clone());
    if (trailPositionsRef.current.length > maxTrailLength) {
      trailPositionsRef.current.pop();
    }

    // 更新轨迹几何体
    if (trailRef.current && trailPositionsRef.current.length > 0) {
      const positions = new Float32Array(trailPositionsRef.current.length * 3);
      trailPositionsRef.current.forEach((pos, i) => {
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
      });
      trailRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // 减少生命周期
    jutsuInstance.lifetime -= delta;
    if (jutsuInstance.lifetime <= 0) {
      jutsuInstance.active = false;
    }
  });

  // 清理轨迹资源
  useEffect(() => {
    return () => {
      if (trailRef.current) {
        trailRef.current.geometry.dispose();
        if (trailRef.current.material instanceof THREE.Material) {
          trailRef.current.material.dispose();
        }
      }
    };
  }, []);

  return (
    <group>
      {/* 主球体 - 发光效果 */}
      <mesh ref={meshRef} position={jutsuInstance.position.toArray() as [number, number, number]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color={jutsuInstance.jutsu.color}
          emissive={jutsuInstance.jutsu.color}
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* 外层光晕 */}
      <mesh position={jutsuInstance.position.toArray() as [number, number, number]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial
          color={jutsuInstance.jutsu.color}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      {/* 轨迹点 */}
      <points ref={trailRef}>
        <bufferGeometry />
        <pointsMaterial
          color={jutsuInstance.jutsu.color}
          size={0.15}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// 爆炸粒子组件 - 更炫酷的爆炸效果
function ExplosionParticles({ position, color, onComplete }: { position: THREE.Vector3, color: THREE.Color, onComplete: () => void }) {
  const particlesRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lifetimeRef = useRef(1.5);
  const velocitiesRef = useRef<THREE.Vector3[]>([]);
  const particleScalesRef = useRef<number[]>([]);

  const { geometry, particleCount } = useMemo(() => {
    const count = 40; // 增加粒子数量
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = position.x;
      positions[i + 1] = position.y;
      positions[i + 2] = position.z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 创建不同速度的粒子
    velocitiesRef.current = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      return new THREE.Vector3(
        Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 3
      );
    });

    particleScalesRef.current = Array.from({ length: count }, () => 0.1 + Math.random() * 0.2);

    return { geometry: geo, particleCount: count };
  }, [position]);

  // 清理几何体资源
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame(() => {
    if (!particlesRef.current) return;

    lifetimeRef.current -= 0.016;
    if (lifetimeRef.current <= 0) {
      onComplete();
      return;
    }

    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      // 添加减速效果
      const drag = 0.98;
      velocitiesRef.current[i].multiplyScalar(drag);

      positions[i * 3] += velocitiesRef.current[i].x * 0.016;
      positions[i * 3 + 1] += velocitiesRef.current[i].y * 0.016;
      positions[i * 3 + 2] += velocitiesRef.current[i].z * 0.016;
    }
    geometry.attributes.position.needsUpdate = true;

    if (particlesRef.current.material instanceof THREE.PointsMaterial) {
      particlesRef.current.material.opacity = Math.min(1, lifetimeRef.current);
    }

    // 核心闪光缩放
    if (coreRef.current) {
      const coreScale = Math.max(0.01, lifetimeRef.current * 2);
      coreRef.current.scale.setScalar(coreScale);
    }
  });

  return (
    <group>
      {/* 核心闪光 */}
      <mesh ref={coreRef} position={position.toArray() as [number, number, number]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(1, 1, 1)}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* 外层光晕 */}
      <mesh position={position.toArray() as [number, number, number]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      {/* 粒子 */}
      <points ref={particlesRef} geometry={geometry}>
        <pointsMaterial
          color={color}
          size={0.25}
          transparent
          opacity={1}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// 主游戏场景逻辑组件
function GameLogic({ gameState, onGameStateUpdate }: { gameState: GameState, onGameStateUpdate: (state: Partial<GameState>) => void }) {
  const enemySpawnTimerRef = useRef(0);
  const explosionsRef = useRef<Array<{ id: string, position: THREE.Vector3, color: THREE.Color }>>([]);

  useFrame((_, delta) => {
    if (gameState.isGameOver) return;

    // 基于波次的难度调整 - 更平滑的曲线
    const wave = gameState.wave;
    const spawnInterval = Math.max(0.5, 2.5 - wave * 0.12); // 波次越高，生成越快
    const maxEnemies = Math.min(10, 3 + Math.floor(wave * 0.8)); // 波次越高，敌人越多
    const enemyHealth = Math.min(300, 60 + wave * 15); // 波次越高，敌人越强（限制最大值）
    const enemySpeed = Math.min(4, 1.5 + wave * 0.15); // 波次越高，敌人越快

    // 生成敌人
    enemySpawnTimerRef.current += delta;
    if (enemySpawnTimerRef.current > spawnInterval && gameState.enemies.length < maxEnemies) {
      const newEnemy = createEnemy(enemyHealth, enemySpeed);
      onGameStateUpdate({ enemies: [...gameState.enemies, newEnemy] });
      enemySpawnTimerRef.current = 0;
    }

    // 碰撞检测
    const updatedState: Partial<GameState> = {};
    let enemiesChanged = false;

    gameState.jutsuInstances.forEach(jutsu => {
      if (!jutsu.active) return;

      gameState.enemies.forEach(enemy => {
        const distance = jutsu.position.distanceTo(enemy.position);
        if (distance < 1) {
          // 命中
          enemy.health -= jutsu.jutsu.damage;
          jutsu.active = false;

          // 播放音效
          audioService.playHitSound(gameState.combo);

          // 增加Combo和分数 - 波次加成和连击奖励
          const waveBonus = 1 + gameState.wave * 0.1; // 波次加成
          const newCombo = gameState.combo + 1;
          const comboMultiplier = newCombo;

          // 连击里程碑奖励
          let comboBonus = 0;
          if (newCombo === 10) comboBonus = 500;      // 10连击奖励
          else if (newCombo === 25) comboBonus = 1500; // 25连击奖励
          else if (newCombo === 50) comboBonus = 5000; // 50连击奖励

          const baseScore = 100;
          updatedState.combo = newCombo;
          updatedState.comboTimer = 3;
          updatedState.score = Math.floor(gameState.score + baseScore * comboMultiplier * waveBonus + comboBonus);

          // 敌人死亡
          if (enemy.health <= 0) {
            audioService.playExplosion();

            // 创建爆炸
            const material = enemy.mesh.material as THREE.MeshStandardMaterial;
            explosionsRef.current.push({
              id: `explosion_${Date.now()}_${Math.random()}`,
              position: enemy.position.clone(),
              color: material.color.clone()
            });

            enemiesChanged = true;
          }
        }
      });
    });

    // 清理死亡敌人
    if (enemiesChanged) {
      const survivingEnemies = gameState.enemies.filter(e => e.health > 0);
      updatedState.enemies = survivingEnemies;

      // 波次提升：每击败5个敌人提升一波
      const killCount = gameState.enemies.length - survivingEnemies.length;
      if (killCount > 0) {
        const newWave = gameState.wave + Math.floor((gameState.score % 500) / 100);
        if (newWave > gameState.wave) {
          updatedState.wave = newWave;
        }
      }
    }

    // 清理无效忍术
    const activeJutsu = gameState.jutsuInstances.filter(j => j.active);
    if (activeJutsu.length !== gameState.jutsuInstances.length) {
      updatedState.jutsuInstances = activeJutsu;
    }

    // 查克拉恢复 - 基于波次动态调整
    if (gameState.chakra < gameState.maxChakra) {
      // 波次越高，恢复越快，让高波次也能持续战斗
      const chakraRegen = 2 + gameState.wave * 0.3;
      updatedState.chakra = Math.min(gameState.chakra + delta * chakraRegen, gameState.maxChakra);
    }

    // Combo计时器减少
    if (gameState.comboTimer > 0) {
      const newComboTimer = gameState.comboTimer - delta;
      if (newComboTimer <= 0) {
        updatedState.combo = 0;
        updatedState.comboTimer = 0;
      } else {
        updatedState.comboTimer = newComboTimer;
      }
    }

    // 批量更新状态
    if (Object.keys(updatedState).length > 0) {
      onGameStateUpdate(updatedState);
    }
  });

  const removeExplosion = (id: string) => {
    explosionsRef.current = explosionsRef.current.filter(e => e.id !== id);
  };

  return (
    <>
      {explosionsRef.current.map(explosion => (
        <ExplosionParticles
          key={explosion.id}
          position={explosion.position}
          color={explosion.color}
          onComplete={() => removeExplosion(explosion.id)}
        />
      ))}
    </>
  );
}

// 创建敌人函数
function createEnemy(health: number = 100, speed: number = 2): Enemy {
  const angle = Math.random() * Math.PI * 2;
  const radius = 15;
  const position = new THREE.Vector3(
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 10,
    -5
  );

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(Math.random(), Math.random(), Math.random()),
    emissive: new THREE.Color(0.2, 0.2, 0.2)
  });

  const geometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 16);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);

  return {
    id: `enemy_${Date.now()}_${Math.random()}`,
    position: position.clone(),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed,
      0
    ),
    health,
    maxHealth: health,
    mesh,
    type: 'basic'
  };
}

// 主场景组件
export const GameScene: React.FC<GameSceneProps> = ({ gameState, onGameStateUpdate }) => {

  // 检测手印并发射忍术
  useEffect(() => {
    if (gameState.currentSeals.length > 0) {
      // 检查是否匹配任何忍术
      const matchedJutsu = jutsuList.find(jutsu =>
        jutsu.seals.length === gameState.currentSeals.length &&
        jutsu.seals.every((seal, index) => seal === gameState.currentSeals[index])
      );

      if (matchedJutsu && gameState.chakra >= matchedJutsu.chakraCost) {
        launchJutsu(matchedJutsu);
        onGameStateUpdate({
          currentSeals: [],
          chakra: gameState.chakra - matchedJutsu.chakraCost
        });
        audioService.playJutsuRelease(matchedJutsu.id);
      }
    }
  }, [gameState.currentSeals]);

  function launchJutsu(jutsu: Jutsu) {
    const startPosition = new THREE.Vector3(0, 0, 8); // 从相机位置发射

    const jutsuInstance: JutsuInstance = {
      jutsu,
      position: startPosition.clone(),
      velocity: new THREE.Vector3(0, 0, -10),
      lifetime: 3,
      active: true,
    };

    onGameStateUpdate({
      jutsuInstances: [...gameState.jutsuInstances, jutsuInstance]
    });
  }

  return (
    <div className="w-full h-full absolute top-0 left-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        {/* 灯光 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* 星空背景 */}
        <Starfield />

        {/* 游戏逻辑 */}
        <GameLogic gameState={gameState} onGameStateUpdate={onGameStateUpdate} />

        {/* 渲染敌人 */}
        {gameState.enemies.map(enemy => (
          <EnemyMesh key={enemy.id} enemy={enemy} />
        ))}

        {/* 渲染忍术 */}
        {gameState.jutsuInstances.filter(j => j.active).map((jutsu, index) => (
          <JutsuMesh key={`${jutsu.jutsu.id}_${index}`} jutsuInstance={jutsu} />
        ))}
      </Canvas>
    </div>
  );
};
