
import { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emotions = [
  { name: 'Calm', color: '#F2FCE2', icon: '😌' },
  { name: 'Happy', color: '#FEF7CD', icon: '😊' },
  { name: 'Excited', color: '#FEC6A1', icon: '😃' },
  { name: 'Focused', color: '#D3E4FD', icon: '🧐' },
  { name: 'Tired', color: '#F1F0FB', icon: '😴' },
  { name: 'Anxious', color: '#FFDEE2', icon: '😰' },
  { name: 'Overwhelmed', color: '#FDE1D3', icon: '😵' }
];

interface EmotionTimelineProps {
  className?: string;
}

const EmotionTimeline: React.FC<EmotionTimelineProps> = ({ className }) => {
  const [selectedEmotion, setSelectedEmotion] = useState(0);
  const [intensity, setIntensity] = useState([3]);
  
  return (
    <Card className={`glass overflow-hidden ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Emotion Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {emotions.map((emotion, index) => (
            <button
              key={emotion.name}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                selectedEmotion === index 
                  ? 'ring-2 ring-primary scale-105' 
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: selectedEmotion === index 
                  ? `${emotion.color}80` 
                  : `${emotion.color}40`
              }}
              onClick={() => setSelectedEmotion(index)}
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
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Last tracked:</p>
            <p className="text-sm">Today, 2:30 PM</p>
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
