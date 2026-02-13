import { VERSION } from '../version.ts';

interface StartScreenProps {
  onStart: () => void;
  onShowTutorial: () => void;
}

// 预生成粒子位置以避免每次渲染随机变化
const PARTICLES = [...Array(20)].map((_, i) => ({
  left: `${(i * 5) % 100}%`,
  width: `${(i % 4) + 2}px`,
  height: `${(i % 4) + 2}px`,
  background: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#eab308' : '#3b82f6',
  duration: `${10 + (i % 10)}s`,
  delay: `${i % 10}s`,
}));

export function StartScreen({ onStart, onShowTutorial }: StartScreenProps) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center z-20 overflow-hidden">
      {/* 粒子背景 - v61 */}
      <div className="absolute inset-0 pointer-events-none">
        {PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: particle.left,
              width: particle.width,
              height: particle.height,
              background: particle.background,
              borderRadius: '50%',
              animationDuration: particle.duration,
              animationDelay: particle.delay,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      <div className="text-center text-white max-w-5xl px-8 relative z-10">
        <h1 className="text-7xl font-bold mb-6 title-shine title-entrance glow-pulse">火影结印游戏</h1>
        <p className="text-2xl mb-4 text-gray-300 subtitle-entrance">Naruto Seal Game</p>
        <p className="text-3xl mb-12 text-orange-300 subtitle-entrance" style={{ animationDelay: '0.5s' }}>使用手势施放忍术，消灭敌人!</p>

        <div className="flex gap-4 justify-center mb-12">
          <button
            onClick={onStart}
            className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-600 text-white text-3xl px-16 py-6 rounded-xl font-bold transition-all transform hover:scale-110 btn-glow border-2 border-orange-400 button-entrance button-entrance-delay-1 floating-pulse"
          >
            🎮 开始游戏
          </button>
          <button
            onClick={onShowTutorial}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-2xl px-12 py-6 rounded-xl font-bold transition-all transform hover:scale-105 border-2 border-blue-400 button-entrance button-entrance-delay-2"
          >
            📖 新手教程
          </button>
        </div>

        <div className="grid grid-cols-2 gap-12 text-left">
          {/* 手势说明 */}
          <div className="glass-panel p-8 border-2 border-blue-500/50 hover:border-blue-400 transition-colors card-entrance card-float" style={{ animationDelay: '0.8s' }}>
            <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">手势说明</h2>
            <div className="space-y-4">
              {[
                { icon: '✋', text: '张开手掌 = 火印 🔥', delay: '1s' },
                { icon: '✊', text: '握拳 = 水印 💧', delay: '1.1s' },
                { icon: '☝️', text: '食指向上 = 雷印 ⚡', delay: '1.2s' },
                { icon: '👍', text: '拇指向上 = 风印 💨', delay: '1.3s' },
                { icon: '✌️', text: 'V字手势 = 土印 🗿', delay: '1.4s' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors gesture-icon-entrance" style={{ animationDelay: item.delay }}>
                  <span className="text-5xl">{item.icon}</span>
                  <span className="text-xl">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 技能说明 */}
          <div className="glass-panel p-8 border-2 border-purple-500/50 hover:border-purple-400 transition-colors card-entrance card-entrance-right card-float" style={{ animationDelay: '0.9s' }}>
            <h2 className="text-3xl font-bold mb-6 text-purple-400 text-center">技能释放</h2>
            <div className="space-y-4">
              {[
                { icon: '🔥', name: '火遁·豪火球之术', damage: '30', delay: '1.1s' },
                { icon: '💧', name: '水遁·水龙弹之术', damage: '35', delay: '1.2s' },
                { icon: '⚡', name: '雷遁·千鸟', damage: '50', delay: '1.3s' },
                { icon: '💨', name: '风遁·螺旋手里剑', damage: '25', delay: '1.4s' },
                { icon: '🗿', name: '土遁·土流壁', damage: '防御', delay: '1.5s' },
              ].map((skill, i) => (
                <div key={i} className="flex items-center gap-6 p-2 rounded-lg hover:bg-white/5 transition-colors skill-bounce" style={{ animationDelay: skill.delay }}>
                  <span className="text-5xl">{skill.icon}</span>
                  <div>
                    <span className="text-xl">{skill.name}</span>
                    <span className="text-sm text-gray-400 ml-2">伤害: {skill.damage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-yellow-400 text-xl glass-panel inline-block px-6 py-3 tip-blink subtitle-entrance" style={{ animationDelay: '1.6s' }}>
          <p>💡 提示: 组合不同手印可以释放更强大的忍术!</p>
          <p className="text-orange-300 text-lg mt-1">🔥 + ⚡ = 火雷爆发 (伤害: 80)</p>
        </div>

        {/* 版本信息 */}
        <div className="mt-6 text-gray-500 text-sm subtitle-entrance" style={{ animationDelay: '1.8s' }}>
          Version {VERSION} | Made with ❤️
        </div>
      </div>
    </div>
  );
}
