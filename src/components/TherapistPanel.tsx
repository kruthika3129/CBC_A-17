
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Simple line chart component
const LineChart = () => {
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
};

interface TherapistPanelProps {
  className?: string;
}

const TherapistPanel: React.FC<TherapistPanelProps> = ({ className }) => {
  const [shareEnabled, setShareEnabled] = useState(true);

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
          <LineChart />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
        
        <div className="pt-2 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-psytrack-purple rounded-full"></div>
              <span className="text-sm">Anxiety</span>
            </div>
            <span className="text-sm font-medium">37% decrease</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-psytrack-soft-blue rounded-full"></div>
              <span className="text-sm">Communication</span>
            </div>
            <span className="text-sm font-medium">12% increase</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-psytrack-soft-pink rounded-full"></div>
              <span className="text-sm">Social Interaction</span>
            </div>
            <span className="text-sm font-medium">24% increase</span>
          </div>
        </div>
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
