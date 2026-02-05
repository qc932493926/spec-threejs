import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import { GameScene } from './components/GameScene';
import type { GameState, SealType } from './types/index.ts';
import { sealEmojis } from './types/index.ts';
import { detectNinjaSeal, getSealType } from './services/gestureService';
import { audioService } from './services/audioService';
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
        console.error = (...args: any[]) => {
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

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* 3D游戏场景 */}
      <GameScene
        gameState={gameState}
        onGameStateUpdate={handleGameStateUpdate}
        onJutsuReady={() => {}}
      />

      {/* 左上角查克拉和Combo */}
      <div className="absolute top-8 left-8 text-white z-10">
        {/* 静音控制按钮 */}
        <button
          onClick={handleToggleMute}
          className="mb-4 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 border-2 border-gray-600 rounded-lg transition-colors flex items-center gap-2"
          title={isMuted ? "开启音效" : "关闭音效"}
        >
          <span className="text-2xl">{isMuted ? "🔇" : "🔊"}</span>
          <span className="text-sm">{isMuted ? "已静音" : "音效开启"}</span>
        </button>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-bold">查克拉:</span>
          <div className="w-48 h-6 bg-gray-800 border-2 border-blue-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${(gameState.chakra / gameState.maxChakra) * 100}%` }}
            />
          </div>
          <span className="text-xl">{Math.floor(gameState.chakra)}</span>
        </div>

        {/* 分数 */}
        <div className="text-3xl font-bold mb-2">
          分数: {gameState.score}
        </div>

        {/* Combo */}
        {gameState.combo > 1 && (
          <div className="text-5xl text-yellow-400 animate-pulse font-bold">
            {gameState.combo}x COMBO!
          </div>
        )}
      </div>

      {/* 右上角当前手印序列 */}
      <div className="absolute top-8 right-8 text-white z-10">
        <div className="text-xl mb-2">当前手印:</div>
        <div className="flex gap-2">
          {gameState.currentSeals.length === 0 ? (
            <div className="text-gray-400 text-sm">等待结印...</div>
          ) : (
            gameState.currentSeals.map((seal, i) => (
              <div
                key={i}
                className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl border-2 border-yellow-400 shadow-lg"
              >
                {sealEmojis[seal]}
              </div>
            ))
          )}
        </div>
        {gameState.currentSeals.length > 0 && (
          <button
            onClick={() => setGameState(prev => ({ ...prev, currentSeals: [] }))}
            className="mt-2 text-sm text-red-400 hover:text-red-300"
          >
            清除手印
          </button>
        )}
      </div>

      {/* 右下角摄像头（PIP） */}
      <div className="absolute bottom-8 right-8 w-80 h-60 border-4 border-orange-500 shadow-lg shadow-orange-500/50 rounded-lg overflow-hidden z-10">
        <div className="relative w-full h-full">
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
          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
            摄像头视图
          </div>
        </div>
      </div>

      {/* 底部技能提示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center z-10">
        <div className="bg-black/70 px-8 py-4 rounded-lg border-2 border-orange-500">
          <div className="text-sm text-gray-400 mb-2">组合提示</div>
          <div className="flex gap-4 text-base">
            <div>🔥 = 火球</div>
            <div>💧 = 水龙</div>
            <div>⚡ = 雷切</div>
            <div>💨 = 风刃</div>
            <div>🗿 = 土墙</div>
          </div>
          <div className="text-xs text-yellow-400 mt-2">
            🔥 + ⚡ = 火雷爆发!
          </div>
        </div>
      </div>

      {/* 开始界面 */}
      {!isReady && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
          <div className="text-center text-white max-w-5xl px-8">
            <h1 className="text-7xl font-bold mb-12 text-orange-500">火影结印游戏</h1>
            <p className="text-3xl mb-12">使用手势施放忍术，消灭敌人!</p>

            <button
              onClick={handleStart}
              className="bg-orange-500 hover:bg-orange-600 text-white text-3xl px-16 py-6 rounded-lg font-bold mb-12 transition-all transform hover:scale-105"
            >
              开始游戏
            </button>

            <div className="grid grid-cols-2 gap-12 text-left">
              {/* 手势说明 */}
              <div className="bg-gray-800/50 p-8 rounded-lg border-2 border-blue-500">
                <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">手势说明</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">✋</span>
                    <span className="text-2xl">张开手掌 = 火印 🔥</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">✊</span>
                    <span className="text-2xl">握拳 = 水印 💧</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">☝️</span>
                    <span className="text-2xl">食指向上 = 雷印 ⚡</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">👍</span>
                    <span className="text-2xl">拇指向上 = 风印 💨</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">✌️</span>
                    <span className="text-2xl">V字手势 = 土印 🗿</span>
                  </div>
                </div>
              </div>

              {/* 技能说明 */}
              <div className="bg-gray-800/50 p-8 rounded-lg border-2 border-purple-500">
                <h2 className="text-3xl font-bold mb-6 text-purple-400 text-center">技能释放</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">🔥</span>
                    <span className="text-2xl">火遁·豪火球之术</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">💧</span>
                    <span className="text-2xl">水遁·水龙弹之术</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">⚡</span>
                    <span className="text-2xl">雷遁·千鸟</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">💨</span>
                    <span className="text-2xl">风遁·螺旋手里剑</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-6xl">🗿</span>
                    <span className="text-2xl">土遁·土流壁</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-yellow-400 text-xl">
              <p>💡 提示: 组合不同手印可以释放更强大的忍术!</p>
            </div>
          </div>
        </div>
      )}

      {/* 游戏结束界面 */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4">游戏结束</h1>
            <p className="text-4xl mb-8">最终分数: {gameState.score}</p>
            <p className="text-2xl mb-8">最高连击: {gameState.combo}x</p>
            <button
              onClick={handleReset}
              className="bg-orange-500 hover:bg-orange-600 text-white text-2xl px-12 py-4 rounded-lg font-bold"
            >
              重新开始
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
