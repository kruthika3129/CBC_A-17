# PsyTrack AI Core

The PsyTrack AI Core is a privacy-first emotion tracking system that processes multimodal inputs to deliver explainable emotional insights to caregivers, therapists, and children in real time.

## Features

### 1. Multimodal Emotion Fusion
- Processes inputs from facial expressions, voice tone, journal text, and wearable metrics
- Combines multiple modalities with dynamic weighting
- Produces a unified emotion state with confidence scores and source attribution

### 2. Context-Aware Alert System
- Detects emotional trends over time (e.g., sustained sadness for >10 minutes)
- Generates alerts with contextual suggestions
- Customizes alerts based on activity context

### 3. Explainability Module
- Provides child-friendly explanations with emojis and colors
- Generates detailed explanations for adults/caregivers
- Supports visual attribution for explainable AI

### 4. Emotion Time Capsule
- Stores emotion data and media references
- Analyzes historical patterns
- Generates summaries for therapists

### 5. LLM Summarizer
- Template-based summarization with optional LLM integration
- Generates session summaries with emotional journey narratives
- Provides suggested focus areas for therapy

### 6. Privacy Controls
- All processing happens on-device
- Configurable data sharing and retention policies
- Data anonymization options

## Usage

### Basic Emotion Detection

```typescript
import { MultimodalEmotionFusion } from './aiCore';

// Process multimodal inputs
const emotionState = MultimodalEmotionFusion.fuse(
  facialEmbedding,  // From facial recognition
  voiceFeatures,    // From voice analysis
  journalEntry,     // From text input
  wearableMetrics,  // From smartwatch/fitness tracker
  activity          // Current context
);

console.log(`Detected mood: ${emotionState.mood}`);
console.log(`Confidence: ${emotionState.confidence}`);
```

### Alert Detection

```typescript
import { EmotionAlertEngine } from './aiCore';

// Initialize alert engine
const alertEngine = new EmotionAlertEngine();

// Add emotion states as they are detected
alertEngine.addState(emotionState);

// Check for alerts
const alerts = alertEngine.checkAlerts(currentActivity);

// Process alerts
alerts.forEach(alert => {
  console.log(`Alert: ${alert.type} - ${alert.suggestion}`);
});
```

### Explainability

```typescript
import { ExplainabilityModule } from './aiCore';

// Get child-friendly explanation
const childExplanation = ExplainabilityModule.forChild(emotionState);
console.log(`${childExplanation.emoji} - ${childExplanation.description}`);

// Get detailed explanation for adults
const adultExplanation = ExplainabilityModule.forAdult(emotionState, features);
console.log(adultExplanation);
```

### Emotion History

```typescript
import { EmotionTimeCapsule } from './aiCore';

// Initialize time capsule
const timeCapsule = new EmotionTimeCapsule();

// Add emotion states and media entries
timeCapsule.addEmotionState(emotionState);
timeCapsule.addEntry(mediaEntry);

// Generate summaries
const summary = timeCapsule.summarizeHistory();
const therapistSummary = timeCapsule.generateTherapistSummary();
```

### Session Summarization

```typescript
import { LLMEmotionSummarizer } from './aiCore';

// Initialize summarizer
const summarizer = new LLMEmotionSummarizer();

// Generate session summary
const sessionSummary = await summarizer.summarizeSession(
  emotionStates,
  mediaEntries,
  {
    audienceType: 'therapist',
    includeContexts: true,
    focusAreas: ['emotional_regulation']
  }
);

console.log(sessionSummary.summary);
```

### Privacy Management

```typescript
import { PrivacyManager } from './aiCore';

// Initialize with default privacy-first settings
const privacyManager = new PrivacyManager();

// Update settings
privacyManager.updateSettings({
  shareWithTherapist: true,
  shareWithCaregivers: false,
  dataRetentionDays: 90
});

// Apply privacy filters before sharing data
const filteredData = privacyManager.applyPrivacyFilters(dataToShare);

// Clean up expired data
privacyManager.cleanupExpiredData(timeCapsule, alertEngine);
```

## Complete Example

See `aiCoreExample.ts` for a complete demonstration of the AI core functionality.

## Privacy Design

- All processing is on-device or edge-optimized
- Only embeddings/features are used, never raw video/audio
- Only inferred states and optional metadata are shared externally
- All classes are modular and testable for backend or in-browser use

## Testing

Run the tests with:

```
npm test
```

## License

MIT
