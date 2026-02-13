/* eslint-disable @typescript-eslint/no-unused-vars */
import type { SealType } from '../types/index.ts';

// 环境音效类型
export type EnvironmentType = 'forest' | 'village' | 'battlefield' | 'mountain' | 'night';

// 天气音效类型
export type WeatherType = 'clear' | 'rain' | 'thunder' | 'wind' | 'snow';

// 音频类别音量配置
interface VolumeConfig {
  master: number;
  bgm: number;
  sfx: number;
  environment: number;
  ui: number;
}

// 战斗紧张度等级
export type BattleIntensity = 'calm' | 'low' | 'medium' | 'high' | 'critical';

class NinjaAudioService {
  private context: AudioContext;
  private masterGain: GainNode;
  private bgMusic: HTMLAudioElement | null = null;
  private jutsuSounds: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;

  // v171: 环境音效系统
  private environmentGain: GainNode;
  private currentEnvironment: EnvironmentType = 'forest';
  private environmentNodes: OscillatorNode[] = [];
  private environmentInterval: ReturnType<typeof setInterval> | null = null;

  // v172: 战场氛围系统
  private battleIntensity: BattleIntensity = 'calm';
  private battleGain: GainNode;
  private battleNodes: OscillatorNode[] = [];
  private battleInterval: ReturnType<typeof setInterval> | null = null;
  // 用于未来功能的变量
  public readonly lastBattleUpdateTime: number = 0;

  // v174: 天气音效系统
  public readonly currentWeather: WeatherType = 'clear';
  private weatherGain: GainNode;
  public readonly weatherNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  public readonly weatherInterval: ReturnType<typeof setInterval> | null = null;

  // 音量配置
  private volumeConfig: VolumeConfig = {
    master: 0.3,
    bgm: 0.3,
    sfx: 0.5,
    environment: 0.15,
    ui: 0.2
  };

  constructor() {
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.volumeConfig.master;
    this.masterGain.connect(this.context.destination);

    // 环境音效增益节点
    this.environmentGain = this.context.createGain();
    this.environmentGain.gain.value = this.volumeConfig.environment;
    this.environmentGain.connect(this.masterGain);

    // 战场氛围增益节点
    this.battleGain = this.context.createGain();
    this.battleGain.gain.value = 0;
    this.battleGain.connect(this.masterGain);

    // 天气音效增益节点
    this.weatherGain = this.context.createGain();
    this.weatherGain.gain.value = 0;
    this.weatherGain.connect(this.masterGain);

    // 预加载音频文件
    this.preloadAudio();
  }

  // 预加载所有音频文件
  private preloadAudio() {
    // 背景音乐
    this.bgMusic = new Audio('/audio/游戏bgm.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.volumeConfig.bgm;

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
      audio.volume = this.volumeConfig.sfx;
      this.jutsuSounds.set(seal, audio);
    });

