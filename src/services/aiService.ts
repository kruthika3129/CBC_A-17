// PsyTrack AI Service
// This service acts as a bridge between the AI core and the frontend components

import {
  MultimodalEmotionFusion,
  EmotionAlertEngine,
  ExplainabilityModule,
  EmotionTimeCapsule,
  LLMEmotionSummarizer,
  PrivacyManager,
  EmotionCategory,
  FacialEmbedding,
  VoiceFeatures,
  JournalEntry,
  WearableMetrics,
  ActivityMetadata,
  EmotionState,
  TimeCapsuleEntry,
  ExplainabilityFeatures,
  EmotionAlert,
  ChildFriendlyVisual,
  TimePeriod,
  EmotionSummary,
  SessionSummary,
  SummaryOptions
} from '@/lib/aiCore';

// Import new services
import MediaService, { VideoFrame, AudioChunk } from './mediaService';
import MLService, { InferenceResult } from './mlService';
import DBService, { JournalEntry as DBJournalEntry } from './dbService';
import LLMService from './llmService';

// Singleton instances for the AI core components
class AIService {
  private static instance: AIService;

  // Core AI components
  private alertEngine: EmotionAlertEngine;
  private timeCapsule: EmotionTimeCapsule;
  private summarizer: LLMEmotionSummarizer;
  private privacyManager: PrivacyManager;

  // New services
  private mediaService: MediaService;
  private mlService: MLService;
  private dbService: DBService;
  private llmService: LLMService;

  // Current state
  private currentEmotionState: EmotionState | null = null;
  private currentActivity: ActivityMetadata | null = null;
  private isProcessingMedia: boolean = false;

  // Callbacks for UI updates
  private emotionUpdateCallbacks: Array<(state: EmotionState) => void> = [];
  private alertCallbacks: Array<(alerts: EmotionAlert[]) => void> = [];
  private mediaStatusCallbacks: Array<(status: { video: boolean, audio: boolean }) => void> = [];

  private constructor() {
    // Initialize AI core components
    this.alertEngine = new EmotionAlertEngine();
    this.timeCapsule = new EmotionTimeCapsule();
    this.summarizer = new LLMEmotionSummarizer();
    this.privacyManager = new PrivacyManager();

    // Initialize new services
    this.mediaService = MediaService.getInstance();
    this.mlService = MLService.getInstance();
    this.dbService = DBService.getInstance();
    this.llmService = LLMService.getInstance();

    // Register ML models
    this.registerMLModels();

    // Set up media processing callbacks
    this.setupMediaCallbacks();

    // Load data from database
    this.loadDataFromDB();

    console.log('AI Service initialized');
  }

  // Register ML models
  private registerMLModels(): void {
    // Register facial expression model
    this.mlService.registerModel(
      'facial',
      '/models/facial_expression_model/model.json',
      [1, 224, 224, 3], // Input shape: [batch, height, width, channels]
      [1, 128], // Output shape: [batch, embedding_size]
      // Preprocessor function
      (imageData) => {
        return this.mlService.preprocessImage(imageData, 224, 224);
      }
    );

    // Register voice analysis model
    this.mlService.registerModel(
      'voice',
      '/models/voice_analysis_model/model.json',
      [1, 1024, 1], // Input shape: [batch, samples, channels]
      [1, 3], // Output shape: [batch, features]
      // Preprocessor function
      (audioData) => {
        return this.mlService.preprocessAudio(audioData);
      }
    );

    console.log('ML models registered');
  }

  // Set up media processing callbacks
  private setupMediaCallbacks(): void {
    // Process video frames
    this.mediaService.onVideoFrame((frame) => {
      if (!this.isProcessingMedia) return;

      // Process frame with ML model
      this.mlService.processFacialFrame(frame).then((result) => {
        if (result) {
          // Use the facial embedding for emotion detection
          this.processFacialEmbedding(result.result);
        }
      });
    });

    // Process audio chunks
    this.mediaService.onAudioChunk((chunk) => {
      if (!this.isProcessingMedia) return;

      // Process chunk with ML model
      this.mlService.processAudioChunk(chunk).then((result) => {
        if (result) {
          // Use the voice features for emotion detection
          this.processVoiceFeatures(result.result);
        }
      });
    });

    // Handle media errors
    this.mediaService.onError((error) => {
      console.error('Media error:', error);
    });

    // Handle ML model errors
    this.mlService.onModelError((error, modelName) => {
      console.error(`ML model error (${modelName}):`, error);
    });
  }

