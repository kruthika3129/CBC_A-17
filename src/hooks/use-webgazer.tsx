import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

// Define types for WebGazer
interface WebGazerPrediction {
  x: number;
  y: number;
}

interface WebGazerInstance {
  begin: () => WebGazerInstance;
  end: () => WebGazerInstance;
  pause: () => WebGazerInstance;
  resume: () => WebGazerInstance;
  setGazeListener: (callback: (data: WebGazerPrediction, elapsedTime: number) => void) => WebGazerInstance;
  clearGazeListener: () => WebGazerInstance;
  showVideo: (show: boolean) => WebGazerInstance;
  showPredictionPoints: (show: boolean) => WebGazerInstance;
  showFaceOverlay: (show: boolean) => WebGazerInstance;
  saveDataAcrossSessions: (save: boolean) => WebGazerInstance;
  applyKalmanFilter: (apply: boolean) => WebGazerInstance;
  setTracker: (tracker: string) => WebGazerInstance;
  setStaticVideo: (url: string) => WebGazerInstance;
  removeStaticVideo: () => WebGazerInstance;
  setVideoElementCanvas: (canvas: HTMLCanvasElement) => WebGazerInstance;
  setVideoElement: (video: HTMLVideoElement) => WebGazerInstance;
  getVideoElementCanvas: () => HTMLCanvasElement;
  getVideoElement: () => HTMLVideoElement;
  getCurrentPrediction: () => WebGazerPrediction;
  params: {
    showVideo: boolean;
    showFaceOverlay: boolean;
    showFaceFeedbackBox: boolean;
    showGazeDot: boolean;
    camConstraints: MediaStreamConstraints;
  };
}

declare global {
  interface Window {
    webgazer?: WebGazerInstance;
  }
}

export type WebGazerStatus = 'inactive' | 'initializing' | 'active' | 'paused' | 'error';

interface UseWebGazerOptions {
  autoStart?: boolean;
  showVideo?: boolean;
  showPredictionPoints?: boolean;
  showFaceOverlay?: boolean;
  throttleMs?: number;
  lowResolution?: boolean;
  pauseOnHidden?: boolean;
}

