import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AIService from '@/services/aiService';
import { EmotionState, ExplainabilityFeatures } from '@/lib/aiCore';

interface EmotionExplainerProps {
  className?: string;
  emotionState?: EmotionState;
}

const EmotionExplainer: React.FC<EmotionExplainerProps> = ({ className, emotionState: propEmotionState }) => {
  const aiService = AIService.getInstance();
  const [emotionState, setEmotionState] = useState<EmotionState | null>(propEmotionState || null);
  const [childExplanation, setChildExplanation] = useState<{ emoji: string, color: string, description: string } | null>(null);
  const [adultExplanation, setAdultExplanation] = useState<string | null>(null);
  
  // Sample features for explainability
  const sampleFeatures: ExplainabilityFeatures = {
    facialFeatures: {
      gaze: 'direct',
      expression: 'neutral',
      dominantRegions: [
        { region: 'eyes', contribution: 0.7 },
        { region: 'mouth', contribution: 0.5 }
      ]
    },
    voiceFeatures: {
      pitchDescription: 'medium',
      energyDescription: 'medium',
      toneDescription: 'neutral'
    },
    textFeatures: {
      dominantKeywords: [],
      sentiment: 'neutral'
    }
  };
  
  // Update features based on emotion
  const getFeatures = (emotion: EmotionState): ExplainabilityFeatures => {
    const features = { ...sampleFeatures };
    
    // Update facial features
    switch (emotion.mood) {
      case 'happy':
        features.facialFeatures!.expression = 'smiling';
        features.facialFeatures!.gaze = 'direct';
        features.voiceFeatures!.pitchDescription = 'high';
        features.voiceFeatures!.energyDescription = 'high';
        features.voiceFeatures!.toneDescription = 'cheerful';
        break;
      case 'sad':
        features.facialFeatures!.expression = 'downturned';
        features.facialFeatures!.gaze = 'downward';
        features.voiceFeatures!.pitchDescription = 'low';
        features.voiceFeatures!.energyDescription = 'low';
        features.voiceFeatures!.toneDescription = 'flat';
        break;
      case 'angry':
        features.facialFeatures!.expression = 'frowning';
        features.facialFeatures!.gaze = 'direct';
        features.voiceFeatures!.pitchDescription = 'high';
        features.voiceFeatures!.energyDescription = 'high';
        features.voiceFeatures!.toneDescription = 'sharp';
        break;
      case 'anxious':
        features.facialFeatures!.expression = 'tense';
        features.facialFeatures!.gaze = 'averted';
        features.voiceFeatures!.pitchDescription = 'variable';
        features.voiceFeatures!.energyDescription = 'variable';
        features.voiceFeatures!.toneDescription = 'shaky';
        break;
      case 'calm':
        features.facialFeatures!.expression = 'relaxed';
        features.facialFeatures!.gaze = 'direct';
        features.voiceFeatures!.pitchDescription = 'medium';
        features.voiceFeatures!.energyDescription = 'medium';
        features.voiceFeatures!.toneDescription = 'steady';
        break;
      // Add more cases as needed
    }
    
    return features;
  };
  
  // Initialize and subscribe to emotion updates
  useEffect(() => {
    // If no emotion state provided as prop, get current emotion state
    if (!propEmotionState) {
      const currentState = aiService.getCurrentEmotionState();
      if (currentState) {
        setEmotionState(currentState);
      }
      
      // Subscribe to emotion updates
      const handleEmotionUpdate = (state: EmotionState) => {
        setEmotionState(state);
      };
      
      aiService.onEmotionUpdate(handleEmotionUpdate);
      
      return () => {
        aiService.removeEmotionUpdateListener(handleEmotionUpdate);
      };
    }
  }, [propEmotionState]);
  
  // Update explanations when emotion state changes
  useEffect(() => {
    if (emotionState) {
      // Get child-friendly explanation
      const childExp = aiService.getChildFriendlyExplanation();
      if (childExp) {
        setChildExplanation(childExp);
      }
      
      // Get adult explanation with features
      const features = getFeatures(emotionState);
      const adultExp = aiService.getAdultExplanation(features);
      if (adultExp) {
        setAdultExplanation(adultExp);
      }
    }
  }, [emotionState]);
  
  if (!emotionState) {
    return (
      <Card className={`glass ${className || ''}`}>
        <CardHeader>
          <CardTitle>Emotion Explainer</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No emotion data available yet. Track an emotion first.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <CardTitle>Emotion Explainer</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="child">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="child">Child View</TabsTrigger>
            <TabsTrigger value="adult">Adult View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="child" className="mt-4">
            {childExplanation ? (
              <div 
                className="p-6 rounded-lg text-center"
                style={{ backgroundColor: `${childExplanation.color}80` }}
              >
                <div className="text-6xl mb-4">{childExplanation.emoji}</div>
                <p className="text-lg font-medium">{childExplanation.description}</p>
              </div>
            ) : (
              <p>Child explanation not available.</p>
            )}
          </TabsContent>
          
          <TabsContent value="adult" className="mt-4">
            {adultExplanation ? (
              <div className="space-y-4">
                <p>{adultExplanation}</p>
                
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Contributing Factors:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(emotionState.sourceWeights).map(([source, weight]) => (
                      <div key={source} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: 
                              source === 'face' ? '#FFD700' :
                              source === 'voice' ? '#6495ED' :
                              source === 'journal' ? '#FF4500' : '#98FB98'
                          }}
                        ></div>
                        <span className="text-sm capitalize">{source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>Adult explanation not available.</p>
            )}
          </TabsContent>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={() => {
            // Generate a mock facial embedding for a random emotion
            const emotions: Array<EmotionCategory> = ['happy', 'sad', 'angry', 'anxious', 'calm'];
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            const mockFacialEmbedding = aiService.generateMockFacialEmbedding(randomEmotion);
            
            // Detect emotion using the mock data
            aiService.detectEmotion(mockFacialEmbedding, null, null, null);
          }}
        >
          Generate Random Emotion
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmotionExplainer;
