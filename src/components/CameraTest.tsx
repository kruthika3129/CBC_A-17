import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';

interface CameraTestProps {
  isOpen: boolean;
  onClose: () => void;
}

const CameraTest: React.FC<CameraTestProps> = ({ isOpen, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Request camera access when the component is opened
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setError(null);

    const checkPermission = async () => {
      try {
        // Check if the browser supports permissions API
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (mounted) {
            setPermissionState(result.state);
            
            // Listen for permission changes
            result.onchange = () => {
              if (mounted) {
                setPermissionState(result.state);
                
                // If permissions were granted, try to access the camera
                if (result.state === 'granted') {
                  accessCamera();
                }
              }
            };
          }
        }
      } catch (err) {
        console.log('Permission check not supported, proceeding with camera request');
      }
      
      // Try to access the camera regardless of permission check result
      accessCamera();
    };

    const accessCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false
        });
        
        if (mounted) {
          setStream(mediaStream);
          
          // Connect the stream to the video element
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          
          toast.success('Camera access granted successfully');
        }
      } catch (err: any) {
        if (mounted) {
          console.error('Camera access error:', err);
          
          // Handle specific error types
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera permission denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera found. Please connect a camera and try again.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('Camera is in use by another application or not accessible.');
          } else {
            setError(`Could not access camera: ${err.message || 'Unknown error'}`);
          }
          
          toast.error('Camera access failed');
        }
      }
    };

    checkPermission();

    // Cleanup function
    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  // Clean up the stream when the component is closed
  useEffect(() => {
    if (!isOpen && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setError(null);
    }
  }, [isOpen, stream]);

  // Handle component close
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Camera Test
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          
          {permissionState === 'prompt' && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permission Required</AlertTitle>
              <AlertDescription>
                Please allow camera access when prompted by your browser.
              </AlertDescription>
            </Alert>
          )}
          
          {permissionState === 'denied' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permission Denied</AlertTitle>
              <AlertDescription>
                Camera access is blocked. Please update your browser settings to allow camera access.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
            {!error ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {error && (
            <Button onClick={() => {
              setError(null);
              if (isOpen) {
                // Try accessing the camera again
                navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                  .then(mediaStream => {
                    setStream(mediaStream);
                    if (videoRef.current) {
                      videoRef.current.srcObject = mediaStream;
                    }
                    toast.success('Camera access granted successfully');
                  })
                  .catch(err => {
                    console.error('Retry camera access error:', err);
                    setError(`Could not access camera: ${err.message || 'Unknown error'}`);
                    toast.error('Camera access failed');
                  });
              }
            }}>
              Retry
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CameraTest;