export function useWebGazer({
  autoStart = false,
  showVideo = false,
  showPredictionPoints = false,
  showFaceOverlay = false,
  throttleMs = 100,
  lowResolution = true,
  pauseOnHidden = true,
}: UseWebGazerOptions = {}) {
  const [status, setStatus] = useState<WebGazerStatus>('inactive');
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<WebGazerPrediction | null>(null);
  const [isWebGazerAvailable, setIsWebGazerAvailable] = useState<boolean>(false);
  
  const lastPredictionTimeRef = useRef<number>(0);
  const gazeListenerRef = useRef<((data: WebGazerPrediction, elapsedTime: number) => void) | null>(null);
  
  // Check if WebGazer is available
  useEffect(() => {
    const checkWebGazer = () => {
      if (window.webgazer) {
        setIsWebGazerAvailable(true);
      } else {
        setIsWebGazerAvailable(false);
      }
    };
    
    checkWebGazer();
    
    // Check again after a short delay in case WebGazer is loaded asynchronously
    const timeoutId = setTimeout(checkWebGazer, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Handle visibility change to pause WebGazer when tab is hidden
  useEffect(() => {
    if (!pauseOnHidden) return;
    
    const handleVisibilityChange = () => {
      if (!window.webgazer) return;
      
      if (document.hidden) {
        if (status === 'active') {
          window.webgazer.pause();
          setStatus('paused');
        }
      } else {
        if (status === 'paused') {
          window.webgazer.resume();
          setStatus('active');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, pauseOnHidden]);
  
  // Initialize WebGazer with optimized settings
  const initWebGazer = useCallback(async () => {
    if (!window.webgazer) {
      setError('WebGazer is not available');
      setStatus('error');
      return false;
    }
    
    try {
      setStatus('initializing');
      setError(null);
      
      // Configure WebGazer with optimized settings
      window.webgazer
        .showVideo(showVideo)
        .showPredictionPoints(showPredictionPoints)
        .showFaceOverlay(showFaceOverlay)
        .saveDataAcrossSessions(false) // Disable saving data across sessions for privacy
        .applyKalmanFilter(true); // Enable Kalman filter for smoother predictions
      
      // Set low resolution for better performance
      if (lowResolution && window.webgazer.params) {
        if (!window.webgazer.params.camConstraints) {
          window.webgazer.params.camConstraints = {};
        }
        
        window.webgazer.params.camConstraints.video = {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 15 }
        };
      }
      
      // Create throttled gaze listener
      const throttledGazeListener = (data: WebGazerPrediction, elapsedTime: number) => {
        const now = Date.now();
        if (now - lastPredictionTimeRef.current >= throttleMs) {
          lastPredictionTimeRef.current = now;
          setPrediction(data);
        }
      };
      
      // Store the listener so we can clear it later
      gazeListenerRef.current = throttledGazeListener;
      
      // Set the gaze listener
      window.webgazer.setGazeListener(throttledGazeListener);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error initializing WebGazer';
      setError(errorMessage);
      setStatus('error');
      return false;
    }
  }, [showVideo, showPredictionPoints, showFaceOverlay, throttleMs, lowResolution]);
  
  // Start WebGazer
  const startWebGazer = useCallback(async () => {
    if (status === 'active') return true;
    
    const initialized = await initWebGazer();
    if (!initialized) return false;
    
    try {
      await window.webgazer?.begin();
      setStatus('active');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error starting WebGazer';
      setError(errorMessage);
      setStatus('error');
      
      // Show toast notification for camera access error
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        toast({
          title: 'Camera access denied',
          description: 'Please allow camera access to use eye tracking features.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error starting eye tracking',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return false;
    }
  }, [status, initWebGazer]);
  
  // Stop WebGazer
  const stopWebGazer = useCallback(() => {
    if (!window.webgazer || status === 'inactive') return;
    
    try {
      // Clear the gaze listener first
      if (gazeListenerRef.current) {
        window.webgazer.clearGazeListener();
        gazeListenerRef.current = null;
      }
      
      window.webgazer.end();
      setStatus('inactive');
      setPrediction(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error stopping WebGazer';
      setError(errorMessage);
    }
  }, [status]);
  
  // Pause WebGazer
  const pauseWebGazer = useCallback(() => {
    if (!window.webgazer || status !== 'active') return;
    
    try {
      window.webgazer.pause();
      setStatus('paused');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error pausing WebGazer';
      setError(errorMessage);
    }
  }, [status]);
  
  // Resume WebGazer
  const resumeWebGazer = useCallback(() => {
    if (!window.webgazer || status !== 'paused') return;
    
    try {
      window.webgazer.resume();
      setStatus('active');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error resuming WebGazer';
      setError(errorMessage);
    }
  }, [status]);
  
  // Auto-start WebGazer if enabled
  useEffect(() => {
    if (autoStart && isWebGazerAvailable && status === 'inactive') {
      startWebGazer();
    }
  }, [autoStart, isWebGazerAvailable, status, startWebGazer]);
  
  // Clean up WebGazer when component unmounts
  useEffect(() => {
    return () => {
      if (window.webgazer && (status === 'active' || status === 'paused')) {
        try {
          if (gazeListenerRef.current) {
            window.webgazer.clearGazeListener();
          }
          window.webgazer.end();
        } catch (err) {
          console.error('Error cleaning up WebGazer:', err);
        }
      }
    };
  }, [status]);
  
  return {
    isWebGazerAvailable,
    status,
    error,
    prediction,
    startWebGazer,
    stopWebGazer,
    pauseWebGazer,
    resumeWebGazer,
  };
}
