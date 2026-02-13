import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import { GameScene } from './components/GameScene';
import type { GameState } from './types/index.ts';
import { sealEmojis } from './types/index.ts';
import { detectNinjaSeal, getSealType } from './services/gestureService';
import { audioService } from './services/audioService';
import { achievementService, type Achievement } from './services/achievementService';
import './index.css';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    chakra: 100,
    maxChakra: 100,
    score: 0,
    combo: 0,
    comboTimer: 0,
    currentSeals: [],
    enemies: [],
    jutsuInstances: [],
    isGameOver: false,
    wave: 1
  });
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    volume: 70,
    difficulty: 'normal' as 'easy' | 'normal' | 'hard',
    quality: 'high' as 'low' | 'medium' | 'high',
  });
  const [achievementNotification, setAchievementNotification] = useState<Achievement | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [prevWave, setPrevWave] = useState(1);
  const [showWaveAnnounce, setShowWaveAnnounce] = useState(false);
  const lastGestureRef = useRef<string>('None');
  const gestureCooldownRef = useRef<number>(0);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    // 只有在isReady为true时才初始化MediaPipe
    if (!isReady) return;

    let isActive = true;

    const initializeGestureRecognizer = async () => {
      try {
        // 临时禁用console.error来隐藏MediaPipe的INFO日志
        const originalError = console.error;
        console.error = (...args: unknown[]) => {
          const message = args[0]?.toString() || '';
          // 只过滤MediaPipe的INFO日志，保留真正的错误
          if (message.includes('INFO:') || message.includes('TensorFlow')) {
            return;
          }
          originalError.apply(console, args);
        };

        // 初始化MediaPipe Tasks Vision
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        // 创建手势识别器
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        // 恢复console.error
        console.error = originalError;

        gestureRecognizerRef.current = recognizer;

        // 启动摄像头
        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 }
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            if (isActive) {
              predictWebcam();
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize gesture recognizer:', error);
      }
    };

    const predictWebcam = () => {
      if (!isActive || !gestureRecognizerRef.current || !videoRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        try {
          // 识别手势
          const nowInMs = Date.now();
          const results = gestureRecognizerRef.current.recognizeForVideo(video, nowInMs);

          // 绘制手部关键点
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // 关键：设置canvas尺寸与video匹配
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              // 清理画布
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              // 绘制骨骼线
              if (results.landmarks && results.landmarks.length > 0) {
                for (const landmarks of results.landmarks) {
                  const drawingUtils = new DrawingUtils(ctx);
                  drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: '#FFD700',
                    lineWidth: 2
                  });
                  drawingUtils.drawLandmarks(landmarks, {
                    color: '#FF0000',
                    lineWidth: 1
                  });
                }
              }
            }
          }

          // 处理手势识别结果
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];

            // 检测手势
            const gestureType = detectNinjaSeal(landmarks);
            const sealType = getSealType(gestureType);

            // 手势冷却时间
            const currentTime = Date.now();
            if (currentTime - gestureCooldownRef.current > 500) {
              if (sealType && gestureType !== lastGestureRef.current) {
                // 新手印
                audioService.playSealSound(sealType);
                setGameState(prev => ({
                  ...prev,
                  currentSeals: [...prev.currentSeals, sealType]
                }));
                lastGestureRef.current = gestureType;
                gestureCooldownRef.current = currentTime;
              } else if (gestureType === 'None' && lastGestureRef.current !== 'None') {
                lastGestureRef.current = 'None';
              }
            }
          }
        } catch (error) {
          console.error('Prediction error:', error);
        }
      }

      // 继续预测
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    };

    initializeGestureRecognizer();
    audioService.resume();

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isReady]);

  const handleGameStateUpdate = (updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  const handleStart = () => {
    audioService.resume();
    setIsReady(true);
  };

  const handleReset = () => {
    // 在重置前更新成就统计
    achievementService.updateStats({
      gamesPlayed: 1,
    });

    setGameState({
      chakra: 100,
      maxChakra: 100,
      score: 0,
      combo: 0,
      comboTimer: 0,
      currentSeals: [],
      enemies: [],
      jutsuInstances: [],
      isGameOver: false,
      wave: 1
    });
  };

  const handleToggleMute = () => {
    audioService.toggleMute();
    setIsMuted(!isMuted);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (showAchievements) {
          setShowAchievements(false);
        } else if (isReady && !gameState.isGameOver) {
          setIsPaused(!isPaused);
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (gameState.isGameOver || isPaused) {
          handleReset();
          setIsPaused(false);
          if (!isReady) setIsReady(true);
        }
      }
      if (e.key === ' ' && !isReady) {
        handleStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, isPaused, gameState.isGameOver, showSettings, showAchievements]);

  // 成就解锁回调
  useEffect(() => {
    const handleAchievementUnlock = (achievement: Achievement) => {
      setAchievementNotification(achievement);
      audioService.playComboMilestone(50);  // 使用里程碑音效
      setTimeout(() => setAchievementNotification(null), 3000);
    };

    achievementService.onUnlock(handleAchievementUnlock);
  }, []);

  // 检测波次变化并显示公告
  useEffect(() => {
    if (gameState.wave > prevWave && isReady) {
      setShowWaveAnnounce(true);
      setPrevWave(gameState.wave);
      const timer = setTimeout(() => setShowWaveAnnounce(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.wave, prevWave, isReady]);

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* 3D游戏场景 */}
      <GameScene
        gameState={gameState}
        onGameStateUpdate={handleGameStateUpdate}
      />

      {/* 波次公告 */}
      {showWaveAnnounce && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center wave-announce">
            <div className="text-8xl font-bold text-orange-500 mb-4" style={{ textShadow: '0 0 40px rgba(249, 115, 22, 0.8)' }}>
              WAVE {gameState.wave}
            </div>
            <div className="text-3xl text-yellow-400">
              {gameState.wave <= 3 ? '敌人来袭!' :
               gameState.wave <= 5 ? '难度提升!' :
               gameState.wave <= 8 ? '危机四伏!' : '最终决战!'}
            </div>
          </div>
        </div>
      )}

      {/* 左上角查克拉和Combo */}
      <div className="absolute top-8 left-8 text-white z-10 glass-panel p-4">
        {/* 控制按钮 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleToggleMute}
            className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 border-2 border-gray-600 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
            title={isMuted ? "开启音效" : "关闭音效"}
          >
            <span className="text-xl">{isMuted ? "🔇" : "🔊"}</span>
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 border-2 border-gray-600 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
            title={isPaused ? "继续游戏" : "暂停游戏"}
          >
            <span className="text-xl">{isPaused ? "▶️" : "⏸️"}</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 border-2 border-gray-600 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
            title="游戏设置"
          >
            <span className="text-xl">⚙️</span>
          </button>
          <button
            onClick={() => setShowAchievements(true)}
            className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 border-2 border-gray-600 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
            title="成就"
          >
            <span className="text-xl">🏆</span>
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-bold">查克拉:</span>
          <div className="w-48 h-6 bg-gray-800 border-2 border-blue-400 rounded-full overflow-hidden chakra-pulse">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${(gameState.chakra / gameState.maxChakra) * 100}%` }}
            />
          </div>
          <span className="text-xl font-mono">{Math.floor(gameState.chakra)}</span>
        </div>

        {/* 分数 */}
        <div className="text-3xl font-bold mb-2 score-fly">
          分数: <span className="text-yellow-400">{gameState.score}</span>
        </div>

        {/* 波次显示 */}
        <div className="text-xl font-bold mb-2 text-orange-400">
          第 {gameState.wave} 波
        </div>

        {/* Combo */}
        {gameState.combo > 1 && (
          <div className="text-5xl text-yellow-400 font-bold combo-bounce drop-shadow-lg"
               style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.8)' }}>
            {gameState.combo}x COMBO!
          </div>
        )}

        {/* 快捷键提示 */}
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div>ESC 暂停 | M 静音 | R 重置</div>
        </div>
      </div>

      {/* 右上角当前手印序列 */}
      <div className="absolute top-8 right-8 text-white z-10 glass-panel p-4">
        <div className="text-xl mb-2 font-bold">当前手印:</div>
        <div className="flex gap-2 min-h-[48px] items-center">
          {gameState.currentSeals.length === 0 ? (
            <div className="text-gray-400 text-sm animate-pulse">等待结印...</div>
          ) : (
            gameState.currentSeals.map((seal, i) => (
              <div
                key={i}
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-2xl border-2 border-yellow-400 shadow-lg seal-pop neon-border text-orange-400"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {sealEmojis[seal]}
              </div>
            ))
          )}
        </div>
        {gameState.currentSeals.length > 0 && (
          <button
            onClick={() => setGameState(prev => ({ ...prev, currentSeals: [] }))}
            className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors hover:underline"
          >
            ✕ 清除手印
          </button>
        )}
      </div>

      {/* 右下角摄像头（PIP） */}
      <div className="absolute bottom-28 right-8 w-72 h-52 z-10">
        <div className="relative w-full h-full glass-panel border-2 border-orange-500/50 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow">
          {/* 标题栏 */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-600/80 to-red-600/80 px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">手势识别</span>
            </div>
            <span className="text-white/70 text-xs">LIVE</span>
          </div>
          <video
            ref={videoRef}
            className="w-full h-full object-cover transform scale-x-[-1]"
            autoPlay
            playsInline
          />
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
          />
          {/* 扫描线效果 */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" style={{ top: '50%' }} />
          </div>
        </div>
      </div>

      {/* 底部技能提示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center z-10">
        <div className="glass-panel px-8 py-4 border-2 border-orange-500/50 hover:border-orange-400 transition-colors">
          <div className="text-sm text-orange-400 mb-2 font-bold">忍术速查</div>
          <div className="flex gap-6 text-base items-center">
            <div className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <span className="text-3xl">🔥</span>
              <span className="text-xs text-gray-300">火球</span>
              <span className="text-xs text-red-400">伤害30</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <span className="text-3xl">💧</span>
              <span className="text-xs text-gray-300">水龙</span>
              <span className="text-xs text-blue-400">伤害35</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <span className="text-3xl">⚡</span>
              <span className="text-xs text-gray-300">雷切</span>
              <span className="text-xs text-cyan-400">伤害50</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <span className="text-3xl">💨</span>
              <span className="text-xs text-gray-300">风刃</span>
              <span className="text-xs text-green-400">伤害25</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <span className="text-3xl">🗿</span>
              <span className="text-xs text-gray-300">土墙</span>
              <span className="text-xs text-amber-400">防御</span>
            </div>
            <div className="w-px h-12 bg-gray-600 mx-2" />
            <div className="flex flex-col items-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex gap-1 text-xl">
                <span>🔥</span>
                <span>+</span>
                <span>⚡</span>
              </div>
              <span className="text-xs text-yellow-400">火雷爆发</span>
              <span className="text-xs text-orange-400">伤害80!</span>
            </div>
          </div>
        </div>
      </div>

      {/* 开始界面 */}
      {!isReady && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center z-20">
          <div className="text-center text-white max-w-5xl px-8">
            <h1 className="text-7xl font-bold mb-6 title-shine">火影结印游戏</h1>
            <p className="text-2xl mb-4 text-gray-300">Naruto Seal Game</p>
            <p className="text-3xl mb-12 text-orange-300">使用手势施放忍术，消灭敌人!</p>

            <button
              onClick={handleStart}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-600 text-white text-3xl px-16 py-6 rounded-xl font-bold mb-12 transition-all transform hover:scale-110 btn-glow border-2 border-orange-400"
            >
              🎮 开始游戏
            </button>

            <div className="grid grid-cols-2 gap-12 text-left">
              {/* 手势说明 */}
              <div className="glass-panel p-8 border-2 border-blue-500/50 hover:border-blue-400 transition-colors">
                <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">手势说明</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">✋</span>
                    <span className="text-xl">张开手掌 = 火印 🔥</span>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">✊</span>
                    <span className="text-xl">握拳 = 水印 💧</span>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">☝️</span>
                    <span className="text-xl">食指向上 = 雷印 ⚡</span>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">👍</span>
                    <span className="text-xl">拇指向上 = 风印 💨</span>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">✌️</span>
                    <span className="text-xl">V字手势 = 土印 🗿</span>
                  </div>
                </div>
              </div>

              {/* 技能说明 */}
              <div className="glass-panel p-8 border-2 border-purple-500/50 hover:border-purple-400 transition-colors">
                <h2 className="text-3xl font-bold mb-6 text-purple-400 text-center">技能释放</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">🔥</span>
                    <div>
                      <span className="text-xl">火遁·豪火球之术</span>
                      <span className="text-sm text-gray-400 ml-2">伤害: 30</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">💧</span>
                    <div>
                      <span className="text-xl">水遁·水龙弹之术</span>
                      <span className="text-sm text-gray-400 ml-2">伤害: 35</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">⚡</span>
                    <div>
                      <span className="text-xl">雷遁·千鸟</span>
                      <span className="text-sm text-gray-400 ml-2">伤害: 50</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">💨</span>
                    <div>
                      <span className="text-xl">风遁·螺旋手里剑</span>
                      <span className="text-sm text-gray-400 ml-2">伤害: 25</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-5xl">🗿</span>
                    <div>
                      <span className="text-xl">土遁·土流壁</span>
                      <span className="text-sm text-gray-400 ml-2">防御</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-yellow-400 text-xl glass-panel inline-block px-6 py-3">
              <p>💡 提示: 组合不同手印可以释放更强大的忍术!</p>
              <p className="text-orange-300 text-lg mt-1">🔥 + ⚡ = 火雷爆发 (伤害: 80)</p>
            </div>
          </div>
        </div>
      )}

      {/* 暂停界面 */}
      {isPaused && !gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-center text-white glass-panel p-12 border-2 border-yellow-500/50">
            <h1 className="text-6xl font-bold mb-8 text-yellow-400" style={{ textShadow: '0 0 30px rgba(250, 204, 21, 0.8)' }}>
              ⏸️ 游戏暂停
            </h1>
            <p className="text-xl mb-8 text-gray-300">休息一下，调整状态</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsPaused(false)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xl px-12 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                ▶️ 继续游戏
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  handleReset();
                  setIsReady(false);
                }}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xl px-12 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                🔄 重新开始
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 游戏结束界面 */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-gray-900/90 to-black/90 flex items-center justify-center z-20">
          <div className="text-center text-white glass-panel p-12 border-2 border-red-500/50">
            <h1 className="text-7xl font-bold mb-6 text-red-500" style={{ textShadow: '0 0 30px rgba(239, 68, 68, 0.8)' }}>
              任务失败
            </h1>
            <p className="text-2xl mb-8 text-gray-300">忍者之路充满坎坷...</p>

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="glass-panel p-4 border border-orange-500/30">
                <div className="text-5xl font-bold text-orange-400">{gameState.score}</div>
                <div className="text-sm text-gray-400 mt-2">最终分数</div>
              </div>
              <div className="glass-panel p-4 border border-yellow-500/30">
                <div className="text-5xl font-bold text-yellow-400">{gameState.combo}x</div>
                <div className="text-sm text-gray-400 mt-2">最高连击</div>
              </div>
              <div className="glass-panel p-4 border border-purple-500/30">
                <div className="text-5xl font-bold text-purple-400">{gameState.wave}</div>
                <div className="text-sm text-gray-400 mt-2">到达波次</div>
              </div>
            </div>

            {/* 评价 */}
            <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border border-orange-500/30">
              <p className="text-xl">
                {gameState.score >= 5000 ? '🌟 传说中的忍者！' :
                 gameState.score >= 2000 ? '⭐ 精英上忍！' :
                 gameState.score >= 1000 ? '✨ 中忍水平' :
                 gameState.score >= 500 ? '📝 下忍入门' : '💪 继续努力！'}
              </p>
            </div>

            <button
              onClick={handleReset}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-600 text-white text-2xl px-16 py-5 rounded-xl font-bold transition-all transform hover:scale-105 btn-glow border-2 border-orange-400"
            >
              🔄 再战一次
            </button>
          </div>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="text-white glass-panel p-8 border-2 border-blue-500/50 w-[500px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-blue-400">⚙️ 游戏设置</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-2xl hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 音量设置 */}
            <div className="mb-6">
              <label className="block text-lg mb-2">
                🔊 音量: {settings.volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => setSettings({ ...settings, volume: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* 难度设置 */}
            <div className="mb-6">
              <label className="block text-lg mb-2">🎯 难度选择</label>
              <div className="flex gap-3">
                {(['easy', 'normal', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSettings({ ...settings, difficulty: diff })}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      settings.difficulty === diff
                        ? diff === 'easy' ? 'bg-green-500 text-white' :
                          diff === 'normal' ? 'bg-yellow-500 text-black' :
                          'bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {diff === 'easy' ? '🌱 简单' :
                     diff === 'normal' ? '⚔️ 普通' : '💀 困难'}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {settings.difficulty === 'easy' ? '敌人较弱，适合新手练习' :
                 settings.difficulty === 'normal' ? '标准难度，体验完整游戏' :
                 '敌人强劲，挑战极限'}
              </p>
            </div>

            {/* 画面质量 */}
            <div className="mb-6">
              <label className="block text-lg mb-2">🖼️ 画面质量</label>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((qual) => (
                  <button
                    key={qual}
                    onClick={() => setSettings({ ...settings, quality: qual })}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      settings.quality === qual
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {qual === 'low' ? '📉 低' :
                     qual === 'medium' ? '📊 中' : '📈 高'}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {settings.quality === 'low' ? '低画质，提升性能' :
                 settings.quality === 'medium' ? '平衡画质与性能' :
                 '高画质，最佳视觉体验'}
              </p>
            </div>

            {/* 保存按钮 */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowSettings(false);
                  audioService.playUIClick();
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-lg font-bold transition-all transform hover:scale-105"
              >
                ✓ 保存设置
              </button>
              <button
                onClick={() => {
                  setSettings({ volume: 70, difficulty: 'normal', quality: 'high' });
                  audioService.playUIClick();
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-all"
              >
                ↺ 恢复默认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成就通知 */}
      {achievementNotification && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
          <div className="glass-panel px-8 py-4 border-2 border-yellow-500 animate-bounce">
            <div className="text-center">
              <div className="text-4xl mb-2">{achievementNotification.icon}</div>
              <div className="text-yellow-400 text-2xl font-bold">成就解锁!</div>
              <div className="text-white text-lg">{achievementNotification.name}</div>
              <div className="text-gray-400 text-sm">{achievementNotification.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* 成就面板 */}
      {showAchievements && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 overflow-auto py-8">
          <div className="text-white glass-panel p-8 border-2 border-yellow-500/50 w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-yellow-400">🏆 成就</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-2xl hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 进度 */}
            <div className="mb-6 text-center">
              <div className="text-lg">
                已解锁: {achievementService.getProgress().unlocked} / {achievementService.getProgress().total}
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                  style={{ width: `${(achievementService.getProgress().unlocked / achievementService.getProgress().total) * 100}%` }}
                />
              </div>
            </div>

            {/* 成就列表 */}
            <div className="grid grid-cols-1 gap-3">
              {achievementService.getAllAchievements().map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    achievement.unlocked
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : 'bg-gray-800/50 border-gray-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-3xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex-1">
                      <div className={`font-bold ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {achievement.name}
                      </div>
                      <div className="text-sm text-gray-400">{achievement.description}</div>
                    </div>
                    {achievement.unlocked && (
                      <span className="text-green-400 text-xl">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
