import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import { GameScene } from './components/GameScene';
import { StartScreen } from './components/StartScreen';
import type { GameState } from './types/index.ts';
import { sealEmojis } from './types/index.ts';
import { detectNinjaSeal, getSealType } from './services/gestureService';
import { audioService } from './services/audioService';
import { achievementService, type Achievement } from './services/achievementService';
import { leaderboardService } from './services/leaderboardService';
import './index.css';

// 初始游戏状态常量，避免每次渲染创建新对象
const INITIAL_GAME_STATE: GameState = {
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
};

// 默认设置常量
const DEFAULT_SETTINGS: {
  volume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  quality: 'low' | 'medium' | 'high';
} = {
  volume: 70,
  difficulty: 'normal',
  quality: 'high',
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [achievementNotification, setAchievementNotification] = useState<Achievement | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [lastScore, setLastScore] = useState(0);
  const [lastCombo, setLastCombo] = useState(0);
  const [lastWave, setLastWave] = useState(1);
  const [showWaveAnnounce, setShowWaveAnnounce] = useState(false);
  const lastGestureRef = useRef<string>('None');
  const gestureCooldownRef = useRef<number>(0);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const gameOverProcessedRef = useRef<boolean>(false);
  const prevWaveAnnounceRef = useRef<number>(1);

  // 使用useCallback优化事件处理函数
  const handleGameStateUpdate = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleStart = useCallback(() => {
    audioService.resume();
    setIsReady(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    audioService.toggleMute();
    setIsMuted(prev => !prev);
  }, []);

  const handleClearSeals = useCallback(() => {
    setGameState(prev => ({ ...prev, currentSeals: [] }));
  }, []);

  // 使用useMemo缓存计算结果
  const chakraPercentage = useMemo(() => {
    return (gameState.chakra / gameState.maxChakra) * 100;
  }, [gameState.chakra, gameState.maxChakra]);

  // 缓存难度相关的文本
  const difficultyInfo = useMemo(() => ({
    easy: { label: '🌱 简单', desc: '敌人较弱，适合新手练习' },
    normal: { label: '⚔️ 普通', desc: '标准难度，体验完整游戏' },
    hard: { label: '💀 困难', desc: '敌人强劲，挑战极限' }
  }), []);

  // 缓存画质相关的文本
  const qualityInfo = useMemo(() => ({
    low: { label: '📉 低', desc: '低画质，提升性能' },
    medium: { label: '📊 中', desc: '平衡画质与性能' },
    high: { label: '📈 高', desc: '高画质，最佳视觉体验' }
  }), []);

  // 缓存评价文本
  const scoreEvaluation = useMemo(() => {
    const score = lastScore || gameState.score;
    if (score >= 5000) return '🌟 传说中的忍者！';
    if (score >= 2000) return '⭐ 精英上忍！';
    if (score >= 1000) return '✨ 中忍水平';
    if (score >= 500) return '📝 下忍入门';
    return '💪 继续努力！';
  }, [lastScore, gameState.score]);

  // 波次公告文本
  const waveAnnounceText = useMemo(() => {
    const wave = gameState.wave;
    if (wave <= 3) return '敌人来袭!';
    if (wave <= 5) return '难度提升!';
    if (wave <= 8) return '危机四伏!';
    return '最终决战!';
  }, [gameState.wave]);

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

  // 处理游戏结束状态保存 - 直接在渲染时处理
  if (gameState.isGameOver && !gameOverProcessedRef.current) {
    gameOverProcessedRef.current = true;
    // 使用setTimeout来延迟状态更新，避免渲染期间更新
    setTimeout(() => {
      setLastScore(gameState.score);
      setLastCombo(gameState.combo);
      setLastWave(gameState.wave);
      achievementService.updateStats({
        totalScore: gameState.score,
        maxCombo: gameState.combo,
        maxWave: gameState.wave,
      });
    }, 0);
  }

  // 重置游戏时清理标记
  const handleResetWithClear = useCallback(() => {
    gameOverProcessedRef.current = false;
    prevWaveAnnounceRef.current = 1;
    achievementService.updateStats({ gamesPlayed: 1 });
    setGameState(INITIAL_GAME_STATE);
    setPlayerName('');
    setShowLeaderboard(false);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (showAchievements) {
          setShowAchievements(false);
        } else if (isReady && !gameState.isGameOver) {
          setIsPaused(prev => !prev);
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (gameState.isGameOver || isPaused) {
          handleResetWithClear();
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
  }, [isReady, isPaused, gameState.isGameOver, showSettings, showAchievements, handleToggleMute, handleResetWithClear, handleStart]);

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
    if (gameState.wave > prevWaveAnnounceRef.current && isReady) {
      prevWaveAnnounceRef.current = gameState.wave;

      // 使用setTimeout来延迟设置，避免同步setState警告
      const rafId: number = requestAnimationFrame(() => {
        setShowWaveAnnounce(true);
      });
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => setShowWaveAnnounce(false), 2000);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer);
      };
    }
  }, [gameState.wave, isReady]);

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
              {waveAnnounceText}
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
            onClick={() => setIsPaused(prev => !prev)}
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
              style={{ width: `${chakraPercentage}%` }}
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
            onClick={handleClearSeals}
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

      {/* 开始界面 - v61优化动画 */}
      {!isReady && !showTutorial && (
        <StartScreen
          onStart={handleStart}
          onShowTutorial={() => {
            setShowTutorial(true);
            setTutorialStep(0);
          }}
        />
      )}

      {/* 暂停界面 - v180增强 */}
      {isPaused && !gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-white glass-panel p-8 border-2 border-yellow-500/50 w-[600px] max-w-[95vw]">
            <h1 className="text-5xl font-bold mb-6 text-yellow-400 text-center" style={{ textShadow: '0 0 30px rgba(250, 204, 21, 0.8)' }}>
              ⏸️ 游戏暂停
            </h1>

            {/* v180: 当前游戏统计 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="glass-panel p-3 border border-orange-500/30 text-center">
                <div className="text-2xl font-bold text-orange-400">{gameState.score}</div>
                <div className="text-xs text-gray-400">分数</div>
              </div>
              <div className="glass-panel p-3 border border-blue-500/30 text-center">
                <div className="text-2xl font-bold text-blue-400">{Math.floor(gameState.chakra)}</div>
                <div className="text-xs text-gray-400">查克拉</div>
              </div>
              <div className="glass-panel p-3 border border-yellow-500/30 text-center">
                <div className="text-2xl font-bold text-yellow-400">{gameState.combo}x</div>
                <div className="text-xs text-gray-400">连击</div>
              </div>
              <div className="glass-panel p-3 border border-purple-500/30 text-center">
                <div className="text-2xl font-bold text-purple-400">{gameState.wave}</div>
                <div className="text-xs text-gray-400">波次</div>
              </div>
            </div>

            {/* v180: 快速设置 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">⚙️ 快速设置</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* 音量控制 */}
                <div className="glass-panel p-3 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">🔊 音量</span>
                    <span className="text-sm text-cyan-400">{settings.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume}
                    onChange={(e) => {
                      const vol = parseInt(e.target.value);
                      setSettings({ ...settings, volume: vol });
                      audioService.setMasterVolume(vol / 100);
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* 难度显示 */}
                <div className="glass-panel p-3 border border-cyan-500/30">
                  <div className="text-sm mb-2">🎯 当前难度</div>
                  <div className={`text-lg font-bold ${
                    settings.difficulty === 'easy' ? 'text-green-400' :
                    settings.difficulty === 'normal' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {settings.difficulty === 'easy' ? '🌱 简单' :
                     settings.difficulty === 'normal' ? '⚔️ 普通' : '💀 困难'}
                  </div>
                </div>
              </div>
            </div>

            {/* v180: 存档槽位 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-green-400 mb-3">💾 存档管理</h3>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3, 4].map((slotId) => (
                  <button
                    key={slotId}
                    onClick={() => {
                      // 存档槽位选择功能预留
                      audioService.playUIClick();
                    }}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      slotId === 0 ? 'bg-green-500/30 border-2 border-green-500' : 'bg-gray-700/50 border-2 border-gray-600'
                    } hover:border-green-400`}
                  >
                    <div className="text-sm">槽位 {slotId + 1}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 按钮组 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsPaused(false)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                ▶️ 继续游戏
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  handleResetWithClear();
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                🔄 重新开始
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  setShowSettings(true);
                }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                ⚙️ 详细设置
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  handleResetWithClear();
                  setIsReady(false);
                }}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-lg px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                🏠 返回主菜单
              </button>
            </div>

            {/* 快捷键提示 */}
            <div className="mt-6 text-center text-xs text-gray-500">
              按 ESC 继续 | R 重新开始 | M 静音
            </div>
          </div>
        </div>
      )}

      {/* 游戏结束界面 */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-gray-900/90 to-black/90 flex items-center justify-center z-20">
          <div className="text-center text-white glass-panel p-12 border-2 border-red-500/50 max-w-[600px]">
            <h1 className="text-7xl font-bold mb-6 text-red-500" style={{ textShadow: '0 0 30px rgba(239, 68, 68, 0.8)' }}>
              任务失败
            </h1>
            <p className="text-2xl mb-8 text-gray-300">忍者之路充满坎坷...</p>

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="glass-panel p-4 border border-orange-500/30">
                <div className="text-5xl font-bold text-orange-400">{lastScore || gameState.score}</div>
                <div className="text-sm text-gray-400 mt-2">最终分数</div>
              </div>
              <div className="glass-panel p-4 border border-yellow-500/30">
                <div className="text-5xl font-bold text-yellow-400">{lastCombo || gameState.combo}x</div>
                <div className="text-sm text-gray-400 mt-2">最高连击</div>
              </div>
              <div className="glass-panel p-4 border border-purple-500/30">
                <div className="text-5xl font-bold text-purple-400">{lastWave || gameState.wave}</div>
                <div className="text-sm text-gray-400 mt-2">到达波次</div>
              </div>
            </div>

            {/* 评价 */}
            <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border border-orange-500/30">
              <p className="text-xl">
                {scoreEvaluation}
              </p>
            </div>

            {/* 排行榜输入 */}
            {leaderboardService.isNewRecord(lastScore || gameState.score) && (lastScore || gameState.score) > 0 && !showLeaderboard && (
              <div className="mb-6">
                <p className="text-yellow-400 text-lg mb-2">🎉 新纪录！请输入你的名字</p>
                <div className="flex gap-2 justify-center">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 10))}
                    placeholder="忍者名字"
                    className="px-4 py-2 bg-gray-800 border-2 border-orange-500 rounded-lg text-white text-center focus:outline-none focus:border-yellow-400"
                    maxLength={10}
                  />
                  <button
                    onClick={() => {
                      const name = playerName.trim() || '匿名忍者';
                      leaderboardService.addEntry({
                        name,
                        score: lastScore || gameState.score,
                        wave: lastWave || gameState.wave,
                        combo: lastCombo || gameState.combo,
                      });
                      setShowLeaderboard(true);
                      audioService.playUIClick();
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-all"
                  >
                    提交
                  </button>
                </div>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={handleResetWithClear}
                className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-600 text-white text-xl px-12 py-4 rounded-xl font-bold transition-all transform hover:scale-105 btn-glow border-2 border-orange-400"
              >
                🔄 再战一次
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white text-xl px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                🏆 排行榜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 排行榜面板 */}
      {showLeaderboard && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="text-white glass-panel p-8 border-2 border-yellow-500/50 w-[500px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-yellow-400">🏆 排行榜</h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-2xl hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {leaderboardService.getLeaderboard().length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无记录，快来挑战吧！</p>
            ) : (
              <div className="space-y-2">
                {leaderboardService.getLeaderboard().map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-500/20 border border-yellow-500' :
                      index === 1 ? 'bg-gray-400/20 border border-gray-400' :
                      index === 2 ? 'bg-orange-700/20 border border-orange-700' :
                      'bg-gray-800/50'
                    }`}
                  >
                    <span className={`text-2xl w-10 text-center font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold">{entry.name}</div>
                      <div className="text-sm text-gray-400">
                        波次 {entry.wave} | 连击 {entry.combo}x | {entry.date}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-orange-400">
                      {entry.score}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowLeaderboard(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg font-bold transition-all"
            >
              关闭
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
                    {difficultyInfo[diff].label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {difficultyInfo[settings.difficulty].desc}
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
                    {qualityInfo[qual].label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {qualityInfo[settings.quality].desc}
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
                  setSettings(DEFAULT_SETTINGS);
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

      {/* 教程面板 */}
      {showTutorial && !isReady && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center z-20">
          <div className="text-white glass-panel p-8 border-2 border-cyan-500/50 w-[700px] max-w-[95vw]">
            {/* 进度条 */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-cyan-400">📖 新手教程</h2>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all ${
                      step === tutorialStep ? 'bg-cyan-400 scale-125' :
                      step < tutorialStep ? 'bg-cyan-400/50' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 教程内容 */}
            <div className="min-h-[300px]">
              {tutorialStep === 0 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">👋</div>
                  <h3 className="text-2xl font-bold text-cyan-300 mb-4">欢迎来到火影结印游戏！</h3>
                  <p className="text-gray-300 text-lg mb-4">
                    这是一个使用手势控制的动作游戏。你需要通过摄像头做出不同的手势来释放忍术，消灭敌人！
                  </p>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mt-4">
                    <p className="text-cyan-300">💡 确保你的摄像头已经开启，并且光线充足</p>
                  </div>
                </div>
              )}

              {tutorialStep === 1 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">✋</div>
                  <h3 className="text-2xl font-bold text-orange-300 mb-4">手势基础</h3>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="glass-panel p-4 border border-orange-500/30">
                      <span className="text-3xl">✋</span> 张开手掌 → 火印 🔥
                    </div>
                    <div className="glass-panel p-4 border border-blue-500/30">
                      <span className="text-3xl">✊</span> 握拳 → 水印 💧
                    </div>
                    <div className="glass-panel p-4 border border-cyan-500/30">
                      <span className="text-3xl">☝️</span> 食指向上 → 雷印 ⚡
                    </div>
                    <div className="glass-panel p-4 border border-green-500/30">
                      <span className="text-3xl">👍</span> 拇指向上 → 风印 💨
                    </div>
                    <div className="glass-panel p-4 border border-amber-500/30 col-span-2 text-center">
                      <span className="text-3xl">✌️</span> V字手势 → 土印 🗿
                    </div>
                  </div>
                </div>
              )}

              {tutorialStep === 2 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🔮</div>
                  <h3 className="text-2xl font-bold text-purple-300 mb-4">释放忍术</h3>
                  <p className="text-gray-300 text-lg mb-4">
                    做出手势后，系统会识别并记录你的手印。当手印组合匹配某个忍术时，忍术会自动释放！
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="glass-panel p-3 border border-red-500/30">
                      🔥 单独火印 → 火遁·豪火球 (伤害: 30)
                    </div>
                    <div className="glass-panel p-3 border border-blue-500/30">
                      💧 单独水印 → 水遁·水龙弹 (伤害: 35)
                    </div>
                    <div className="glass-panel p-3 border border-yellow-500/30">
                      🔥+⚡ 组合 → 火遁·龙火 (伤害: 80!)
                    </div>
                    <div className="glass-panel p-3 border border-purple-500/30">
                      更多组合等你探索！
                    </div>
                  </div>
                </div>
              )}

              {tutorialStep === 3 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">⚔️</div>
                  <h3 className="text-2xl font-bold text-red-300 mb-4">战斗技巧</h3>
                  <div className="space-y-4 text-left">
                    <div className="glass-panel p-4 border border-red-500/30">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💙</span>
                        <div>
                          <div className="font-bold">查克拉管理</div>
                          <div className="text-sm text-gray-400">每个忍术消耗查克拉，会自动恢复</div>
                        </div>
                      </div>
                    </div>
                    <div className="glass-panel p-4 border border-yellow-500/30">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔥</span>
                        <div>
                          <div className="font-bold">连击加成</div>
                          <div className="text-sm text-gray-400">连续击杀获得更高分数！10/25/50连击有额外奖励</div>
                        </div>
                      </div>
                    </div>
                    <div className="glass-panel p-4 border border-purple-500/30">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👾</span>
                        <div>
                          <div className="font-bold">敌人类型</div>
                          <div className="text-sm text-gray-400">红色基础、青色快速、绿色坦克 - 不同策略应对</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tutorialStep === 4 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <h3 className="text-2xl font-bold text-green-300 mb-4">准备好了吗？</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    你已经学会了基础操作！现在开始你的忍者之旅吧！
                  </p>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                    <p className="text-green-300 text-lg">🏆 完成成就可以解锁特殊称号！</p>
                    <p className="text-green-300 text-lg">📊 挑战排行榜，成为最强忍者！</p>
                  </div>
                  <button
                    onClick={handleStart}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-2xl px-12 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
                  >
                    🚀 开始游戏！
                  </button>
                </div>
              )}
            </div>

            {/* 导航按钮 */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  tutorialStep === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                  'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                disabled={tutorialStep === 0}
              >
                ← 上一步
              </button>
              {tutorialStep < 4 && (
                <button
                  onClick={() => setTutorialStep(tutorialStep + 1)}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold transition-all"
                >
                  下一步 →
                </button>
              )}
              <button
                onClick={() => setShowTutorial(false)}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-bold transition-all"
              >
                跳过教程
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
