// PsyTrack Ethical AI Module
// This module provides tools for explainable and fair AI in emotion detection

import { EmotionState, ExplainabilityFeatures } from './aiCore';

// Types for SHAP values
export interface ShapValues {
  baseValue: number;
  values: number[];
  features: string[];
  data: number[];
}

// Types for LIME explanations
export interface LimeExplanation {
  features: string[];
  weights: number[];
  localPrediction: number;
  intercept: number;
}

// Types for fairness metrics
export interface FairnessMetrics {
  demographicParity: Record<string, number>;
  equalizedOdds: Record<string, number>;
  disparateImpact: Record<string, number>;
  groupFairnessScore: number;
}

// Types for demographic groups
export interface DemographicGroups {
  age?: string;
  gender?: string;
  ethnicity?: string;
  [key: string]: string | undefined;
}

// Types for model evaluation
export interface ModelEvaluation {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: number[][];
}

/**
 * SHAP (SHapley Additive exPlanations) implementation
 * Provides feature importance values for global and local explanations
 */
export class ShapExplainer {
  /**
   * Calculate SHAP values for a given emotion prediction
   * @param emotionState The emotion state to explain
   * @param features The features used for prediction
   * @returns SHAP values for the prediction
   */
  static calculateShapValues(emotionState: EmotionState, features: ExplainabilityFeatures): ShapValues {
    // In a real implementation, this would use the SHAP library
    // For this example, we'll simulate SHAP values
    
    // Extract feature values
    const featureNames: string[] = [];
    const featureValues: number[] = [];
    
    // Process facial features
    if (features.facialFeatures) {
      if (features.facialFeatures.dominantRegions) {
        features.facialFeatures.dominantRegions.forEach(region => {
          featureNames.push(`facial_${region.region}`);
          featureValues.push(region.contribution);
        });
      }
      
      if (features.facialFeatures.gaze) {
        featureNames.push('facial_gaze');
        featureValues.push(features.facialFeatures.gaze === 'direct' ? 0.8 : 0.4);
      }
    }
    
    // Process voice features
    if (features.voiceFeatures) {
      if (features.voiceFeatures.pitchDescription) {
        featureNames.push('voice_pitch');
        featureValues.push(features.voiceFeatures.pitchDescription === 'high' ? 0.7 : 0.3);
      }
      
      if (features.voiceFeatures.energyDescription) {
        featureNames.push('voice_energy');
        featureValues.push(features.voiceFeatures.energyDescription === 'high' ? 0.9 : 0.2);
      }
    }
    
    // Process text features
    if (features.textFeatures && features.textFeatures.dominantKeywords) {
      features.textFeatures.dominantKeywords.forEach((keyword, index) => {
        featureNames.push(`text_keyword_${index}`);
        featureValues.push(0.6); // Placeholder value
      });
    }
    
    // Calculate simulated SHAP values
    // In a real implementation, these would be calculated using the SHAP library
    const shapValues = featureValues.map(value => {
      // Adjust value based on contribution to the predicted emotion
      const adjustment = emotionState.mood === 'happy' ? 0.2 : -0.1;
      return value + adjustment;
    });
    
    return {
      baseValue: 0.5, // Base value (average prediction)
      values: shapValues,
      features: featureNames,
      data: featureValues
    };
  }
  
  /**
   * Generate a summary plot data for SHAP values
   * @param shapValues SHAP values to visualize
   * @returns Data for summary plot
   */
  static generateSummaryPlotData(shapValues: ShapValues) {
    return shapValues.features.map((feature, index) => ({
      feature,
      importance: Math.abs(shapValues.values[index]),
      impact: shapValues.values[index]
    })).sort((a, b) => b.importance - a.importance);
  }
}

/**
 * LIME (Local Interpretable Model-agnostic Explanations) implementation
 * Provides local explanations for individual predictions
 */
export class LimeExplainer {
  /**
   * Generate LIME explanation for a given emotion prediction
   * @param emotionState The emotion state to explain
   * @param features The features used for prediction
   * @returns LIME explanation for the prediction
   */
  static generateExplanation(emotionState: EmotionState, features: ExplainabilityFeatures): LimeExplanation {
    // In a real implementation, this would use the LIME library
    // For this example, we'll simulate LIME explanations
    
    // Extract feature names and create weights
    const featureNames: string[] = [];
    const weights: number[] = [];
    
    // Process facial features
    if (features.facialFeatures) {
      if (features.facialFeatures.expression) {
        featureNames.push(`Expression: ${features.facialFeatures.expression}`);
        weights.push(features.facialFeatures.expression === 'smiling' ? 0.4 : -0.2);
      }
      
      if (features.facialFeatures.dominantRegions) {
        features.facialFeatures.dominantRegions.forEach(region => {
          featureNames.push(`Face region: ${region.region}`);
          weights.push(region.contribution * 0.3);
        });
      }
    }
    
    // Process voice features
    if (features.voiceFeatures) {
      if (features.voiceFeatures.pitchDescription) {
        featureNames.push(`Voice pitch: ${features.voiceFeatures.pitchDescription}`);
        weights.push(features.voiceFeatures.pitchDescription === 'high' ? 0.25 : -0.1);
      }
      
      if (features.voiceFeatures.energyDescription) {
        featureNames.push(`Voice energy: ${features.voiceFeatures.energyDescription}`);
        weights.push(features.voiceFeatures.energyDescription === 'high' ? 0.35 : -0.15);
      }
    }
    
    // Process text features
    if (features.textFeatures && features.textFeatures.dominantKeywords) {
      features.textFeatures.dominantKeywords.forEach(keyword => {
        featureNames.push(`Keyword: "${keyword}"`);
        // Adjust weight based on emotion
        const isPositive = ['happy', 'excited', 'calm'].includes(emotionState.mood);
        weights.push(isPositive ? 0.2 : -0.1);
      });
    }
    
    return {
      features: featureNames,
      weights,
      localPrediction: emotionState.confidence,
      intercept: 0.3 // Base prediction value
    };
  }
}

