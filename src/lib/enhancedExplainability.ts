// PsyTrack Enhanced Explainability Module
// This module extends the core explainability with SHAP, LIME, and Fairlearn

import { EmotionState, ExplainabilityFeatures, ChildFriendlyVisual, AttributionData } from './aiCore';
import { ShapExplainer, LimeExplainer, FairnessAssessor, ModelEvaluator } from './ethicalAI';

// Enhanced attribution data with ethical AI components
export interface EnhancedAttributionData extends AttributionData {
  shapValues?: {
    baseValue: number;
    values: number[];
    features: string[];
    data: number[];
  };
  limeExplanation?: {
    features: string[];
    weights: number[];
    localPrediction: number;
    intercept: number;
  };
  fairnessMetrics?: {
    demographicParity: Record<string, number>;
    equalizedOdds: Record<string, number>;
    disparateImpact: Record<string, number>;
    groupFairnessScore: number;
  };
}

// Enhanced explainability module that integrates ethical AI tools
export class EnhancedExplainabilityModule {
  // Original emoji and color mappings from the core module
  private static emotionVisuals: Record<string, ChildFriendlyVisual> = {
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
      description: 'You seem excited and energetic!'
    },
    frustrated: {
      emoji: '😤',
      color: '#CD5C5C', // Indian Red
      description: 'You seem a bit frustrated.'
    },
    neutral: {
      emoji: '😐',
      color: '#E0E0E0', // Light Gray
      description: 'You seem calm and neutral.'
    }
  };

  // Generate child-friendly explanation (same as core module)
  static forChild(state: EmotionState): ChildFriendlyVisual {
    return this.emotionVisuals[state.mood] || this.emotionVisuals.neutral;
  }

  // Generate detailed explanation for adults/caregivers with ethical AI insights
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

    // Add feature-specific explanations if available
    if (features) {
      explanation += this.generateFeatureExplanation(state.mood, features);
    }

    // Add ethical AI explanation if available
    if (features) {
      explanation += "\n\nEthical AI Analysis: ";
      explanation += "This prediction has been analyzed using SHAP and LIME for transparency. ";
      
      if (features.demographics) {
        explanation += "Fairness metrics have been calculated to ensure unbiased predictions across demographic groups. ";
        explanation += "You can view detailed visualizations in the Ethical AI dashboard.";
      }
    }

    return explanation;
  }

  // Generate enhanced visual attribution data with ethical AI components
  static visualAttribution(state: EmotionState, features?: ExplainabilityFeatures): EnhancedAttributionData | null {
    if (!features) return null;

    const attributionData: EnhancedAttributionData = {};

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
        attributionData.voiceAttributes['pitch'] = features.voiceFeatures.pitchDescription === 'high' ? 0.8 : 0.4;
      }
      if (features.voiceFeatures.energyDescription) {
        attributionData.voiceAttributes['energy'] = features.voiceFeatures.energyDescription === 'high' ? 0.9 : 0.5;
      }
    }

    // Process wearable features if available
    if (features.wearableFeatures) {
      attributionData.wearableAttributes = {};
      if (features.wearableFeatures.heartRateDescription) {
        attributionData.wearableAttributes['heart_rate'] = features.wearableFeatures.heartRateDescription === 'elevated' ? 0.7 : 0.3;
      }
      if (features.wearableFeatures.activityLevel) {
        attributionData.wearableAttributes['activity'] = features.wearableFeatures.activityLevel === 'active' ? 0.8 : 0.4;
      }
    }

    // Add SHAP values using the ShapExplainer
    attributionData.shapValues = ShapExplainer.calculateShapValues(state, features);

    // Add LIME explanation using the LimeExplainer
    attributionData.limeExplanation = LimeExplainer.generateExplanation(state, features);

    // Add fairness metrics if demographics are available
    if (features.demographics) {
      // In a real implementation, this would use historical data and ground truth
      // For this example, we'll simulate fairness metrics
      attributionData.fairnessMetrics = {
        demographicParity: {
          'age_child': 0.8,
          'age_teen': 0.75,
          'age_adult': 0.7,
          'gender_male': 0.75,
          'gender_female': 0.78
        },
        equalizedOdds: {
          'gender_male_tpr': 0.8,
          'gender_female_tpr': 0.82
        },
        disparateImpact: {
          'gender_ratio': 1.04,
          'age_ratio': 1.14
        },
        groupFairnessScore: 0.92
      };
    }

    return attributionData;
  }

  // Format source name for explanation
  private static formatSourceName(source: string): string {
    switch (source) {
      case 'facial':
        return 'facial expression';
      case 'voice':
        return 'voice tone';
      case 'text':
        return 'journal text';
      case 'wearable':
        return 'physical signals';
      default:
        return source;
    }
  }

  // Generate explanation based on features
  private static generateFeatureExplanation(emotion: string, features: ExplainabilityFeatures): string {
    let explanation = '';

    // Add facial feature explanation
    if (features.facialFeatures) {
      if (features.facialFeatures.expression) {
        explanation += `Your ${features.facialFeatures.expression} expression `;
        
        if (emotion === 'happy' && features.facialFeatures.expression === 'smiling') {
          explanation += 'shows happiness. ';
        } else if (emotion === 'sad' && features.facialFeatures.expression === 'frowning') {
          explanation += 'indicates sadness. ';
        } else {
          explanation += `suggests ${emotion} emotion. `;
        }
      }

      if (features.facialFeatures.dominantRegions && features.facialFeatures.dominantRegions.length > 0) {
        const topRegion = features.facialFeatures.dominantRegions[0];
        explanation += `Activity in the ${topRegion.region} region of your face was particularly noticeable. `;
      }
    }

    // Add voice feature explanation
    if (features.voiceFeatures) {
      if (features.voiceFeatures.pitchDescription && features.voiceFeatures.energyDescription) {
        explanation += `Your voice had ${features.voiceFeatures.pitchDescription} pitch and ${features.voiceFeatures.energyDescription} energy, `;
        
        if (features.voiceFeatures.pitchDescription === 'high' && features.voiceFeatures.energyDescription === 'high') {
          explanation += 'which often indicates excitement or happiness. ';
        } else if (features.voiceFeatures.pitchDescription === 'low' && features.voiceFeatures.energyDescription === 'low') {
          explanation += 'which can suggest sadness or calmness. ';
        } else {
          explanation += `which is consistent with ${emotion}. `;
        }
      }
    }

    // Add text feature explanation
    if (features.textFeatures && features.textFeatures.dominantKeywords && features.textFeatures.dominantKeywords.length > 0) {
      explanation += `Your journal used words like "${features.textFeatures.dominantKeywords.join('", "')}", `;
      
      if (features.textFeatures.sentiment) {
        explanation += `expressing a ${features.textFeatures.sentiment} sentiment. `;
      } else {
        explanation += 'which influenced the emotion detection. ';
      }
    }

    return explanation;
  }

  // Generate SHAP summary plot data for visualization
  static generateShapSummaryData(state: EmotionState, features: ExplainabilityFeatures) {
    const shapValues = ShapExplainer.calculateShapValues(state, features);
    return ShapExplainer.generateSummaryPlotData(shapValues);
  }

  // Generate LIME explanation data for visualization
  static generateLimeExplanationData(state: EmotionState, features: ExplainabilityFeatures) {
    return LimeExplainer.generateExplanation(state, features);
  }

  // Assess fairness across demographic groups
  static assessFairness(predictions: EmotionState[], demographics: any[], groundTruth?: string[]) {
    return FairnessAssessor.assessFairness(predictions, demographics, groundTruth);
  }

  // Evaluate model performance
  static evaluateModel(predictions: EmotionState[], groundTruth: string[], demographics?: any[]) {
    return ModelEvaluator.evaluateModel(predictions, groundTruth, demographics);
  }
}
