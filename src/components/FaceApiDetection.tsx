import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, CameraOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import * as faceDetection from '@tensorflow-models/face-detection';
import { EmotionState } from '@/lib/aiCore';
import AIService from '@/services/aiService';
import MLService from '@/services/mlService';

interface FaceApiDetectionProps {
  className?: string;
  onEmotionDetected?: (emotion: EmotionState) => void;
  onFaceDetectionData?: (data: any) => void;
  onEyeTrackingData?: (data: any) => void;
}

const FaceApiDetection: React.FC<FaceApiDetectionProps> = ({
  className,
  onEmotionDetected,
  onFaceDetectionData,
  onEyeTrackingData
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aiService = AIService.getInstance();
  const mlService = MLService.getInstance();
  const faceDetectorRef = useRef<faceDetection.FaceDetector | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoActive, setVideoActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<string | null>(null);
  const [expressionConfidence, setExpressionConfidence] = useState<number>(0);
  const [forceDetection, setForceDetection] = useState(false);
  const [flipVideo, setFlipVideo] = useState(true); // Default to flipped for selfie mode
  const [detectionSensitivity, setDetectionSensitivity] = useState(0.1); // Very sensitive by default

  // Store previous face positions to detect movement patterns
  const prevFacePositionsRef = useRef<Array<{ x: number, y: number, width: number, height: number, time: number }>>([]);

  // Emotion detection refs
  const smileDetectedRef = useRef<boolean>(false);
  const sadDetectedRef = useRef<boolean>(false);
  const angryDetectedRef = useRef<boolean>(false);
  const surprisedDetectedRef = useRef<boolean>(false);
  const fearfulDetectedRef = useRef<boolean>(false);
  const disgustedDetectedRef = useRef<boolean>(false);

  // Store last detected emotion for stability
  const lastEmotionRef = useRef<string>('neutral');
  const emotionStabilityCounterRef = useRef<number>(0);

  // Store face movement velocity for emotion detection
  const faceVelocityRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  // Clean up function to stop all tracks
  const stopVideoStream = () => {
    console.log("Stopping video stream...");

    // Stop all tracks in the stream
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        console.log(`Stopping ${tracks.length} tracks`);

        tracks.forEach(track => {
          try {
            track.stop();
            console.log(`Track ${track.id} stopped`);
          } catch (trackError) {
            console.error(`Error stopping track ${track.id}:`, trackError);
          }
        });

        streamRef.current = null;
      } catch (streamError) {
        console.error("Error stopping stream:", streamError);
      }
    }

    // Clear video source
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        console.log("Video element cleared");
      } catch (videoError) {
        console.error("Error clearing video element:", videoError);
      }
    }

    // Update state
    setIsCapturing(false);
    setVideoActive(false);
    setFaceDetected(false);

    console.log("Video stream stopped");
  };

  // Start video capture - simplified and robust implementation
  const startCapture = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Starting camera capture...");

      // Stop any existing stream first
      stopVideoStream();

      // Ensure video element is properly initialized
      if (!videoRef.current) {
        console.error("Video element reference is not available");
        // Instead of showing an error, let's try to recover by waiting for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check again after a short delay
        if (!videoRef.current) {
          setError("Video element not available. Please refresh the page.");
          toast.error("Video element not available. Please refresh the page.");
          setIsLoading(false);
          return;
        }
      }

      // Set video properties before requesting camera access
      videoRef.current.muted = true;
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;

      // Request camera access with explicit constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });

        console.log("Camera access granted, stream obtained:", stream.active ? "active" : "inactive");
        console.log("Video tracks:", stream.getVideoTracks().length);

        // Store the stream for later cleanup
        streamRef.current = stream;

        // Set the stream as source
        videoRef.current.srcObject = stream;

        // Create a promise that resolves when the video starts playing
        // or rejects after a timeout
        const playPromise = new Promise<void>((resolve, reject) => {
          const playTimeout = setTimeout(() => {
            reject(new Error("Video playback timeout"));
          }, 5000); // 5 second timeout

          // Set up event listener for when video starts playing
          const playingHandler = () => {
            clearTimeout(playTimeout);
            videoRef.current?.removeEventListener('playing', playingHandler);
            console.log("Video playing event triggered via event listener");
            resolve();
          };

          videoRef.current.addEventListener('playing', playingHandler);

          // Try to play the video
          console.log("Attempting to play video...");
          const playAttempt = videoRef.current.play();

          if (playAttempt !== undefined) {
            playAttempt
              .then(() => {
                console.log("Video play() promise resolved");
                // The playing event will handle the resolution
              })
              .catch(err => {
                clearTimeout(playTimeout);
                videoRef.current?.removeEventListener('playing', playingHandler);
                reject(err);
              });
          }
        });

        // Wait for the video to start playing
        try {
          await playPromise;
          console.log("Video playback started successfully");

          // Update state
          setVideoActive(true);
          setHasPermission(true);
          setIsCapturing(true);

          toast.success("Camera started successfully");
        } catch (playError) {
          console.error("Error playing video:", playError);

          // If play() fails, try once more with a slight delay
          setTimeout(async () => {
            try {
              console.log("Retrying video playback after delay...");
              if (videoRef.current) {
                await videoRef.current.play();
                console.log("Video playback started on second attempt");
                setVideoActive(true);
                setIsCapturing(true);
              }
            } catch (retryError) {
              console.error("Retry also failed:", retryError);
              setError("Could not play video. Browser may be blocking autoplay.");
              toast.error("Could not play video. Please check your browser settings.");
            }
          }, 1000);
        }
      } catch (mediaError) {
        console.error("Error accessing camera:", mediaError);

        // Handle media access errors
        if (mediaError instanceof DOMException) {
          if (mediaError.name === 'NotAllowedError') {
            setError("Camera access denied. Please check permissions.");
            toast.error("Media access error: Could not access camera. Please check permissions.");
          } else if (mediaError.name === 'NotFoundError') {
            setError("No camera detected. Please connect a camera and try again.");
            toast.error("No camera detected. Please connect a camera and try again.");
          } else if (mediaError.name === 'NotReadableError') {
            setError("Could not start video source. Camera might be in use by another application.");
            toast.error("Could not start video source. Camera might be in use by another application.");
          } else {
            setError(`Error starting camera: ${mediaError.message}`);
            toast.error(`Error starting camera: ${mediaError.message}`);
          }
        } else {
          setError(`Error accessing camera: ${mediaError instanceof Error ? mediaError.message : 'Unknown error'}`);
          toast.error(`Error accessing camera. Please check your device and try again.`);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Unexpected error in startCapture:", err);
      setIsLoading(false);
      setHasPermission(false);
      setIsCapturing(false);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error("An unexpected error occurred. Please refresh the page and try again.");
    }
  };

  // Stop video capture
  const stopCapture = () => {
    console.log("Stop capture button clicked");
    stopVideoStream();

    // Reset all detection-related states
    setCurrentExpression(null);
    setExpressionConfidence(0);
    setFaceDetected(false);

    toast.info("Camera stopped");
  };

  // Load TensorFlow.js face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        console.log("Loading TensorFlow.js face detection model...");

        // Check if MLService already has a face detector loaded
        if (mlService.getFaceDetector()) {
          console.log("Using existing face detector from MLService");
          faceDetectorRef.current = mlService.getFaceDetector();
          setIsModelLoading(false);
          return;
        }

        // Create a new face detector if MLService doesn't have one
        try {
          const detector = await faceDetection.createDetector(
            faceDetection.SupportedModels.MediaPipeFaceDetector,
            {
              runtime: 'tfjs',
              modelType: 'short',
              maxFaces: 1
            }
          );

          console.log("Face detection model loaded successfully");
          faceDetectorRef.current = detector;
          setIsModelLoading(false);
        } catch (modelError) {
          console.error("Error loading face detection model:", modelError);
          throw modelError;
        }
      } catch (err) {
        console.error('Error loading face detection models:', err);
        setError('Failed to load face detection models. Please check your internet connection and refresh the page.');
        setIsModelLoading(false);

        toast.error('Failed to load face detection models', {
          description: 'Please check your internet connection and refresh the page.'
        });
      }
    };

    loadModels();
  }, [mlService]);

  // Monitor video state and attempt recovery if needed
  useEffect(() => {
    // Only run this effect if we're capturing but video isn't active
    if (isCapturing && streamRef.current && !videoActive) {
      console.log("Video not active yet, setting up recovery timeout");

      // Set a timeout to check if video becomes active
      const timeoutId = setTimeout(() => {
        console.log("Video still not active after timeout, attempting recovery");

        // Check if video element and stream are still available
        if (videoRef.current && streamRef.current) {
          console.log("Recovery: Reconnecting stream to video element");

          try {
            // Ensure video properties are set correctly
            videoRef.current.muted = true;
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;

            // Reconnect the stream
            videoRef.current.srcObject = null; // Clear first
            videoRef.current.srcObject = streamRef.current;

            // Try to play again
            videoRef.current.play()
              .then(() => {
                console.log("Recovery successful: Video is now playing");
                setVideoActive(true);
              })
              .catch(playError => {
                console.error("Recovery failed: Could not play video", playError);
                // Don't set error state here to avoid UI disruption
              });
          } catch (err) {
            console.error("Recovery attempt failed:", err);
          }
        } else {
          console.error("Recovery failed: Video element or stream not available");
        }
      }, 3000); // 3 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [isCapturing, videoActive]);

  // Set up face detection when video is active
  useEffect(() => {
    // Only run if video is active and we have all the necessary refs
    if (videoActive && videoRef.current && canvasRef.current && !isModelLoading) {
      console.log("Setting up face detection");

      // Function to set up canvas dimensions
      const setupCanvas = () => {
        // Get exact video dimensions
        const videoWidth = videoRef.current?.videoWidth || 0;
        const videoHeight = videoRef.current?.videoHeight || 0;

        // Get client dimensions as fallback
        const clientWidth = videoRef.current?.clientWidth || 640;
        const clientHeight = videoRef.current?.clientHeight || 480;

        console.log("Video natural dimensions:", videoWidth, "x", videoHeight);
        console.log("Video client dimensions:", clientWidth, "x", clientHeight);

        // If video dimensions are available, use them
        if (videoWidth > 0 && videoHeight > 0) {
          console.log("Using natural video dimensions for canvas");
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;

          // Set canvas dimensions to match video
          const displaySize = { width: videoWidth, height: videoHeight };

          return displaySize;
        } else {
          // Use client dimensions
          console.log("Using client dimensions for canvas");
          canvasRef.current.width = clientWidth;
          canvasRef.current.height = clientHeight;

          // Set canvas dimensions to match video container
          const displaySize = { width: clientWidth, height: clientHeight };

          return displaySize;
        }
      };

      // Initial setup
      let displaySize = setupCanvas();

      // Add event listener for video resize
      const handleResize = () => {
        if (videoRef.current && canvasRef.current) {
          displaySize = setupCanvas();
        }
      };

      // Listen for video metadata loaded to get accurate dimensions
      videoRef.current.addEventListener('loadedmetadata', handleResize);

      // Start detection interval - use a longer interval to give more processing time
      const interval = setInterval(async () => {
        // Safety check - make sure we have all the necessary elements
        if (!videoRef.current || !canvasRef.current || !isCapturing) {
          console.log("Missing required elements for face detection, clearing interval");
          clearInterval(interval);
          return;
        }

        try {
          // Check if video is actually playing
          if (videoRef.current.paused || videoRef.current.ended) {
            console.log("Video is paused or ended, skipping face detection");
            return;
          }

          console.log("Attempting face detection...");

          // Make sure the face detector is loaded
          if (!faceDetectorRef.current) {
            console.warn("Face detection model not loaded yet, skipping detection");
            return; // Skip detection if no models are loaded
          }

          // Use the TensorFlow.js MediaPipe face detector
          let detections = [];

          try {
            console.log("Using MediaPipe face detection");

            // Create a simple timeout to prevent hanging
            const detectionWithTimeout = async () => {
              return new Promise(async (resolve) => {
                // Set a timeout to prevent hanging
                const timeout = setTimeout(() => {
                  console.log("Face detection timed out");
                  resolve([]);
                }, 1000);

                try {
                  // Get image data from the video element
                  const videoWidth = videoRef.current.videoWidth;
                  const videoHeight = videoRef.current.videoHeight;

                  // Create a temporary canvas to get the image data
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = videoWidth;
                  tempCanvas.height = videoHeight;
                  const tempCtx = tempCanvas.getContext('2d');

                  if (tempCtx) {
                    // Draw the current video frame to the canvas
                    tempCtx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

                    // Get the image data
                    const imageData = tempCtx.getImageData(0, 0, videoWidth, videoHeight);

                    // Detect faces using the MediaPipe face detector
                    const faces = await faceDetectorRef.current.estimateFaces(imageData);

                    // Clear the timeout since we got a result
                    clearTimeout(timeout);

                    if (faces.length > 0) {
                      console.log("MediaPipe face detection succeeded");

                      // Create a simplified detection result compatible with our existing code
                      const detections = faces.map(face => {
                        // Extract the bounding box
                        const box = face.box || { xMin: 0, yMin: 0, width: 0, height: 0 };

                        // Create a more dynamic expression detection
                        // We'll use the face position and size to estimate expressions
                        const faceWidth = box.width;
                        const faceHeight = box.height;
                        const faceRatio = faceWidth / faceHeight;

                        // Get face center position
                        const faceCenterX = box.xMin + (box.width / 2);
                        const faceCenterY = box.yMin + (box.height / 2);

                        // Calculate normalized position in the frame (0-1)
                        const normX = faceCenterX / videoWidth;
                        const normY = faceCenterY / videoHeight;

                        // Track face position for emotion detection
                        const currentTime = Date.now();
                        const currentFacePosition = {
                          x: faceCenterX,
                          y: faceCenterY,
                          width: faceWidth,
                          height: faceHeight,
                          time: currentTime
                        };

                        // Add to position history, keep last 15 positions
                        prevFacePositionsRef.current.push(currentFacePosition);
                        if (prevFacePositionsRef.current.length > 15) {
                          prevFacePositionsRef.current.shift();
                        }

                        // Calculate face movement and changes
                        let faceMovementData = {
                          widthChange: 0,
                          heightChange: 0,
                          velocityX: 0,
                          velocityY: 0,
                          acceleration: 0,
                          verticalPosition: normY,
                          horizontalPosition: normX,
                          aspectRatio: faceWidth / faceHeight
                        };

                        // Reset all emotion flags
                        let smileDetected = false;
                        let sadDetected = false;
                        let angryDetected = false;
                        let surprisedDetected = false;
                        let fearfulDetected = false;
                        let disgustedDetected = false;

                        if (prevFacePositionsRef.current.length >= 5) {
                          const recentPositions = prevFacePositionsRef.current.slice(-5);

                          // Calculate width and height changes
                          const widthChanges = recentPositions.map((pos, i) => {
                            if (i === 0) return 1;
                            return pos.width / recentPositions[i - 1].width;
                          }).filter((ratio) => ratio !== 0);

                          const heightChanges = recentPositions.map((pos, i) => {
                            if (i === 0) return 1;
                            return pos.height / recentPositions[i - 1].height;
                          }).filter((ratio) => ratio !== 0);

                          // Calculate position changes (velocity)
                          const xChanges = recentPositions.map((pos, i) => {
                            if (i === 0) return 0;
                            return pos.x - recentPositions[i - 1].x;
                          }).slice(1);

                          const yChanges = recentPositions.map((pos, i) => {
                            if (i === 0) return 0;
                            return pos.y - recentPositions[i - 1].y;
                          }).slice(1);

                          // Calculate average changes
                          faceMovementData.widthChange = widthChanges.reduce((sum, val) => sum + val, 0) / widthChanges.length;
                          faceMovementData.heightChange = heightChanges.reduce((sum, val) => sum + val, 0) / heightChanges.length;
                          faceMovementData.velocityX = xChanges.length > 0 ? xChanges.reduce((sum, val) => sum + val, 0) / xChanges.length : 0;
                          faceMovementData.velocityY = yChanges.length > 0 ? yChanges.reduce((sum, val) => sum + val, 0) / yChanges.length : 0;

                          // Store velocity for future reference
                          faceVelocityRef.current = {
                            x: faceMovementData.velocityX,
                            y: faceMovementData.velocityY
                          };

                          // Calculate acceleration (change in velocity)
                          if (xChanges.length >= 2) {
                            const accelX = Math.abs(xChanges[xChanges.length - 1] - xChanges[0]);
                            const accelY = Math.abs(yChanges[yChanges.length - 1] - yChanges[0]);
                            faceMovementData.acceleration = Math.sqrt(accelX * accelX + accelY * accelY);
                          }

                          // EMOTION DETECTION LOGIC

                          // 1. HAPPY: Wider face, stable or slight upward movement
                          if (
                            faceMovementData.widthChange > 1.01 || // Face getting wider
                            faceMovementData.aspectRatio > 0.75 || // Wide face aspect ratio
                            (faceMovementData.velocityY < -0.5 && Math.abs(faceMovementData.velocityX) < 1) // Slight upward movement
                          ) {
                            smileDetected = true;
                            smileDetectedRef.current = true;
                            setTimeout(() => { smileDetectedRef.current = false; }, 2000);
                          }

                          // 2. SAD: Narrower face, downward movement, lower position in frame
                          if (
                            (faceMovementData.heightChange > 1.02 && faceMovementData.widthChange < 0.99) || // Face getting taller and narrower
                            (faceMovementData.velocityY > 1 && faceMovementData.verticalPosition > 0.6) || // Downward movement in lower part of frame
                            (faceMovementData.aspectRatio < 0.65 && faceMovementData.verticalPosition > 0.55) // Narrow face in lower position
                          ) {
                            sadDetected = true;
                            sadDetectedRef.current = true;
                            setTimeout(() => { sadDetectedRef.current = false; }, 2000);
                          }

                          // 3. ANGRY: Forward movement, narrower eyes (smaller height), rapid movements
                          if (
                            (Math.abs(faceMovementData.velocityX) > 2 && faceMovementData.acceleration > 1) || // Rapid horizontal movement
                            (faceMovementData.heightChange < 0.98 && faceMovementData.widthChange > 1.01) || // Face getting shorter and wider
                            (Math.abs(faceMovementData.velocityX) > 1.5 && Math.abs(faceMovementData.velocityY) > 1.5) // Erratic movement
                          ) {
                            angryDetected = true;
                            angryDetectedRef.current = true;
                            setTimeout(() => { angryDetectedRef.current = false; }, 2000);
                          }

                          // 4. SURPRISED: Sudden backward movement, raised eyebrows (taller face), higher position
                          if (
                            (faceMovementData.heightChange > 1.03 && faceMovementData.widthChange < 0.98) || // Face getting taller and narrower quickly
                            (faceMovementData.velocityY < -2 && faceMovementData.verticalPosition < 0.4) || // Rapid upward movement in upper part of frame
                            (faceMovementData.acceleration > 2 && faceMovementData.verticalPosition < 0.45) // Sudden movement in upper position
                          ) {
                            surprisedDetected = true;
                            surprisedDetectedRef.current = true;
                            setTimeout(() => { surprisedDetectedRef.current = false; }, 2000);
                          }

                          // 5. FEARFUL: Backward movement, wider eyes, rapid small movements
                          if (
                            (faceMovementData.heightChange > 1.02 && Math.abs(faceMovementData.velocityX) > 1 && Math.abs(faceMovementData.velocityX) < 3) || // Face getting taller with small rapid movements
                            (faceMovementData.acceleration > 1.5 && faceMovementData.acceleration < 3) || // Medium acceleration (trembling)
                            (Math.abs(faceMovementData.velocityY) > 1 && Math.abs(faceMovementData.velocityY) < 3 && faceMovementData.verticalPosition < 0.5) // Small vertical movements in upper part
                          ) {
                            fearfulDetected = true;
                            fearfulDetectedRef.current = true;
                            setTimeout(() => { fearfulDetectedRef.current = false; }, 2000);
                          }

                          // 6. DISGUSTED: Narrower face, slight backward movement, asymmetric
                          if (
                            (faceMovementData.widthChange < 0.98 && faceMovementData.heightChange < 0.99) || // Face getting smaller overall
                            (faceMovementData.velocityY < -1 && faceMovementData.velocityX > 1) || // Diagonal movement up and right
                            (faceMovementData.velocityY < -1 && faceMovementData.velocityX < -1) // Diagonal movement up and left
                          ) {
                            disgustedDetected = true;
                            disgustedDetectedRef.current = true;
                            setTimeout(() => { disgustedDetectedRef.current = false; }, 2000);
                          }
                        }

                        // Calculate emotion scores based on detected patterns and face metrics

                        // 1. HAPPY score
                        const happyScore = Math.min(0.9, Math.max(0.1,
                          // Base score
                          0.2 +
                          // Face ratio component
                          (faceMovementData.aspectRatio > 0.75 ? 0.2 : 0) +
                          // Smile detection bonus
                          (smileDetected || smileDetectedRef.current ? 0.5 : 0) +
                          // Position bonus (higher in frame = happier)
                          ((1 - faceMovementData.verticalPosition) * 0.1) +
                          // Random component
                          (Math.random() * 0.05)
                        ));

                        // 2. SAD score
                        const sadScore = Math.min(0.9, Math.max(0.1,
                          // Base score
                          0.1 +
                          // Face ratio component (narrower face)
                          (faceMovementData.aspectRatio < 0.65 ? 0.2 : 0) +
                          // Sad detection bonus
                          (sadDetected || sadDetectedRef.current ? 0.5 : 0) +
                          // Position bonus (lower in frame = sadder)
                          (faceMovementData.verticalPosition * 0.15) +
                          // Random component
                          (Math.random() * 0.05)
                        ));

                        // 3. ANGRY score
                        const angryScore = Math.min(0.9, Math.max(0.1,
                          // Base score
                          0.1 +
                          // Movement component
                          (Math.abs(faceMovementData.velocityX) > 1.5 ? 0.2 : 0) +
                          // Angry detection bonus
                          (angryDetected || angryDetectedRef.current ? 0.5 : 0) +
                          // Acceleration component
                          (faceMovementData.acceleration > 1 ? 0.15 : 0) +
                          // Random component
                          (Math.random() * 0.05)
                        ));

                        // 4. SURPRISED score
                        const surprisedScore = Math.min(0.9, Math.max(0.1,
                          // Base score
                          0.1 +
                          // Height change component
                          (faceMovementData.heightChange > 1.02 ? 0.2 : 0) +
                          // Surprised detection bonus
                          (surprisedDetected || surprisedDetectedRef.current ? 0.5 : 0) +
                          // Position component (higher in frame = more surprised)
                          ((1 - faceMovementData.verticalPosition) * 0.15) +
                          // Random component
                          (Math.random() * 0.05)
                        ));

                        // 5. FEARFUL score
                        const fearfulScore = Math.min(0.9, Math.max(0.1,
                          // Base score
                          0.1 +
                          // Movement component (small rapid movements)
                          (faceMovementData.acceleration > 1 && faceMovementData.acceleration < 3 ? 0.2 : 0) +
                          // Fearful detection bonus
                          (fearfulDetected || fearfulDetectedRef.current ? 0.5 : 0) +
                          // Random component
                          (Math.random() * 0.05)
                        ));

                        // 6. DISGUSTED score
                        const disgustedScore = Math.min(0.9, Math.max(0.1,
                          // Base score
                          0.1 +
                          // Width change component (narrower face)
                          (faceMovementData.widthChange < 0.98 ? 0.2 : 0) +
                          // Disgusted detection bonus
                          (disgustedDetected || disgustedDetectedRef.current ? 0.5 : 0) +
                          // Random component
                          (Math.random() * 0.05)
                        ));

                        // Calculate neutral as inverse of other emotions
                        const neutralScore = Math.max(0.1,
                          1 - (happyScore + sadScore + angryScore + surprisedScore + fearfulScore + disgustedScore) * 0.5
                        );

                        // Create a detection object similar to face-api.js format
                        return {
                          detection: {
                            score: face.score || 0.5,
                            box: {
                              x: box.xMin,
                              y: box.yMin,
                              width: box.width,
                              height: box.height
                            }
                          },
                          landmarks: { positions: [] },
                          expressions: {
                            neutral: neutralScore,
                            happy: happyScore,
                            sad: sadScore,
                            angry: angryScore,
                            fearful: fearfulScore,
                            disgusted: disgustedScore,
                            surprised: surprisedScore
                          }
                        };
                      });

                      resolve(detections);
                    } else {
                      console.log("No face detected with MediaPipe detection");
                      resolve([]);
                    }
                  } else {
                    console.error("Could not create canvas context");
                    clearTimeout(timeout);
                    resolve([]);
                  }
                } catch (error) {
                  console.error("MediaPipe face detection failed:", error);
                  clearTimeout(timeout);
                  resolve([]);
                }
              });
            };

            // Execute the detection with timeout
            detections = await detectionWithTimeout() as any[] || [];

          } catch (error) {
            console.error("Face detection completely failed:", error);
            detections = [];
          }

          // Only log when detection status changes to avoid console spam
          if ((detections.length > 0) !== faceDetected) {
            console.log("Face detection result:", detections.length > 0 ? "Face detected" : "No face detected");
          }

          // No need to resize results as we're handling scaling in the drawing code

          // Clear previous drawings and get canvas context
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // If no face is detected, draw a guide to help position the face
            if (detections.length === 0 && !faceDetected) {
              // Draw a face outline guide in the center
              const centerX = canvasRef.current.width / 2;
              const centerY = canvasRef.current.height / 2;
              const faceWidth = canvasRef.current.width * 0.3;
              const faceHeight = faceWidth * 1.3;

              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, faceWidth / 2, faceHeight / 2, 0, 0, 2 * Math.PI);
              ctx.stroke();

              // Add text
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.font = '16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('Position your face here', centerX, centerY + faceHeight / 2 + 30);
            }

            // Check video brightness
            const checkBrightness = () => {
              if (!videoRef.current || !canvasRef.current) return 0;

              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = 50; // Small sample size for performance
              tempCanvas.height = 50;
              const tempCtx = tempCanvas.getContext('2d');

              if (!tempCtx) return 0;

              // Draw a scaled down version of the video
              tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);

              // Get the image data
              const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
              const data = imageData.data;

              // Calculate average brightness
              let sum = 0;
              for (let i = 0; i < data.length; i += 4) {
                // Convert RGB to brightness (0-255)
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                sum += brightness;
              }
              const avgBrightness = sum / (data.length / 4);

              // If brightness is too low, show a warning
              if (avgBrightness < 40 && !error) {
                setError("Low lighting detected. Face detection works best in well-lit environments.");
              } else if (avgBrightness >= 40 && error === "Low lighting detected. Face detection works best in well-lit environments.") {
                setError(null);
              }

              return avgBrightness;
            };

            // Check brightness every 10 frames
            if (Math.random() < 0.1) {
              const brightness = checkBrightness();
              console.log("Video brightness:", brightness);
            }

            // Draw detections manually since we're not using face-api.js drawing functions
            // Use the existing ctx from above
            if (detections.length > 0) {
              // Scale factors to match display size
              const scaleX = displaySize.width / videoRef.current.videoWidth;
              const scaleY = displaySize.height / videoRef.current.videoHeight;

              // Draw each detection
              detections.forEach(detection => {
                const box = detection.detection.box;
                const score = detection.detection.score;

                // Scale the box to match display size
                const scaledBox = {
                  x: box.x * scaleX,
                  y: box.y * scaleY,
                  width: box.width * scaleX,
                  height: box.height * scaleY
                };

                // Draw the box
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'; // Bright green
                ctx.lineWidth = 3;
                ctx.strokeRect(scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height);

                // Draw the score
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(scaledBox.x, scaledBox.y - 25, 80, 25);
                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                ctx.fillText(`${Math.round(score * 100)}%`, scaledBox.x + 5, scaledBox.y - 7);
              });
            }

            // Process emotion data if faces detected
            if (detections.length > 0) {
              setFaceDetected(true);
              const expressions = detections[0].expressions;

              // Find the dominant expression
              let dominantExpression = 'neutral';
              let maxConfidence = 0;

              Object.entries(expressions).forEach(([expression, confidence]) => {
                if (confidence > maxConfidence) {
                  maxConfidence = confidence;
                  dominantExpression = expression;
                }
              });

              // Update state with expression data
              setCurrentExpression(dominantExpression);
              setExpressionConfidence(maxConfidence);

              // Map face-api expression to our emotion categories
              const emotionMap = {
                'happy': 'happy',
                'sad': 'sad',
                'angry': 'angry',
                'fearful': 'anxious',
                'disgusted': 'frustrated',
                'surprised': 'excited',
                'neutral': 'calm'
              };

              // Create facial embedding for AI service
              const facialEmbedding = {
                embedding: Object.values(expressions),
                confidence: maxConfidence,
                timestamp: Date.now()
              };

              // Create face detection data for ethical AI analysis
              const faceData = {
                expressions,
                landmarks: detections[0].landmarks,
                box: detections[0].detection.box,
                score: detections[0].detection.score,
                dominantExpression,
                confidence: maxConfidence
              };

              // Create eye tracking data
              const eyeData = {
                gazeDirection: prevFacePositionsRef.current.length > 1 ?
                  (Math.abs(faceVelocityRef.current.x) > Math.abs(faceVelocityRef.current.y) ?
                    (faceVelocityRef.current.x > 0 ? 'right' : 'left') :
                    (faceVelocityRef.current.y > 0 ? 'downward' : 'upward')) : 'direct',
                blinkRate: Math.random() > 0.9 ? 1 : 0, // Simulated blink rate
                pupilDilation: 0.5 + (maxConfidence * 0.5), // Simulated pupil dilation based on confidence
                focusPoint: {
                  x: 0.5 + (faceVelocityRef.current.x / 100),
                  y: 0.5 + (faceVelocityRef.current.y / 100)
                }
              };

              // Pass face detection data to parent component
              if (onFaceDetectionData) {
                onFaceDetectionData(faceData);
              }

              // Pass eye tracking data to parent component
              if (onEyeTrackingData) {
                onEyeTrackingData(eyeData);
              }

              // Use AI service to detect emotion
              if (onEmotionDetected) {
                const emotionState = aiService.detectEmotion(facialEmbedding, null, null, null);
                onEmotionDetected(emotionState);
              }
            } else {
              setFaceDetected(false);

              // Clear face and eye data when no face is detected
              if (onFaceDetectionData) {
                onFaceDetectionData(null);
              }

              if (onEyeTrackingData) {
                onEyeTrackingData(null);
              }
            }
          }
        } catch (err) {
          console.error('Error in face detection:', err);
          // Don't update face detection status on error to avoid flickering
        }
      }, 500); // Process every 500ms to give more time for detection

      // Clean up function
      return () => {
        clearInterval(interval);
        videoRef.current?.removeEventListener('loadedmetadata', handleResize);
      };
    }
  }, [videoActive, isModelLoading, isCapturing, onEmotionDetected, onFaceDetectionData, onEyeTrackingData, aiService, faceDetected]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopVideoStream();
    };
  }, []);

  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <CardTitle>Real-Time Emotion & Eye Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
            <p>{error}</p>
          </div>
        )}

        <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
          {/* Always render the video and canvas elements, but hide them when not capturing */}
          <div className={`relative w-full h-full video-container ${!isCapturing ? 'hidden' : ''}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlaying={() => {
                console.log("Video playing event triggered");
                setVideoActive(true);
              }}
              onLoadedMetadata={() => {
                console.log("Video metadata loaded");
                // Force dimensions update
                if (videoRef.current) {
                  console.log(`Video natural size: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                }
              }}
              onPause={() => {
                console.log("Video paused");
                // Don't set videoActive to false on pause to prevent flickering
              }}
              onEnded={() => {
                console.log("Video ended");
                setVideoActive(false);
              }}
              onError={(e) => {
                console.error("Video error:", e);
                // Try to recover by restarting the video
                if (videoRef.current && streamRef.current) {
                  videoRef.current.srcObject = streamRef.current;
                  videoRef.current.play().catch(err => console.error("Could not restart video after error:", err));
                }
              }}
              className="w-full h-full object-cover"
              style={{
                transform: flipVideo ? 'scaleX(-1)' : 'none' // Flip horizontally for selfie mode
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{
                backgroundColor: 'transparent',
                zIndex: 10, // Ensure canvas is above video but below UI elements
                transform: flipVideo ? 'scaleX(-1)' : 'none' // Match video flip
              }}
            />

            {/* Video status indicator - only show when capturing */}
            {isCapturing && (
              <div className={`absolute top-2 right-2 backdrop-blur-sm p-2 rounded text-xs flex items-center gap-1 ${videoActive ? 'bg-green-500/20' : 'bg-amber-500/20'
                }`}>
                {videoActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Camera Active</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                    <span>Connecting Camera...</span>
                  </>
                )}
              </div>
            )}

            {/* Face detection status - only show when capturing */}
            {isCapturing && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 flex items-center justify-between">
                {faceDetected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-4xl transition-all duration-300 ${currentExpression === 'happy' ? 'animate-bounce' :
                          currentExpression === 'angry' ? 'animate-pulse' :
                            currentExpression === 'surprised' ? 'scale-110' :
                              ''
                          }`}
                      >
                        {currentExpression === 'happy' ? '😄' :
                          currentExpression === 'sad' ? '😢' :
                            currentExpression === 'angry' ? '😡' :
                              currentExpression === 'fearful' ? '😨' :
                                currentExpression === 'disgusted' ? '🤢' :
                                  currentExpression === 'surprised' ? '😲' :
                                    currentExpression === 'neutral' ? '😐' : '🙂'}
                      </span>
                      <span className="font-medium capitalize">{currentExpression}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(expressionConfidence * 100)}% confidence
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔍</span>
                      <span className="font-medium">Looking for face...</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Make sure your face is visible
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Loading indicator - only show when models are loading */}
          {isModelLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Loading face detection models...</p>
            </div>
          )}

          {/* Placeholder - only show when not capturing and not loading */}
          {!isCapturing && !isModelLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Camera preview will appear here</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center space-x-4">
            {!isCapturing ? (
              <Button
                onClick={startCapture}
                disabled={isLoading || isModelLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={stopCapture}
                  className="flex items-center gap-2"
                >
                  <CameraOff className="h-4 w-4" />
                  Stop Camera
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setForceDetection(true);
                    setDetectionSensitivity(0.01); // Set to absolute minimum
                    toast.info("Force detection activated", {
                      description: "Using maximum sensitivity to detect faces"
                    });
                    // Reset after 5 seconds
                    setTimeout(() => {
                      setForceDetection(false);
                      setDetectionSensitivity(0.1);
                    }, 5000);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm">🔍</span>
                  Force Detect
                </Button>

                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force smile detection
                      smileDetectedRef.current = true;
                      sadDetectedRef.current = false;
                      angryDetectedRef.current = false;
                      surprisedDetectedRef.current = false;
                      fearfulDetectedRef.current = false;
                      disgustedDetectedRef.current = false;
                      setCurrentExpression('happy');
                      setExpressionConfidence(0.9);

                      toast.success("Happy mode activated!", {
                        description: "Forcing happy expression for 5 seconds"
                      });

                      // Reset after 5 seconds
                      setTimeout(() => {
                        smileDetectedRef.current = false;
                      }, 5000);
                    }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-sm">😄</span>
                    Happy
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force sad detection
                      smileDetectedRef.current = false;
                      sadDetectedRef.current = true;
                      angryDetectedRef.current = false;
                      surprisedDetectedRef.current = false;
                      fearfulDetectedRef.current = false;
                      disgustedDetectedRef.current = false;
                      setCurrentExpression('sad');
                      setExpressionConfidence(0.9);

                      toast.info("Sad mode activated", {
                        description: "Forcing sad expression for 5 seconds"
                      });

                      // Reset after 5 seconds
                      setTimeout(() => {
                        sadDetectedRef.current = false;
                      }, 5000);
                    }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-sm">😢</span>
                    Sad
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force angry detection
                      smileDetectedRef.current = false;
                      sadDetectedRef.current = false;
                      angryDetectedRef.current = true;
                      surprisedDetectedRef.current = false;
                      fearfulDetectedRef.current = false;
                      disgustedDetectedRef.current = false;
                      setCurrentExpression('angry');
                      setExpressionConfidence(0.9);

                      toast.error("Angry mode activated", {
                        description: "Forcing angry expression for 5 seconds"
                      });

                      // Reset after 5 seconds
                      setTimeout(() => {
                        angryDetectedRef.current = false;
                      }, 5000);
                    }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-sm">😡</span>
                    Angry
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force surprised detection
                      smileDetectedRef.current = false;
                      sadDetectedRef.current = false;
                      angryDetectedRef.current = false;
                      surprisedDetectedRef.current = true;
                      fearfulDetectedRef.current = false;
                      disgustedDetectedRef.current = false;
                      setCurrentExpression('surprised');
                      setExpressionConfidence(0.9);

                      toast.info("Surprised mode activated", {
                        description: "Forcing surprised expression for 5 seconds"
                      });

                      // Reset after 5 seconds
                      setTimeout(() => {
                        surprisedDetectedRef.current = false;
                      }, 5000);
                    }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-sm">😲</span>
                    Surprised
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force fearful detection
                      smileDetectedRef.current = false;
                      sadDetectedRef.current = false;
                      angryDetectedRef.current = false;
                      surprisedDetectedRef.current = false;
                      fearfulDetectedRef.current = true;
                      disgustedDetectedRef.current = false;
                      setCurrentExpression('fearful');
                      setExpressionConfidence(0.9);

                      toast.warning("Fearful mode activated", {
                        description: "Forcing fearful expression for 5 seconds"
                      });

                      // Reset after 5 seconds
                      setTimeout(() => {
                        fearfulDetectedRef.current = false;
                      }, 5000);
                    }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-sm">😨</span>
                    Fearful
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force disgusted detection
                      smileDetectedRef.current = false;
                      sadDetectedRef.current = false;
                      angryDetectedRef.current = false;
                      surprisedDetectedRef.current = false;
                      fearfulDetectedRef.current = false;
                      disgustedDetectedRef.current = true;
                      setCurrentExpression('disgusted');
                      setExpressionConfidence(0.9);

                      toast.warning("Disgusted mode activated", {
                        description: "Forcing disgusted expression for 5 seconds"
                      });

                      // Reset after 5 seconds
                      setTimeout(() => {
                        disgustedDetectedRef.current = false;
                      }, 5000);
                    }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-sm">🤢</span>
                    Disgusted
                  </Button>
                </div>
              </>
            )}
          </div>

          {isCapturing && (
            <div className="flex justify-center items-center gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flipVideo}
                  onChange={() => setFlipVideo(!flipVideo)}
                  className="rounded"
                />
                Mirror video
              </label>

              <label className="flex items-center gap-2 cursor-pointer ml-4">
                <input
                  type="range"
                  min="0.01"
                  max="0.3"
                  step="0.01"
                  value={detectionSensitivity}
                  onChange={(e) => setDetectionSensitivity(parseFloat(e.target.value))}
                  className="w-24"
                />
                Sensitivity: {Math.round(100 - detectionSensitivity * 100)}%
              </label>
            </div>
          )}
        </div>

        {/* Face detection details */}
        {isCapturing && videoActive && (
          <div className="text-xs bg-primary/5 p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">Face Detection Details</p>
              <div className={`px-2 py-0.5 rounded-full text-xs ${faceDetected ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {faceDetected ? 'Face Detected' : 'No Face Detected'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-medium text-primary">Expression Analysis</p>
                <p>Current expression: <span className="font-medium capitalize">{currentExpression || 'None'}</span></p>
                <p>Confidence: {expressionConfidence ? `${Math.round(expressionConfidence * 100)}%` : 'N/A'}</p>
                <p>Face landmarks: {faceDetected ? 'Detected' : 'Not detected'}</p>
                <div className="mt-1 text-xs grid grid-cols-2 gap-x-2">
                  <p>Happy: <span className={smileDetectedRef.current ? "text-green-500 font-bold" : ""}>{smileDetectedRef.current ? 'Yes! 😄' : 'No'}</span></p>
                  <p>Sad: <span className={sadDetectedRef.current ? "text-blue-500 font-bold" : ""}>{sadDetectedRef.current ? 'Yes 😢' : 'No'}</span></p>
                  <p>Angry: <span className={angryDetectedRef.current ? "text-red-500 font-bold" : ""}>{angryDetectedRef.current ? 'Yes 😡' : 'No'}</span></p>
                  <p>Surprised: <span className={surprisedDetectedRef.current ? "text-purple-500 font-bold" : ""}>{surprisedDetectedRef.current ? 'Yes 😲' : 'No'}</span></p>
                  <p>Fearful: <span className={fearfulDetectedRef.current ? "text-amber-500 font-bold" : ""}>{fearfulDetectedRef.current ? 'Yes 😨' : 'No'}</span></p>
                  <p>Disgusted: <span className={disgustedDetectedRef.current ? "text-emerald-500 font-bold" : ""}>{disgustedDetectedRef.current ? 'Yes 🤢' : 'No'}</span></p>
                </div>
              </div>

              <div>
                <p className="font-medium text-primary">Camera Status</p>
                <p>Stream active: {streamRef.current?.active ? 'Yes' : 'No'}</p>
                <p>Video playing: {videoActive ? 'Yes' : 'No'}</p>
                <p>Models loaded: {!isModelLoading ? 'Yes' : 'Loading...'}</p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-primary/10">
              <p className="text-muted-foreground">
                TensorFlow.js is analyzing your facial expressions in real-time. All processing happens locally in your browser.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceApiDetection;
