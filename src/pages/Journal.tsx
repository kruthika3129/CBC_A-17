
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import JournalInput from '@/components/JournalInput';
import EmotionExplainer from '@/components/EmotionExplainer';
import AlertSystem from '@/components/AlertSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmotionState } from '@/lib/aiCore';

const Journal = () => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);

  // Handle emotion detection from journal
  const handleEmotionDetected = (emotion: EmotionState) => {
    setCurrentEmotion(emotion);
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-6">Your Journal</h1>
        <p className="text-muted-foreground mb-8">Express yourself freely in a safe, private space.</p>

        {/* Alert System */}
        <div className="mb-8">
          <AlertSystem />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <JournalInput onEmotionDetected={handleEmotionDetected} />

            <EmotionExplainer emotionState={currentEmotion || undefined} />
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be populated from a database in a real app */}
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Today, 10:30 AM</p>
                      <div className="flex items-center mt-1">
                        <span className="text-lg mr-1">😊</span>
                        <span className="text-sm text-muted-foreground">Happy (85% confidence)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">I had a great morning today! My math test went really well and I'm feeling confident about the results.</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Yesterday, 7:15 PM</p>
                      <div className="flex items-center mt-1">
                        <span className="text-lg mr-1">😰</span>
                        <span className="text-sm text-muted-foreground">Anxious (72% confidence)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">Feeling nervous about tomorrow's math test. I've been studying hard but still worried about some of the topics.</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">2 days ago, 3:45 PM</p>
                      <div className="flex items-center mt-1">
                        <span className="text-lg mr-1">🧐</span>
                        <span className="text-sm text-muted-foreground">Focused (91% confidence)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">Spent the afternoon studying for my math test. I'm making good progress on understanding the formulas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Journal;