  // Load data from database
  private async loadDataFromDB(): void {
    try {
      // Wait for database to be ready
      this.dbService.onReady(async () => {
        // Load emotion states
        const states = await this.dbService.getAll<EmotionState>('emotionStates');
        states.forEach(state => {
          this.alertEngine.addState(state);
          this.timeCapsule.addEmotionState(state);
        });

        // Load time capsule entries
        const entries = await this.dbService.getAll<TimeCapsuleEntry>('timeCapsuleEntries');
        entries.forEach(entry => {
          this.timeCapsule.addEntry(entry);
        });

        // Load user settings
        const settings = await this.dbService.get('userSettings', 1);
        if (settings) {
          this.privacyManager.updateSettings(settings);
        }

        console.log('Data loaded from database');
      });
    } catch (error) {
      console.error('Error loading data from database:', error);
    }
  }

  // Get the singleton instance
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // --- Media Processing Methods ---

  // Get the media service instance
  public getMediaService(): MediaService {
    return this.mediaService;
  }

  // Start webcam and microphone for real-time emotion detection
  public async startMediaProcessing(): Promise<{ video: boolean, audio: boolean }> {
    try {
      // Start webcam
      const videoStream = await this.mediaService.startVideo();

      // Start microphone
      const audioStream = await this.mediaService.startAudio();

      // Start processing
      this.mediaService.startVideoProcessing(5); // 5 fps
      this.mediaService.startAudioProcessing(4); // 4 samples per second

      // Load ML models
      await this.mlService.loadModel('facial');
      await this.mlService.loadModel('voice');

      // Enable processing
      this.isProcessingMedia = true;

      // Notify status
      const status = {
        video: videoStream.active,
        audio: audioStream.active
      };
      this.notifyMediaStatus(status);

      return status;
    } catch (error) {
      console.error('Error starting media processing:', error);

      // Notify status
      const status = {
        video: false,
        audio: false
      };
      this.notifyMediaStatus(status);

      return status;
    }
  }

  // Stop webcam and microphone
  public stopMediaProcessing(): void {
    // Stop media streams
    this.mediaService.stopVideo();
    this.mediaService.stopAudio();

    // Disable processing
    this.isProcessingMedia = false;

    // Notify status
    this.notifyMediaStatus({ video: false, audio: false });

    console.log('Media processing stopped');
  }

  // Process a facial embedding from the ML model
  private processFacialEmbedding(embedding: FacialEmbedding): void {
    // Only process if we have permission
    if (!this.privacyManager.isAllowed('remote_process')) {
      return;
    }

    // Use the embedding for emotion detection
    this.detectEmotion(embedding, null, null, null);
  }

  // Process voice features from the ML model
  private processVoiceFeatures(features: VoiceFeatures): void {
    // Only process if we have permission
    if (!this.privacyManager.isAllowed('remote_process')) {
      return;
    }

    // Use the features for emotion detection
    this.detectEmotion(null, features, null, null);
  }

  // --- Emotion Detection Methods ---

  // Process multimodal inputs to detect emotion
  public detectEmotion(
    face: FacialEmbedding | null,
    voice: VoiceFeatures | null,
    journal: JournalEntry | null,
    wearable: WearableMetrics | null,
    activity?: ActivityMetadata
  ): EmotionState {
    // Update current activity if provided
    if (activity) {
      this.currentActivity = activity;
    }

    // Process inputs using the fusion module
    const emotionState = MultimodalEmotionFusion.fuse(face, voice, journal, wearable, this.currentActivity || undefined);

    // Update current state
    this.currentEmotionState = emotionState;

    // Add to history
    this.alertEngine.addState(emotionState);
    this.timeCapsule.addEmotionState(emotionState);

    // Save to database
    this.saveEmotionState(emotionState);

    // Check for alerts
    this.checkForAlerts();

    // Notify listeners
    this.notifyEmotionUpdateListeners(emotionState);

    return emotionState;
  }

