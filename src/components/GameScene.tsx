import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Enemy, GameState, Jutsu, JutsuInstance } from '../types/index.ts';
import { jutsuList } from '../types/index.ts';
import { audioService } from '../services/audioService';

interface GameSceneProps {
  gameState: GameState;
  onGameStateUpdate: (state: Partial<GameState>) => void;
  onJutsuReady: (jutsu: Jutsu) => void;
}

// 星空背景组件
function Starfield() {
  const starsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(1000 * 3);

    for (let i = 0; i < 1000 * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <points ref={starsRef} geometry={geometry}>
      <pointsMaterial color={0xffffff} size={0.1} />
    </points>
  );
}

// 敌人组件
function EnemyMesh({ enemy }: { enemy: Enemy }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // 更新位置
    enemy.position.add(enemy.velocity.clone().multiplyScalar(delta));
    meshRef.current.position.copy(enemy.position);

    // 边界反弹
    if (Math.abs(enemy.position.x) > 12) {
      enemy.velocity.x *= -1;
    }
    if (Math.abs(enemy.position.y) > 8) {
      enemy.velocity.y *= -1;
    }

    // 旋转
    meshRef.current.rotation.y += delta;
  });

  return (
    <mesh ref={meshRef} position={enemy.position.toArray() as [number, number, number]}>
      <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
      <meshStandardMaterial
        color={enemy.mesh.material instanceof THREE.MeshStandardMaterial ? enemy.mesh.material.color : 0xff0000}
        emissive={new THREE.Color(0.2, 0.2, 0.2)}
      />
    </mesh>
  );
}

// 忍术发射物组件
function JutsuMesh({ jutsuInstance }: { jutsuInstance: JutsuInstance }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // 更新位置
    jutsuInstance.position.add(jutsuInstance.velocity.clone().multiplyScalar(delta));
    meshRef.current.position.copy(jutsuInstance.position);

    // 减少生命周期
    jutsuInstance.lifetime -= delta;
    if (jutsuInstance.lifetime <= 0) {
      jutsuInstance.active = false;
    }
  });

  return (
    <mesh ref={meshRef} position={jutsuInstance.position.toArray() as [number, number, number]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={jutsuInstance.jutsu.color} />
    </mesh>
  );
}

// 爆炸粒子组件
function ExplosionParticles({ position, color, onComplete }: { position: THREE.Vector3, color: THREE.Color, onComplete: () => void }) {
  const particlesRef = useRef<THREE.Points>(null);
  const lifetimeRef = useRef(1);
  const velocitiesRef = useRef<THREE.Vector3[]>([]);

  const { geometry, particleCount } = useMemo(() => {
    const count = 20;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = position.x;
      positions[i + 1] = position.y;
      positions[i + 2] = position.z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    velocitiesRef.current = Array.from({ length: count }, () => new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5
    ));

    return { geometry: geo, particleCount: count };
  }, [position]);

  useFrame(() => {
    if (!particlesRef.current) return;

    lifetimeRef.current -= 0.016;
    if (lifetimeRef.current <= 0) {
      onComplete();
      return;
    }

    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocitiesRef.current[i].x * 0.016;
      positions[i * 3 + 1] += velocitiesRef.current[i].y * 0.016;
      positions[i * 3 + 2] += velocitiesRef.current[i].z * 0.016;
    }
    geometry.attributes.position.needsUpdate = true;

    if (particlesRef.current.material instanceof THREE.PointsMaterial) {
      particlesRef.current.material.opacity = lifetimeRef.current;
    }
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial color={color} size={0.2} transparent opacity={1} />
    </points>
  );
}

// 主游戏场景逻辑组件
function GameLogic({ gameState, onGameStateUpdate }: { gameState: GameState, onGameStateUpdate: (state: Partial<GameState>) => void }) {
  const enemySpawnTimerRef = useRef(0);
  const explosionsRef = useRef<Array<{ id: string, position: THREE.Vector3, color: THREE.Color }>>([]);

  useFrame((_, delta) => {
    if (gameState.isGameOver) return;

    // 生成敌人
    enemySpawnTimerRef.current += delta;
    if (enemySpawnTimerRef.current > 2 && gameState.enemies.length < 4) {
      const newEnemy = createEnemy();
      onGameStateUpdate({ enemies: [...gameState.enemies, newEnemy] });
      enemySpawnTimerRef.current = 0;
    }

    // 碰撞检测
    const updatedState: Partial<GameState> = {};
    let scoreChanged = false;
    let comboChanged = false;
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

          // 增加Combo和分数
          updatedState.combo = gameState.combo + 1;
          updatedState.comboTimer = 3;
          updatedState.score = gameState.score + 100 * (gameState.combo + 1);
          scoreChanged = true;
          comboChanged = true;

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
      updatedState.enemies = gameState.enemies.filter(e => e.health > 0);
    }

    // 清理无效忍术
    const activeJutsu = gameState.jutsuInstances.filter(j => j.active);
    if (activeJutsu.length !== gameState.jutsuInstances.length) {
      updatedState.jutsuInstances = activeJutsu;
    }

    // 查克拉恢复
    if (gameState.chakra < gameState.maxChakra) {
      updatedState.chakra = Math.min(gameState.chakra + delta * 5, gameState.maxChakra);
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
function createEnemy(): Enemy {
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
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      0
    ),
    health: 100,
    maxHealth: 100,
    mesh,
    type: 'basic'
  };
}

// 主场景组件
export const GameScene: React.FC<GameSceneProps> = ({ gameState, onGameStateUpdate, onJutsuReady }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

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
