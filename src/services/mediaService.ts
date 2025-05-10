// PsyTrack Media Service
// This service handles webcam and microphone access for real-time analysis

// Types for media streams and processing
export interface MediaStreamInfo {
  stream: MediaStream;
  active: boolean;
  deviceId: string;
}

export interface VideoFrame {
  imageData: ImageData;
  timestamp: number;
}

export interface AudioChunk {
  audioData: Float32Array;
  timestamp: number;
}

// Callbacks for media processing
type VideoFrameCallback = (frame: VideoFrame) => void;
type AudioChunkCallback = (chunk: AudioChunk) => void;
type MediaErrorCallback = (error: Error) => void;

class MediaService {
  private static instance: MediaService;

  // Media streams
  private videoStream: MediaStreamInfo | null = null;
  private audioStream: MediaStreamInfo | null = null;

  // Processing elements
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;

  // Processing state
  private isProcessingVideo: boolean = false;
  private isProcessingAudio: boolean = false;
  private videoFrameRate: number = 5; // frames per second
  private audioSampleRate: number = 4; // samples per second

  // Callbacks
  private videoFrameCallbacks: VideoFrameCallback[] = [];
  private audioChunkCallbacks: AudioChunkCallback[] = [];
  private errorCallbacks: MediaErrorCallback[] = [];

  private constructor() {
    // Create hidden video and canvas elements for processing
    this.createVideoElement();
    this.createCanvasElement();

    console.log('Media Service initialized');
  }

  // Get the singleton instance
  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // Create a hidden video element for webcam feed
  private createVideoElement(): void {
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('playsinline', 'true');
    this.videoElement.setAttribute('autoplay', 'true');
    this.videoElement.setAttribute('muted', 'true');
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.top = '-9999px';
    this.videoElement.style.left = '-9999px';
    document.body.appendChild(this.videoElement);
  }

  // Create a hidden canvas element for video processing
  private createCanvasElement(): void {
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = 640;
    this.canvasElement.height = 480;
    this.canvasElement.style.position = 'absolute';
    this.canvasElement.style.top = '-9999px';
    this.canvasElement.style.left = '-9999px';
    document.body.appendChild(this.canvasElement);

    this.canvasContext = this.canvasElement.getContext('2d');
  }