  // Process journal text to detect emotion
  public async detectEmotionFromJournal(text: string): Promise<EmotionState> {
    const journal: JournalEntry = {
      text,
      timestamp: Date.now()
    };

    // Detect emotion
    const emotionState = this.detectEmotion(null, null, journal, null);

    // Save journal entry to database
    await this.saveJournalEntry({
      text,
      timestamp: journal.timestamp,
      detectedEmotion: emotionState.mood,
      confidence: emotionState.confidence
    });

    return emotionState;
  }

  // Save emotion state to database
  private async saveEmotionState(state: EmotionState): Promise<void> {
    try {
      await this.dbService.add('emotionStates', state);
    } catch (error) {
      console.error('Error saving emotion state to database:', error);
    }
  }

  // Save journal entry to database
  private async saveJournalEntry(entry: DBJournalEntry): Promise<void> {
    try {
      await this.dbService.add('journalEntries', entry);
    } catch (error) {
      console.error('Error saving journal entry to database:', error);
    }
  }

  // Get the current emotion state
  public getCurrentEmotionState(): EmotionState | null {
    return this.currentEmotionState;
  }

  // --- Alert Methods ---

  // Check for alerts based on emotion history
  public checkForAlerts(): EmotionAlert[] {
    const alerts = this.alertEngine.checkAlerts(this.currentActivity || undefined);

    // Notify listeners
    this.notifyAlertListeners(alerts);

    return alerts;
  }

  // --- Explainability Methods ---

  // Get child-friendly explanation for current emotion
  public getChildFriendlyExplanation(): ChildFriendlyVisual | null {
    if (!this.currentEmotionState) return null;

    return ExplainabilityModule.forChild(this.currentEmotionState);
  }

  // Get adult explanation for current emotion
  public getAdultExplanation(features?: ExplainabilityFeatures): string | null {
    if (!this.currentEmotionState) return null;

    return ExplainabilityModule.forAdult(this.currentEmotionState, features);
  }

  // --- Time Capsule Methods ---

  // Add a media entry to the time capsule
  public addTimeCapsuleEntry(entry: TimeCapsuleEntry): void {
    this.timeCapsule.addEntry(entry);
  }

  // Get emotion history summary
  public getEmotionSummary(period?: TimePeriod): EmotionSummary {
    return this.timeCapsule.summarizeHistory(period);
  }

  // Get therapist summary
  public getTherapistSummary(period?: TimePeriod): string {
    return this.timeCapsule.generateTherapistSummary(period);
  }

  // --- LLM Summarization Methods ---

  // Generate a session summary
  public async generateSessionSummary(options?: SummaryOptions): Promise<SessionSummary> {
    // Get emotion states and time capsule entries
    const states = this.alertEngine.getHistory();
    const entries = this.timeCapsule.getEntries();

    // Check if we should use the actual LLM service
    if (this.privacyManager.isAllowed('remote_process')) {
      try {
        // Use the LLM service for summarization
        return await this.llmService.generateSessionSummary(states, entries, options);
      } catch (error) {
        console.error('Error generating session summary with LLM service:', error);
        // Fall back to local summarizer
      }
    }

    // Use the local summarizer
    return this.summarizer.summarizeSession(states, entries, options);
  }

  // Register an OpenAI API key for LLM integration
  public registerOpenAIKey(apiKey: string): void {
    if (!apiKey) {
      console.warn('Invalid API key');
      return;
    }

    // Register with LLM service
    this.llmService.registerOpenAIProvider(apiKey);

    // Update privacy settings to allow remote processing
    this.privacyManager.updateSettings({
      allowRemoteProcessing: true
    });

    console.log('OpenAI API key registered');
  }

  // --- Privacy Methods ---

