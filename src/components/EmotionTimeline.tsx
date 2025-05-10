
import { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AIService from '@/services/aiService';
import { EmotionCategory, EmotionState } from '@/lib/aiCore';

// Map of emotion categories to UI display properties
const emotionMap: Record<EmotionCategory, { name: string, color: string, icon: string }> = {
  calm: { name: 'Calm', color: '#F2FCE2', icon: '😌' },
  happy: { name: 'Happy', color: '#FEF7CD', icon: '😊' },
  excited: { name: 'Excited', color: '#FEC6A1', icon: '😃' },
  focused: { name: 'Focused', color: '#D3E4FD', icon: '🧐' },
  tired: { name: 'Tired', color: '#F1F0FB', icon: '😴' },
  anxious: { name: 'Anxious', color: '#FFDEE2', icon: '😰' },
  overwhelmed: { name: 'Overwhelmed', color: '#FDE1D3', icon: '😵' },
  sad: { name: 'Sad', color: '#E6F0FF', icon: '😢' },
  angry: { name: 'Angry', color: '#FFE5E5', icon: '😠' },
  frustrated: { name: 'Frustrated', color: '#FFE8D9', icon: '😤' },
  neutral: { name: 'Neutral', color: '#F0F0F0', icon: '😐' }
};

// Convert the map to an array for rendering
const emotions = Object.entries(emotionMap).map(([key, value]) => ({
  id: key as EmotionCategory,
  ...value
}));

interface EmotionTimelineProps {
  className?: string;
}

const EmotionTimeline: React.FC<EmotionTimelineProps> = ({ className }) => {
  const { toast } = useToast();
  const aiService = AIService.getInstance();

  // State for UI
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionCategory>('neutral');
  const [intensity, setIntensity] = useState([3]);
  const [lastTracked, setLastTracked] = useState<Date | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);

  // Initialize and subscribe to emotion updates
  useEffect(() => {
    // Get current emotion state if available
    const currentState = aiService.getCurrentEmotionState();
    if (currentState) {
      setCurrentEmotion(currentState);
      setSelectedEmotion(currentState.mood);
      setIntensity([Math.round(currentState.confidence * 5)]);
      setLastTracked(new Date(currentState.timestamp));
    }

    // Subscribe to emotion updates
    const handleEmotionUpdate = (state: EmotionState) => {
      setCurrentEmotion(state);
      setSelectedEmotion(state.mood);
      setIntensity([Math.round(state.confidence * 5)]);
      setLastTracked(new Date(state.timestamp));
    };

    aiService.onEmotionUpdate(handleEmotionUpdate);

    // Cleanup subscription
    return () => {
      aiService.removeEmotionUpdateListener(handleEmotionUpdate);
    };
  }, []);

  // Handle manual emotion tracking
  const handleTrackEmotion = () => {
    // Convert intensity to confidence (0-1 scale)
    const confidence = intensity[0] / 5;

    // Use the AI service to generate a mock facial embedding for the selected emotion
    const mockFacialEmbedding = aiService.generateMockFacialEmbedding(selectedEmotion);

    // Detect emotion using the mock data
    const emotionState = aiService.detectEmotion(mockFacialEmbedding, null, null, null);

    // Show toast notification
    toast({
      title: "Emotion Tracked",
      description: `${emotionMap[emotionState.mood].icon} ${emotionMap[emotionState.mood].name} with ${Math.round(emotionState.confidence * 100)}% confidence`,
    });
  };

  // Format the last tracked time
  const formatLastTracked = () => {
    if (!lastTracked) return 'Not tracked yet';

    const now = new Date();
    const diffMs = now.getTime() - lastTracked.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const hours = lastTracked.getHours();
    const minutes = lastTracked.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `Today, ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <Card className={`glass overflow-hidden ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Emotion Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                selectedEmotion === emotion.id
                  ? 'ring-2 ring-primary scale-105'
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: selectedEmotion === emotion.id
                  ? `${emotion.color}80`
                  : `${emotion.color}40`
              }}
              onClick={() => setSelectedEmotion(emotion.id)}
            >
              <span className="text-xl">{emotion.icon}</span>
              <span>{emotion.name}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Intensity</span>
            <span className="text-sm font-medium">{intensity[0]}/5</span>
          </div>

          <Slider
            defaultValue={[3]}
            max={5}
            step={1}
            value={intensity}
            onValueChange={setIntensity}
            className="py-4"
          />

          <div className="grid grid-cols-5 text-xs text-muted-foreground">
            <div className="text-left">Subtle</div>
            <div className="text-center">Low</div>
            <div className="text-center">Medium</div>
            <div className="text-center">High</div>
            <div className="text-right">Intense</div>
          </div>

          <Button
            className="w-full mt-2"
            onClick={handleTrackEmotion}
          >
            Track Emotion
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Last tracked:</p>
            <p className="text-sm">{formatLastTracked()}</p>
          </div>
          <div className="mt-2 flex justify-center">
            <button className="text-primary text-sm flex items-center gap-1 hover:underline">
              <span>View history</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 5L15.5 12L8.5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionTimeline;
