
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import AIService from '@/services/aiService';
import { EmotionCategory, EmotionState, EmotionSummary } from '@/lib/aiCore';

// Map of emotion categories to colors
const emotionColors: Record<EmotionCategory, string> = {
  happy: '#FEF7CD',
  sad: '#E6F0FF',
  angry: '#FFE5E5',
  anxious: '#FFDEE2',
  calm: '#F2FCE2',
  excited: '#FEC6A1',
  tired: '#F1F0FB',
  frustrated: '#FFE8D9',
  focused: '#D3E4FD',
  overwhelmed: '#FDE1D3',
  neutral: '#F0F0F0'
};

// Simple line chart component
const LineChart = ({ emotionHistory }: { emotionHistory: EmotionState[] }) => {
  // If no history, show placeholder data
  if (emotionHistory.length === 0) {
    const points = [15, 40, 20, 60, 35, 25, 70];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min;

    return (
      <div className="w-full h-[60px] flex items-end">
        {points.map((point, i) => {
          const height = ((point - min) / range) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <div
                className={`w-1 rounded-t-full bg-primary/80 transition-all duration-300 ease-in-out ${i === points.length - 1 ? 'animate-pulse' : ''}`}
                style={{ height: `${height}%` }}
              ></div>
            </div>
          );
        })}
      </div>
    );
  }

  // Process real emotion history
  // Group by day and calculate average confidence
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayData: Record<string, { count: number, totalConfidence: number, emotions: Record<EmotionCategory, number> }> = {};

  // Initialize data for each day
  days.forEach(day => {
    dayData[day] = {
      count: 0,
      totalConfidence: 0,
      emotions: {
        happy: 0, sad: 0, angry: 0, anxious: 0, calm: 0,
        excited: 0, tired: 0, frustrated: 0, focused: 0,
        overwhelmed: 0, neutral: 0
      }
    };
  });

  // Process emotion history
  emotionHistory.forEach(state => {
    const date = new Date(state.timestamp);
    const day = days[date.getDay()];

    dayData[day].count += 1;
    dayData[day].totalConfidence += state.confidence;
    dayData[day].emotions[state.mood] += 1;
  });

  // Calculate dominant emotion for each day
  const dayEmotions = days.map(day => {
    if (dayData[day].count === 0) return { day, emotion: 'neutral' as EmotionCategory, height: 0 };

    // Find dominant emotion
    let dominantEmotion: EmotionCategory = 'neutral';
    let maxCount = 0;

    Object.entries(dayData[day].emotions).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion as EmotionCategory;
      }
    });

    // Calculate average confidence
    const avgConfidence = dayData[day].totalConfidence / dayData[day].count;

    return {
      day,
      emotion: dominantEmotion,
      height: dayData[day].count > 0 ? avgConfidence * 100 : 0
    };
  });

  // Ensure we have a range for the chart
  const heights = dayEmotions.map(d => d.height);
  const max = Math.max(...heights, 70); // Ensure at least some height
  const min = Math.min(...heights, 10); // Ensure at least some range
  const range = max - min;

  return (
    <div className="w-full h-[60px] flex items-end">
      {dayEmotions.map((data, i) => {
        const height = range > 0 ? ((data.height - min) / range) * 100 : 50;
        return (
          <div key={data.day} className="flex-1 flex flex-col items-center justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`w-1 rounded-t-full transition-all duration-300 ease-in-out ${i === dayEmotions.length - 1 ? 'animate-pulse' : ''}`}
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: emotionColors[data.emotion] || '#F0F0F0'
                  }}
                ></div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{data.day}: {data.emotion} ({Math.round(data.height)}%)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};

interface TherapistPanelProps {
  className?: string;
}

const TherapistPanel: React.FC<TherapistPanelProps> = ({ className }) => {
  const aiService = AIService.getInstance();
  const [shareEnabled, setShareEnabled] = useState(true);
  const [emotionHistory, setEmotionHistory] = useState<EmotionState[]>([]);
  const [emotionSummary, setEmotionSummary] = useState<EmotionSummary | null>(null);
  const [therapistSummary, setTherapistSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Update privacy settings when share toggle changes
  useEffect(() => {
    aiService.updatePrivacySettings({
      shareWithTherapist: shareEnabled
    });
  }, [shareEnabled]);

  // Get emotion history and summary
  useEffect(() => {
    // Get the last 7 days period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const period = {
      start: startDate.getTime(),
      end: endDate.getTime(),
      label: 'Last 7 days'
    };

    // Get emotion summary
    const summary = aiService.getEmotionSummary(period);
    setEmotionSummary(summary);

    // Get therapist summary
    const tSummary = aiService.getTherapistSummary(period);
    setTherapistSummary(tSummary);

    // Get emotion history from alert engine
    const history = aiService.getCurrentEmotionState() ? [aiService.getCurrentEmotionState()!] : [];
    setEmotionHistory(history);

    // Subscribe to emotion updates
    const handleEmotionUpdate = (state: EmotionState) => {
      setEmotionHistory(prev => [...prev, state]);
    };

    aiService.onEmotionUpdate(handleEmotionUpdate);

    return () => {
      aiService.removeEmotionUpdateListener(handleEmotionUpdate);
    };
  }, []);

  // Generate a detailed session summary
  const generateSessionSummary = async () => {
    setIsGeneratingSummary(true);

    try {
      const summary = await aiService.generateSessionSummary({
        audienceType: 'therapist',
        includeContexts: true,
        focusAreas: ['emotional_regulation', 'anxiety_management']
      });

      // Update therapist summary with the generated summary
      setTherapistSummary(summary.summary);
    } catch (error) {
      console.error('Error generating session summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Calculate trend indicators
  const getTrendIndicator = (emotion: EmotionCategory): { direction: 'increase' | 'decrease' | 'stable', percentage: number } => {
    if (!emotionSummary) {
      return { direction: 'stable', percentage: 0 };
    }

    const trend = emotionSummary.trends.find(t => t.emotion === emotion);

    if (!trend) {
      return { direction: 'stable', percentage: 0 };
    }

    if (trend.trend === 'increasing') {
      return { direction: 'increase', percentage: Math.round(trend.averageIntensity * 100) };
    } else if (trend.trend === 'decreasing') {
      return { direction: 'decrease', percentage: Math.round(trend.averageIntensity * 100) };
    } else {
      return { direction: 'stable', percentage: Math.round(trend.averageIntensity * 100) };
    }
  };

  // Get anxiety trend
  const anxietyTrend = getTrendIndicator('anxious');

  // Get focus/communication trend
  const focusTrend = getTrendIndicator('focused');

  // Get social interaction (using calm as proxy)
  const calmTrend = getTrendIndicator('calm');

  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Therapist Panel</CardTitle>
          <Badge variant="outline" className={shareEnabled ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}>
            {shareEnabled ? "Sharing On" : "Private Mode"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">Weekly Mood Trends</div>
          <TooltipProvider>
            <LineChart emotionHistory={emotionHistory} />
          </TooltipProvider>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-psytrack-purple rounded-full"></div>
              <span className="text-sm">Anxiety</span>
            </div>
            <span className="text-sm font-medium">
              {anxietyTrend.direction === 'decrease' ? `${anxietyTrend.percentage}% decrease` :
               anxietyTrend.direction === 'increase' ? `${anxietyTrend.percentage}% increase` :
               'Stable'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-psytrack-soft-blue rounded-full"></div>
              <span className="text-sm">Focus</span>
            </div>
            <span className="text-sm font-medium">
              {focusTrend.direction === 'increase' ? `${focusTrend.percentage}% increase` :
               focusTrend.direction === 'decrease' ? `${focusTrend.percentage}% decrease` :
               'Stable'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-psytrack-soft-pink rounded-full"></div>
              <span className="text-sm">Emotional Balance</span>
            </div>
            <span className="text-sm font-medium">
              {calmTrend.direction === 'increase' ? `${calmTrend.percentage}% increase` :
               calmTrend.direction === 'decrease' ? `${calmTrend.percentage}% decrease` :
               'Stable'}
            </span>
          </div>
        </div>

        {therapistSummary && (
          <div className="pt-2 mt-2 border-t">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">Therapist Summary</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">This summary is generated for your therapist based on your emotional data.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">{therapistSummary}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={generateSessionSummary}
              disabled={isGeneratingSummary}
            >
              {isGeneratingSummary ? 'Generating...' : 'Generate Detailed Summary'}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Dr. Sarah available</span>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="share-toggle" className="text-sm">Share Data</Label>
          <Switch
            id="share-toggle"
            checked={shareEnabled}
            onCheckedChange={setShareEnabled}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default TherapistPanel;
