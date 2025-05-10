
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import AIService from '@/services/aiService';
import { EmotionCategory, EmotionState } from '@/lib/aiCore';

// Map sentiment labels to emotion categories
const sentimentMap: Record<string, EmotionCategory[]> = {
  'Positive': ['happy', 'excited', 'calm', 'focused'],
  'Neutral': ['neutral', 'tired'],
  'Negative': ['sad', 'angry', 'anxious', 'frustrated', 'overwhelmed']
};

const sentimentEmojis = [
  { emoji: '😊', label: 'Positive' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Negative' },
];

interface JournalInputProps {
  className?: string;
  style?: React.CSSProperties;
  onEmotionDetected?: (emotion: EmotionState) => void;
}

const JournalInput: React.FC<JournalInputProps> = ({ className, style, onEmotionDetected }) => {
  const { toast } = useToast();
  const aiService = AIService.getInstance();

  const [journalText, setJournalText] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<number | null>(null);
  const [detectedEmotion, setDetectedEmotion] = useState<EmotionState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJournalText(e.target.value);

    // Reset detected emotion when text changes
    if (detectedEmotion) {
      setDetectedEmotion(null);
    }
  };

  // Analyze journal text to detect emotion
  const analyzeJournalText = () => {
    if (!journalText.trim()) return;

    setIsAnalyzing(true);

    try {
      // Use the AI service to detect emotion from journal text
      const emotionState = aiService.detectEmotionFromJournal(journalText);

      // Update state
      setDetectedEmotion(emotionState);

      // Auto-select the sentiment based on the detected emotion
      if (emotionState) {
        for (const [sentiment, emotions] of Object.entries(sentimentMap)) {
          if (emotions.includes(emotionState.mood)) {
            const sentimentIndex = sentimentEmojis.findIndex(item => item.label === sentiment);
            if (sentimentIndex !== -1) {
              setSelectedSentiment(sentimentIndex);
            }
            break;
          }
        }
      }

      // Notify parent component if callback provided
      if (onEmotionDetected) {
        onEmotionDetected(emotionState);
      }

      // Show toast with detected emotion
      toast({
        title: "Emotion Detected",
        description: `Based on your journal entry, you seem to be feeling ${emotionState.mood} (${Math.round(emotionState.confidence * 100)}% confidence)`,
      });
    } catch (error) {
      console.error('Error analyzing journal text:', error);
      toast({
        title: "Analysis Error",
        description: "There was an error analyzing your journal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    // If no emotion has been detected yet, analyze the text first
    if (!detectedEmotion && journalText.trim()) {
      analyzeJournalText();
    }

    // Create journal entry object
    const journalEntry = {
      text: journalText,
      sentiment: selectedSentiment !== null ? sentimentEmojis[selectedSentiment].label : null,
      timestamp: Date.now(),
      detectedEmotion: detectedEmotion?.mood || null,
      confidence: detectedEmotion?.confidence || null
    };

    // Log the journal entry (in a real app, this would save to a database)
    console.log('Saving journal entry:', journalEntry);

    // Show success toast
    toast({
      title: "Journal Entry Saved",
      description: "Your journal entry has been saved successfully.",
    });

    // Reset the form after saving
    setJournalText('');
    setSelectedSentiment(null);
    setDetectedEmotion(null);
  };

  return (
    <Card className={`glass ${className || ''}`} style={style}>
      <CardHeader>
        <CardTitle className="text-xl">Journal Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="How are you feeling today? Express yourself freely..."
          className="min-h-[120px] resize-none bg-background/50 focus-visible:ring-primary"
          value={journalText}
          onChange={handleJournalChange}
        />

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm">How would you rate this feeling?</p>
            {journalText.length > 10 && !detectedEmotion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeJournalText}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {sentimentEmojis.map((item, index) => (
              <button
                key={item.label}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  selectedSentiment === index
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'hover:bg-primary/5'
                }`}
                onClick={() => setSelectedSentiment(index)}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {detectedEmotion && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <p className="text-sm font-medium">AI Detected Emotion:</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">
                {detectedEmotion.mood === 'happy' ? '😊' :
                 detectedEmotion.mood === 'sad' ? '😢' :
                 detectedEmotion.mood === 'angry' ? '😠' :
                 detectedEmotion.mood === 'anxious' ? '😰' :
                 detectedEmotion.mood === 'calm' ? '😌' :
                 detectedEmotion.mood === 'excited' ? '😃' :
                 detectedEmotion.mood === 'tired' ? '😴' :
                 detectedEmotion.mood === 'frustrated' ? '😤' :
                 detectedEmotion.mood === 'focused' ? '🧐' :
                 detectedEmotion.mood === 'overwhelmed' ? '😵' : '😐'}
              </span>
              <span className="capitalize">{detectedEmotion.mood}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {Math.round(detectedEmotion.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          className="magnetic-button"
          onClick={handleSave}
          disabled={!journalText.trim()}
        >
          Save Entry
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JournalInput;
