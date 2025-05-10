// PsyTrack AI Core Tests
// Tests for the AI core functionality

import {
  MultimodalEmotionFusion,
  EmotionAlertEngine,
  ExplainabilityModule,
  EmotionTimeCapsule,
  TemplateLLMSummarizer,
  PrivacyManager,
  EmotionCategory,
  FacialEmbedding,
  VoiceFeatures,
  JournalEntry,
  WearableMetrics,
  ActivityMetadata,
  EmotionState,
  TimeCapsuleEntry,
  TimePeriod
} from './aiCore';

// --- 1. Multimodal Fusion Tests ---

describe('MultimodalEmotionFusion', () => {
  test('should return neutral state when no inputs are provided', () => {
    const result = MultimodalEmotionFusion.fuse(null, null, null, null);
    
    expect(result.mood).toBe('neutral');
    expect(result.confidence).toBeLessThan(0.5);
    expect(Object.keys(result.sourceWeights).length).toBe(0);
  });
  
  test('should detect happiness from facial embedding', () => {
    const facialEmbedding: FacialEmbedding = {
      embedding: [0.9, 0.1, 0.2, 0.3], // High first value should trigger 'happy'
      timestamp: Date.now()
    };
    
    const result = MultimodalEmotionFusion.fuse(facialEmbedding, null, null, null);
    
    expect(result.mood).toBe('happy');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.sourceWeights.face).toBeGreaterThan(0);
  });
  
  test('should detect sadness from voice features', () => {
    const voiceFeatures: VoiceFeatures = {
      pitch: 0.2, // Low pitch
      energy: 0.2, // Low energy
      tone: 'sad',
      timestamp: Date.now()
    };
    
    const result = MultimodalEmotionFusion.fuse(null, voiceFeatures, null, null);
    
    expect(result.mood).toBe('sad');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.sourceWeights.voice).toBeGreaterThan(0);
  });
  
  test('should detect anxiety from journal text', () => {
    const journalEntry: JournalEntry = {
      text: 'I am feeling very anxious and worried about the upcoming exam.',
      timestamp: Date.now()
    };
    
    const result = MultimodalEmotionFusion.fuse(null, null, journalEntry, null);
    
    expect(result.mood).toBe('anxious');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.sourceWeights.journal).toBeGreaterThan(0);
  });
  
  test('should include activity context when provided', () => {
    const activity: ActivityMetadata = {
      activity: 'math homework',
      timestamp: Date.now()
    };
    
    const result = MultimodalEmotionFusion.fuse(null, null, null, null, activity);
    
    expect(result.context).toBe('math homework');
  });
  
  test('should fuse multiple modalities with appropriate weights', () => {
    const facialEmbedding: FacialEmbedding = {
      embedding: [0.9, 0.1, 0.2, 0.3], // High first value should trigger 'happy'
      timestamp: Date.now()
    };
    
    const voiceFeatures: VoiceFeatures = {
      pitch: 0.8, // High pitch
      energy: 0.8, // High energy
      tone: 'excited',
      timestamp: Date.now()
    };
    
    const journalEntry: JournalEntry = {
      text: 'I am feeling very happy and excited today!',
      timestamp: Date.now()
    };
    
    const result = MultimodalEmotionFusion.fuse(facialEmbedding, voiceFeatures, journalEntry, null);
    
    // All modalities suggest happiness/excitement, so result should be one of these
    expect(['happy', 'excited']).toContain(result.mood);
    expect(result.confidence).toBeGreaterThan(0.7); // High confidence due to agreement
    expect(Object.keys(result.sourceWeights).length).toBe(3); // Three sources
  });
});

// --- 2. Alert Engine Tests ---

describe('EmotionAlertEngine', () => {
  let alertEngine: EmotionAlertEngine;
  
  beforeEach(() => {
    alertEngine = new EmotionAlertEngine();
  });
  
  test('should not generate alerts with insufficient history', () => {
    const alerts = alertEngine.checkAlerts();
    expect(alerts.length).toBe(0);
  });
  
  test('should detect sustained negative emotions', () => {
    // Create a series of sad states spanning over 10 minutes
    const baseTime = Date.now() - (15 * 60 * 1000); // 15 minutes ago
    
    for (let i = 0; i < 5; i++) {
      const state: EmotionState = {
        mood: 'sad',
        confidence: 0.8,
        sourceWeights: { face: 1.0 },
        timestamp: baseTime + (i * 3 * 60 * 1000) // 3-minute intervals
      };
      
      alertEngine.addState(state);
    }
    
    const alerts = alertEngine.checkAlerts();
    
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].type).toBe('sustained_negative');
    expect(alerts[0].emotion).toBe('sad');
  });
  
  test('should customize suggestions based on activity', () => {
    // Add a frustrated state
    const state: EmotionState = {
      mood: 'frustrated',
      confidence: 0.9,
      sourceWeights: { face: 1.0 },
      timestamp: Date.now() - (11 * 60 * 1000) // 11 minutes ago
    };
    
    // Add another frustrated state to trigger sustained emotion
    const state2: EmotionState = {
      mood: 'frustrated',
      confidence: 0.9,
      sourceWeights: { face: 1.0 },
      timestamp: Date.now() - (5 * 60 * 1000) // 5 minutes ago
    };
    
    alertEngine.addState(state);
    alertEngine.addState(state2);
    
    // Check alerts with homework activity
    const activity: ActivityMetadata = {
      activity: 'homework',
      timestamp: Date.now()
    };
    
    const alerts = alertEngine.checkAlerts(activity);
    
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].context).toBe('homework');
    expect(alerts[0].suggestion).toContain('Pomodoro');
  });
});

// Add more tests for other modules as needed
