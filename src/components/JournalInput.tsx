
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const sentimentEmojis = [
  { emoji: '😊', label: 'Positive' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Negative' },
];

interface JournalInputProps {
  className?: string;
  style?: React.CSSProperties; // Add style prop to the interface
}

const JournalInput: React.FC<JournalInputProps> = ({ className, style }) => {
  const [journalText, setJournalText] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<number | null>(null);
  
  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJournalText(e.target.value);
  };
  
  const handleSave = () => {
    // Save journal entry functionality would go here
    console.log('Saving journal entry:', {
      text: journalText,
      sentiment: selectedSentiment !== null ? sentimentEmojis[selectedSentiment].label : null,
    });
    
    // Reset the form after saving
    setJournalText('');
    setSelectedSentiment(null);
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
          <p className="text-sm mb-2">How would you rate this feeling?</p>
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
