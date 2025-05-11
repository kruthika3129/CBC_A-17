// PsyTrack AI Core Module
// Privacy-first, modular, and testable TypeScript classes/interfaces for emotion tracking
// Designed for Node.js (Express), FastAPI (if ported to Python), or in-browser (TensorFlow.js)

// --- 1. Interfaces for Multimodal Inputs ---

export interface FacialEmbedding {
  embedding: number[]; // e.g., 128-dim vector
  confidence?: number; // 0-1 confidence score
  timestamp: number;
}

export interface VoiceFeatures {
  pitch: number;
  energy: number;
  tone: string; // e.g., 'flat', 'excited', etc.
  timestamp: number;
}

export interface JournalEntry {
  text: string;
  timestamp: number;
}

export interface WearableMetrics {
  heartRate?: number;
  stepCount?: number;
  timestamp: number;
}

export interface ActivityMetadata {
  activity: string; // e.g., 'math homework', 'break', etc.
  timestamp: number;
}

// --- 2. Unified Emotion State ---

export type EmotionCategory =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'calm'
  | 'excited'
  | 'tired'
  | 'frustrated'
  | 'focused'
  | 'overwhelmed'
  | 'neutral';

export interface EmotionState {
  mood: EmotionCategory;
  confidence: number; // 0-1
  sourceWeights: Record<string, number>; // e.g., {face: 0.4, voice: 0.3, journal: 0.2, wearable: 0.1}
  timestamp: number;
  context?: string; // e.g., 'during math homework'
}

// --- 3. Multimodal Fusion ---

// Utility types for emotion processing
interface EmotionPrediction {
  emotion: EmotionCategory;
  confidence: number;
}

interface ModalityResult {
  predictions: EmotionPrediction[];
  weight: number;
}

export class MultimodalEmotionFusion {
  // Predefined emotion keywords for text analysis
  private static emotionKeywords: Record<EmotionCategory, string[]> = {
    happy: ['happy', 'joy', 'delighted', 'pleased', 'cheerful', 'content', 'glad', 'thrilled'],
    sad: ['sad', 'unhappy', 'depressed', 'down', 'blue', 'gloomy', 'miserable', 'sorrow'],
    angry: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage', 'outraged', 'hostile'],
    anxious: ['anxious', 'worried', 'nervous', 'uneasy', 'tense', 'stressed', 'concerned', 'afraid'],
    calm: ['calm', 'peaceful', 'relaxed', 'tranquil', 'serene', 'composed', 'collected', 'quiet'],
    excited: ['excited', 'thrilled', 'eager', 'enthusiastic', 'animated', 'energetic', 'lively'],
    tired: ['tired', 'exhausted', 'sleepy', 'fatigued', 'drained', 'weary', 'lethargic'],
    frustrated: ['frustrated', 'annoyed', 'irritated', 'agitated', 'exasperated', 'bothered'],
    focused: ['focused', 'concentrated', 'attentive', 'engaged', 'absorbed', 'alert', 'mindful'],
    overwhelmed: ['overwhelmed', 'swamped', 'overloaded', 'stressed', 'burdened', 'pressured'],
    neutral: ['neutral', 'okay', 'fine', 'average', 'indifferent', 'balanced', 'moderate']
  };

  // Process facial embeddings to predict emotions
  private static processFacialEmbedding(face: FacialEmbedding): ModalityResult {
    // In a real implementation, this would use a pre-trained model to map embeddings to emotions
    // For this example, we'll use a simplified approach

    // Normalize the embedding vector (assuming it's a feature vector)
    const normalizedEmbedding = this.normalizeVector(face.embedding);

    // Simulate emotion predictions based on embedding patterns
    // This is a placeholder - in a real system, you would use a proper ML model
    const predictions: EmotionPrediction[] = [];

    // Example: Use the first few dimensions to simulate emotion predictions
    // In reality, you would use a proper classifier or similarity measure
    if (normalizedEmbedding.length > 0) {
      const val1 = normalizedEmbedding[0];
      const val2 = normalizedEmbedding.length > 1 ? normalizedEmbedding[1] : 0;

      // Simple heuristic mapping of embedding values to emotions
      if (val1 > 0.7) {
        predictions.push({ emotion: 'happy', confidence: val1 });
        predictions.push({ emotion: 'excited', confidence: val1 * 0.8 });
      } else if (val1 < 0.3) {
        predictions.push({ emotion: 'sad', confidence: 1 - val1 });
        predictions.push({ emotion: 'tired', confidence: (1 - val1) * 0.7 });
      } else if (val2 > 0.6) {
        predictions.push({ emotion: 'angry', confidence: val2 });
        predictions.push({ emotion: 'frustrated', confidence: val2 * 0.9 });
      } else if (val2 < 0.3) {
        predictions.push({ emotion: 'calm', confidence: 1 - val2 });
        predictions.push({ emotion: 'focused', confidence: (1 - val2) * 0.8 });
      } else {
        predictions.push({ emotion: 'neutral', confidence: 0.6 });
        predictions.push({ emotion: 'focused', confidence: 0.4 });
      }
    } else {
      // Default if we can't make a prediction
      predictions.push({ emotion: 'neutral', confidence: 0.5 });
    }

    // Sort by confidence
    predictions.sort((a, b) => b.confidence - a.confidence);

    return {
      predictions: predictions.slice(0, 3), // Top 3 predictions
      weight: 0.4 // Facial expressions are typically reliable indicators
    };
  }

  // Process voice features to predict emotions
  private static processVoiceFeatures(voice: VoiceFeatures): ModalityResult {
    const predictions: EmotionPrediction[] = [];

    // Normalize pitch and energy to 0-1 scale (assuming they're already in a reasonable range)
    const normalizedPitch = this.clamp(voice.pitch, 0, 1);
    const normalizedEnergy = this.clamp(voice.energy, 0, 1);

    // High energy + high pitch often indicates excitement or happiness
    if (normalizedEnergy > 0.7 && normalizedPitch > 0.7) {
      predictions.push({ emotion: 'excited', confidence: normalizedEnergy * 0.9 });
      predictions.push({ emotion: 'happy', confidence: normalizedPitch * 0.8 });
    }
    // High energy + low pitch might indicate anger
    else if (normalizedEnergy > 0.7 && normalizedPitch < 0.4) {
      predictions.push({ emotion: 'angry', confidence: normalizedEnergy * 0.85 });
      predictions.push({ emotion: 'frustrated', confidence: (1 - normalizedPitch) * 0.7 });
    }
    // Low energy + low pitch could be sadness or tiredness
    else if (normalizedEnergy < 0.3 && normalizedPitch < 0.4) {
      predictions.push({ emotion: 'sad', confidence: (1 - normalizedEnergy) * 0.8 });
      predictions.push({ emotion: 'tired', confidence: (1 - normalizedPitch) * 0.75 });
    }
    // Low energy + medium/high pitch might be anxiety
    else if (normalizedEnergy < 0.3 && normalizedPitch > 0.6) {
      predictions.push({ emotion: 'anxious', confidence: normalizedPitch * 0.7 });
      predictions.push({ emotion: 'overwhelmed', confidence: (1 - normalizedEnergy) * 0.6 });
    }
    // Medium energy and pitch might be calm or neutral
    else {
      predictions.push({ emotion: 'calm', confidence: 0.6 });
      predictions.push({ emotion: 'neutral', confidence: 0.5 });
    }

    // Also consider the tone label if available
    if (voice.tone) {
      switch (voice.tone.toLowerCase()) {
        case 'excited':
          predictions.push({ emotion: 'excited', confidence: 0.85 });
          break;
        case 'flat':
          predictions.push({ emotion: 'neutral', confidence: 0.8 });
          predictions.push({ emotion: 'tired', confidence: 0.6 });
          break;
        case 'angry':
          predictions.push({ emotion: 'angry', confidence: 0.9 });
          break;
        case 'sad':
          predictions.push({ emotion: 'sad', confidence: 0.85 });
          break;
        case 'happy':
          predictions.push({ emotion: 'happy', confidence: 0.8 });
          break;
        // Add more tone mappings as needed
      }
    }

    // Sort by confidence and remove duplicates
    const uniquePredictions = this.getUniquePredictions(predictions);

    return {
      predictions: uniquePredictions.slice(0, 3), // Top 3 predictions
      weight: 0.3 // Voice is a good indicator but can be affected by environment
    };
  }

  // Process journal text to predict emotions
  private static processJournalText(journal: JournalEntry): ModalityResult {
    const text = journal.text.toLowerCase();
    const predictions: EmotionPrediction[] = [];

    // Count occurrences of emotion keywords
    const emotionCounts: Record<EmotionCategory, number> = {
      happy: 0, sad: 0, angry: 0, anxious: 0, calm: 0,
      excited: 0, tired: 0, frustrated: 0, focused: 0,
      overwhelmed: 0, neutral: 0
    };

    // Check for each emotion's keywords
    Object.entries(this.emotionKeywords).forEach(([emotion, keywords]) => {
      keywords.forEach(keyword => {
        // Count occurrences of the keyword
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          emotionCounts[emotion as EmotionCategory] += matches.length;
        }
      });
    });