    // 组合技音效
    const comboAudio = new Audio('/audio/火雷爆发.wav');
    comboAudio.volume = 0.6;
    this.jutsuSounds.set('fire_thunder_combo', comboAudio);
  }

  // ==================== 环境音效系统 (v171) ====================

  // 播放环境音效（使用Web Audio API合成）
  startEnvironmentSound(environment: EnvironmentType) {
    if (this.isMuted) return;

    this.currentEnvironment = environment;
    this.stopEnvironmentSound();

    // 根据环境类型生成不同的背景音效
    switch (environment) {
      case 'forest':
        this.playForestAmbience();
        break;
      case 'village':
        this.playVillageAmbience();
        break;
      case 'battlefield':
        this.playBattlefieldAmbience();
        break;
      case 'mountain':
        this.playMountainAmbience();
        break;
      case 'night':
        this.playNightAmbience();
        break;
    }
  }

  // 森林环境音 - 鸟鸣和风声
  private playForestAmbience() {
    // 低频风声背景
    this.createDroneSound(80, 'sine', 0.08);

    // 随机鸟鸣效果
    this.environmentInterval = setInterval(() => {
      if (this.isMuted || this.currentEnvironment !== 'forest') return;
      if (Math.random() > 0.7) {
        this.playBirdChirp();
      }
    }, 2000);
  }

  // 村庄环境音 - 宁静和谐
  private playVillageAmbience() {
    // 温暖的和弦背景
    this.createDroneSound(130, 'sine', 0.06);
    this.createDroneSound(196, 'sine', 0.04);

    // 偶尔的钟声
    this.environmentInterval = setInterval(() => {
      if (this.isMuted || this.currentEnvironment !== 'village') return;
      if (Math.random() > 0.8) {
        this.playVillageBell();
      }
    }, 5000);
  }

  // 战场环境音 - 紧张激烈
  private playBattlefieldAmbience() {
    // 低沉的战鼓节奏
    this.createDroneSound(60, 'sawtooth', 0.05);

    // 战鼓节拍
    this.environmentInterval = setInterval(() => {
      if (this.isMuted || this.currentEnvironment !== 'battlefield') return;
      this.playWarDrum();
    }, 1500);
  }

  // 山岳环境音 - 空旷回响
  private playMountainAmbience() {
    // 风声呼啸
    this.createDroneSound(100, 'triangle', 0.07);

    // 回声效果
    this.environmentInterval = setInterval(() => {
      if (this.isMuted || this.currentEnvironment !== 'mountain') return;
      if (Math.random() > 0.85) {
        this.playMountainEcho();
      }
    }, 4000);
  }

  // 夜晚环境音 - 虫鸣神秘
  private playNightAmbience() {
    // 低沉神秘的背景
    this.createDroneSound(55, 'sine', 0.05);

    // 虫鸣效果
    this.environmentInterval = setInterval(() => {
      if (this.isMuted || this.currentEnvironment !== 'night') return;
      this.playCricketSound();
    }, 800);
  }

  // 创建持续的低频背景音
  private createDroneSound(frequency: number, type: OscillatorType, volume: number) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

    // 添加轻微的频率波动
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.setValueAtTime(0.2, this.context.currentTime);
    lfoGain.gain.setValueAtTime(frequency * 0.02, this.context.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 4, this.context.currentTime);

    gainNode.gain.setValueAtTime(volume, this.context.currentTime);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.environmentGain);

    oscillator.start();
    this.environmentNodes.push(oscillator, lfo);
  }

  // 鸟鸣音效
  private playBirdChirp() {
    const baseFreq = 1500 + Math.random() * 1000;
    const duration = 0.1 + Math.random() * 0.15;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(baseFreq, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, this.context.currentTime + duration * 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, this.context.currentTime + duration);

    gainNode.gain.setValueAtTime(0.03, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.environmentGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  // 村庄钟声
  private playVillageBell() {
    const frequencies = [523, 659, 784]; // C major chord

    frequencies.forEach((freq, index) => {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context.currentTime);

      const startTime = this.context.currentTime + index * 0.02;
      gainNode.gain.setValueAtTime(0.04, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 2);

      oscillator.connect(gainNode);
      gainNode.connect(this.environmentGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 2);
    });
  }

  // 战鼓音效
  private playWarDrum() {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(80, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.context.currentTime);

    gainNode.gain.setValueAtTime(0.08, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.environmentGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);
  }

  // 山岳回声
  private playMountainEcho() {
    const freq = 300 + Math.random() * 200;

    for (let i = 0; i < 3; i++) {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context.currentTime);

      const delay = i * 0.3;
      const volume = 0.04 / (i + 1);

      gainNode.gain.setValueAtTime(volume, this.context.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(this.environmentGain);

      oscillator.start(this.context.currentTime + delay);
      oscillator.stop(this.context.currentTime + delay + 0.5);
    }
  }

  // 虫鸣音效
  private playCricketSound() {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    // 高频颤动
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(4000, this.context.currentTime);

    // 调制频率
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.setValueAtTime(15, this.context.currentTime);
    lfoGain.gain.setValueAtTime(500, this.context.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start();

    gainNode.gain.setValueAtTime(0.015, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.environmentGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
    lfo.stop(this.context.currentTime + 0.1);
  }

  // 停止环境音效
  stopEnvironmentSound() {
    if (this.environmentInterval) {
      clearInterval(this.environmentInterval);
      this.environmentInterval = null;
    }

    this.environmentNodes.forEach(node => {
      try {
        node.stop();
      } catch {
        // 忽略已停止的节点
      }
    });
    this.environmentNodes = [];
  }

  // 设置环境音量
  setEnvironmentVolume(volume: number) {
    this.volumeConfig.environment = Math.max(0, Math.min(1, volume));
    this.environmentGain.gain.setValueAtTime(this.volumeConfig.environment, this.context.currentTime);
  }

  // ==================== 战场氛围系统 (v172) ====================

  // 更新战斗紧张度（根据敌人数量、波次、血量等动态调整）
  updateBattleIntensity(enemyCount: number, wave: number, playerHealth: number) {
    // 计算紧张度分数
    let score = 0;

    // 敌人数量影响
    score += Math.min(enemyCount * 10, 30);

    // 波次影响
    score += Math.min(wave * 3, 30);

    // 玩家血量影响（低血量增加紧张感）
    if (playerHealth < 30) {
      score += 40;
    } else if (playerHealth < 60) {
      score += 20;
    }

    // 确定紧张度等级
    const newIntensity: BattleIntensity =
      score >= 80 ? 'critical' :
      score >= 60 ? 'high' :
      score >= 40 ? 'medium' :
      score >= 20 ? 'low' : 'calm';

    // 只在紧张度变化时更新
    if (newIntensity !== this.battleIntensity) {
      this.setBattleIntensity(newIntensity);
    }
  }

  // 设置战斗紧张度等级
  setBattleIntensity(intensity: BattleIntensity) {
    if (this.isMuted) return;

    this.battleIntensity = intensity;
    this.stopBattleAmbience();

    // 根据紧张度设置不同的音效
    switch (intensity) {
      case 'calm':
        // 平静 - 非常轻柔的背景
        this.battleGain.gain.setValueAtTime(0, this.context.currentTime);
        break;
      case 'low':
        // 低紧张度 - 轻微的心跳感
        this.startLowTensionAmbience();
        break;
      case 'medium':
        // 中等紧张度 - 加速的心跳和呼吸
        this.startMediumTensionAmbience();
        break;
      case 'high':
        // 高紧张度 - 快速心跳、警报感
        this.startHighTensionAmbience();
        break;
      case 'critical':
        // 危急 - 极度紧张的警报音
        this.startCriticalTensionAmbience();
        break;
    }
  }

  // 低紧张度氛围
  private startLowTensionAmbience() {
    // 平滑过渡音量
    this.battleGain.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.5);

    // 缓慢的心跳节奏 (每秒1次)
    this.battleInterval = setInterval(() => {
      if (this.isMuted) return;
      this.playHeartbeat(0.08, 1);
    }, 1000);
  }

  // 中等紧张度氛围
  private startMediumTensionAmbience() {
    this.battleGain.gain.linearRampToValueAtTime(0.15, this.context.currentTime + 0.5);

    // 加速的心跳 (每0.7秒1次)
    this.battleInterval = setInterval(() => {
      if (this.isMuted) return;
      this.playHeartbeat(0.12, 1.2);
    }, 700);

    // 添加低频紧张背景
    this.createTensionDrone(50, 0.05);
  }

  // 高紧张度氛围
  private startHighTensionAmbience() {
    this.battleGain.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.3);

    // 快速心跳 (每0.5秒1次)
    this.battleInterval = setInterval(() => {
      if (this.isMuted) return;
      this.playHeartbeat(0.15, 1.4);
    }, 500);

    // 紧张背景
    this.createTensionDrone(60, 0.08);

    // 偶尔的警报音
    const alertInterval = setInterval(() => {
      if (this.battleIntensity !== 'high' || this.isMuted) {
        clearInterval(alertInterval);
        return;
      }
      this.playAlertBeep(800, 0.05);
    }, 3000);
  }

  // 危急紧张度氛围
  private startCriticalTensionAmbience() {
    this.battleGain.gain.linearRampToValueAtTime(0.25, this.context.currentTime + 0.2);

    // 极速心跳 (每0.35秒1次)
    this.battleInterval = setInterval(() => {
      if (this.isMuted) return;
      this.playHeartbeat(0.18, 1.6);
    }, 350);

    // 强烈紧张背景
    this.createTensionDrone(70, 0.1);

    // 频繁警报音
    const alertInterval = setInterval(() => {
      if (this.battleIntensity !== 'critical' || this.isMuted) {
        clearInterval(alertInterval);
        return;
      }
      this.playAlertBeep(1000, 0.08);
    }, 1500);
  }

  // 播放心跳音效
  private playHeartbeat(volume: number, intensity: number) {
    // 心跳的双重音 (lub-dub)
    const times = [0, 0.12];

    times.forEach((delay, index) => {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      oscillator.type = 'sine';
      // lub (低音) 和 dub (稍高音)
      oscillator.frequency.setValueAtTime(40 + index * 10, this.context.currentTime + delay);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, this.context.currentTime + delay);

      const vol = volume * (index === 0 ? 1 : 0.6);
      gainNode.gain.setValueAtTime(0, this.context.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(vol * intensity, this.context.currentTime + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + 0.15);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.battleGain);

      oscillator.start(this.context.currentTime + delay);
      oscillator.stop(this.context.currentTime + delay + 0.15);
    });
  }

  // 创建紧张背景音
  private createTensionDrone(frequency: number, volume: number) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

    // 频率调制制造紧张感
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.setValueAtTime(0.5, this.context.currentTime);
    lfoGain.gain.setValueAtTime(frequency * 0.1, this.context.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3, this.context.currentTime);

    gainNode.gain.setValueAtTime(volume, this.context.currentTime);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.battleGain);

    oscillator.start();
    this.battleNodes.push(oscillator, lfo);
  }

  // 播放警报音
  private playAlertBeep(frequency: number, volume: number) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.battleGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.15);
  }

  // 停止战场氛围
  stopBattleAmbience() {
    if (this.battleInterval) {
      clearInterval(this.battleInterval);
      this.battleInterval = null;
    }

    this.battleNodes.forEach(node => {
      try {
        node.stop();
      } catch {
        // 忽略已停止的节点
      }
    });
    this.battleNodes = [];

    // 平滑降低音量
    this.battleGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);
  }

  // 获取当前战斗紧张度
  getBattleIntensity(): BattleIntensity {
    return this.battleIntensity;
  }

  // ==================== 忍术释放环境响应 (v173) ====================

  // 播放忍术释放时的环境共鸣音效
  playJutsuEnvironmentResonance(sealType: SealType, power: number = 1) {
    if (this.isMuted) return;

    // 根据忍术类型触发不同的环境响应
    switch (sealType) {
      case '火印':
        this.playFireResonance(power);
        break;
      case '水印':
        this.playWaterResonance(power);
        break;
      case '雷印':
        this.playThunderResonance(power);
        break;
      case '风印':
        this.playWindResonance(power);
        break;
      case '土印':
        this.playEarthResonance(power);
        break;
    }
  }

  // 火遁共鸣 - 火焰燃烧和热量扩散
  private playFireResonance(power: number) {
    // 火焰燃烧的噼啪声
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.05;
      const freq = 200 + Math.random() * 100;

      const noise = this.createNoiseBuffer(0.1);
      const source = this.context.createBufferSource();
      source.buffer = noise;

      const filter = this.context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, this.context.currentTime + delay);
      filter.Q.setValueAtTime(5, this.context.currentTime + delay);

      const gainNode = this.context.createGain();
      gainNode.gain.setValueAtTime(0.15 * power, this.context.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + 0.1);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      source.start(this.context.currentTime + delay);
    }

    // 热量波动的低频
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(80, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.1 * power, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);
  }

  // 水遁共鸣 - 水流和涟漪声
  private playWaterResonance(power: number) {
    // 水流声
    const noise = this.createNoiseBuffer(0.3);
    const source = this.context.createBufferSource();
    source.buffer = noise;

    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.context.currentTime);
    filter.Q.setValueAtTime(2, this.context.currentTime);

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(0.08 * power, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15 * power, this.context.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(this.context.currentTime);

    // 涟漪音效
    for (let i = 0; i < 4; i++) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();

      oscillator.type = 'sine';
      const baseFreq = 300 + i * 100;
      oscillator.frequency.setValueAtTime(baseFreq, this.context.currentTime + i * 0.05);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, this.context.currentTime + i * 0.05 + 0.2);

      gain.gain.setValueAtTime(0.05 * power, this.context.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + i * 0.05 + 0.2);

      oscillator.connect(gain);
      gain.connect(this.masterGain);

      oscillator.start(this.context.currentTime + i * 0.05);
      oscillator.stop(this.context.currentTime + i * 0.05 + 0.2);
    }
  }

  // 雷遁共鸣 - 电弧和雷鸣
  private playThunderResonance(power: number) {
    // 电弧噼啪声
    for (let i = 0; i < 5; i++) {
      const delay = Math.random() * 0.15;
      const freq = 1000 + Math.random() * 2000;

      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(freq, this.context.currentTime + delay);

      gainNode.gain.setValueAtTime(0.1 * power, this.context.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + 0.03);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(this.context.currentTime + delay);
      oscillator.stop(this.context.currentTime + delay + 0.03);
    }

    // 低频雷鸣
    const thunder = this.context.createOscillator();
    const thunderGain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    thunder.type = 'sawtooth';
    thunder.frequency.setValueAtTime(60, this.context.currentTime);
    thunder.frequency.exponentialRampToValueAtTime(30, this.context.currentTime + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, this.context.currentTime);

    thunderGain.gain.setValueAtTime(0.15 * power, this.context.currentTime);
    thunderGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);

    thunder.connect(filter);
    filter.connect(thunderGain);
    thunderGain.connect(this.masterGain);

    thunder.start(this.context.currentTime);
    thunder.stop(this.context.currentTime + 0.4);
  }

  // 风遁共鸣 - 呼啸和涡流
  private playWindResonance(power: number) {
    // 风声
    const noise = this.createNoiseBuffer(0.5);
    const source = this.context.createBufferSource();
    source.buffer = noise;

    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.context.currentTime);
    filter.frequency.linearRampToValueAtTime(1200, this.context.currentTime + 0.2);
    filter.frequency.linearRampToValueAtTime(300, this.context.currentTime + 0.4);
    filter.Q.setValueAtTime(3, this.context.currentTime);

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12 * power, this.context.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(this.context.currentTime);

    // 尖锐的呼啸
    const whistle = this.context.createOscillator();
    const whistleGain = this.context.createGain();

    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(600, this.context.currentTime);
    whistle.frequency.exponentialRampToValueAtTime(900, this.context.currentTime + 0.2);

    whistleGain.gain.setValueAtTime(0.06 * power, this.context.currentTime);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);

    whistle.connect(whistleGain);
    whistleGain.connect(this.masterGain);

    whistle.start(this.context.currentTime);
    whistle.stop(this.context.currentTime + 0.2);
  }

  // 土遁共鸣 - 岩石崩裂和地震
  private playEarthResonance(power: number) {
    // 低沉的地震声
    const rumble = this.context.createOscillator();
    const rumbleGain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(40, this.context.currentTime);
    rumble.frequency.exponentialRampToValueAtTime(25, this.context.currentTime + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, this.context.currentTime);

    rumbleGain.gain.setValueAtTime(0.2 * power, this.context.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);

    rumble.connect(filter);
    filter.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);

    rumble.start(this.context.currentTime);
    rumble.stop(this.context.currentTime + 0.5);

    // 岩石碎裂声
    for (let i = 0; i < 4; i++) {
      const delay = 0.1 + i * 0.08;

      const noise = this.createNoiseBuffer(0.05);
      const source = this.context.createBufferSource();
      source.buffer = noise;

      const crackFilter = this.context.createBiquadFilter();
      crackFilter.type = 'highpass';
      crackFilter.frequency.setValueAtTime(500, this.context.currentTime + delay);

      const crackGain = this.context.createGain();
      crackGain.gain.setValueAtTime(0.1 * power, this.context.currentTime + delay);
      crackGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + 0.05);

      source.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(this.masterGain);

      source.start(this.context.currentTime + delay);
    }
  }

  // 创建噪声缓冲区
  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  // 播放忍术冲击波音效
  playShockwave(intensity: number = 1) {
    if (this.isMuted) return;

    // 冲击波的低频
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(100, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, this.context.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3 * intensity, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);

    // 高频冲击
    const noise = this.createNoiseBuffer(0.15);
    const source = this.context.createBufferSource();
    source.buffer = noise;

    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, this.context.currentTime);

    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.15 * intensity, this.context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    source.start(this.context.currentTime);
  }

  // ==================== 基础音效系统 ====================

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

    if (this.isMuted) {
      this.stopEnvironmentSound();
    }
  }

  // 获取静音状态
  getMuted(): boolean {
    return this.isMuted;
  }

  // 设置主音量
  setMasterVolume(volume: number) {
    this.volumeConfig.master = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setValueAtTime(this.volumeConfig.master, this.context.currentTime);
  }

  // 获取音量配置
  getVolumeConfig(): VolumeConfig {
    return { ...this.volumeConfig };
  }

  // 播放手印音效（使用真实音频）
  playSealSound(sealType: SealType) {
    if (this.isMuted) return;

    const sound = this.jutsuSounds.get(sealType);
    if (sound) {
      // 克隆音频以支持快速连续播放
      const audio = sound.cloneNode() as HTMLAudioElement;
      audio.volume = this.volumeConfig.sfx;
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
    if (this.isMuted) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    // Combo越高，音调越高，最大限制
    const baseFreq = 400;
    const frequency = Math.min(baseFreq + (comboCount * 50), 1200);

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
    if (this.isMuted) return;

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

  // 播放连击里程碑音效（10/25/50连击）
  playComboMilestone(comboCount: number) {
    if (this.isMuted) return;

    // 根据里程碑等级播放不同的音效
    const milestoneLevel = comboCount >= 50 ? 3 : comboCount >= 25 ? 2 : 1;

    // 播放多个音符形成和弦
    const frequencies = milestoneLevel === 3
      ? [523, 659, 784, 1047]  // C major 7 (50连击)
      : milestoneLevel === 2
      ? [523, 659, 784]        // C major (25连击)
      : [523, 659];            // 完美五度 (10连击)

    frequencies.forEach((freq, index) => {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context.currentTime);

      // 依次播放，形成琶音效果
      const startTime = this.context.currentTime + index * 0.08;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4 / frequencies.length, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }

  // 播放波次提升音效
  playWaveUp(wave: number) {
    if (this.isMuted) return;

    // 波次越高，音效越复杂
    const noteCount = Math.min(3 + Math.floor(wave / 5), 6);

    for (let i = 0; i < noteCount; i++) {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      // 上行音阶
      const baseFreq = 330;
      const freq = baseFreq * Math.pow(1.122, i);  // 大二度递增

      oscillator.type = i === noteCount - 1 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context.currentTime);

      const startTime = this.context.currentTime + i * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3 / noteCount, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    }
  }

  // 播放敌人击杀音效（根据敌人类型）
  playEnemyKill(enemyType: 'basic' | 'fast' | 'tank') {
    if (this.isMuted) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    // 不同敌人类型不同音色
    switch (enemyType) {
      case 'fast':
        // 快速敌人 - 高音短促
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.15);
        break;

      case 'tank':
        // 坦克敌人 - 低音浑厚
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(100, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.5, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.4);
        break;

      default:
        // 基础敌人 - 使用默认爆炸音效
        this.playExplosion();
        return;
    }

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
  }

  // 播放查克拉充能音效
  playChakraCharge() {
    if (this.isMuted) return;

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
    if (this.isMuted) return;

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

  // 播放UI点击音效
  playUIClick() {
    if (this.isMuted) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, this.context.currentTime);

    gainNode.gain.setValueAtTime(this.volumeConfig.ui, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.05);
  }

  // 恢复AudioContext（需要用户交互）
  resume() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    // 开始播放背景音乐
    this.playBGMusic();
  }

  // 清理资源
  dispose() {
    this.stopEnvironmentSound();
    this.stopBattleAmbience();
    this.stopBGMusic();
    this.context.close();
  }
}

export const audioService = new NinjaAudioService();
