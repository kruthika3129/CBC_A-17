import { useState } from 'react';
import { useWebGazer, WebGazerStatus } from '@/hooks/use-webgazer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface WebGazerControlsProps {
  className?: string;
}

export function WebGazerControls({ className }: WebGazerControlsProps) {
  // WebGazer settings
  const [showVideo, setShowVideo] = useState(false);
  const [showPredictionPoints, setShowPredictionPoints] = useState(false);
  const [showFaceOverlay, setShowFaceOverlay] = useState(false);
  const [throttleMs, setThrottleMs] = useState(100);
  const [lowResolution, setLowResolution] = useState(true);
  
  // Initialize WebGazer hook with settings
  const {
    isWebGazerAvailable,
    status,
    error,
    prediction,
    startWebGazer,
    stopWebGazer,
    pauseWebGazer,
    resumeWebGazer,
  } = useWebGazer({
    showVideo,
    showPredictionPoints,
    showFaceOverlay,
    throttleMs,
    lowResolution,
    pauseOnHidden: true,
  });
  
  // Handle toggle WebGazer
  const handleToggleWebGazer = async () => {
    if (status === 'active' || status === 'paused') {
      stopWebGazer();
    } else if (status === 'inactive' || status === 'error') {
      const success = await startWebGazer();
      if (success) {
        toast({
          title: 'Eye tracking started',
          description: 'Eye tracking is now active.',
        });
      }
    }
  };
  
  // Handle pause/resume WebGazer
  const handlePauseResumeWebGazer = () => {
    if (status === 'active') {
      pauseWebGazer();
      toast({
        title: 'Eye tracking paused',
        description: 'Eye tracking is now paused.',
      });
    } else if (status === 'paused') {
      resumeWebGazer();
      toast({
        title: 'Eye tracking resumed',
        description: 'Eye tracking is now active.',
      });
    }
  };
  
  // Get status text and color
  const getStatusInfo = (status: WebGazerStatus) => {
    switch (status) {
      case 'inactive':
        return { text: 'Inactive', color: 'text-gray-500' };
      case 'initializing':
        return { text: 'Initializing...', color: 'text-yellow-500' };
      case 'active':
        return { text: 'Active', color: 'text-green-500' };
      case 'paused':
        return { text: 'Paused', color: 'text-blue-500' };
      case 'error':
        return { text: 'Error', color: 'text-red-500' };
      default:
        return { text: 'Unknown', color: 'text-gray-500' };
    }
  };
  
  const statusInfo = getStatusInfo(status);
  
  // If WebGazer is not available, show a message
  if (!isWebGazerAvailable) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Eye Tracking</CardTitle>
          <CardDescription>WebGazer is not available on this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Eye Tracking Controls</span>
          <span className={`text-sm font-normal ${statusInfo.color}`}>{statusInfo.text}</span>
        </CardTitle>
        <CardDescription>
          Optimize eye tracking performance and settings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Main controls */}
        <div className="space-y-4">
          {/* Performance settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Performance Settings</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="lowResolution" className="flex-1">Low Resolution Mode</Label>
              <Switch
                id="lowResolution"
                checked={lowResolution}
                onCheckedChange={(checked) => {
                  setLowResolution(checked);
                  if (status === 'active') {
                    toast({
                      title: 'Restart required',
                      description: 'Please restart eye tracking to apply this change.',
                    });
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="throttleMs">Update Frequency</Label>
                <span className="text-sm text-muted-foreground">{throttleMs}ms</span>
              </div>
              <Slider
                id="throttleMs"
                min={16}
                max={500}
                step={16}
                value={[throttleMs]}
                onValueChange={(value) => {
                  setThrottleMs(value[0]);
                  if (status === 'active') {
                    toast({
                      title: 'Restart required',
                      description: 'Please restart eye tracking to apply this change.',
                    });
                  }
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Faster (16ms)</span>
                <span>Smoother (500ms)</span>
              </div>
            </div>
          </div>
          
          {/* Debug settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Debug Settings</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showVideo" className="flex-1">Show Camera Feed</Label>
              <Switch
                id="showVideo"
                checked={showVideo}
                onCheckedChange={(checked) => {
                  setShowVideo(checked);
                  if (status === 'active') {
                    toast({
                      title: 'Restart required',
                      description: 'Please restart eye tracking to apply this change.',
                    });
                  }
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showPredictionPoints" className="flex-1">Show Prediction Points</Label>
              <Switch
                id="showPredictionPoints"
                checked={showPredictionPoints}
                onCheckedChange={(checked) => {
                  setShowPredictionPoints(checked);
                  if (status === 'active') {
                    toast({
                      title: 'Restart required',
                      description: 'Please restart eye tracking to apply this change.',
                    });
                  }
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showFaceOverlay" className="flex-1">Show Face Overlay</Label>
              <Switch
                id="showFaceOverlay"
                checked={showFaceOverlay}
                onCheckedChange={(checked) => {
                  setShowFaceOverlay(checked);
                  if (status === 'active') {
                    toast({
                      title: 'Restart required',
                      description: 'Please restart eye tracking to apply this change.',
                    });
                  }
                }}
              />
            </div>
          </div>
          
          {/* Current prediction */}
          {prediction && (
            <div className="text-sm">
              <p className="font-medium">Current Gaze Position:</p>
              <p className="text-muted-foreground">
                X: {prediction.x.toFixed(0)}, Y: {prediction.y.toFixed(0)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2">
        <Button
          variant={status === 'active' || status === 'paused' ? "destructive" : "default"}
          className="flex-1"
          onClick={handleToggleWebGazer}
          disabled={status === 'initializing'}
        >
          {status === 'active' || status === 'paused' ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Tracking
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Tracking
            </>
          )}
        </Button>
        
        {(status === 'active' || status === 'paused') && (
          <Button
            variant="outline"
            onClick={handlePauseResumeWebGazer}
          >
            {status === 'active' ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
        )}
        
        {status === 'error' && (
          <Button
            variant="outline"
            onClick={() => startWebGazer()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