  // Update privacy settings
  public updatePrivacySettings(settings: Partial<{
    storeRawData: boolean;
    shareWithTherapist: boolean;
    shareWithCaregivers: boolean;
    dataRetentionDays: number;
    anonymizeData: boolean;
    allowRemoteProcessing: boolean;
  }>): void {
    this.privacyManager.updateSettings(settings);
  }

  // Get current privacy settings
  public getPrivacySettings() {
    return this.privacyManager.getSettings();
  }

  // Check if an operation is allowed based on privacy settings
  public isOperationAllowed(operation: 'store_raw' | 'share_therapist' | 'share_caregiver' | 'remote_process'): boolean {
    return this.privacyManager.isAllowed(operation);
  }

  // --- Event Listeners ---

  // Add a callback for emotion updates
  public onEmotionUpdate(callback: (state: EmotionState) => void): void {
    this.emotionUpdateCallbacks.push(callback);
  }

  // Add a callback for alerts
  public onAlert(callback: (alerts: EmotionAlert[]) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Add a callback for media status updates
  public onMediaStatus(callback: (status: { video: boolean, audio: boolean }) => void): void {
    this.mediaStatusCallbacks.push(callback);
  }

  // Remove a callback for emotion updates
  public removeEmotionUpdateListener(callback: (state: EmotionState) => void): void {
    this.emotionUpdateCallbacks = this.emotionUpdateCallbacks.filter(cb => cb !== callback);
  }

  // Remove a callback for alerts
  public removeAlertListener(callback: (alerts: EmotionAlert[]) => void): void {
    this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
  }

  // Remove a callback for media status updates
  public removeMediaStatusListener(callback: (status: { video: boolean, audio: boolean }) => void): void {
    this.mediaStatusCallbacks = this.mediaStatusCallbacks.filter(cb => cb !== callback);
  }

  // Notify emotion update listeners
  private notifyEmotionUpdateListeners(state: EmotionState): void {
    this.emotionUpdateCallbacks.forEach(callback => callback(state));
  }

  // Notify alert listeners
  private notifyAlertListeners(alerts: EmotionAlert[]): void {
    if (alerts.length > 0) {
      this.alertCallbacks.forEach(callback => callback(alerts));
    }
  }

  // Notify media status listeners
  private notifyMediaStatus(status: { video: boolean, audio: boolean }): void {
    this.mediaStatusCallbacks.forEach(callback => callback(status));
  }

  // Clean up resources
  public dispose(): void {
    // Stop media processing
    this.stopMediaProcessing();

    // Dispose services
    this.mediaService.dispose();
    this.mlService.dispose();
    this.dbService.close();

    // Clear callbacks
    this.emotionUpdateCallbacks = [];
    this.alertCallbacks = [];
    this.mediaStatusCallbacks = [];

    console.log('AI Service disposed');
  }

  // --- Mock Data Methods (for development) ---

  // Generate mock facial embedding
  public generateMockFacialEmbedding(emotion: EmotionCategory): FacialEmbedding {
    // Simple mock data for development
    const mockEmbeddings: Record<EmotionCategory, number[]> = {
      happy: [0.9, 0.1, 0.2, 0.3, 0.1],
      sad: [0.2, 0.1, 0.8, 0.3, 0.1],
      angry: [0.3, 0.8, 0.2, 0.1, 0.1],
      anxious: [0.4, 0.6, 0.3, 0.2, 0.1],
      calm: [0.3, 0.2, 0.1, 0.8, 0.1],
      excited: [0.8, 0.7, 0.2, 0.1, 0.1],
      tired: [0.2, 0.1, 0.3, 0.1, 0.8],
      frustrated: [0.4, 0.7, 0.3, 0.1, 0.1],
      focused: [0.3, 0.2, 0.1, 0.7, 0.2],
      overwhelmed: [0.5, 0.6, 0.4, 0.2, 0.1],
      neutral: [0.5, 0.5, 0.5, 0.5, 0.5]
    };

    return {
      embedding: mockEmbeddings[emotion] || mockEmbeddings.neutral,
      timestamp: Date.now()
    };
  }
}

export default AIService;
