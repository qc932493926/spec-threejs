import type { SealType } from '../types/index.ts';

class NinjaAudioService {
  private context: AudioContext;
  private masterGain: GainNode;
  private bgMusic: HTMLAudioElement | null = null;
  private jutsuSounds: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;

  constructor() {
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.context.destination);

    // 预加载音频文件
    this.preloadAudio();
  }

  // 预加载所有音频文件
  private preloadAudio() {
    // 背景音乐
    this.bgMusic = new Audio('/audio/游戏bgm.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.3;

    // 忍术音效
    const jutsuFiles: Record<SealType, string> = {
      '火印': '/audio/火遁.wav',
      '水印': '/audio/水遁.wav',
      '雷印': '/audio/雷遁.wav',
      '风印': '/audio/风遁.wav',
      '土印': '/audio/土遁.wav'
    };

    // 预加载所有忍术音效
    Object.entries(jutsuFiles).forEach(([seal, file]) => {
      const audio = new Audio(file);
      audio.volume = 0.5;
      this.jutsuSounds.set(seal, audio);
    });

    // 组合技音效
    const comboAudio = new Audio('/audio/火雷爆发.wav');
    comboAudio.volume = 0.6;
    this.jutsuSounds.set('fire_thunder_combo', comboAudio);
  }

  // 播放背景音乐
  playBGMusic() {
    if (this.bgMusic && !this.isMuted) {
      this.bgMusic.play().catch(err => console.log('BGM play failed:', err));
    }
  }

  // 停止背景音乐
  stopBGMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  // 切换静音
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgMusic) {
      this.bgMusic.muted = this.isMuted;
    }
    this.jutsuSounds.forEach(sound => {
      sound.muted = this.isMuted;
    });
  }

  // 播放手印音效（使用真实音频）
  playSealSound(sealType: SealType) {
    if (this.isMuted) return;

    const sound = this.jutsuSounds.get(sealType);
    if (sound) {
      // 克隆音频以支持快速连续播放
      const audio = sound.cloneNode() as HTMLAudioElement;
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Seal sound play failed:', err));
    }
  }

  // 播放忍术释放音效（根据忍术ID播放对应音效）
  playJutsuRelease(jutsuId: string) {
    if (this.isMuted) return;

    const sound = this.jutsuSounds.get(jutsuId);
    if (sound) {
      const audio = sound.cloneNode() as HTMLAudioElement;
      audio.volume = 0.6;
      audio.play().catch(err => console.log('Jutsu sound play failed:', err));
    }
  }

  // 播放命中音效
  playHitSound(comboCount: number) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    // Combo越高，音调越高
    const baseFreq = 400;
    const frequency = baseFreq + (comboCount * 50);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

    gainNode.gain.setValueAtTime(0.5, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.2);
  }

  // 播放爆炸音效
  playExplosion() {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.6, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);
  }

  // 播放查克拉充能音效
  playChakraCharge() {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.5);
  }

  // 播放游戏结束音效
  playGameOver() {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(400, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 1);

    gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 1);
  }

  // 恢复AudioContext（需要用户交互）
  resume() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    // 开始播放背景音乐
    this.playBGMusic();
  }
}

export const audioService = new NinjaAudioService();