    // Convert counts to predictions with confidence scores
    let totalMatches = 0;
    Object.values(emotionCounts).forEach(count => totalMatches += count);

    if (totalMatches > 0) {
      // Create predictions based on keyword matches
      Object.entries(emotionCounts).forEach(([emotion, count]) => {
        if (count > 0) {
          const confidence = Math.min(count / totalMatches, 0.95); // Cap at 0.95
          predictions.push({
            emotion: emotion as EmotionCategory,
            confidence
          });
        }
      });
    } else {
      // If no keywords matched, default to neutral with low confidence
      predictions.push({ emotion: 'neutral', confidence: 0.4 });
    }

    // Sort by confidence
    predictions.sort((a, b) => b.confidence - a.confidence);

    return {
      predictions: predictions.slice(0, 3), // Top 3 predictions
      weight: 0.25 // Journal text is explicit but might not capture subtle emotions
    };
  }

  // Process wearable metrics to predict emotions
  private static processWearableMetrics(wearable: WearableMetrics): ModalityResult {
    const predictions: EmotionPrediction[] = [];

    // Default to neutral with low confidence if no metrics available
    if (!wearable.heartRate && !wearable.stepCount) {
      predictions.push({ emotion: 'neutral', confidence: 0.3 });
      return { predictions, weight: 0.1 };
    }

    // Process heart rate if available
    if (wearable.heartRate) {
      // Simplified heart rate interpretation
      // In reality, this would be personalized to the user's baseline
      if (wearable.heartRate > 100) {
        // High heart rate could indicate excitement, anxiety, or physical activity
        if (wearable.stepCount && wearable.stepCount > 100) {
          // If step count is high, likely physical activity
          predictions.push({ emotion: 'excited', confidence: 0.7 });
        } else {
          // If step count is low, might be anxiety
          predictions.push({ emotion: 'anxious', confidence: 0.65 });
          predictions.push({ emotion: 'excited', confidence: 0.4 });
        }
      } else if (wearable.heartRate < 60) {
        // Low heart rate might indicate calm or tired
        predictions.push({ emotion: 'calm', confidence: 0.6 });
        predictions.push({ emotion: 'tired', confidence: 0.5 });
      } else {
        // Normal heart rate
        predictions.push({ emotion: 'neutral', confidence: 0.5 });
        predictions.push({ emotion: 'focused', confidence: 0.4 });
      }
    }

    // Process step count if available
    if (wearable.stepCount) {
      if (wearable.stepCount > 120) {
        // High activity
        predictions.push({ emotion: 'excited', confidence: 0.6 });
      } else if (wearable.stepCount < 20) {
        // Low activity
        predictions.push({ emotion: 'calm', confidence: 0.5 });
        predictions.push({ emotion: 'focused', confidence: 0.4 });
      }
    }

    // Sort by confidence and remove duplicates
    const uniquePredictions = this.getUniquePredictions(predictions);

    return {
      predictions: uniquePredictions.slice(0, 3), // Top 3 predictions
      weight: 0.15 // Wearable data is objective but less directly tied to emotions
    };
  }

  // Utility function to normalize a vector
  private static normalizeVector(vector: number[]): number[] {
    if (vector.length === 0) return [];

    // Find the magnitude
    let magnitude = 0;
    for (const val of vector) {
      magnitude += val * val;
    }
    magnitude = Math.sqrt(magnitude);

    // Avoid division by zero
    if (magnitude === 0) return vector.map(() => 0);

    // Normalize
    return vector.map(val => val / magnitude);
  }

  // Utility function to clamp a value between min and max
  private static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // Utility function to get unique predictions (by emotion)
  private static getUniquePredictions(predictions: EmotionPrediction[]): EmotionPrediction[] {
    const uniquePredictions: EmotionPrediction[] = [];
    const seenEmotions = new Set<EmotionCategory>();

    predictions.sort((a, b) => b.confidence - a.confidence);

    for (const pred of predictions) {
      if (!seenEmotions.has(pred.emotion)) {
        uniquePredictions.push(pred);
        seenEmotions.add(pred.emotion);
      }
    }

    return uniquePredictions;
  }

  // Main fusion function
  static fuse(
    face: FacialEmbedding | null,
    voice: VoiceFeatures | null,
    journal: JournalEntry | null,
    wearable: WearableMetrics | null,
    activity?: ActivityMetadata
  ): EmotionState {
    // Process each available modality
    const results: ModalityResult[] = [];

    if (face) {
      results.push(this.processFacialEmbedding(face));
    }

    if (voice) {
      results.push(this.processVoiceFeatures(voice));
    }

    if (journal) {
      results.push(this.processJournalText(journal));
    }

    if (wearable) {
      results.push(this.processWearableMetrics(wearable));
    }

    // If no modalities are available, return neutral state
    if (results.length === 0) {
      return {
        mood: 'neutral',
        confidence: 0.3,
        sourceWeights: {},
        timestamp: Date.now(),
        context: activity?.activity
      };
    }

    // Combine predictions from all modalities
    const emotionScores: Record<EmotionCategory, { score: number, count: number }> = {
      happy: { score: 0, count: 0 },
      sad: { score: 0, count: 0 },
      angry: { score: 0, count: 0 },
      anxious: { score: 0, count: 0 },
      calm: { score: 0, count: 0 },
      excited: { score: 0, count: 0 },
      tired: { score: 0, count: 0 },
      frustrated: { score: 0, count: 0 },
      focused: { score: 0, count: 0 },
      overwhelmed: { score: 0, count: 0 },
      neutral: { score: 0, count: 0 }
    };

    // Calculate total weight for normalization
    let totalWeight = 0;
    results.forEach(result => totalWeight += result.weight);

    // Normalize weights if needed
    if (totalWeight > 0) {
      results.forEach(result => {
        const normalizedWeight = result.weight / totalWeight;

        // Add weighted scores for each emotion prediction
        result.predictions.forEach(pred => {
          emotionScores[pred.emotion].score += pred.confidence * normalizedWeight;
          emotionScores[pred.emotion].count += 1;
        });
      });
    }

    // Find the emotion with the highest score
    let topEmotion: EmotionCategory = 'neutral';
    let topScore = 0;

    Object.entries(emotionScores).forEach(([emotion, data]) => {
      if (data.score > topScore) {
        topScore = data.score;
        topEmotion = emotion as EmotionCategory;
      }
    });

    // Calculate confidence based on agreement and score
    // Higher if multiple modalities agree
    const agreementFactor = emotionScores[topEmotion].count / results.length;
    const confidence = topScore * (0.7 + 0.3 * agreementFactor);

    // Create source weights for the result
    const sourceWeights: Record<string, number> = {};

    if (face) sourceWeights.face = results.find(r => r === this.processFacialEmbedding(face))?.weight || 0;
    if (voice) sourceWeights.voice = results.find(r => r === this.processVoiceFeatures(voice))?.weight || 0;
    if (journal) sourceWeights.journal = results.find(r => r === this.processJournalText(journal))?.weight || 0;
    if (wearable) sourceWeights.wearable = results.find(r => r === this.processWearableMetrics(wearable))?.weight || 0;

    // Normalize source weights to sum to 1
    const sourceWeightSum = Object.values(sourceWeights).reduce((sum, weight) => sum + weight, 0);
    if (sourceWeightSum > 0) {
      Object.keys(sourceWeights).forEach(key => {
        sourceWeights[key] = sourceWeights[key] / sourceWeightSum;
      });
    }

    // Return the unified emotion state
    return {
      mood: topEmotion,
      confidence: this.clamp(confidence, 0, 1),
      sourceWeights,
      timestamp: Date.now(),
      context: activity?.activity
    };
  }
}

// --- 4. Alert System ---

export type AlertType =
  | 'sustained_negative'
  | 'sudden_change'
  | 'recurring_pattern'
  | 'intensity_spike'
  | 'prolonged_fatigue'
  | 'emotional_volatility'
  | 'positive_trend';

export interface EmotionAlert {
  type: AlertType;
  emotion: EmotionCategory;
  suggestion: string;
  context?: string;
  severity: 'low' | 'medium' | 'high';
  triggeredAt: number;
  duration?: number; // Duration in milliseconds for sustained emotions
}

export class EmotionAlertEngine {
  private history: EmotionState[] = [];
  private maxHistoryLength: number = 100; // Limit history to prevent memory issues
  private lastAlertTime: Record<AlertType, number> = {
    sustained_negative: 0,
    sudden_change: 0,
    recurring_pattern: 0,
    intensity_spike: 0,
    prolonged_fatigue: 0,
    emotional_volatility: 0,
    positive_trend: 0
  };

