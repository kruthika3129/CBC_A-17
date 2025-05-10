import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, Mic, CameraOff, MicOff, AlertCircle, X, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AIService from '@/services/aiService';
import { EmotionState } from '@/lib/aiCore';

// Declare WebGazer as a global variable
declare global {
  interface Window {
    webgazer: any;
  }
}

interface MediaCaptureProps {
  className?: string;
  onEmotionDetected?: (emotion: EmotionState) => void;
}

const MediaCapture: React.FC<MediaCaptureProps> = ({ className, onEmotionDetected }) => {
  const { toast: uiToast } = useToast();
  const aiService = AIService.getInstance();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const webgazerCanvasRef = useRef<HTMLDivElement>(null);
  const gazeDataRef = useRef<{ x: number, y: number, timestamp?: number } | null>(null);

  // State
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaStatus, setMediaStatus] = useState({ video: false, audio: false });
  const [showPreview, setShowPreview] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirectCameraMode, setIsDirectCameraMode] = useState(false);
  const [webgazerReady, setWebgazerReady] = useState(false);
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Additional states for loading management
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isInitializingWebGazer, setIsInitializingWebGazer] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingTimeoutId, setLoadingTimeoutId] = useState<number | null>(null);
  const [isLoadingCancelled, setIsLoadingCancelled] = useState(false);

  // Cancel any ongoing loading process
  const cancelLoading = () => {
    console.log("Cancelling WebGazer loading process");

    // Clear any timeout
    if (loadingTimeoutId !== null) {
      clearTimeout(loadingTimeoutId);
      setLoadingTimeoutId(null);
    }

    // Set cancelled flag
    setIsLoadingCancelled(true);

    // Reset loading states
    setIsLoadingScript(false);
    setIsInitializingWebGazer(false);

    // Clean up any partial WebGazer initialization
    if (window.webgazer) {
      try {
        cleanupWebGazer();
      } catch (error) {
        console.error("Error cleaning up WebGazer during cancellation:", error);
      }
    }

    toast.info("Eye tracking initialization cancelled");
  };

  // Clean up function to stop all tracks
  const stopVideoStream = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping track:', e);
          }
        });
      } catch (e) {
        console.error('Error stopping stream tracks:', e);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error('Error clearing video source:', e);
      }
    }
  };

  // Load WebGazer script manually with lazy loading and timeout
  useEffect(() => {
    // Only load WebGazer when eye tracking is enabled
    if (!eyeTrackingEnabled) {
      return;
    }

    // Reset loading cancelled flag
    setIsLoadingCancelled(false);

    const loadWebGazerScript = () => {
      // Reset error state
      setLoadingError(null);

      // Check if script is already loaded
      if (document.querySelector('script[src="https://webgazer.cs.brown.edu/webgazer.js"]')) {
        console.log("WebGazer script already loaded");
        setScriptLoaded(true);
        return;
      }

      // Set loading state
      setIsLoadingScript(true);

      console.log("Loading WebGazer script...");
      const script = document.createElement('script');
      script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
      script.async = true;

      // Set a timeout for script loading (15 seconds)
      const timeoutId = window.setTimeout(() => {
        if (isLoadingCancelled) return;

        console.error("WebGazer script loading timed out");
        setLoadingError("Script loading timed out. Please check your internet connection and try again.");
        setIsLoadingScript(false);

        // Remove the script element
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

        toast.error("Eye tracking library failed to load", {
          description: "Loading timed out. Please try again."
        });
      }, 15000);

      // Store the timeout ID
      setLoadingTimeoutId(timeoutId);

      script.onload = () => {
        // Clear the timeout
        clearTimeout(timeoutId);
        setLoadingTimeoutId(null);

        console.log("WebGazer script loaded");
        setScriptLoaded(true);
        setIsLoadingScript(false);
      };

      script.onerror = () => {
        // Clear the timeout
        clearTimeout(timeoutId);
        setLoadingTimeoutId(null);

        console.error("Failed to load WebGazer script");
        setLoadingError("Failed to load eye tracking library. Please check your internet connection and try again.");
        setIsLoadingScript(false);
        setEyeTrackingEnabled(false);

        toast.error("Failed to load eye tracking library");
      };

      document.body.appendChild(script);
    };

    loadWebGazerScript();

    // Cleanup function
    return () => {
      // Clear any timeout if component unmounts during loading
      if (loadingTimeoutId !== null) {
        clearTimeout(loadingTimeoutId);
      }

      // Don't remove the script when component unmounts
      // This prevents reloading the script when the component remounts
      // We'll clean it up when eye tracking is disabled
    };
  }, [eyeTrackingEnabled, isLoadingCancelled, loadingTimeoutId]);

  // Initialize WebGazer with optimized settings, timeout, and better error handling
  const initializeWebGazer = async () => {
    if (!window.webgazer || !scriptLoaded) return;

    // If already initializing, don't start again
    if (isInitializingWebGazer) return;

    // Reset error state
    setLoadingError(null);

    // Set initializing state
    setIsInitializingWebGazer(true);

    // Set a timeout for initialization (20 seconds)
    const timeoutId = window.setTimeout(() => {
      if (isLoadingCancelled) return;

      console.error("WebGazer initialization timed out");
      setLoadingError("Initialization timed out. Your camera might be in use by another application.");
      toast.error("Eye tracking initialization timed out", {
        description: "Please check your camera and try again"
      });

      // Clean up any partial initialization
      try {
        cleanupWebGazer();
      } catch (error) {
        console.error("Error cleaning up after timeout:", error);
      }

      // Reset states
      setIsInitializingWebGazer(false);
      setEyeTrackingEnabled(false);
    }, 20000);

    // Store the timeout ID for cleanup
    setLoadingTimeoutId(timeoutId);

    try {
      console.log("Initializing WebGazer with optimized settings...");

      // Request camera permissions explicitly first with timeout
      try {
        const permissionPromise = navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },  // Low resolution for better performance
            height: { ideal: 240 }, // Low resolution for better performance
            frameRate: { ideal: 15 } // Lower frame rate for better performance
          }
        });

        // Add a timeout for permission request (10 seconds)
        const permissionTimeout = new Promise<MediaStream>((_, reject) => {
          setTimeout(() => reject(new Error("Camera permission request timed out")), 10000);
        });

        // Race the permission request against the timeout
        const stream = await Promise.race([permissionPromise, permissionTimeout]);

        // Stop the stream immediately - we just needed to get permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.error("Camera permission error:", permissionError);

        // Clear the main timeout
        clearTimeout(timeoutId);
        setLoadingTimeoutId(null);

        // Set specific error message based on the error
        let errorMessage = "Camera access denied. Please allow camera access to use eye tracking.";
        if (permissionError instanceof Error) {
          if (permissionError.message.includes("timed out")) {
            errorMessage = "Camera permission request timed out. Please try again.";
          } else if (permissionError.name === "NotFoundError") {
            errorMessage = "No camera detected. Please connect a camera and try again.";
          } else if (permissionError.name === "NotReadableError") {
            errorMessage = "Camera is in use by another application. Please close other applications using your camera.";
          }
        }

        setLoadingError(errorMessage);
        toast.error("Camera access issue", {
          description: errorMessage
        });

        // Reset states
        setIsInitializingWebGazer(false);
        setEyeTrackingEnabled(false);
        return;
      }

      // Check if cancelled during permission request
      if (isLoadingCancelled) {
        clearTimeout(timeoutId);
        setLoadingTimeoutId(null);
        setIsInitializingWebGazer(false);
        return;
      }

      // Configure WebGazer for better performance
      if (window.webgazer.params) {
        // Set low resolution camera constraints for better performance
        window.webgazer.params.camConstraints = {
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            frameRate: { ideal: 15 }
          }
        };

        // Reduce face detection frequency for better performance
        if (window.webgazer.params.faceDetectionInterval) {
          window.webgazer.params.faceDetectionInterval = 500; // Detect face every 500ms instead of default
        }
      }

      // Set up WebGazer with optimized settings
      await window.webgazer
        .setRegression('ridge') // Ridge regression is more efficient
        .setTracker('clmtrackr') // Use clmtrackr for better performance
        .setGazeListener((data: any, elapsedTime: number) => {
          if (data == null) return;

          // Throttle updates to reduce CPU usage
          const now = Date.now();
          if (!gazeDataRef.current || now - (gazeDataRef.current.timestamp || 0) > 100) {
            // Store gaze data with timestamp
            gazeDataRef.current = {
              x: data.x,
              y: data.y,
              timestamp: now
            };
          }
        })
        .begin();

      // Check if cancelled during initialization
      if (isLoadingCancelled) {
        clearTimeout(timeoutId);
        setLoadingTimeoutId(null);

        // Clean up WebGazer
        try {
          cleanupWebGazer();
        } catch (error) {
          console.error("Error cleaning up after cancellation:", error);
        }

        setIsInitializingWebGazer(false);
        return;
      }

      // Configure WebGazer display for better performance
      window.webgazer.showVideo(true);
      window.webgazer.showFaceOverlay(true);
      window.webgazer.showFaceFeedbackBox(true);
      window.webgazer.showPredictionPoints(false); // Hide prediction points for better performance

      // Apply Kalman filter for smoother predictions
      if (typeof window.webgazer.applyKalmanFilter === 'function') {
        window.webgazer.applyKalmanFilter(true);
      }

      // Move WebGazer video to our container if possible
      if (webgazerCanvasRef.current) {
        const videoElement = document.getElementById('webgazerVideoContainer');
        if (videoElement) {
          // Reduce the size of the video element for better performance
          const videoCanvas = videoElement.querySelector('canvas');
          if (videoCanvas) {
            videoCanvas.style.width = '320px';
            videoCanvas.style.height = '240px';
          }

          webgazerCanvasRef.current.appendChild(videoElement);
        }
      }

      // Clear the timeout
      clearTimeout(timeoutId);
      setLoadingTimeoutId(null);

      // Update states
      setWebgazerReady(true);
      setIsInitializingWebGazer(false);
      toast.success("Eye tracking initialized with optimized settings");
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      setLoadingTimeoutId(null);

      console.error("Error initializing WebGazer:", error);

      // Set specific error message
      let errorMessage = "Failed to initialize eye tracking. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }

      setLoadingError(errorMessage);
      toast.error("Eye tracking initialization failed", {
        description: errorMessage
      });

      // Reset states
      setIsInitializingWebGazer(false);
      setEyeTrackingEnabled(false);
    }
  };

  // Clean up WebGazer with improved error handling
  const cleanupWebGazer = () => {
    if (window.webgazer) {
      try {
        // First try to pause WebGazer
        try {
          window.webgazer.pause();
        } catch (pauseError) {
          console.error("Error pausing WebGazer:", pauseError);
        }

        // Clear any listeners
        try {
          window.webgazer.clearGazeListener();
        } catch (clearError) {
          console.error("Error clearing gaze listener:", clearError);
        }

        // End WebGazer
        window.webgazer.end();

        // Reset state
        setWebgazerReady(false);
        gazeDataRef.current = null;

        console.log("WebGazer cleaned up successfully");
      } catch (error) {
        console.error("Error cleaning up WebGazer:", error);
      }
    }
  };

  // Initialize and subscribe to updates
  useEffect(() => {
    // Subscribe to emotion updates
    const handleEmotionUpdate = (state: EmotionState) => {
      setCurrentEmotion(state);

      // Notify parent component if callback provided
      if (onEmotionDetected) {
        onEmotionDetected(state);
      }
    };

    // Subscribe to media status updates
    const handleMediaStatus = (status: { video: boolean, audio: boolean }) => {
      setMediaStatus(status);

      // Update video preview if video status changed and not in direct camera mode
      if (status.video && videoRef.current && !isDirectCameraMode) {
        // Get video stream from media service
        const mediaService = aiService.getMediaService();
        const videoStream = mediaService.getVideoStream?.();
        if (videoStream) {
          videoRef.current.srcObject = videoStream;

          // Try to play the video
          videoRef.current.play().catch(err => {
            console.error("Error playing video from media service:", err);
          });
        }
      }
    };

    aiService.onEmotionUpdate(handleEmotionUpdate);
    aiService.onMediaStatus(handleMediaStatus);

    // Cleanup subscriptions
    return () => {
      aiService.removeEmotionUpdateListener(handleEmotionUpdate);
      aiService.removeMediaStatusListener(handleMediaStatus);

      // Stop media processing if component unmounts while capturing
      if (isCapturing) {
        aiService.stopMediaProcessing();
      }

      // Clean up direct camera access if active
      if (isDirectCameraMode) {
        stopVideoStream();
      }

      // Clean up WebGazer
      cleanupWebGazer();
    };
  }, [aiService, onEmotionDetected, isCapturing, isDirectCameraMode]);

  // Initialize WebGazer when script is loaded and eye tracking is enabled
  useEffect(() => {
    if (scriptLoaded && eyeTrackingEnabled && !webgazerReady && !isInitializingWebGazer && !isLoadingCancelled) {
      initializeWebGazer();
    }
  }, [scriptLoaded, eyeTrackingEnabled, webgazerReady, isInitializingWebGazer, isLoadingCancelled]);

  // Start media capture with direct camera access as fallback
  const startCapture = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // First try the AI service's media processing
      try {
        // Request permissions and start media processing
        const status = await aiService.startMediaProcessing();

        if (!status.video && !status.audio) {
          throw new Error("Could not access camera or microphone through AI service");
        }

        setIsCapturing(true);
        setIsDirectCameraMode(false);

        toast.success("Media capture started successfully", {
          description: `Camera: ${status.video ? 'On' : 'Off'}, Microphone: ${status.audio ? 'On' : 'Off'}`
        });

        return; // Success, exit the function
      } catch (aiError) {
        console.error('Error starting media capture through AI service:', aiError);

        // Fall back to direct camera access
        console.log("Falling back to direct camera access...");
      }

      // Direct camera access as fallback
      try {
        // Stop any existing stream first
        stopVideoStream();

        // Request camera access with explicit constraints
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Direct camera access granted:", stream);

        // Store the stream for later cleanup
        streamRef.current = stream;

        // Set the video source
        if (videoRef.current) {
          try {
            videoRef.current.srcObject = stream;

            // Create a promise that resolves when the video starts playing
            // or rejects after a timeout
            const playPromise = new Promise<void>((resolve, reject) => {
              const playTimeout = setTimeout(() => {
                reject(new Error("Video playback timeout"));
              }, 5000); // 5 second timeout

              videoRef.current!.onplaying = () => {
                clearTimeout(playTimeout);
                resolve();
              };

              // Force the video to play
              const playAttempt = videoRef.current!.play();
              if (playAttempt !== undefined) {
                playAttempt.catch(err => {
                  clearTimeout(playTimeout);
                  reject(err);
                });
              }
            });

            await playPromise;
            console.log("Direct video playback started");

            // Set direct camera mode
            setIsDirectCameraMode(true);
            setIsCapturing(true);
            setMediaStatus({
              video: stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled,
              audio: stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled
            });

            toast.success("Direct camera access started", {
              description: "Using browser's camera API directly"
            });
          } catch (playError) {
            console.error("Error playing video:", playError);
            throw playError;
          }
        } else {
          throw new Error("Video element not available");
        }
      } catch (directError) {
        console.error("Error with direct camera access:", directError);
        throw directError;
      }
    } catch (error) {
      console.error('All camera access methods failed:', error);

      // Provide more specific error messages based on the error
      let errorMsg = "";
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMsg = "Camera access was denied. Please check your browser permissions.";
        } else if (error.name === 'NotFoundError') {
          errorMsg = "No camera detected. Please connect a camera and try again.";
        } else if (error.name === 'NotReadableError') {
          errorMsg = "Could not start video source. Camera might be in use by another application.";
        } else {
          errorMsg = `Error accessing camera: ${error.message}`;
        }
      } else {
        errorMsg = `Could not access camera: ${(error as Error).message}`;
      }

      setErrorMessage(errorMsg);

      toast.error("Media capture failed", {
        description: "Could not access camera or microphone. Please check permissions."
      });
      setIsCapturing(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop media capture
  const stopCapture = () => {
    // Stop AI service media processing if not in direct mode
    if (!isDirectCameraMode) {
      aiService.stopMediaProcessing();
    }

    // Stop direct camera access if active
    if (isDirectCameraMode) {
      stopVideoStream();
    }

    // Pause WebGazer if it's running
    if (window.webgazer && eyeTrackingEnabled) {
      try {
        window.webgazer.pause();
      } catch (error) {
        console.error("Error pausing WebGazer:", error);
      }
    }

    setIsCapturing(false);
    setIsDirectCameraMode(false);
    setMediaStatus({ video: false, audio: false });

    toast.success("Media capture stopped", {
      description: "Camera and microphone have been turned off."
    });
  };

  // Function to retry loading after an error
  const retryEyeTracking = () => {
    // Reset all states
    setLoadingError(null);
    setIsLoadingScript(false);
    setIsInitializingWebGazer(false);
    setIsLoadingCancelled(false);
    setScriptLoaded(false);
    setWebgazerReady(false);

    // Clean up any existing WebGazer instance
    if (window.webgazer) {
      try {
        cleanupWebGazer();
      } catch (error) {
        console.error("Error cleaning up WebGazer during retry:", error);
      }
    }

    // Remove the script to ensure a fresh start
    const script = document.querySelector('script[src="https://webgazer.cs.brown.edu/webgazer.js"]');
    if (script) {
      document.body.removeChild(script);
    }

    // Start the process again
    setEyeTrackingEnabled(true);

    toast.info("Retrying eye tracking initialization");
  };

  // Toggle eye tracking with improved performance, error handling, and loading states
  const toggleEyeTracking = () => {
    // If currently loading or initializing, cancel the process
    if (isLoadingScript || isInitializingWebGazer) {
      cancelLoading();
      return;
    }

    if (eyeTrackingEnabled) {
      // Disable eye tracking
      if (window.webgazer) {
        try {
          // First pause WebGazer
          window.webgazer.pause();

          // Then end WebGazer to free up resources
          cleanupWebGazer();

          // Remove the script to completely free up resources
          const script = document.querySelector('script[src="https://webgazer.cs.brown.edu/webgazer.js"]');
          if (script) {
            document.body.removeChild(script);
            setScriptLoaded(false);
          }
        } catch (error) {
          console.error("Error disabling WebGazer:", error);
        }
      }

      // Reset all states
      setEyeTrackingEnabled(false);
      setWebgazerReady(false);
      setIsLoadingScript(false);
      setIsInitializingWebGazer(false);
      setLoadingError(null);
      gazeDataRef.current = null;

      toast.info("Eye tracking disabled and resources freed");
    } else {
      // Reset error state
      setLoadingError(null);

      // Enable eye tracking
      setEyeTrackingEnabled(true);

      // The script will be loaded by the useEffect hook when eyeTrackingEnabled changes

      // If script is already loaded but WebGazer is not ready, initialize it
      if (scriptLoaded && !webgazerReady) {
        initializeWebGazer();
      }
      // If WebGazer is already initialized, just resume it
      else if (window.webgazer && webgazerReady) {
        try {
          window.webgazer.resume();
          toast.success("Eye tracking resumed");
        } catch (error) {
          console.error("Error resuming WebGazer:", error);
          toast.error("Failed to resume eye tracking");

          // Try to reinitialize if resume fails
          try {
            initializeWebGazer();
          } catch (reinitError) {
            console.error("Error reinitializing WebGazer:", reinitError);
          }
        }
      }
    }
  };

  // Toggle video preview
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Real-time Emotion & Eye Tracking</span>
          {isCapturing && (
            <div className="flex items-center gap-2 text-sm font-normal">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error message */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
            {errorMessage.includes("permission") || errorMessage.includes("denied") ? (
              <div className="mt-2 text-sm">
                <p className="font-medium mt-2">How to fix camera permissions:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Look for the camera icon in your browser's address bar</li>
                  <li>Click it and select "Allow" for camera access</li>
                  <li>If you don't see the icon, go to your browser's settings:</li>
                  <li className="pl-2">Chrome: Settings → Privacy and security → Site Settings → Camera</li>
                  <li className="pl-2">Firefox: Settings → Privacy & Security → Permissions → Camera</li>
                  <li className="pl-2">Edge: Settings → Cookies and site permissions → Camera</li>
                  <li>After changing permissions, refresh the page and try again</li>
                </ul>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Try to reset permissions using the Permissions API if available
                      if (navigator.permissions && navigator.permissions.query) {
                        navigator.permissions.query({ name: 'camera' as PermissionName })
                          .then(permissionStatus => {
                            toast.info("Please update camera permissions in your browser", {
                              description: "Look for the camera icon in your browser's address bar"
                            });
                          })
                          .catch(err => {
                            console.error("Error querying permissions:", err);
                          });
                      }

                      // Suggest refreshing the page
                      toast.info("After updating permissions, refresh the page", {
                        action: {
                          label: "Refresh Now",
                          onClick: () => window.location.reload()
                        }
                      });
                    }}
                  >
                    Reset Permissions
                  </Button>
                </div>
              </div>
            ) : null}
          </Alert>
        )}

        {/* Video preview with WebGazer container */}
        {showPreview && (
          <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
            {/* Regular video preview (hidden when WebGazer is active) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${(isCapturing && (mediaStatus.video || isDirectCameraMode) && !eyeTrackingEnabled) ? 'opacity-100' : 'opacity-0 absolute'}`}
            />

            {/* WebGazer container */}
            <div
              ref={webgazerCanvasRef}
              className={`absolute inset-0 ${eyeTrackingEnabled && webgazerReady ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Placeholder when no video */}
            {!(isCapturing && (mediaStatus.video || isDirectCameraMode || (eyeTrackingEnabled && webgazerReady))) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-muted-foreground opacity-20" />
              </div>
            )}

            {/* Gaze data display with performance indicator */}
            {eyeTrackingEnabled && gazeDataRef.current && (
              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-2 rounded-md text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Eye Tracking</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p>Gaze X: {Math.round(gazeDataRef.current.x)}</p>
                <p>Gaze Y: {Math.round(gazeDataRef.current.y)}</p>
                {gazeDataRef.current.timestamp && (
                  <p className="text-muted-foreground mt-1">
                    Updated: {new Date(gazeDataRef.current.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}

            {/* Overlay current emotion */}
            {currentEmotion && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {currentEmotion.mood === 'happy' ? '😊' :
                     currentEmotion.mood === 'sad' ? '😢' :
                     currentEmotion.mood === 'angry' ? '😠' :
                     currentEmotion.mood === 'anxious' ? '😰' :
                     currentEmotion.mood === 'calm' ? '😌' :
                     currentEmotion.mood === 'excited' ? '😃' :
                     currentEmotion.mood === 'tired' ? '😴' :
                     currentEmotion.mood === 'frustrated' ? '😤' :
                     currentEmotion.mood === 'focused' ? '🧐' :
                     currentEmotion.mood === 'overwhelmed' ? '😵' : '😐'}
                  </span>
                  <span className="font-medium capitalize">{currentEmotion.mood}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(currentEmotion.confidence * 100)}% confidence
                </span>
              </div>
            )}
          </div>
        )}

        {/* Media status */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mediaStatus.video ? (
                <Camera className="w-4 h-4 text-green-500" />
              ) : (
                <CameraOff className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Camera</span>
            </div>
            <div className={`px-2 py-1 text-xs rounded-full ${mediaStatus.video ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
              {mediaStatus.video ? 'Active' : 'Inactive'}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mediaStatus.audio ? (
                <Mic className="w-4 h-4 text-green-500" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Microphone</span>
            </div>
            <div className={`px-2 py-1 text-xs rounded-full ${mediaStatus.audio ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
              {mediaStatus.audio ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            All processing happens on your device. No raw video or audio data is sent to any server.
            Only the detected emotions are stored locally.
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-preview" className="text-sm">Show Video Preview</Label>
            <Switch
              id="show-preview"
              checked={showPreview}
              onCheckedChange={togglePreview}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="eye-tracking" className="text-sm flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                Eye Tracking
                {isLoadingScript && (
                  <div className="ml-2 flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    <span className="text-xs text-muted-foreground">Loading script...</span>
                  </div>
                )}
                {isInitializingWebGazer && (
                  <div className="ml-2 flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    <span className="text-xs text-muted-foreground">Initializing...</span>
                  </div>
                )}
              </Label>

              {/* Switch with different states */}
              {(isLoadingScript || isInitializingWebGazer) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelLoading}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              ) : (
                <Switch
                  id="eye-tracking"
                  checked={eyeTrackingEnabled}
                  onCheckedChange={toggleEyeTracking}
                  disabled={isLoading} // Only disable for general loading, not for eye tracking loading
                />
              )}
            </div>

            {/* Error message with retry button */}
            {loadingError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-2 rounded-md text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{loadingError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryEyeTracking}
                  className="self-end h-7"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}

            {/* Loading progress indicator */}
            {(isLoadingScript || isInitializingWebGazer) && !loadingError && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-2 rounded-md text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="font-medium">
                    {isLoadingScript ? "Loading eye tracking library..." : "Initializing eye tracking..."}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {isLoadingScript
                    ? "Downloading the eye tracking library. This may take a moment..."
                    : "Setting up camera and initializing tracking. Please wait..."}
                </div>
                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  Click "Cancel" to abort if it's taking too long.
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={isCapturing ? stopCapture : startCapture}
            disabled={isLoading}
            variant={isCapturing ? "destructive" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : isCapturing ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Capture
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Start Capture
              </>
            )}
          </Button>

          {eyeTrackingEnabled && webgazerReady && (
            <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded-md">
              <p className="font-medium mb-1">Eye Tracking Active (Optimized)</p>
              <p>Look around the screen to calibrate the eye tracker. The yellow box shows your face detection.</p>
              <p className="mt-1 text-green-600 dark:text-green-400">
                Performance optimizations applied: lower resolution, reduced frame rate, and throttled updates.
              </p>
            </div>
          )}

          {!eyeTrackingEnabled && !isLoadingScript && !isInitializingWebGazer && !loadingError && (
            <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
              <p className="font-medium mb-1 text-green-700 dark:text-green-400">Performance Optimized</p>
              <p>Eye tracking has been optimized to reduce lag and fix camera access issues. Enable it only when needed.</p>
            </div>
          )}

          {/* Troubleshooting tips when there's an error */}
          {loadingError && (
            <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md mt-2">
              <p className="font-medium mb-1 text-amber-700 dark:text-amber-400">Troubleshooting Tips</p>
              <ul className="list-disc pl-4 space-y-1 text-amber-700 dark:text-amber-400">
                <li>Make sure your camera is connected and working</li>
                <li>Allow camera permissions in your browser</li>
                <li>Close other applications that might be using your camera</li>
                <li>Try refreshing the page</li>
                <li>Check your internet connection if loading fails</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaCapture;
