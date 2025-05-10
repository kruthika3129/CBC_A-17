// PsyTrack ML Service
// This service handles ML model loading, inference, and caching

import * as tf from '@tensorflow/tfjs';
// Import face detection models
import * as faceDetection from '@tensorflow-models/face-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { VideoFrame, AudioChunk } from './mediaService';
import { EmotionCategory, FacialEmbedding, VoiceFeatures } from '@/lib/aiCore';

// Types for ML models and inference
export interface ModelInfo {
  name: string;
  url: string;
  loaded: boolean;
  model: tf.LayersModel | tf.GraphModel | null;
  inputShape: number[];
  outputShape: number[];
  preprocessor?: (input: any) => tf.Tensor;
  postprocessor?: (output: tf.Tensor) => any;
}

export interface InferenceResult<T> {
  result: T;
  timestamp: number;
  inferenceTime: number;
  confidence: number;
}

// Callbacks for inference results
type FacialEmbeddingCallback = (embedding: InferenceResult<FacialEmbedding>) => void;
type VoiceFeaturesCallback = (features: InferenceResult<VoiceFeatures>) => void;
type ModelLoadCallback = (modelInfo: ModelInfo) => void;
type ModelErrorCallback = (error: Error, modelName: string) => void;

class MLService {
  private static instance: MLService;

  // Models
  private models: Map<string, ModelInfo> = new Map();

  // Face detector and landmark detector
  private faceDetector: faceDetection.FaceDetector | null = null;
  private faceLandmarkDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

  // Caching
  private facialEmbeddingCache: Map<string, FacialEmbedding> = new Map();
  private voiceFeaturesCache: Map<string, VoiceFeatures> = new Map();
  private cacheSize: number = 100;
  private cacheExpiryMs: number = 60 * 1000; // 1 minute

  // Callbacks
  private facialEmbeddingCallbacks: FacialEmbeddingCallback[] = [];
  private voiceFeaturesCallbacks: VoiceFeaturesCallback[] = [];
  private modelLoadCallbacks: ModelLoadCallback[] = [];
  private modelErrorCallbacks: ModelErrorCallback[] = [];

  // Processing state
  private isProcessingFacial: boolean = false;
  private isProcessingVoice: boolean = false;

  private constructor() {
    // Initialize TensorFlow.js
    this.initTensorFlow();

    console.log('ML Service initialized');
  }