  // Minimum time between alerts of the same type (to prevent alert fatigue)
  private alertCooldown: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Configuration for alert thresholds
  private config = {
    // Time thresholds (in milliseconds)
    sustainedEmotionTime: 10 * 60 * 1000, // 10 minutes
    suddenChangeWindow: 5 * 60 * 1000, // 5 minutes
    volatilityWindow: 30 * 60 * 1000, // 30 minutes

    // Confidence thresholds
    minConfidence: 0.6, // Minimum confidence to consider an emotion valid
    changeThreshold: 0.4, // Minimum change in emotion to consider it significant

    // Number of changes to consider emotional volatility
    volatilityThreshold: 4
  };

  constructor(config?: Partial<typeof EmotionAlertEngine.prototype.config>) {
    // Allow custom configuration
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Add a new emotion state to the history
  addState(state: EmotionState) {
    // Only add states with sufficient confidence
    if (state.confidence >= this.config.minConfidence) {
      this.history.push(state);

      // Trim history if it exceeds the maximum length
      if (this.history.length > this.maxHistoryLength) {
        this.history.shift();
      }
    }
  }

  // Check for alerts based on the current emotion history
  checkAlerts(activity?: ActivityMetadata): EmotionAlert[] {
    const alerts: EmotionAlert[] = [];
    const now = Date.now();

    // Skip if we don't have enough history
    if (this.history.length < 2) {
      return alerts;
    }

    // Check for sustained negative emotions
    const sustainedAlert = this.checkSustainedEmotions(now);
    if (sustainedAlert) alerts.push(sustainedAlert);

    // Check for sudden changes in emotion
    const suddenChangeAlert = this.checkSuddenChanges(now);
    if (suddenChangeAlert) alerts.push(suddenChangeAlert);

    // Check for emotional volatility
    const volatilityAlert = this.checkEmotionalVolatility(now);
    if (volatilityAlert) alerts.push(volatilityAlert);

    // Check for positive trends
    const positiveAlert = this.checkPositiveTrends(now);
    if (positiveAlert) alerts.push(positiveAlert);

    // Add context from activity if available
    if (activity) {
      alerts.forEach(alert => {
        alert.context = activity.activity;
      });

      // Customize suggestions based on activity
      this.customizeSuggestions(alerts, activity);
    }

    return alerts;
  }

  // Check for sustained negative emotions (e.g., sadness, anxiety, anger)
  private checkSustainedEmotions(now: number): EmotionAlert | null {
    // Skip if on cooldown
    if (now - this.lastAlertTime.sustained_negative < this.alertCooldown) {
      return null;
    }

    const negativeEmotions: EmotionCategory[] = ['sad', 'anxious', 'angry', 'frustrated', 'overwhelmed'];
    const tiredEmotions: EmotionCategory[] = ['tired'];

    // Check for sustained negative emotions
    for (const emotion of negativeEmotions) {
      const sustainedResult = this.isSustainedEmotion(emotion, this.config.sustainedEmotionTime);

      if (sustainedResult.isSustained) {
        this.lastAlertTime.sustained_negative = now;

        return {
          type: 'sustained_negative',
          emotion: emotion,
          suggestion: this.getSuggestionForEmotion(emotion),
          severity: this.getSeverity(sustainedResult.duration, emotion),
          triggeredAt: now,
          duration: sustainedResult.duration
        };
      }
    }

    // Check for prolonged fatigue
    for (const emotion of tiredEmotions) {
      const sustainedResult = this.isSustainedEmotion(emotion, this.config.sustainedEmotionTime * 1.5); // Longer threshold for fatigue

      if (sustainedResult.isSustained) {
        this.lastAlertTime.prolonged_fatigue = now;

        return {
          type: 'prolonged_fatigue',
          emotion: emotion,
          suggestion: 'Consider taking a rest or short nap if possible. Hydrate and take a break from screens.',
          severity: 'medium',
          triggeredAt: now,
          duration: sustainedResult.duration
        };
      }
    }

    return null;
  }

  // Check if an emotion has been sustained for a specified duration
  private isSustainedEmotion(emotion: EmotionCategory, minDuration: number): { isSustained: boolean, duration: number } {
    if (this.history.length < 2) {
      return { isSustained: false, duration: 0 };
    }

    // Start from the most recent state
    const latestState = this.history[this.history.length - 1];
    if (latestState.mood !== emotion) {
      return { isSustained: false, duration: 0 };
    }

    // Find the earliest state with the same emotion in sequence
    let startIndex = this.history.length - 2;
    while (startIndex >= 0 && this.history[startIndex].mood === emotion) {
      startIndex--;
    }

    // We went one too far back
    startIndex++;

    // Calculate the duration
    const startTime = this.history[startIndex].timestamp;
    const endTime = latestState.timestamp;
    const duration = endTime - startTime;

    return {
      isSustained: duration >= minDuration,
      duration: duration
    };
  }

  // Check for sudden changes in emotion
  private checkSuddenChanges(now: number): EmotionAlert | null {
    // Skip if on cooldown
    if (now - this.lastAlertTime.sudden_change < this.alertCooldown) {
      return null;
    }

    // Need at least 2 states to detect a change
    if (this.history.length < 2) {
      return null;
    }

    const latestState = this.history[this.history.length - 1];
    const previousState = this.history[this.history.length - 2];

    // Check if the emotion has changed and is recent enough
    const isRecentChange = (now - latestState.timestamp) < this.config.suddenChangeWindow;
    const isDifferentEmotion = latestState.mood !== previousState.mood;
    const isSignificantChange = this.isSignificantEmotionChange(previousState.mood, latestState.mood);

    if (isRecentChange && isDifferentEmotion && isSignificantChange) {
      this.lastAlertTime.sudden_change = now;

      // Determine if it's a positive or negative change
      const isNegativeChange = this.isNegativeEmotion(latestState.mood) && !this.isNegativeEmotion(previousState.mood);

      return {
        type: 'sudden_change',
        emotion: latestState.mood,
        suggestion: isNegativeChange
          ? `Noticed a shift to ${latestState.mood}. Take a moment to breathe and reflect on what triggered this change.`
          : `Your mood has shifted to ${latestState.mood}. Notice what's working well for you right now.`,
        severity: isNegativeChange ? 'medium' : 'low',
        triggeredAt: now
      };
    }

    return null;
  }

  // Check for emotional volatility (multiple changes in a short period)
  private checkEmotionalVolatility(now: number): EmotionAlert | null {
    // Skip if on cooldown
    if (now - this.lastAlertTime.emotional_volatility < this.alertCooldown * 2) { // Longer cooldown for volatility
      return null;
    }

    // Need enough history to detect volatility
    if (this.history.length < 4) {
      return null;
    }

    // Look at states within the volatility window
    const recentStates = this.history.filter(state =>
      (now - state.timestamp) <= this.config.volatilityWindow
    );

    if (recentStates.length < 3) {
      return null;
    }

    // Count emotion changes
    let changes = 0;
    for (let i = 1; i < recentStates.length; i++) {
      if (recentStates[i].mood !== recentStates[i - 1].mood) {
        changes++;
      }
    }

    if (changes >= this.config.volatilityThreshold) {
      this.lastAlertTime.emotional_volatility = now;

      return {
        type: 'emotional_volatility',
        emotion: recentStates[recentStates.length - 1].mood,
        suggestion: 'Your emotions have been changing frequently. Consider a grounding exercise or taking a break from stimulating activities.',
        severity: 'high',
        triggeredAt: now
      };
    }

    return null;
  }

  // Check for positive trends
  private checkPositiveTrends(now: number): EmotionAlert | null {
    // Skip if on cooldown
    if (now - this.lastAlertTime.positive_trend < this.alertCooldown * 3) { // Even longer cooldown for positive alerts
      return null;
    }

    // Need enough history
    if (this.history.length < 5) {
      return null;
    }

    // Look at the last 5 states
    const recentStates = this.history.slice(-5);

    // Count positive emotions
    const positiveEmotions = recentStates.filter(state =>
      ['happy', 'excited', 'calm', 'focused'].includes(state.mood)
    );

    // If most recent states are positive and there are enough of them
    if (positiveEmotions.length >= 4 &&
      ['happy', 'excited', 'calm', 'focused'].includes(recentStates[recentStates.length - 1].mood)) {

      this.lastAlertTime.positive_trend = now;

      return {
        type: 'positive_trend',
        emotion: recentStates[recentStates.length - 1].mood,
        suggestion: 'You\'ve been maintaining a positive emotional state. Great job! Take note of what\'s working well for you.',
        severity: 'low',
        triggeredAt: now
      };
    }

    return null;
  }

  // Determine if an emotion change is significant
  private isSignificantEmotionChange(from: EmotionCategory, to: EmotionCategory): boolean {
    // Define emotion groups
    const positiveEmotions: EmotionCategory[] = ['happy', 'excited', 'calm', 'focused'];
    const negativeEmotions: EmotionCategory[] = ['sad', 'angry', 'anxious', 'frustrated', 'overwhelmed'];
    const neutralEmotions: EmotionCategory[] = ['neutral', 'tired'];

    // Check if the emotions are in different groups (using neutral as fallback)
    const fromGroup = positiveEmotions.includes(from)
      ? 'positive'
      : negativeEmotions.includes(from)
        ? 'negative'
        : 'neutral';

    const toGroup = positiveEmotions.includes(to)
      ? 'positive'
      : negativeEmotions.includes(to)
        ? 'negative'
        : 'neutral';

    // A change between different groups is significant
    return fromGroup !== toGroup;
  }

  // Check if an emotion is considered negative
  private isNegativeEmotion(emotion: EmotionCategory): boolean {
    return ['sad', 'angry', 'anxious', 'frustrated', 'overwhelmed'].includes(emotion);
  }

  // Get a suggestion based on the emotion
  private getSuggestionForEmotion(emotion: EmotionCategory): string {
    switch (emotion) {
      case 'sad':
        return 'You\'ve been feeling sad for a while. Consider reaching out to someone you trust or doing an activity you enjoy.';
      case 'anxious':
        return 'You\'ve been feeling anxious. Try a deep breathing exercise: breathe in for 4 counts, hold for 4, and exhale for 6.';
      case 'angry':
        return 'You\'ve been feeling angry. Consider taking a short break or trying a physical activity to release tension.';
      case 'frustrated':
        return 'You\'ve been feeling frustrated. It might help to step away from the current task and return to it later with fresh eyes.';
      case 'overwhelmed':
        return 'You\'ve been feeling overwhelmed. Try breaking down your tasks into smaller steps and focus on one thing at a time.';
      default:
        return 'Consider taking a short break to check in with yourself.';
    }
  }

  // Determine alert severity based on duration and emotion
  private getSeverity(duration: number, emotion: EmotionCategory): 'low' | 'medium' | 'high' {
    // High-priority emotions get higher severity
    const highPriorityEmotions: EmotionCategory[] = ['anxious', 'overwhelmed', 'angry'];

    if (highPriorityEmotions.includes(emotion)) {
      if (duration > this.config.sustainedEmotionTime * 1.5) {
        return 'high';
      } else {
        return 'medium';
      }
    } else {
      if (duration > this.config.sustainedEmotionTime * 2) {
        return 'medium';
      } else {
        return 'low';
      }
    }
  }

  // Customize suggestions based on activity context
  private customizeSuggestions(alerts: EmotionAlert[], activity: ActivityMetadata): void {
    const activityLower = activity.activity.toLowerCase();

    alerts.forEach(alert => {
      // Customize based on activity type
      if (activityLower.includes('homework') || activityLower.includes('study')) {
        if (alert.emotion === 'frustrated' || alert.emotion === 'overwhelmed') {
          alert.suggestion = 'Consider taking a short break from your homework. Try the Pomodoro technique: 25 minutes of focus followed by a 5-minute break.';
        } else if (alert.emotion === 'tired') {
          alert.suggestion = 'You seem tired while studying. A short walk or stretching might help restore your energy.';
        }
      } else if (activityLower.includes('game') || activityLower.includes('play')) {
        if (alert.emotion === 'angry' || alert.emotion === 'frustrated') {
          alert.suggestion = 'Games can sometimes be frustrating. Remember it\'s okay to take a break and come back to it later.';
        }
      } else if (activityLower.includes('social') || activityLower.includes('friend') || activityLower.includes('family')) {
        if (alert.emotion === 'anxious' || alert.emotion === 'overwhelmed') {
          alert.suggestion = 'Social situations can be overwhelming. It\'s okay to take a few minutes alone to recharge if needed.';
        }
      }
    });
  }

  // Clear history (e.g., for a new session)
  clearHistory(): void {
    this.history = [];
  }

  // Get the current history (e.g., for debugging or visualization)
  getHistory(): EmotionState[] {
    return [...this.history];
  }
}

// --- 5. Explainability Module ---

// Types for explainability features
export interface ExplainabilityFeatures {
  facialFeatures?: {
    gaze?: 'upward' | 'downward' | 'direct' | 'averted' | 'right' | 'left';
    expression?: string;
    dominantRegions?: Array<{ region: string, contribution: number }>;
  };
  voiceFeatures?: {
    pitchDescription?: 'high' | 'low' | 'medium' | 'variable';
    energyDescription?: 'high' | 'low' | 'medium' | 'variable';
    toneDescription?: string;
  };
  textFeatures?: {
    dominantKeywords?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
  wearableFeatures?: {
    heartRateDescription?: 'elevated' | 'normal' | 'low';
    activityLevel?: 'active' | 'sedentary' | 'moderate';
  };
  eyeTrackingFeatures?: {
    blinkRate?: number;
    pupilDilation?: number;
    focusPoint?: string;
  };
  demographics?: {
    age?: string;
    gender?: string;
    ethnicity?: string;
    [key: string]: string | undefined;
  };
}

// Visual representation for child-friendly explanations
export interface ChildFriendlyVisual {
  emoji: string;
  color: string;
  description: string;
}

// Attribution data for visualization
export interface AttributionData {
  facialRegions?: Record<string, number>; // Region name -> contribution score
  textHighlights?: Array<{ word: string, score: number }>;
  voiceAttributes?: Record<string, number>; // Feature name -> contribution score
  wearableAttributes?: Record<string, number>; // Feature name -> contribution score
}

export class ExplainabilityModule {
  // Emoji and color mappings for child-friendly explanations
  private static emotionVisuals: Record<EmotionCategory, ChildFriendlyVisual> = {
    happy: {
      emoji: '😊',
      color: '#FFD700', // Gold
      description: 'You seem happy and cheerful!'
    },
    sad: {
      emoji: '😢',
      color: '#6495ED', // Cornflower Blue
      description: 'You seem a bit sad. That\'s okay!'
    },
    angry: {
      emoji: '😠',
      color: '#FF4500', // Orange Red
      description: 'You seem upset about something.'
    },
    anxious: {
      emoji: '😰',
      color: '#9370DB', // Medium Purple
      description: 'You seem worried or nervous.'
    },
    calm: {
      emoji: '😌',
      color: '#98FB98', // Pale Green
      description: 'You seem peaceful and relaxed.'
    },
    excited: {
      emoji: '😃',
      color: '#FFA500', // Orange
      description: 'You seem really excited!'
    },
    tired: {
      emoji: '😴',
      color: '#B0C4DE', // Light Steel Blue
      description: 'You seem tired or sleepy.'
    },
    frustrated: {
      emoji: '😤',
      color: '#CD5C5C', // Indian Red
      description: 'You seem frustrated with something.'
    },
    focused: {
      emoji: '🧐',
      color: '#87CEEB', // Sky Blue
      description: 'You seem very focused and concentrated.'
    },
    overwhelmed: {
      emoji: '😵',
      color: '#DA70D6', // Orchid
      description: 'You seem like you have a lot going on.'
    },
    neutral: {
      emoji: '😐',
      color: '#E0E0E0', // Light Gray
      description: 'You seem calm and neutral.'
    }
  };