  // Start webcam access
  public async startVideo(deviceId?: string): Promise<MediaStreamInfo> {
    try {
      // Stop any existing video stream
      if (this.videoStream) {
        this.stopVideo();
      }

      // Request webcam access
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store stream info
      this.videoStream = {
        stream,
        active: true,
        deviceId: deviceId || stream.getVideoTracks()[0].getSettings().deviceId || ''
      };

      // Connect stream to video element
      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
      }

      console.log('Webcam started successfully');
      return this.videoStream;
    } catch (error) {
      console.error('Error starting webcam:', error);
      this.notifyError(error as Error);
      throw error;
    }
  }

  // Stop webcam access
  public stopVideo(): void {
    if (this.videoStream) {
      // Stop all video tracks
      this.videoStream.stream.getVideoTracks().forEach(track => track.stop());
      this.videoStream.active = false;
      this.videoStream = null;

      // Clear video element
      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }

      // Stop processing
      this.isProcessingVideo = false;

      console.log('Webcam stopped');
    }
  }

  // Get the current video stream
  public getVideoStream(): MediaStream | null {
    return this.videoStream?.stream || null;
  }

  // Set an external video stream (for direct camera access)
  public setExternalVideoStream(stream: MediaStream): void {
    // Stop any existing video stream
    if (this.videoStream) {
      this.stopVideo();
    }

    // Store the new stream
    this.videoStream = {
      stream,
      active: true,
      deviceId: stream.getVideoTracks()[0]?.getSettings().deviceId || ''
    };

    // Connect stream to video element
    if (this.videoElement) {
      this.videoElement.srcObject = stream;
    }

    console.log('External video stream set successfully');
  }

  // Start microphone access
  public async startAudio(deviceId?: string): Promise<MediaStreamInfo> {
    try {
      // Stop any existing audio stream
      if (this.audioStream) {
        this.stopAudio();
      }

      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store stream info
      this.audioStream = {
        stream,
        active: true,
        deviceId: deviceId || stream.getAudioTracks()[0].getSettings().deviceId || ''
      };

      // Initialize audio context and analyzer
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 2048;
      source.connect(this.audioAnalyser);

      console.log('Microphone started successfully');
      return this.audioStream;
    } catch (error) {
      console.error('Error starting microphone:', error);
      this.notifyError(error as Error);
      throw error;
    }
  }

  // Stop microphone access
  public stopAudio(): void {
    if (this.audioStream) {
      // Stop all audio tracks
      this.audioStream.stream.getAudioTracks().forEach(track => track.stop());
      this.audioStream.active = false;
      this.audioStream = null;

      // Close audio context
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
        this.audioAnalyser = null;
      }

      // Stop processing
      this.isProcessingAudio = false;

      console.log('Microphone stopped');
    }
  }

  // Start processing video frames
  public startVideoProcessing(frameRate: number = 5): void {
    if (!this.videoStream || !this.videoStream.active) {
      console.error('No active video stream to process');
      return;
    }

    this.videoFrameRate = frameRate;
    this.isProcessingVideo = true;
    this.processVideoFrame();

    console.log(`Video processing started at ${frameRate} fps`);
  }

  // Process a single video frame
  private processVideoFrame(): void {
    if (!this.isProcessingVideo || !this.videoStream || !this.videoStream.active) {
      return;
    }

    // Draw video frame to canvas
    if (this.videoElement && this.canvasContext && this.canvasElement) {
      this.canvasContext.drawImage(
        this.videoElement,
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Get image data
      const imageData = this.canvasContext.getImageData(
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Create frame object
      const frame: VideoFrame = {
        imageData,
        timestamp: Date.now()
      };

      // Notify callbacks
      this.notifyVideoFrame(frame);
    }

    // Schedule next frame
    setTimeout(() => {
      this.processVideoFrame();
    }, 1000 / this.videoFrameRate);
  }

  // Start processing audio chunks
  public startAudioProcessing(sampleRate: number = 4): void {
    if (!this.audioStream || !this.audioStream.active || !this.audioAnalyser) {
      console.error('No active audio stream to process');
      return;
    }

    this.audioSampleRate = sampleRate;
    this.isProcessingAudio = true;
    this.processAudioChunk();

    console.log(`Audio processing started at ${sampleRate} samples per second`);
  }

  // Process a single audio chunk
  private processAudioChunk(): void {
    if (!this.isProcessingAudio || !this.audioStream || !this.audioStream.active || !this.audioAnalyser) {
      return;
    }

    // Get audio data
    const bufferLength = this.audioAnalyser.frequencyBinCount;
    const audioData = new Float32Array(bufferLength);
    this.audioAnalyser.getFloatTimeDomainData(audioData);

    // Create chunk object
    const chunk: AudioChunk = {
      audioData,
      timestamp: Date.now()
    };

    // Notify callbacks
    this.notifyAudioChunk(chunk);

    // Schedule next chunk
    setTimeout(() => {
      this.processAudioChunk();
    }, 1000 / this.audioSampleRate);
  }

  // Get available media devices
  public async getMediaDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error) {
      console.error('Error getting media devices:', error);
      this.notifyError(error as Error);
      throw error;
    }
  }

  // Register callbacks
  public onVideoFrame(callback: VideoFrameCallback): void {
    this.videoFrameCallbacks.push(callback);
  }

  public onAudioChunk(callback: AudioChunkCallback): void {
    this.audioChunkCallbacks.push(callback);
  }

  public onError(callback: MediaErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  // Remove callbacks
  public removeVideoFrameCallback(callback: VideoFrameCallback): void {
    this.videoFrameCallbacks = this.videoFrameCallbacks.filter(cb => cb !== callback);
  }

  public removeAudioChunkCallback(callback: AudioChunkCallback): void {
    this.audioChunkCallbacks = this.audioChunkCallbacks.filter(cb => cb !== callback);
  }

  public removeErrorCallback(callback: MediaErrorCallback): void {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  // Notify callbacks
  private notifyVideoFrame(frame: VideoFrame): void {
    this.videoFrameCallbacks.forEach(callback => callback(frame));
  }

  private notifyAudioChunk(chunk: AudioChunk): void {
    this.audioChunkCallbacks.forEach(callback => callback(chunk));
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  // Clean up resources
  public dispose(): void {
    this.stopVideo();
    this.stopAudio();

    // Remove elements
    if (this.videoElement) {
      document.body.removeChild(this.videoElement);
      this.videoElement = null;
    }

    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
      this.canvasElement = null;
      this.canvasContext = null;
    }

    // Clear callbacks
    this.videoFrameCallbacks = [];
    this.audioChunkCallbacks = [];
    this.errorCallbacks = [];

    console.log('Media Service disposed');
  }
}

export default MediaService;