/**
 * Fairlearn implementation for fairness assessment and mitigation
 * Provides tools to detect and mitigate bias in emotion detection
 */
export class FairnessAssessor {
  /**
   * Assess fairness across demographic groups
   * @param predictions Array of emotion predictions
   * @param demographics Array of demographic information for each prediction
   * @param groundTruth Optional array of ground truth labels
   * @returns Fairness metrics
   */
  static assessFairness(
    predictions: EmotionState[],
    demographics: DemographicGroups[],
    groundTruth?: string[]
  ): FairnessMetrics {
    // In a real implementation, this would use the Fairlearn library
    // For this example, we'll simulate fairness metrics
    
    // Calculate demographic parity (equal prediction rates across groups)
    const demographicParity: Record<string, number> = {};
    
    // Calculate for age groups
    const ageGroups = this.groupBy(demographics, 'age');
    Object.entries(ageGroups).forEach(([age, indices]) => {
      if (age && indices.length > 0) {
        const positiveRate = this.calculatePositiveRate(predictions, indices);
        demographicParity[`age_${age}`] = positiveRate;
      }
    });
    
    // Calculate for gender groups
    const genderGroups = this.groupBy(demographics, 'gender');
    Object.entries(genderGroups).forEach(([gender, indices]) => {
      if (gender && indices.length > 0) {
        const positiveRate = this.calculatePositiveRate(predictions, indices);
        demographicParity[`gender_${gender}`] = positiveRate;
      }
    });
    
    // Calculate equalized odds (equal true positive and false positive rates)
    const equalizedOdds: Record<string, number> = {};
    
    if (groundTruth) {
      // For each demographic group, calculate true positive rate
      Object.entries(genderGroups).forEach(([gender, indices]) => {
        if (gender && indices.length > 0) {
          const tpr = this.calculateTruePositiveRate(predictions, groundTruth, indices);
          equalizedOdds[`gender_${gender}_tpr`] = tpr;
        }
      });
      
      Object.entries(ageGroups).forEach(([age, indices]) => {
        if (age && indices.length > 0) {
          const tpr = this.calculateTruePositiveRate(predictions, groundTruth, indices);
          equalizedOdds[`age_${age}_tpr`] = tpr;
        }
      });
    }
    
    // Calculate disparate impact (ratio of positive prediction rates)
    const disparateImpact: Record<string, number> = {};
    
    // For gender
    if (genderGroups['male'] && genderGroups['female']) {
      const maleRate = this.calculatePositiveRate(predictions, genderGroups['male']);
      const femaleRate = this.calculatePositiveRate(predictions, genderGroups['female']);
      disparateImpact['gender_ratio'] = femaleRate / maleRate;
    }
    
    // For age groups (comparing youngest to oldest)
    const ageKeys = Object.keys(ageGroups).sort();
    if (ageKeys.length >= 2) {
      const youngestRate = this.calculatePositiveRate(predictions, ageGroups[ageKeys[0]]);
      const oldestRate = this.calculatePositiveRate(predictions, ageGroups[ageKeys[ageKeys.length - 1]]);
      disparateImpact['age_ratio'] = youngestRate / oldestRate;
    }
    
    // Calculate overall fairness score (0-1, higher is better)
    const groupFairnessScore = this.calculateOverallFairnessScore(demographicParity, disparateImpact);
    
    return {
      demographicParity,
      equalizedOdds,
      disparateImpact,
      groupFairnessScore
    };
  }
  
  /**
   * Group indices by demographic attribute
   * @param demographics Array of demographic information
   * @param attribute Demographic attribute to group by
   * @returns Record of attribute values to array indices
   */
  private static groupBy(demographics: DemographicGroups[], attribute: string): Record<string, number[]> {
    const groups: Record<string, number[]> = {};
    
    demographics.forEach((demo, index) => {
      const value = demo[attribute];
      if (value) {
        if (!groups[value]) {
          groups[value] = [];
        }
        groups[value].push(index);
      }
    });
    
    return groups;
  }
  