  // Generate child-friendly explanation
  static forChild(state: EmotionState): ChildFriendlyVisual {
    // Return the visual representation for the detected mood
    return this.emotionVisuals[state.mood] || this.emotionVisuals.neutral;
  }

  // Generate detailed explanation for adults/caregivers
  static forAdult(state: EmotionState, features?: ExplainabilityFeatures): string {
    // Start with a basic explanation based on the detected emotion
    let explanation = `Detected ${state.mood} mood with ${Math.round(state.confidence * 100)}% confidence. `;

    // Add information about which sources contributed most
    if (Object.keys(state.sourceWeights).length > 0) {
      const primarySource = Object.entries(state.sourceWeights)
        .sort((a, b) => b[1] - a[1])[0];

      explanation += `Primary indicator: ${this.formatSourceName(primarySource[0])} `;

      // Add context if available
      if (state.context) {
        explanation += `during ${state.context}. `;
      } else {
        explanation += '. ';
      }
    }

    // Add detailed explanation based on available features
    if (features) {
      explanation += this.generateDetailedExplanation(state.mood, features);
    }

    return explanation;
  }

  // Generate visual attribution data for explainability
  static visualAttribution(_state: EmotionState, features?: ExplainabilityFeatures): AttributionData | null {
    if (!features) return null;

    const attributionData: AttributionData = {};

    // Process facial features if available
    if (features.facialFeatures?.dominantRegions) {
      attributionData.facialRegions = {};
      features.facialFeatures.dominantRegions.forEach(region => {
        attributionData.facialRegions![region.region] = region.contribution;
      });
    }

    // Process text features if available
    if (features.textFeatures?.dominantKeywords) {
      attributionData.textHighlights = features.textFeatures.dominantKeywords.map(word => ({
        word,
        score: 0.8 // Placeholder score, would be calculated based on actual contribution
      }));
    }

    // Process voice features if available
    if (features.voiceFeatures) {
      attributionData.voiceAttributes = {};
      if (features.voiceFeatures.pitchDescription) {
        attributionData.voiceAttributes['pitch'] = this.getAttributeScore(features.voiceFeatures.pitchDescription);
      }
      if (features.voiceFeatures.energyDescription) {
        attributionData.voiceAttributes['energy'] = this.getAttributeScore(features.voiceFeatures.energyDescription);
      }
      if (features.voiceFeatures.toneDescription) {
        attributionData.voiceAttributes['tone'] = 0.7; // Placeholder
      }
    }

    // Process wearable features if available
    if (features.wearableFeatures) {
      attributionData.wearableAttributes = {};
      if (features.wearableFeatures.heartRateDescription) {
        attributionData.wearableAttributes['heartRate'] =
          features.wearableFeatures.heartRateDescription === 'elevated' ? 0.8 :
            features.wearableFeatures.heartRateDescription === 'low' ? 0.6 : 0.4;
      }
      if (features.wearableFeatures.activityLevel) {
        attributionData.wearableAttributes['activity'] =
          features.wearableFeatures.activityLevel === 'active' ? 0.7 :
            features.wearableFeatures.activityLevel === 'sedentary' ? 0.5 : 0.3;
      }
    }

    return attributionData;
  }

