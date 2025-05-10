// PsyTrack AI Core Example Usage
// This file demonstrates how to use the AI core functionality

import {
  MultimodalEmotionFusion,
  EmotionAlertEngine,
  ExplainabilityModule,
  EmotionTimeCapsule,
  LLMEmotionSummarizer,
  PrivacyManager,
  FacialEmbedding,
  VoiceFeatures,
  JournalEntry,
  WearableMetrics,
  ActivityMetadata,
  EmotionState,
  TimeCapsuleEntry,
  ExplainabilityFeatures,
  TimePeriod
} from './aiCore';

// Example function to demonstrate the complete AI core pipeline
export async function runAICoreDemo() {
  console.log('PsyTrack AI Core Demo');
  console.log('---------------------');
  
  // 1. Initialize components
  const alertEngine = new EmotionAlertEngine();
  const timeCapsule = new EmotionTimeCapsule();
  const summarizer = new LLMEmotionSummarizer();
  const privacyManager = new PrivacyManager();
  
  console.log('Components initialized');
  
  // 2. Create sample input data
  
  // Sample facial embedding (would come from a face detection model)
  const facialEmbedding: FacialEmbedding = {
    embedding: [0.8, 0.2, 0.3, 0.1, 0.5], // Simplified embedding vector
    timestamp: Date.now()
  };
  
  // Sample voice features (would come from audio analysis)
  const voiceFeatures: VoiceFeatures = {
    pitch: 0.7,
    energy: 0.6,
    tone: 'excited',
    timestamp: Date.now()
  };
  
  // Sample journal entry (from user input)
  const journalEntry: JournalEntry = {
    text: "I'm feeling really happy today because I did well on my math test!",
    timestamp: Date.now()
  };
  
  // Sample wearable metrics (from smartwatch/fitness tracker)
  const wearableMetrics: WearableMetrics = {
    heartRate: 85,
    stepCount: 50,
    timestamp: Date.now()
  };
  
  // Current activity context
  const activity: ActivityMetadata = {
    activity: 'after school',
    timestamp: Date.now()
  };
  
  console.log('Sample input data created');
  
  // 3. Process multimodal inputs to get emotion state
  const emotionState = MultimodalEmotionFusion.fuse(
    facialEmbedding,
    voiceFeatures,
    journalEntry,
    wearableMetrics,
    activity
  );
  
  console.log('Emotion fusion result:');
  console.log(`- Detected mood: ${emotionState.mood}`);
  console.log(`- Confidence: ${Math.round(emotionState.confidence * 100)}%`);
  console.log(`- Context: ${emotionState.context || 'none'}`);
  console.log(`- Source weights: ${JSON.stringify(emotionState.sourceWeights)}`);
  
  // 4. Add the emotion state to the alert engine and check for alerts
  alertEngine.addState(emotionState);
  
  // Add a few more states to simulate history (for demonstration)
  const pastState1: EmotionState = {
    mood: 'happy',
    confidence: 0.8,
    sourceWeights: { face: 0.5, journal: 0.5 },
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    context: 'during math test'
  };
  
  const pastState2: EmotionState = {
    mood: 'anxious',
    confidence: 0.7,
    sourceWeights: { face: 0.6, voice: 0.4 },
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    context: 'before math test'
  };
  
  alertEngine.addState(pastState1);
  alertEngine.addState(pastState2);
  
  // Check for alerts
  const alerts = alertEngine.checkAlerts(activity);
  
  console.log('\nAlert check results:');
  if (alerts.length > 0) {
    alerts.forEach((alert, index) => {
      console.log(`Alert ${index + 1}:`);
      console.log(`- Type: ${alert.type}`);
      console.log(`- Emotion: ${alert.emotion}`);
      console.log(`- Severity: ${alert.severity}`);
      console.log(`- Suggestion: ${alert.suggestion}`);
    });
  } else {
    console.log('No alerts triggered');
  }
  
  // 5. Generate explanations for the emotion state
  
  // Sample features for explainability (would come from the detection models)
  const explainabilityFeatures: ExplainabilityFeatures = {
    facialFeatures: {
      gaze: 'direct',
      expression: 'smiling',
      dominantRegions: [
        { region: 'mouth', contribution: 0.7 },
        { region: 'eyes', contribution: 0.5 }
      ]
    },
    voiceFeatures: {
      pitchDescription: 'high',
      energyDescription: 'high',
      toneDescription: 'animated'
    },
    textFeatures: {
      dominantKeywords: ['happy', 'well', 'math'],
      sentiment: 'positive'
    }
  };
  
  // Get child-friendly explanation
  const childExplanation = ExplainabilityModule.forChild(emotionState);
  
  // Get adult/caregiver explanation
  const adultExplanation = ExplainabilityModule.forAdult(emotionState, explainabilityFeatures);
  
  // Get visual attribution data
  const attributionData = ExplainabilityModule.visualAttribution(emotionState, explainabilityFeatures);
  
  console.log('\nExplanations:');
  console.log(`Child-friendly: ${childExplanation.emoji} - ${childExplanation.description}`);
  console.log(`Adult/caregiver: ${adultExplanation}`);
  console.log(`Visual attribution data available: ${attributionData !== null}`);
  
  // 6. Store emotion data in the time capsule
  
  // Add the current emotion state
  timeCapsule.addEmotionState(emotionState);
  timeCapsule.addEmotionState(pastState1);
  timeCapsule.addEmotionState(pastState2);
  
  // Add a sample media entry (would be a reference to locally stored media)
  const mediaEntry: TimeCapsuleEntry = {
    mediaUrl: 'local://emotions/video_20230615_123045.mp4',
    type: 'video',
    emotionTag: emotionState.mood,
    intensity: emotionState.confidence,
    context: emotionState.context,
    notes: 'Recorded after getting math test results',
    timestamp: Date.now()
  };
  
  timeCapsule.addEntry(mediaEntry);
  
  // Generate a summary of the emotion history
  const timePeriod: TimePeriod = {
    start: Date.now() - 1000 * 60 * 60 * 24, // Last 24 hours
    end: Date.now(),
    label: 'Today'
  };
  
  const emotionSummary = timeCapsule.summarizeHistory(timePeriod);
  const therapistSummary = timeCapsule.generateTherapistSummary(timePeriod);
  
  console.log('\nEmotion History Summary:');
  console.log(`Dominant emotion: ${emotionSummary.dominantEmotion}`);
  console.log(`Emotional volatility: ${Math.round(emotionSummary.volatility * 100)}%`);
  console.log(`Therapist summary: ${therapistSummary}`);
  
  // 7. Generate an LLM summary (using template-based approach)
  const sessionSummary = await summarizer.summarizeSession(
    [emotionState, pastState1, pastState2],
    [mediaEntry],
    {
      audienceType: 'therapist',
      includeContexts: true,
      focusAreas: ['emotional_regulation', 'anxiety_management']
    }
  );
  
  console.log('\nLLM Session Summary:');
  console.log(sessionSummary.summary);
  console.log(`Emotional journey: ${sessionSummary.emotionalJourney}`);
  console.log(`Suggested focus: ${sessionSummary.suggestedFocus}`);
  
  // 8. Apply privacy controls
  console.log('\nPrivacy Controls:');
  console.log(`Initial privacy settings: ${JSON.stringify(privacyManager.getSettings())}`);
  
  // Update privacy settings
  privacyManager.updateSettings({
    shareWithCaregivers: true,
    dataRetentionDays: 30
  });
  
  console.log(`Updated privacy settings: ${JSON.stringify(privacyManager.getSettings())}`);
  
  // Apply privacy filters to data before sharing
  const filteredSummary = privacyManager.applyPrivacyFilters(sessionSummary);
  console.log(`Privacy-filtered data ready for sharing: ${filteredSummary !== null}`);
  
  // Clean up expired data
  privacyManager.cleanupExpiredData(timeCapsule, alertEngine);
  console.log('Expired data cleaned up according to retention policy');
  
  console.log('\nDemo completed');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runAICoreDemo().catch(console.error);
}