  /**
   * Calculate positive prediction rate for a group
   * @param predictions Array of emotion predictions
   * @param indices Array of indices for the group
   * @returns Positive prediction rate (0-1)
   */
  private static calculatePositiveRate(predictions: EmotionState[], indices: number[]): number {
    const positiveCount = indices.filter(i => 
      ['happy', 'excited', 'calm'].includes(predictions[i].mood)
    ).length;
    
    return positiveCount / indices.length;
  }
  
  /**
   * Calculate true positive rate for a group
   * @param predictions Array of emotion predictions
   * @param groundTruth Array of ground truth labels
   * @param indices Array of indices for the group
   * @returns True positive rate (0-1)
   */
  private static calculateTruePositiveRate(
    predictions: EmotionState[],
    groundTruth: string[],
    indices: number[]
  ): number {
    const truePositives = indices.filter(i => 
      predictions[i].mood === groundTruth[i] && 
      ['happy', 'excited', 'calm'].includes(groundTruth[i])
    ).length;
    
    const actualPositives = indices.filter(i => 
      ['happy', 'excited', 'calm'].includes(groundTruth[i])
    ).length;
    
    return actualPositives > 0 ? truePositives / actualPositives : 0;
  }
  
  /**
   * Calculate overall fairness score
   * @param demographicParity Demographic parity metrics
   * @param disparateImpact Disparate impact metrics
   * @returns Overall fairness score (0-1)
   */
  private static calculateOverallFairnessScore(
    demographicParity: Record<string, number>,
    disparateImpact: Record<string, number>
  ): number {
    // Calculate variance in demographic parity (lower is better)
    const parityValues = Object.values(demographicParity);
    const parityMean = parityValues.reduce((sum, val) => sum + val, 0) / parityValues.length;
    const parityVariance = parityValues.reduce((sum, val) => sum + Math.pow(val - parityMean, 2), 0) / parityValues.length;
    
    // Calculate disparate impact score (closer to 1 is better)
    const impactValues = Object.values(disparateImpact);
    const impactScore = impactValues.reduce((sum, val) => sum + (1 - Math.abs(1 - val)), 0) / impactValues.length;
    
    // Combine scores (80% weight on disparate impact, 20% on demographic parity)
    const parityScore = 1 - Math.min(parityVariance * 10, 1); // Scale variance to 0-1 range
    return 0.2 * parityScore + 0.8 * impactScore;
  }
}

/**
 * Model evaluation tools for assessing performance across different groups
 */
export class ModelEvaluator {
  /**
   * Evaluate model performance
   * @param predictions Array of emotion predictions
   * @param groundTruth Array of ground truth labels
   * @param demographics Optional array of demographic information
   * @returns Model evaluation metrics
   */
  static evaluateModel(
    predictions: EmotionState[],
    groundTruth: string[],
    demographics?: DemographicGroups[]
  ): ModelEvaluation {
    // Calculate overall accuracy
    const correct = predictions.filter((pred, i) => pred.mood === groundTruth[i]).length;
    const accuracy = correct / predictions.length;
    
    // Get unique emotion categories
    const emotions = Array.from(new Set([
      ...predictions.map(p => p.mood),
      ...groundTruth
    ]));
    
    // Calculate precision, recall, and F1 score for each emotion
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1Score: Record<string, number> = {};
    
    emotions.forEach(emotion => {
      // True positives: predicted emotion correctly
      const tp = predictions.filter((pred, i) => 
        pred.mood === emotion && groundTruth[i] === emotion
      ).length;
      
      // False positives: predicted emotion incorrectly
      const fp = predictions.filter((pred, i) => 
        pred.mood === emotion && groundTruth[i] !== emotion
      ).length;
      
      // False negatives: failed to predict emotion
      const fn = predictions.filter((pred, i) => 
        pred.mood !== emotion && groundTruth[i] === emotion
      ).length;
      
      // Calculate metrics
      precision[emotion] = tp / (tp + fp) || 0;
      recall[emotion] = tp / (tp + fn) || 0;
      f1Score[emotion] = 2 * (precision[emotion] * recall[emotion]) / 
        (precision[emotion] + recall[emotion]) || 0;
    });
    
    // Create confusion matrix
    const confusionMatrix = this.createConfusionMatrix(predictions, groundTruth, emotions);
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix
    };
  }
  
  /**
   * Create confusion matrix
   * @param predictions Array of emotion predictions
   * @param groundTruth Array of ground truth labels
   * @param emotions Array of unique emotion categories
   * @returns Confusion matrix
   */
  private static createConfusionMatrix(
    predictions: EmotionState[],
    groundTruth: string[],
    emotions: string[]
  ): number[][] {
    // Initialize confusion matrix with zeros
    const matrix = Array(emotions.length).fill(0).map(() => Array(emotions.length).fill(0));
    
    // Fill confusion matrix
    predictions.forEach((pred, i) => {
      const predIndex = emotions.indexOf(pred.mood);
      const trueIndex = emotions.indexOf(groundTruth[i]);
      if (predIndex >= 0 && trueIndex >= 0) {
        matrix[trueIndex][predIndex]++;
      }
    });
    
    return matrix;
  }
}
