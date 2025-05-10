/**
 * WebGazer Optimizer
 * 
 * This utility provides functions to optimize WebGazer performance and handle common issues.
 */

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

/**
 * Optimize WebGazer for better performance
 */
export function optimizeWebGazer() {
  if (!window.webgazer) {
    console.error('WebGazer is not available');
    return false;
  }
  
  try {
    // Apply performance optimizations
    
    // 1. Use low resolution video for better performance
    if (window.webgazer.params && window.webgazer.params.camConstraints) {
      window.webgazer.params.camConstraints.video = {
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 15 }
      };
    }
    
    // 2. Enable Kalman filter for smoother predictions
    window.webgazer.applyKalmanFilter(true);
    
    // 3. Disable saving data across sessions for privacy and performance
    window.webgazer.saveDataAcrossSessions(false);
    
    // 4. Hide video and prediction points by default for better performance
    window.webgazer.showVideo(false);
    window.webgazer.showPredictionPoints(false);
    window.webgazer.showFaceOverlay(false);
    
    return true;
  } catch (err) {
    console.error('Error optimizing WebGazer:', err);
    return false;
  }
}

/**
 * Create a throttled gaze listener to reduce CPU usage
 */
export function createThrottledGazeListener(
  callback: (data: WebGazerPrediction) => void,
  throttleMs: number = 100
) {
  if (!window.webgazer) {
    console.error('WebGazer is not available');
    return null;
  }
  
  let lastCallTime = 0;
  
  const throttledListener = (data: WebGazerPrediction, elapsedTime: number) => {
    const now = Date.now();
    if (now - lastCallTime >= throttleMs) {
      lastCallTime = now;
      callback(data);
    }
  };
  
  try {
    window.webgazer.setGazeListener(throttledListener);
    return throttledListener;
  } catch (err) {
    console.error('Error setting throttled gaze listener:', err);
    return null;
  }
}

/**
 * Handle visibility change to pause WebGazer when tab is not visible
 */
export function setupVisibilityHandler() {
  if (!window.webgazer) {
    console.error('WebGazer is not available');
    return () => {}; // Return empty cleanup function
  }
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      try {
        window.webgazer?.pause();
      } catch (err) {
        console.error('Error pausing WebGazer:', err);
      }
    } else {
      try {
        window.webgazer?.resume();
      } catch (err) {
        console.error('Error resuming WebGazer:', err);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Check if camera permissions are granted
 */
export async function checkCameraPermissions(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Stop all tracks to release the camera
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (err) {
    console.error('Camera permission error:', err);
    return false;
  }
}

/**
 * Request camera permissions explicitly
 */
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 15 }
      } 
    });
    
    // Stop all tracks to release the camera
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (err) {
    console.error('Error requesting camera permissions:', err);
    return false;
  }
}

/**
 * Clean up WebGazer resources
 */
export function cleanupWebGazer() {
  if (!window.webgazer) {
    return;
  }
  
  try {
    window.webgazer.clearGazeListener();
    window.webgazer.end();
  } catch (err) {
    console.error('Error cleaning up WebGazer:', err);
  }
}

/**
 * Check if WebGazer is available
 */
export function isWebGazerAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.webgazer;
}

/**
 * Get WebGazer version if available
 */
export function getWebGazerVersion(): string | null {
  if (!window.webgazer) {
    return null;
  }
  
  // Try to get version from WebGazer
  // Note: This is not a standard property, may not be available
  return (window.webgazer as any).version || null;
}
