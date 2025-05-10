
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmotionTimeline from '@/components/EmotionTimeline';
import TherapistPanel from '@/components/TherapistPanel';
import AlertSystem from '@/components/AlertSystem';
import JournalInput from '@/components/JournalInput';
import MediaCapture from '@/components/MediaCapture';
import AIService from '@/services/aiService';
import { EmotionState } from '@/lib/aiCore';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '@/components/ErrorFallback';

const Dashboard = () => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);

  // Initialize AI service
  useEffect(() => {
    const aiService = AIService.getInstance();

    // Get current emotion state if available
    const state = aiService.getCurrentEmotionState();
    if (state) {
      setCurrentEmotion(state);
    }

    // Subscribe to emotion updates
    const handleEmotionUpdate = (state: EmotionState) => {
      setCurrentEmotion(state);
    };

    aiService.onEmotionUpdate(handleEmotionUpdate);

    return () => {
      aiService.removeEmotionUpdateListener(handleEmotionUpdate);
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
        <p className="text-muted-foreground mb-8">Track your progress and manage your mental health journey.</p>

        {/* Alert System */}
        <div className="mb-8">
          <AlertSystem />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmotionTimeline />
          <TherapistPanel />
          <MediaCapture onEmotionDetected={setCurrentEmotion} />
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Current Emotion</CardTitle>
            </CardHeader>
            <CardContent>
              {currentEmotion ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">
                      {currentEmotion.mood === 'happy' ? '😊' :
                       currentEmotion.mood === 'sad' ? '😢' :
                       currentEmotion.mood === 'angry' ? '😠' :
                       currentEmotion.mood === 'anxious' ? '😰' :
                       currentEmotion.mood === 'calm' ? '😌' :
                       currentEmotion.mood === 'excited' ? '😃' :
                       currentEmotion.mood === 'tired' ? '😴' :
                       currentEmotion.mood === 'frustrated' ? '😤' :
                       currentEmotion.mood === 'focused' ? '🧐' :
                       currentEmotion.mood === 'overwhelmed' ? '😵' : '😐'}
                    </span>
                    <div>
                      <h3 className="text-lg font-medium capitalize">{currentEmotion.mood}</h3>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {Math.round(currentEmotion.confidence * 100)}%
                      </p>
                    </div>
                  </div>

                  {currentEmotion.context && (
                    <p className="text-sm">
                      <span className="font-medium">Context:</span> {currentEmotion.context}
                    </p>
                  )}

                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-1">Source Weights:</h4>
                    <div className="space-y-1">
                      {Object.entries(currentEmotion.sourceWeights).map(([source, weight]) => (
                        <div key={source} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{source}</span>
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${weight * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Math.round(weight * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>No emotion data available yet. Try tracking your emotions using the timeline or enable real-time detection.</p>
              )}
            </CardContent>
          </Card>

          <JournalInput onEmotionDetected={setCurrentEmotion} />
        </div>
      </main>
    </>
  );
};

export default Dashboard;