  // Helper method to format source names for explanations
  private static formatSourceName(source: string): string {
    switch (source) {
      case 'face': return 'facial expression';
      case 'voice': return 'voice tone';
      case 'journal': return 'journal text';
      case 'wearable': return 'physical signals';
      default: return source;
    }
  }

  // Helper method to generate detailed explanation based on features
  private static generateDetailedExplanation(mood: EmotionCategory, features: ExplainabilityFeatures): string {
    let details = '';

    // Add facial feature details
    if (features.facialFeatures) {
      if (features.facialFeatures.gaze) {
        details += `Detected ${features.facialFeatures.gaze} gaze. `;
      }
      if (features.facialFeatures.expression) {
        details += `Facial expression: ${features.facialFeatures.expression}. `;
      }
    }

    // Add voice feature details
    if (features.voiceFeatures) {
      const voiceDetails = [];

      if (features.voiceFeatures.pitchDescription) {
        voiceDetails.push(`${features.voiceFeatures.pitchDescription} pitch`);
      }
      if (features.voiceFeatures.energyDescription) {
        voiceDetails.push(`${features.voiceFeatures.energyDescription} energy`);
      }
      if (features.voiceFeatures.toneDescription) {
        voiceDetails.push(`${features.voiceFeatures.toneDescription} tone`);
      }

      if (voiceDetails.length > 0) {
        details += `Voice showed ${voiceDetails.join(', ')}. `;
      }
    }

    // Add text feature details
    if (features.textFeatures) {
      if (features.textFeatures.sentiment) {
        details += `Text expressed ${features.textFeatures.sentiment} sentiment. `;
      }
      if (features.textFeatures.dominantKeywords && features.textFeatures.dominantKeywords.length > 0) {
        details += `Key words: ${features.textFeatures.dominantKeywords.slice(0, 3).join(', ')}. `;
      }
    }

    // Add wearable feature details
    if (features.wearableFeatures) {
      if (features.wearableFeatures.heartRateDescription) {
        details += `Heart rate was ${features.wearableFeatures.heartRateDescription}. `;
      }
      if (features.wearableFeatures.activityLevel) {
        details += `Activity level was ${features.wearableFeatures.activityLevel}. `;
      }
    }

    // Add emotion-specific interpretation
    details += this.getEmotionInterpretation(mood);

    return details;
  }

  // Helper method to get emotion-specific interpretation
  private static getEmotionInterpretation(mood: EmotionCategory): string {
    switch (mood) {
      case 'happy':
        return 'These signals typically indicate a positive emotional state.';
      case 'sad':
        return 'These patterns are often associated with sadness or low mood.';
      case 'angry':
        return 'These indicators suggest frustration or anger.';
      case 'anxious':
        return 'This combination of signals often indicates anxiety or worry.';
      case 'calm':
        return 'These patterns suggest a relaxed, balanced state.';
      case 'excited':
        return 'These signals indicate heightened positive arousal or excitement.';
      case 'tired':
        return 'These patterns are consistent with fatigue or low energy.';
      case 'frustrated':
        return 'These indicators suggest frustration with a situation or task.';
      case 'focused':
        return 'These patterns indicate concentration and mental engagement.';
      case 'overwhelmed':
        return 'This combination of signals suggests feeling overwhelmed by stimuli or demands.';
      case 'neutral':
        return 'These signals indicate a balanced, neutral emotional state.';
      default:
        return 'The pattern of signals suggests this emotional state.';
    }
  }

  // Helper method to convert descriptive attributes to numeric scores
  private static getAttributeScore(description: string): number {
    switch (description) {
      case 'high':
      case 'elevated':
      case 'active':
        return 0.8;
      case 'medium':
      case 'moderate':
      case 'variable':
        return 0.5;
      case 'low':
      case 'sedentary':
        return 0.3;
      default:
        return 0.5;
    }
  }
}

// --- 6. Emotion Time Capsule Engine ---

export interface TimeCapsuleEntry {
  mediaUrl: string; // Local blob or file reference
  type: 'video' | 'audio';
  emotionTag: EmotionCategory;
  intensity?: number; // 0-1 scale
  context?: string;
  notes?: string;
  timestamp: number;
}

export interface EmotionTrend {
  emotion: EmotionCategory;
  frequency: number; // Count of occurrences
  averageIntensity: number; // Average intensity (0-1)
  trend: 'increasing' | 'decreasing' | 'stable'; // Trend over time
  contexts?: string[]; // Common contexts for this emotion
}

export interface TimePeriod {
  start: number;
  end: number;
  label?: string; // e.g., "Morning", "Last Week", etc.
}

export interface EmotionSummary {
  dominantEmotion: EmotionCategory;
  emotionDistribution: Record<EmotionCategory, number>; // Percentage distribution
  trends: EmotionTrend[];
  volatility: number; // 0-1 scale, higher means more emotional changes
  period: TimePeriod;
}

export class EmotionTimeCapsule {
  private entries: TimeCapsuleEntry[] = [];
  private emotionStates: EmotionState[] = [];
  private maxEntries: number = 1000; // Limit to prevent memory issues

