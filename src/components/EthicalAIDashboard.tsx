import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Info, Eye, MessageSquare, AlertTriangle } from 'lucide-react';
import ShapVisualization from './ShapVisualization';
import LimeExplanation from './LimeExplanation';
import FairnessMetrics from './FairnessMetrics';
import AIService from '@/services/aiService';
import { EmotionState, ExplainabilityFeatures } from '@/lib/aiCore';
import { EnhancedExplainabilityModule } from '@/lib/enhancedExplainability';

interface EthicalAIDashboardProps {
  className?: string;
  emotionState?: EmotionState;
  textInput?: string;
  eyeTrackingData?: {
    gazeDirection?: string;
    blinkRate?: number;
    pupilDilation?: number;
    focusPoint?: { x: number, y: number };
  };
  faceDetectionData?: {
    expressions?: Record<string, number>;
    landmarks?: any;
    gender?: string;
    age?: number;
  };
  realTime?: boolean;
}

const EthicalAIDashboard: React.FC<EthicalAIDashboardProps> = ({
  className,
  emotionState: propEmotionState,
  textInput,
  eyeTrackingData,
  faceDetectionData,
  realTime = true
}) => {
  const aiService = AIService.getInstance();
  const [emotionState, setEmotionState] = useState<EmotionState | null>(propEmotionState || null);
  const [features, setFeatures] = useState<ExplainabilityFeatures | null>(null);
  const [attributionData, setAttributionData] = useState<any | null>(null);
  const [dataSource, setDataSource] = useState<'text' | 'face' | 'combined' | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate features for the current emotion state with real-time data
  const generateFeatures = (state: EmotionState) => {
    // Create base features
    const features: ExplainabilityFeatures = {
      demographics: {
        age: faceDetectionData?.age ? (faceDetectionData.age < 13 ? 'child' :
          faceDetectionData.age < 18 ? 'teen' : 'adult') : 'child',
        gender: faceDetectionData?.gender || (Math.random() > 0.5 ? 'male' : 'female')
      }
    };

    // Add facial features if available
    if (faceDetectionData?.expressions) {
      const expressions = faceDetectionData.expressions;
      const dominantExpression = Object.entries(expressions)
        .sort((a, b) => b[1] - a[1])[0][0];

      features.facialFeatures = {
        expression: dominantExpression,
        dominantRegions: [
          { region: 'eyes', contribution: expressions.surprised || expressions.fearful || 0.5 },
          { region: 'mouth', contribution: expressions.happy || expressions.sad || 0.4 },
          { region: 'brows', contribution: expressions.angry || expressions.disgusted || 0.3 }
        ]
      };
    } else {
      // Fallback facial features
      features.facialFeatures = {
        expression: state.mood === 'happy' ? 'smiling' :
          state.mood === 'sad' ? 'frowning' : 'neutral',
        dominantRegions: [
          { region: 'eyes', contribution: 0.7 },
          { region: 'mouth', contribution: 0.5 }
        ]
      };
    }

    // Add eye tracking data if available
    if (eyeTrackingData) {
      if (!features.facialFeatures) features.facialFeatures = {};

      features.facialFeatures.gaze = eyeTrackingData.gazeDirection as any || 'direct';

      // Add eye tracking specific features
      features.eyeTrackingFeatures = {
        blinkRate: eyeTrackingData.blinkRate,
        pupilDilation: eyeTrackingData.pupilDilation,
        focusPoint: eyeTrackingData.focusPoint ?
          `x:${eyeTrackingData.focusPoint.x.toFixed(2)}, y:${eyeTrackingData.focusPoint.y.toFixed(2)}` : undefined
      };
    }

    // Add text features if available
    if (textInput) {
      // Simple sentiment analysis based on keywords
      const positiveWords = ['happy', 'good', 'great', 'excellent', 'joy', 'love', 'excited', 'calm'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'angry', 'hate', 'anxious', 'worried'];

      const words = textInput.toLowerCase().split(/\W+/).filter(w => w.length > 2);
      const positiveCount = words.filter(w => positiveWords.includes(w)).length;
      const negativeCount = words.filter(w => negativeWords.includes(w)).length;

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      else if (negativeCount > positiveCount) sentiment = 'negative';

      features.textFeatures = {
        dominantKeywords: words.filter(w => positiveWords.includes(w) || negativeWords.includes(w)).slice(0, 3),
        sentiment
      };
    } else {
      // Fallback text features
      features.textFeatures = {
        dominantKeywords: ['feeling', state.mood, 'today'],
        sentiment: ['happy', 'excited', 'calm'].includes(state.mood) ? 'positive' as const :
          ['sad', 'angry', 'anxious'].includes(state.mood) ? 'negative' as const : 'neutral' as const
      };
    }

    // Add voice features (mock data as we don't have real voice input)
    features.voiceFeatures = {
      pitchDescription: state.mood === 'excited' ? 'high' as const :
        state.mood === 'sad' ? 'low' as const : 'medium' as const,
      energyDescription: state.mood === 'excited' || state.mood === 'angry' ? 'high' as const :
        state.mood === 'tired' ? 'low' as const : 'medium' as const,
      toneDescription: state.mood
    };

    return features;
  };

  // Update attribution data when emotion state changes
  useEffect(() => {
    if (emotionState) {
      const newFeatures = generateFeatures(emotionState);
      setFeatures(newFeatures);

      // Generate attribution data using the enhanced explainability module
      const newAttributionData = EnhancedExplainabilityModule.visualAttribution(emotionState, newFeatures);
      setAttributionData(newAttributionData);

      // Determine data source
      if (textInput && faceDetectionData) {
        setDataSource('combined');
      } else if (textInput) {
        setDataSource('text');
      } else if (faceDetectionData) {
        setDataSource('face');
      }

      // Update timestamp
      setLastUpdate(new Date());
      setIsAnalyzing(false);
    }
  }, [emotionState, textInput, faceDetectionData, eyeTrackingData]);

  // Set up real-time updates
  useEffect(() => {
    if (!realTime) return;

    // Function to update analysis
    const updateAnalysis = () => {
      setIsAnalyzing(true);

      // In a real implementation, this would trigger a new analysis
      // For this example, we'll simulate a delay
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        // Generate a new emotion state based on current inputs
        if (faceDetectionData?.expressions) {
          // Use face detection data to determine emotion
          const expressions = faceDetectionData.expressions;
          const dominantExpression = Object.entries(expressions)
            .sort((a, b) => b[1] - a[1])[0];

          const expressionToEmotion: Record<string, string> = {
            'happy': 'happy',
            'sad': 'sad',
            'angry': 'angry',
            'disgusted': 'frustrated',
            'fearful': 'anxious',
            'surprised': 'excited',
            'neutral': 'neutral'
          };

          const mood = expressionToEmotion[dominantExpression[0]] || 'neutral';
          const confidence = dominantExpression[1];

          const newEmotionState: EmotionState = {
            mood: mood as any,
            confidence,
            timestamp: new Date().toISOString(),
            sourceWeights: {
              facial: 0.7,
              text: textInput ? 0.3 : 0,
              eye: eyeTrackingData ? 0.2 : 0
            },
            context: 'real-time analysis'
          };

          setEmotionState(newEmotionState);
        } else if (textInput) {
          // Use text input to determine emotion
          const positiveWords = ['happy', 'good', 'great', 'excellent', 'joy', 'love', 'excited', 'calm'];
          const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'angry', 'hate', 'anxious', 'worried'];

          const words = textInput.toLowerCase().split(/\W+/).filter(w => w.length > 2);
          const positiveCount = words.filter(w => positiveWords.includes(w)).length;
          const negativeCount = words.filter(w => negativeWords.includes(w)).length;

          let mood = 'neutral';
          if (positiveCount > negativeCount) {
            mood = positiveWords.find(w => textInput.toLowerCase().includes(w)) || 'happy';
          } else if (negativeCount > positiveCount) {
            mood = negativeWords.find(w => textInput.toLowerCase().includes(w)) || 'sad';
          }

          const confidence = Math.max(0.6, Math.min(0.9, (Math.abs(positiveCount - negativeCount) / words.length) + 0.6));

          const newEmotionState: EmotionState = {
            mood: mood as any,
            confidence,
            timestamp: new Date().toISOString(),
            sourceWeights: {
              facial: 0,
              text: 0.9,
              eye: eyeTrackingData ? 0.1 : 0
            },
            context: 'text analysis'
          };

          setEmotionState(newEmotionState);
        }
      }, 500);
    };

    // Trigger update when inputs change
    if ((textInput || faceDetectionData || eyeTrackingData) && !isAnalyzing) {
      updateAnalysis();
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [realTime, textInput, faceDetectionData, eyeTrackingData, isAnalyzing]);

  // Generate SHAP summary data for visualization
  const shapSummaryData = attributionData?.shapValues ?
    EnhancedExplainabilityModule.generateShapSummaryData(emotionState!, features!) : [];

  if (!emotionState || !attributionData) {
    return (
      <Card className={`glass ${className || ''}`}>
        <CardHeader>
          <CardTitle>Ethical AI Dashboard</CardTitle>
          <CardDescription>
            Transparent and fair emotion detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>No emotion data available yet. Track an emotion first.</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => {
              // Generate a mock facial embedding for a random emotion
              const emotions = ['happy', 'sad', 'angry', 'anxious', 'calm'];
              const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
              const mockFacialEmbedding = aiService.generateMockFacialEmbedding(randomEmotion);

              // Detect emotion using the mock data
              const newEmotionState = aiService.detectEmotion(mockFacialEmbedding, null, null, null);
              setEmotionState(newEmotionState);
            }}
          >
            Generate Random Emotion
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Ethical AI Dashboard</CardTitle>
            <CardDescription>
              Transparent and fair emotion detection
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {dataSource && (
              <div className="flex items-center gap-1 text-xs bg-secondary/50 px-2 py-1 rounded-full">
                {dataSource === 'face' && <Eye className="h-3 w-3" />}
                {dataSource === 'text' && <MessageSquare className="h-3 w-3" />}
                {dataSource === 'combined' && (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>+</span>
                    <MessageSquare className="h-3 w-3" />
                  </>
                )}
                <span className="capitalize">{dataSource}</span>
              </div>
            )}
            {isAnalyzing && (
              <div className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                <span className="animate-pulse">Analyzing...</span>
              </div>
            )}
            <Button variant="outline" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {lastUpdate && (
          <div className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="explainability">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explainability">Explainability</TabsTrigger>
            <TabsTrigger value="fairness">Fairness</TabsTrigger>
            <TabsTrigger value="model">Model Info</TabsTrigger>
          </TabsList>

          <TabsContent value="explainability" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ShapVisualization shapValues={shapSummaryData} />

              <LimeExplanation
                features={attributionData.limeExplanation.features}
                weights={attributionData.limeExplanation.weights}
                localPrediction={attributionData.limeExplanation.localPrediction}
                intercept={attributionData.limeExplanation.intercept}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Why This Matters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explainable AI helps therapists and caregivers understand why a particular emotion was detected.
                  This transparency builds trust and allows for better decision-making in therapeutic contexts.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fairness" className="mt-4 space-y-6">
            {attributionData.fairnessMetrics ? (
              <FairnessMetrics
                demographicParity={attributionData.fairnessMetrics.demographicParity}
                equalizedOdds={attributionData.fairnessMetrics.equalizedOdds}
                disparateImpact={attributionData.fairnessMetrics.disparateImpact}
                groupFairnessScore={attributionData.fairnessMetrics.groupFairnessScore}
              />
            ) : (
              <p>No fairness metrics available.</p>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Why This Matters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fairness metrics ensure that our emotion detection works equally well for all children,
                  regardless of age, gender, or other demographic factors. This is crucial for providing
                  equitable mental health support.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="model" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Model Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Model Type</span>
                      <span className="text-sm">Multimodal Fusion</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Version</span>
                      <span className="text-sm">1.2.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Updated</span>
                      <span className="text-sm">2023-06-15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Training Data</span>
                      <span className="text-sm">Diverse Children's Dataset</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Overall Accuracy</span>
                      <span className="text-sm">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Precision</span>
                      <span className="text-sm">83%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Recall</span>
                      <span className="text-sm">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">F1 Score</span>
                      <span className="text-sm">84%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Why This Matters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Understanding the model's capabilities and limitations helps therapists interpret
                  the results appropriately. Our model is regularly evaluated and updated to ensure
                  it meets the highest standards for accuracy and fairness.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-6"
          onClick={() => {
            // Generate a mock facial embedding for a random emotion
            const emotions = ['happy', 'sad', 'angry', 'anxious', 'calm'];
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            const mockFacialEmbedding = aiService.generateMockFacialEmbedding(randomEmotion);

            // Detect emotion using the mock data
            const newEmotionState = aiService.detectEmotion(mockFacialEmbedding, null, null, null);
            setEmotionState(newEmotionState);
          }}
        >
          Generate New Random Emotion
        </Button>
      </CardContent>
    </Card>
  );
};

export default EthicalAIDashboard;
