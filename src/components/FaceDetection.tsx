import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

interface FaceDetectionProps {
  className?: string;
}

const FaceDetection: React.FC<FaceDetectionProps> = ({ className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up function to stop all tracks
  const stopVideoStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsTestRunning(false);
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopVideoStream();
    };
  }, []);

  const startFaceDetection = async () => {
    try {
      setIsTestRunning(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      // Store the stream for later cleanup
      streamRef.current = stream;
      
      // Set the video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasPermission(true);
      toast.success("Camera access granted successfully");
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsTestRunning(false);
      setHasPermission(false);
      
      // Show appropriate error message
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error("Media access error: Could not access camera or microphone. Please check permissions.");
        } else if (error.name === 'NotFoundError') {
          toast.error("No camera detected. Please connect a camera and try again.");
        } else if (error.name === 'NotReadableError') {
          toast.error("Could not start video source. Camera might be in use by another application.");
        } else {
          toast.error(`Error testing face detection: ${error.message}`);
        }
      } else {
        toast.error("Error testing face detection: Could not start video source");
      }
    }
  };

  const stopFaceDetection = () => {
    stopVideoStream();
    toast.info("Face detection test stopped");
  };

  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <CardTitle>ML Testing - Face Detection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
          {isTestRunning ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Camera preview will appear here</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center space-x-4">
          {!isTestRunning ? (
            <Button onClick={startFaceDetection}>
              Test Face Detection
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopFaceDetection}>
              Stop Test
            </Button>
          )}
        </div>
        
        {hasPermission === false && (
          <div className="text-sm text-destructive mt-2">
            <p>Camera access denied. Please check your browser permissions and try again.</p>
            <p className="mt-1">
              In most browsers, you can click the camera icon in the address bar to update permissions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceDetection;