  // Add a new media entry to the time capsule
  addEntry(entry: TimeCapsuleEntry): void {
    this.entries.push(entry);

    // Trim if exceeding max entries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  // Add an emotion state to track (without media)
  addEmotionState(state: EmotionState): void {
    this.emotionStates.push(state);

    // Trim if exceeding max entries
    if (this.emotionStates.length > this.maxEntries) {
      this.emotionStates.shift();
    }
  }

  // Get all entries
  getEntries(): TimeCapsuleEntry[] {
    return [...this.entries];
  }

  // Get entries filtered by emotion
  getEntriesByEmotion(emotion: EmotionCategory): TimeCapsuleEntry[] {
    return this.entries.filter(entry => entry.emotionTag === emotion);
  }

  // Get entries within a time period
  getEntriesByTimePeriod(period: TimePeriod): TimeCapsuleEntry[] {
    return this.entries.filter(entry =>
      entry.timestamp >= period.start && entry.timestamp <= period.end
    );
  }

  // Get entries by context
  getEntriesByContext(context: string): TimeCapsuleEntry[] {
    return this.entries.filter(entry =>
      entry.context && entry.context.toLowerCase().includes(context.toLowerCase())
    );
  }

  // Generate a summary of emotion patterns for a given time period
  summarizeHistory(period?: TimePeriod): EmotionSummary {
    // Default to all-time if no period specified
    const effectivePeriod: TimePeriod = period || {
      start: this.getEarliestTimestamp(),
      end: Date.now()
    };

    // Get relevant entries and states for the period
    const periodEntries = this.getEntriesByTimePeriod(effectivePeriod);
    const periodStates = this.getEmotionStatesByTimePeriod(effectivePeriod);

    // If no data, return a default summary
    if (periodEntries.length === 0 && periodStates.length === 0) {
      return this.createDefaultSummary(effectivePeriod);
    }

    // Calculate emotion distribution
    const emotionDistribution = this.calculateEmotionDistribution(periodEntries, periodStates);

    // Find dominant emotion
    const dominantEmotion = this.findDominantEmotion(emotionDistribution);

    // Calculate emotion trends
    const trends = this.calculateEmotionTrends(effectivePeriod);

    // Calculate emotional volatility
    const volatility = this.calculateEmotionalVolatility(periodStates);

    return {
      dominantEmotion,
      emotionDistribution,
      trends,
      volatility,
      period: effectivePeriod
    };
  }

  // Generate a natural language summary for therapists
  generateTherapistSummary(period?: TimePeriod): string {
    const summary = this.summarizeHistory(period);
    const periodLabel = period?.label || 'the recorded period';

    let result = `During ${periodLabel}, the dominant emotion was ${summary.dominantEmotion} `;
    result += `(${Math.round(summary.emotionDistribution[summary.dominantEmotion] * 100)}% of recordings). `;

    // Add trend information
    if (summary.trends.length > 0) {
      const significantTrends = summary.trends.filter(t =>
        t.frequency > 2 && (t.trend === 'increasing' || t.trend === 'decreasing')
      );

      if (significantTrends.length > 0) {
        result += 'Notable trends: ';
        significantTrends.forEach((trend, index) => {
          result += `${trend.emotion} is ${trend.trend}`;
          if (index < significantTrends.length - 1) {
            result += ', ';
          }
        });
        result += '. ';
      }
    }

    // Add volatility information
    if (summary.volatility > 0.7) {
      result += 'Emotional states have been highly variable. ';
    } else if (summary.volatility < 0.3) {
      result += 'Emotional states have been relatively stable. ';
    }

    // Add specific insights based on dominant emotion
    result += this.getEmotionSpecificInsights(summary.dominantEmotion, summary);

    return result;
  }

  // Clear all entries (e.g., for privacy or starting fresh)
  clearEntries(): void {
    this.entries = [];
    this.emotionStates = [];
  }

  // Export data (for backup or transfer)
  exportData(): { entries: TimeCapsuleEntry[], states: EmotionState[] } {
    return {
      entries: [...this.entries],
      states: [...this.emotionStates]
    };
  }

  // Import data (from backup or transfer)
  importData(data: { entries: TimeCapsuleEntry[], states: EmotionState[] }): void {
    // Validate data before importing
    if (Array.isArray(data.entries) && Array.isArray(data.states)) {
      this.entries = [...data.entries];
      this.emotionStates = [...data.states];
    }
  }

  // Private helper methods

  // Get emotion states within a time period
  private getEmotionStatesByTimePeriod(period: TimePeriod): EmotionState[] {
    return this.emotionStates.filter(state =>
      state.timestamp >= period.start && state.timestamp <= period.end
    );
  }

  // Get the earliest timestamp in the data
  private getEarliestTimestamp(): number {
    const entryTimestamps = this.entries.map(e => e.timestamp);
    const stateTimestamps = this.emotionStates.map(s => s.timestamp);
    const allTimestamps = [...entryTimestamps, ...stateTimestamps];

    return allTimestamps.length > 0 ? Math.min(...allTimestamps) : Date.now() - 86400000; // Default to 24 hours ago
  }

  // Calculate emotion distribution from entries and states
  private calculateEmotionDistribution(
    entries: TimeCapsuleEntry[],
    states: EmotionState[]
  ): Record<EmotionCategory, number> {
    // Initialize counts for all emotions
    const emotionCounts: Record<EmotionCategory, number> = {
      happy: 0, sad: 0, angry: 0, anxious: 0, calm: 0,
      excited: 0, tired: 0, frustrated: 0, focused: 0,
      overwhelmed: 0, neutral: 0
    };

    // Count emotions from entries
    entries.forEach(entry => {
      emotionCounts[entry.emotionTag]++;
    });

    // Count emotions from states
    states.forEach(state => {
      emotionCounts[state.mood]++;
    });

    // Calculate total
    const total = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);

    // Convert to distribution (percentages)
    const distribution: Record<EmotionCategory, number> = {} as Record<EmotionCategory, number>;

    if (total > 0) {
      Object.entries(emotionCounts).forEach(([emotion, count]) => {
        distribution[emotion as EmotionCategory] = count / total;
      });
    } else {
      // Default even distribution if no data
      Object.keys(emotionCounts).forEach(emotion => {
        distribution[emotion as EmotionCategory] = 1 / Object.keys(emotionCounts).length;
      });
    }

    return distribution;
  }

  // Find the dominant emotion from a distribution
  private findDominantEmotion(distribution: Record<EmotionCategory, number>): EmotionCategory {
    let dominant: EmotionCategory = 'neutral';
    let maxPercentage = 0;

    Object.entries(distribution).forEach(([emotion, percentage]) => {
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        dominant = emotion as EmotionCategory;
      }
    });

    return dominant;
  }

  // Calculate trends for each emotion over time
  private calculateEmotionTrends(period: TimePeriod): EmotionTrend[] {
    const trends: EmotionTrend[] = [];
    const emotions: EmotionCategory[] = [
      'happy', 'sad', 'angry', 'anxious', 'calm',
      'excited', 'tired', 'frustrated', 'focused',
      'overwhelmed', 'neutral'
    ];

    // Split the period into two halves to compare
    const midpoint = period.start + (period.end - period.start) / 2;
    const firstHalf: TimePeriod = { start: period.start, end: midpoint };
    const secondHalf: TimePeriod = { start: midpoint + 1, end: period.end };

    // Get entries and states for each half
    const firstHalfEntries = this.getEntriesByTimePeriod(firstHalf);
    const firstHalfStates = this.getEmotionStatesByTimePeriod(firstHalf);
    const secondHalfEntries = this.getEntriesByTimePeriod(secondHalf);
    const secondHalfStates = this.getEmotionStatesByTimePeriod(secondHalf);

    // Calculate distributions for each half
    const firstHalfDistribution = this.calculateEmotionDistribution(firstHalfEntries, firstHalfStates);
    const secondHalfDistribution = this.calculateEmotionDistribution(secondHalfEntries, secondHalfStates);

    // For each emotion, determine the trend
    emotions.forEach(emotion => {
      // Get all entries for this emotion
      const emotionEntries = this.entries.filter(e => e.emotionTag === emotion);
      const emotionStates = this.emotionStates.filter(s => s.mood === emotion);

      // Skip if not enough data
      if (emotionEntries.length + emotionStates.length < 2) {
        return;
      }

      // Calculate frequency
      const frequency = emotionEntries.length + emotionStates.length;

      // Calculate average intensity
      const entryIntensities = emotionEntries.map(e => e.intensity || 0.5);
      const stateIntensities = emotionStates.map(s => s.confidence);
      const allIntensities = [...entryIntensities, ...stateIntensities];
      const averageIntensity = allIntensities.reduce((sum, val) => sum + val, 0) / allIntensities.length;

      // Determine trend direction
      let trendDirection: 'increasing' | 'decreasing' | 'stable';
      const firstHalfPercentage = firstHalfDistribution[emotion] || 0;
      const secondHalfPercentage = secondHalfDistribution[emotion] || 0;
      const changeMagnitude = secondHalfPercentage - firstHalfPercentage;

      if (changeMagnitude > 0.1) {
        trendDirection = 'increasing';
      } else if (changeMagnitude < -0.1) {
        trendDirection = 'decreasing';
      } else {
        trendDirection = 'stable';
      }

      // Find common contexts
      const contexts = new Set<string>();
      emotionEntries.forEach(entry => {
        if (entry.context) contexts.add(entry.context);
      });
      emotionStates.forEach(state => {
        if (state.context) contexts.add(state.context);
      });

      // Add to trends
      trends.push({
        emotion,
        frequency,
        averageIntensity,
        trend: trendDirection,
        contexts: Array.from(contexts)
      });
    });

    // Sort by frequency (most common first)
    return trends.sort((a, b) => b.frequency - a.frequency);
  }

  // Calculate emotional volatility from state changes
  private calculateEmotionalVolatility(states: EmotionState[]): number {
    if (states.length < 3) {
      return 0.5; // Default medium volatility if not enough data
    }

    // Sort states by timestamp
    const sortedStates = [...states].sort((a, b) => a.timestamp - b.timestamp);

    // Count changes in emotion
    let changes = 0;
    for (let i = 1; i < sortedStates.length; i++) {
      if (sortedStates[i].mood !== sortedStates[i - 1].mood) {
        changes++;
      }
    }

    // Calculate volatility as ratio of changes to opportunities for change
    const volatility = changes / (sortedStates.length - 1);

    return Math.min(volatility, 1); // Cap at 1
  }

  // Create a default summary when no data is available
  private createDefaultSummary(period: TimePeriod): EmotionSummary {
    // Even distribution across all emotions
    const emotionDistribution: Record<EmotionCategory, number> = {
      happy: 0.09, sad: 0.09, angry: 0.09, anxious: 0.09, calm: 0.09,
      excited: 0.09, tired: 0.09, frustrated: 0.09, focused: 0.09,
      overwhelmed: 0.09, neutral: 0.1
    };

    return {
      dominantEmotion: 'neutral',
      emotionDistribution,
      trends: [],
      volatility: 0.5,
      period
    };
  }

