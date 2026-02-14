declare module '@mediapipe/hands' {
  export interface HandsConfig {
    locateFile?: (file: string) => string;
  }

  export interface HandsOptions {
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface Results {
    multiHandLandmarks?: any[][];
    multiHandedness?: any[];
  }

  export class Hands {
    constructor(config?: HandsConfig);
    setOptions(options: HandsOptions): void;
    onResults(callback: (results: Results) => void): void;
    send(inputs: { image: HTMLVideoElement }): Promise<void>;
  }
}

declare module '@mediapipe/camera_utils' {
  export interface CameraConfig {
    onFrame: () => Promise<void>;
    width: number;
    height: number;
  }

  export class Camera {
    constructor(video: HTMLVideoElement, config: CameraConfig);
    start(): void;
    stop(): void;
  }
}