  // Get the singleton instance
  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  // Initialize TensorFlow.js and load models
  private async initTensorFlow(): Promise<void> {
    try {
      // Set backend to WebGL for GPU acceleration if available
      await tf.setBackend('webgl');
      console.log('TensorFlow.js initialized with backend:', tf.getBackend());

      // Enable debug mode in development
      if (process.env.NODE_ENV === 'development') {
        tf.enableDebugMode();
      }

      // Load face detection models
      try {
        // Load face detector model
        this.faceDetector = await faceDetection.createDetector(
          faceDetection.SupportedModels.MediaPipeFaceDetector,
          {
            runtime: 'tfjs',
            modelType: 'short',
            maxFaces: 1
          }
        );

        console.log('Face detector model loaded');

        // Load face landmark detector model
        this.faceLandmarkDetector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1
          }
        );

        console.log('Face landmark detector model loaded');

        // Register models in our tracking system
        this.registerModel(
          'facial',
          'built-in',
          [1, 224, 224, 3],
          [1, 128]
        );

        // For voice, we'll use a simple feature extractor instead of a full model
        this.registerModel(
          'voice',
          'built-in',
          [1, 1024, 1],
          [1, 3]
        );

        // Mark models as loaded
        const facialModel = this.models.get('facial');
        if (facialModel) {
          facialModel.loaded = true;
          this.models.set('facial', facialModel);
        }

        const voiceModel = this.models.get('voice');
        if (voiceModel) {
          voiceModel.loaded = true;
          this.models.set('voice', voiceModel);
        }
      } catch (modelError) {
        console.error('Error loading face detection models:', modelError);
        this.notifyModelError(modelError as Error, 'face-detection');
      }
    } catch (error) {
      console.error('Error initializing TensorFlow.js:', error);
      // Fall back to CPU
      await tf.setBackend('cpu');
      console.log('Fallback to CPU backend');
    }
  }

  // Register a model
  public registerModel(
    name: string,
    url: string,
    inputShape: number[],
    outputShape: number[],
    preprocessor?: (input: any) => tf.Tensor,
    postprocessor?: (output: tf.Tensor) => any
  ): void {
    const modelInfo: ModelInfo = {
      name,
      url,
      loaded: false,
      model: null,
      inputShape,
      outputShape,
      preprocessor,
      postprocessor
    };

    this.models.set(name, modelInfo);
    console.log(`Model "${name}" registered`);
  }

  // Load a model
  public async loadModel(name: string): Promise<ModelInfo> {
    const modelInfo = this.models.get(name);

    if (!modelInfo) {
      const error = new Error(`Model "${name}" not registered`);
      this.notifyModelError(error, name);
      throw error;
    }

    if (modelInfo.loaded && modelInfo.model) {
      return modelInfo;
    }

    try {
      console.log(`Loading model "${name}" from ${modelInfo.url}`);

      // Determine model type from URL
      const isGraphModel = modelInfo.url.endsWith('model.json');

      // Load the model
      const model = isGraphModel
        ? await tf.loadGraphModel(modelInfo.url)
        : await tf.loadLayersModel(modelInfo.url);

      // Update model info
      modelInfo.model = model;
      modelInfo.loaded = true;
      this.models.set(name, modelInfo);

      // Warm up the model with a dummy tensor
      const inputShape = [1, ...modelInfo.inputShape.slice(1)];
      const dummyInput = tf.zeros(inputShape);
      model.predict(dummyInput);
      dummyInput.dispose();

      console.log(`Model "${name}" loaded successfully`);
      this.notifyModelLoad(modelInfo);

      return modelInfo;
    } catch (error) {
      console.error(`Error loading model "${name}":`, error);
      this.notifyModelError(error as Error, name);
      throw error;
    }
  }

  // Helper method to preprocess an image
  public preprocessImage(imageData: ImageData, width: number, height: number): tf.Tensor {
    return tf.tidy(() => {
      // Convert ImageData to tensor
      const imageTensor = tf.browser.fromPixels(imageData);

      // Resize to target dimensions
      const resized = tf.image.resizeBilinear(imageTensor, [width, height]);

      // Normalize pixel values to [0, 1]
      const normalized = resized.toFloat().div(tf.scalar(255));

      // Add batch dimension
      return normalized.expandDims(0);
    });
  }

  // Helper method to preprocess audio data
  public preprocessAudio(audioData: Float32Array): tf.Tensor {
    return tf.tidy(() => {
      // Convert audio data to tensor
      const audioTensor = tf.tensor(Array.from(audioData));

      // Reshape to expected dimensions [batch, samples, channels]
      // Assuming the model expects 1024 samples with 1 channel
      const reshaped = audioTensor.reshape([1, 1024, 1]);

      return reshaped;
    });
  }

  // Process a video frame to extract facial embedding
  public async processFacialFrame(frame: VideoFrame): Promise<InferenceResult<FacialEmbedding> | null> {
    // Check if face detector is loaded
    if (!this.faceDetector) {
      console.warn('Face detector not loaded');
      return null;
    }

    // Generate cache key based on frame data
    const cacheKey = `facial_${frame.timestamp}`;

    // Check cache
    const cachedEmbedding = this.facialEmbeddingCache.get(cacheKey);
    if (cachedEmbedding) {
      return {
        result: cachedEmbedding,
        timestamp: frame.timestamp,
        inferenceTime: 0,
        confidence: cachedEmbedding.confidence || 0.8
      };
    }

    try {
      const startTime = performance.now();

      // Detect faces in the frame
      const faces = await this.faceDetector.estimateFaces(frame.imageData);

      // If no faces detected, return null
      if (faces.length === 0) {
        console.log('No faces detected in frame');
        return null;
      }

      // Get the first face (we're only processing one face)
      const face = faces[0];

      // Extract face landmarks if available
      let landmarks = [];
      if (this.faceLandmarkDetector) {
        const faceLandmarks = await this.faceLandmarkDetector.estimateFaces(frame.imageData);
        if (faceLandmarks.length > 0) {
          landmarks = faceLandmarks[0].keypoints || [];
        }
      }

      // Create a simple embedding from face detection results
      // In a real implementation, this would use a more sophisticated approach
      const boundingBox = face.box || { xMin: 0, yMin: 0, width: 0, height: 0 };

      // Create a simplified embedding from face detection and landmarks
      // This is a placeholder for a real embedding from a face recognition model
      const embedding: number[] = [
        // Normalized bounding box values
        boundingBox.xMin / frame.imageData.width,
        boundingBox.yMin / frame.imageData.height,
        boundingBox.width / frame.imageData.width,
        boundingBox.height / frame.imageData.height,
        // Add some landmark positions if available (normalized)
        ...landmarks.slice(0, 20).flatMap(landmark => [
          landmark.x / frame.imageData.width,
          landmark.y / frame.imageData.height
        ])
      ];

      // Pad or truncate to ensure consistent length
      const targetLength = 128;
      if (embedding.length < targetLength) {
        embedding.push(...Array(targetLength - embedding.length).fill(0));
      } else if (embedding.length > targetLength) {
        embedding.length = targetLength;
      }

      const endTime = performance.now();
      const inferenceTime = endTime - startTime;

      // Calculate confidence based on face detection score
      const confidence = face.score || 0.8;

      // Create embedding object
      const facialEmbedding: FacialEmbedding = {
        embedding,
        timestamp: frame.timestamp,
        confidence
      };

      // Cache the result
      this.facialEmbeddingCache.set(cacheKey, facialEmbedding);
      this.trimCache(this.facialEmbeddingCache);

      // Create result object
      const result: InferenceResult<FacialEmbedding> = {
        result: facialEmbedding,
        timestamp: frame.timestamp,
        inferenceTime,
        confidence
      };

      // Notify callbacks
      this.notifyFacialEmbedding(result);

      return result;
    } catch (error) {
      console.error('Error processing facial frame:', error);
      this.notifyModelError(error as Error, 'facial');
      return null;
    }
  }

  // Process an audio chunk to extract voice features
  public async processAudioChunk(chunk: AudioChunk): Promise<InferenceResult<VoiceFeatures> | null> {
    // Generate cache key based on chunk data
    const cacheKey = `voice_${chunk.timestamp}`;

    // Check cache
    const cachedFeatures = this.voiceFeaturesCache.get(cacheKey);
    if (cachedFeatures) {
      return {
        result: cachedFeatures,
        timestamp: chunk.timestamp,
        inferenceTime: 0,
        confidence: 0.8
      };
    }

    try {
      const startTime = performance.now();

      // Simple audio analysis without using a model
      // In a real implementation, this would use a more sophisticated approach

      // Calculate energy (volume) from audio data
      let energy = 0;
      let sumSquares = 0;

      // Calculate RMS (Root Mean Square) energy
      for (let i = 0; i < chunk.audioData.length; i++) {
        sumSquares += chunk.audioData[i] * chunk.audioData[i];
      }
      energy = Math.sqrt(sumSquares / chunk.audioData.length);

      // Normalize energy to 0-1 range (assuming typical audio levels)
      energy = Math.min(1, energy * 5); // Scale up for better sensitivity

      // Calculate zero-crossing rate (rough approximation of pitch)
      let zeroCrossings = 0;
      for (let i = 1; i < chunk.audioData.length; i++) {
        if ((chunk.audioData[i] >= 0 && chunk.audioData[i - 1] < 0) ||
            (chunk.audioData[i] < 0 && chunk.audioData[i - 1] >= 0)) {
          zeroCrossings++;
        }
      }

      // Normalize zero-crossing rate to approximate pitch (0-1)
      const zeroCrossingRate = zeroCrossings / chunk.audioData.length;
      const pitch = Math.min(1, zeroCrossingRate * 10); // Scale for better range

      // Determine tone based on energy and pitch
      let tone: string;
      if (energy > 0.7 && pitch > 0.6) {
        tone = 'excited';
      } else if (energy > 0.5) {
        tone = 'animated';
      } else if (energy > 0.3) {
        tone = 'neutral';
      } else {
        tone = 'flat';
      }

      const endTime = performance.now();
      const inferenceTime = endTime - startTime;

      // Create voice features object
      const voiceFeatures: VoiceFeatures = {
        pitch,
        energy,
        tone,
        timestamp: chunk.timestamp
      };

      // Cache the result
      this.voiceFeaturesCache.set(cacheKey, voiceFeatures);
      this.trimCache(this.voiceFeaturesCache);

      // Calculate confidence based on signal strength
      const confidence = energy > 0.1 ? 0.7 + (energy * 0.3) : 0.5;

      // Create result object
      const result: InferenceResult<VoiceFeatures> = {
        result: voiceFeatures,
        timestamp: chunk.timestamp,
        inferenceTime,
        confidence
      };

      // Notify callbacks
      this.notifyVoiceFeatures(result);

      return result;
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      this.notifyModelError(error as Error, 'voice');
      return null;
    }
  }

  // Trim cache to prevent memory leaks
  private trimCache<T>(cache: Map<string, T>): void {
    if (cache.size <= this.cacheSize) {
      return;
    }

    // Remove oldest entries
    const entriesToRemove = cache.size - this.cacheSize;
    const entries = Array.from(cache.entries());

    for (let i = 0; i < entriesToRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }

  // Register callbacks
  public onFacialEmbedding(callback: FacialEmbeddingCallback): void {
    this.facialEmbeddingCallbacks.push(callback);
  }

  public onVoiceFeatures(callback: VoiceFeaturesCallback): void {
    this.voiceFeaturesCallbacks.push(callback);
  }

  public onModelLoad(callback: ModelLoadCallback): void {
    this.modelLoadCallbacks.push(callback);
  }

  public onModelError(callback: ModelErrorCallback): void {
    this.modelErrorCallbacks.push(callback);
  }

  // Remove callbacks
  public removeFacialEmbeddingCallback(callback: FacialEmbeddingCallback): void {
    this.facialEmbeddingCallbacks = this.facialEmbeddingCallbacks.filter(cb => cb !== callback);
  }

  public removeVoiceFeaturesCallback(callback: VoiceFeaturesCallback): void {
    this.voiceFeaturesCallbacks = this.voiceFeaturesCallbacks.filter(cb => cb !== callback);
  }

  public removeModelLoadCallback(callback: ModelLoadCallback): void {
    this.modelLoadCallbacks = this.modelLoadCallbacks.filter(cb => cb !== callback);
  }

  public removeModelErrorCallback(callback: ModelErrorCallback): void {
    this.modelErrorCallbacks = this.modelErrorCallbacks.filter(cb => cb !== callback);
  }

  // Notify callbacks
  private notifyFacialEmbedding(result: InferenceResult<FacialEmbedding>): void {
    this.facialEmbeddingCallbacks.forEach(callback => callback(result));
  }

  private notifyVoiceFeatures(result: InferenceResult<VoiceFeatures>): void {
    this.voiceFeaturesCallbacks.forEach(callback => callback(result));
  }

  private notifyModelLoad(modelInfo: ModelInfo): void {
    this.modelLoadCallbacks.forEach(callback => callback(modelInfo));
  }

  private notifyModelError(error: Error, modelName: string): void {
    this.modelErrorCallbacks.forEach(callback => callback(error, modelName));
  }

  // Clean up resources
  public dispose(): void {
    // Dispose all models
    this.models.forEach(modelInfo => {
      if (modelInfo.model) {
        modelInfo.model.dispose();
      }
    });

    // Clear caches
    this.facialEmbeddingCache.clear();
    this.voiceFeaturesCache.clear();

    // Clear callbacks
    this.facialEmbeddingCallbacks = [];
    this.voiceFeaturesCallbacks = [];
    this.modelLoadCallbacks = [];
    this.modelErrorCallbacks = [];

    console.log('ML Service disposed');
  }
}

export default MLService;