  // Get specific insights based on dominant emotion
  private getEmotionSpecificInsights(emotion: EmotionCategory, _summary: EmotionSummary): string {
    switch (emotion) {
      case 'happy':
      case 'excited':
      case 'calm':
      case 'focused':
        return 'Positive emotional states have been predominant, which is beneficial for overall wellbeing.';

      case 'sad':
        return 'Sadness has been a prominent emotion. Consider exploring potential triggers and coping strategies.';

      case 'anxious':
        return 'Anxiety has been frequently recorded. Relaxation techniques and identifying anxiety triggers may be helpful.';

      case 'angry':
      case 'frustrated':
        return 'Frustration/anger has been common. Exploring healthy expression of these emotions could be beneficial.';

      case 'tired':
        return 'Fatigue has been a recurring theme. Consider discussing sleep patterns and energy management.';

      case 'overwhelmed':
        return 'Feeling overwhelmed has been common. Breaking down tasks and stress management techniques may help.';

      case 'neutral':
        return 'Emotional states have been predominantly neutral. This could indicate emotional regulation or potential emotional suppression.';

      default:
        return 'Consider discussing these patterns in your next session.';
    }
  }
}

// --- 7. (Optional) LLM Summarizer Interface ---

export interface SessionSummary {
  summary: string;
  timestamp: number;
  dominantEmotions: EmotionCategory[];
  emotionalJourney: string;
  suggestedFocus?: string;
  confidence: number;
}

export interface SummaryOptions {
  includeContexts?: boolean;
  maxLength?: number;
  audienceType?: 'therapist' | 'caregiver' | 'self';
  focusAreas?: ('emotional_regulation' | 'anxiety_management' | 'social_skills' | 'communication')[];
}

export class TemplateLLMSummarizer {
  // Default options
  private defaultOptions: SummaryOptions = {
    includeContexts: true,
    maxLength: 500,
    audienceType: 'therapist',
    focusAreas: ['emotional_regulation']
  };

  // Summarize a session using templates (no actual LLM required)
  async summarizeSession(
    states: EmotionState[],
    timeCapsule: TimeCapsuleEntry[],
    options?: SummaryOptions
  ): Promise<SessionSummary> {
    // Merge options with defaults
    const effectiveOptions = { ...this.defaultOptions, ...options };

    // Ensure we have data to summarize
    if (states.length === 0 && timeCapsule.length === 0) {
      return this.createDefaultSummary();
    }

    // Analyze the emotional data
    const emotionAnalysis = this.analyzeEmotionalData(states, timeCapsule);

    // Generate the summary based on the analysis and options
    const summary = this.generateSummaryText(emotionAnalysis, effectiveOptions);

    // Generate emotional journey narrative
    const emotionalJourney = this.generateEmotionalJourney(emotionAnalysis);

    // Generate suggested focus areas
    const suggestedFocus = this.generateSuggestedFocus(emotionAnalysis, effectiveOptions);

    return {
      summary,
      timestamp: Date.now(),
      dominantEmotions: emotionAnalysis.dominantEmotions,
      emotionalJourney,
      suggestedFocus,
      confidence: emotionAnalysis.dataQuality
    };
  }

  // Analyze emotional data to extract patterns and insights
  private analyzeEmotionalData(states: EmotionState[], entries: TimeCapsuleEntry[]) {
    // Combine all emotional data
    const allEmotions: { emotion: EmotionCategory, timestamp: number, confidence: number, context?: string }[] = [
      ...states.map(s => ({
        emotion: s.mood,
        timestamp: s.timestamp,
        confidence: s.confidence,
        context: s.context
      })),
      ...entries.map(e => ({
        emotion: e.emotionTag,
        timestamp: e.timestamp,
        confidence: e.intensity || 0.5,
        context: e.context
      }))
    ];

    // Sort by timestamp
    allEmotions.sort((a, b) => a.timestamp - b.timestamp);

    // Count emotion occurrences
    const emotionCounts: Record<EmotionCategory, number> = {
      happy: 0, sad: 0, angry: 0, anxious: 0, calm: 0,
      excited: 0, tired: 0, frustrated: 0, focused: 0,
      overwhelmed: 0, neutral: 0
    };

    allEmotions.forEach(item => {
      emotionCounts[item.emotion]++;
    });

    // Find dominant emotions (top 3)
    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion as EmotionCategory);

    // Identify emotional transitions
    const transitions: { from: EmotionCategory, to: EmotionCategory, count: number }[] = [];

    for (let i = 1; i < allEmotions.length; i++) {
      const from = allEmotions[i - 1].emotion;
      const to = allEmotions[i].emotion;

      if (from !== to) {
        // Check if this transition already exists
        const existingTransition = transitions.find(t => t.from === from && t.to === to);

        if (existingTransition) {
          existingTransition.count++;
        } else {
          transitions.push({ from, to, count: 1 });
        }
      }
    }

    // Sort transitions by frequency
    transitions.sort((a, b) => b.count - a.count);

    // Extract contexts if available
    const contexts = new Set<string>();
    allEmotions.forEach(item => {
      if (item.context) contexts.add(item.context);
    });

    // Calculate data quality/confidence (0-1)
    // Based on amount of data and confidence scores
    const dataQuality = Math.min(
      0.3 + (allEmotions.length / 20) * 0.5, // More data = higher quality, up to 0.8
      0.95 // Cap at 0.95
    );

    return {
      allEmotions,
      emotionCounts,
      dominantEmotions,
      transitions,
      contexts: Array.from(contexts),
      dataQuality
    };
  }

  // Generate summary text based on analysis and options
  private generateSummaryText(
    analysis: ReturnType<typeof this.analyzeEmotionalData>,
    options: SummaryOptions
  ): string {
    let summary = '';

    // Introduction based on audience type
    switch (options.audienceType) {
      case 'therapist':
        summary += 'Session Summary (Therapist Report): ';
        break;
      case 'caregiver':
        summary += 'Emotional Check-in Summary (Caregiver Report): ';
        break;
      case 'self':
        summary += 'Your Emotional Journey Summary: ';
        break;
    }

    // Add dominant emotions
    if (analysis.dominantEmotions.length > 0) {
      summary += `The predominant emotions were ${analysis.dominantEmotions.join(', ')}. `;
    } else {
      summary += 'No clear emotional patterns were detected. ';
    }

    // Add emotional transitions if there are any significant ones
    const significantTransitions = analysis.transitions.filter(t => t.count > 1).slice(0, 2);
    if (significantTransitions.length > 0) {
      summary += 'Notable emotional shifts included ';
      significantTransitions.forEach((transition, index) => {
        summary += `${transition.from} to ${transition.to}`;
        if (index < significantTransitions.length - 1) {
          summary += ' and ';
        }
      });
      summary += '. ';
    }

    // Add contexts if requested and available
    if (options.includeContexts && analysis.contexts.length > 0) {
      summary += 'These emotions were observed during ';
      if (analysis.contexts.length <= 3) {
        summary += analysis.contexts.join(', ');
      } else {
        summary += `${analysis.contexts.slice(0, 3).join(', ')}, and other activities`;
      }
      summary += '. ';
    }

    // Add focus-area specific observations
    if (options.focusAreas.includes('emotional_regulation')) {
      const volatility = this.calculateEmotionalVolatility(analysis.allEmotions);
      if (volatility > 0.7) {
        summary += 'Emotional regulation may be an area for attention, as emotions showed significant variability. ';
      } else if (volatility < 0.3) {
        summary += 'Emotional regulation appears stable, with consistent emotional states maintained. ';
      }
    }

    if (options.focusAreas.includes('anxiety_management')) {
      const anxietyCount = analysis.emotionCounts.anxious + analysis.emotionCounts.overwhelmed;
      const totalCount = Object.values(analysis.emotionCounts).reduce((sum, count) => sum + count, 0);

      if (anxietyCount / totalCount > 0.3) {
        summary += 'Anxiety and feeling overwhelmed were significant components of the emotional experience. ';
      }
    }

    // Trim if needed
    if (summary.length > options.maxLength) {
      summary = summary.substring(0, options.maxLength - 3) + '...';
    }

    return summary;
  }

  // Generate emotional journey narrative
  private generateEmotionalJourney(analysis: ReturnType<typeof this.analyzeEmotionalData>): string {
    if (analysis.allEmotions.length < 2) {
      return 'Insufficient data to chart an emotional journey.';
    }

    // Group emotions into segments for a more coherent narrative
    const segments: { emotion: EmotionCategory, duration: number }[] = [];
    let currentEmotion = analysis.allEmotions[0].emotion;
    let startTime = analysis.allEmotions[0].timestamp;

    for (let i = 1; i < analysis.allEmotions.length; i++) {
      if (analysis.allEmotions[i].emotion !== currentEmotion) {
        // End of a segment
        segments.push({
          emotion: currentEmotion,
          duration: analysis.allEmotions[i].timestamp - startTime
        });

        // Start new segment
        currentEmotion = analysis.allEmotions[i].emotion;
        startTime = analysis.allEmotions[i].timestamp;
      }
    }

    // Add the final segment
    if (analysis.allEmotions.length > 0) {
      segments.push({
        emotion: currentEmotion,
        duration: analysis.allEmotions[analysis.allEmotions.length - 1].timestamp - startTime
      });
    }

    // Generate narrative based on segments
    let journey = 'The emotional journey began with ';

    if (segments.length > 0) {
      journey += `${segments[0].emotion}`;

      if (segments.length > 1) {
        journey += ', followed by ';

        // Add middle segments
        const middleSegments = segments.slice(1, -1);
        if (middleSegments.length > 0) {
          middleSegments.forEach((segment, index) => {
            journey += segment.emotion;
            if (index < middleSegments.length - 1) {
              journey += ', then ';
            }
          });
          journey += ', ';
        }

        // Add final segment
        journey += `and eventually ${segments[segments.length - 1].emotion}`;
      }

      journey += '.';
    } else {
      journey += 'an unclear emotional state.';
    }

    return journey;
  }

  // Generate suggested focus areas based on emotional data
  private generateSuggestedFocus(
    analysis: ReturnType<typeof this.analyzeEmotionalData>,
    options: SummaryOptions
  ): string {
    // Default suggestion if no clear pattern
    if (analysis.allEmotions.length < 3) {
      return 'Continue general emotional awareness practices.';
    }

    // Check for specific patterns that suggest focus areas

    // High anxiety/overwhelm
    const anxietyCount = analysis.emotionCounts.anxious + analysis.emotionCounts.overwhelmed;
    const totalCount = Object.values(analysis.emotionCounts).reduce((sum, count) => sum + count, 0);

    if (anxietyCount / totalCount > 0.3) {
      return 'Consider focusing on anxiety management techniques such as deep breathing, grounding exercises, or mindfulness practices.';
    }

    // High frustration/anger
    const frustrationCount = analysis.emotionCounts.angry + analysis.emotionCounts.frustrated;
    if (frustrationCount / totalCount > 0.3) {
      return 'Consider exploring healthy expression of frustration and anger management techniques.';
    }

    // High sadness
    if (analysis.emotionCounts.sad / totalCount > 0.3) {
      return 'Consider focusing on mood-lifting activities and exploring triggers for sadness.';
    }

    // High emotional volatility
    const volatility = this.calculateEmotionalVolatility(analysis.allEmotions);
    if (volatility > 0.7) {
      return 'Consider emotional regulation techniques and identifying triggers for emotional shifts.';
    }

    // Predominant tiredness
    if (analysis.emotionCounts.tired / totalCount > 0.3) {
      return 'Consider focusing on energy management, sleep hygiene, and stress reduction.';
    }

    // If no specific issues, suggest building on strengths
    const positiveCount =
      analysis.emotionCounts.happy +
      analysis.emotionCounts.calm +
      analysis.emotionCounts.focused +
      analysis.emotionCounts.excited;

    if (positiveCount / totalCount > 0.5) {
      return 'Continue building on positive emotional states by noting what activities and contexts support them.';
    }

    // Default general suggestion
    return 'Consider exploring the patterns between activities and emotional states to identify supportive factors.';
  }

  // Calculate emotional volatility from emotion data
  private calculateEmotionalVolatility(
    emotions: Array<{ emotion: EmotionCategory, timestamp: number }>
  ): number {
    if (emotions.length < 3) {
      return 0.5; // Default medium volatility if not enough data
    }

    // Sort by timestamp
    const sortedEmotions = [...emotions].sort((a, b) => a.timestamp - b.timestamp);

    // Count changes in emotion
    let changes = 0;
    for (let i = 1; i < sortedEmotions.length; i++) {
      if (sortedEmotions[i].emotion !== sortedEmotions[i - 1].emotion) {
        changes++;
      }
    }

    // Calculate volatility as ratio of changes to opportunities for change
    const volatility = changes / (sortedEmotions.length - 1);

    return Math.min(volatility, 1); // Cap at 1
  }

  // Create a default summary when no data is available
  private createDefaultSummary(): SessionSummary {
    return {
      summary: 'Insufficient data to generate a meaningful summary. Continue tracking emotions to receive insights.',
      timestamp: Date.now(),
      dominantEmotions: ['neutral'],
      emotionalJourney: 'No emotional journey data available yet.',
      confidence: 0.1
    };
  }
}

// Implementation of the LLM interface that could be extended with actual LLM integration
export class LLMEmotionSummarizer {
  private templateSummarizer = new TemplateLLMSummarizer();
  private useActualLLM = false; // Flag to control whether to use template or actual LLM

  // Constructor with option to use actual LLM
  constructor(useActualLLM = false) {
    this.useActualLLM = useActualLLM;
  }

  // Summarize session using either template or LLM
  async summarizeSession(
    states: EmotionState[],
    timeCapsule: TimeCapsuleEntry[],
    options?: SummaryOptions
  ): Promise<SessionSummary> {
    // If not using actual LLM, use the template summarizer
    if (!this.useActualLLM) {
      return this.templateSummarizer.summarizeSession(states, timeCapsule, options);
    }

    // This would be where actual LLM integration would happen
    // For now, we'll just use the template summarizer with a note
    const summary = await this.templateSummarizer.summarizeSession(states, timeCapsule, options);

    // Modify the summary to indicate it would normally use an LLM
    summary.summary = `[LLM would generate here] ${summary.summary}`;

    return summary;
  }
}

// --- 8. Privacy Design Notes ---
// - All processing is on-device or edge-optimized.
// - Only embeddings/features are used, never raw video/audio.
// - Only inferred states and optional metadata are shared externally.
// - All classes are modular and testable for backend or in-browser use.

// --- 9. Privacy Controls ---

export interface PrivacySettings {
  storeRawData: boolean;
  shareWithTherapist: boolean;
  shareWithCaregivers: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  allowRemoteProcessing: boolean;
}

export class PrivacyManager {
  private settings: PrivacySettings;

  constructor(initialSettings?: Partial<PrivacySettings>) {
    // Default privacy settings (privacy-first approach)
    this.settings = {
      storeRawData: false,
      shareWithTherapist: true,
      shareWithCaregivers: false,
      dataRetentionDays: 90,
      anonymizeData: true,
      allowRemoteProcessing: false,
      ...initialSettings
    };
  }

  // Update privacy settings
  updateSettings(newSettings: Partial<PrivacySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Get current privacy settings
  getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  // Check if a specific operation is allowed based on privacy settings
  isAllowed(operation: 'store_raw' | 'share_therapist' | 'share_caregiver' | 'remote_process'): boolean {
    switch (operation) {
      case 'store_raw':
        return this.settings.storeRawData;
      case 'share_therapist':
        return this.settings.shareWithTherapist;
      case 'share_caregiver':
        return this.settings.shareWithCaregivers;
      case 'remote_process':
        return this.settings.allowRemoteProcessing;
      default:
        return false;
    }
  }

  // Apply privacy filters to data before sharing
  applyPrivacyFilters<T extends object>(data: T): T {
    // Create a deep copy to avoid modifying the original
    const filteredData = JSON.parse(JSON.stringify(data)) as T;

    // Apply anonymization if needed
    if (this.settings.anonymizeData) {
      this.anonymizeObject(filteredData);
    }

    return filteredData;
  }

  // Helper method to anonymize sensitive fields in an object
  private anonymizeObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    // List of fields that should be anonymized
    const sensitiveFields = ['name', 'id', 'user', 'userId', 'patientId', 'email', 'phone'];

    // Recursively process the object
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // If it's a sensitive field, anonymize it
        if (sensitiveFields.includes(key)) {
          if (typeof obj[key] === 'string') {
            obj[key] = 'ANONYMIZED';
          } else if (typeof obj[key] === 'number') {
            obj[key] = 0;
          }
        }
        // If it's an object or array, recursively process it
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.anonymizeObject(obj[key]);
        }
      }
    }
  }

  // Clean up data based on retention policy
  cleanupExpiredData(
    timeCapsule: EmotionTimeCapsule,
    alertEngine: EmotionAlertEngine
  ): void {
    if (this.settings.dataRetentionDays <= 0) return;

    const cutoffTime = Date.now() - (this.settings.dataRetentionDays * 24 * 60 * 60 * 1000);

    // Export current data
    const capsuleData = timeCapsule.exportData();

    // Filter out expired entries
    const filteredEntries = capsuleData.entries.filter(entry => entry.timestamp >= cutoffTime);
    const filteredStates = capsuleData.states.filter(state => state.timestamp >= cutoffTime);

    // Import filtered data back
    timeCapsule.importData({
      entries: filteredEntries,
      states: filteredStates
    });

    // Reset alert engine history (simplified approach)
    alertEngine.clearHistory();

    // In a real implementation, we would selectively clean alert engine history
    // while preserving recent data
  }
}
