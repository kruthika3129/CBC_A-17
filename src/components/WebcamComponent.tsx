import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';

interface WebcamComponentProps {
  onCapture?: (imageSrc: string) => void;
}

const WebcamComponent: React.FC<WebcamComponentProps> = ({ onCapture }) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Configure webcam settings
  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user"
  };

  // Function to capture image from webcam
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImgSrc(imageSrc);
        if (onCapture) {
          onCapture(imageSrc);
        }
      }
    }
  }, [webcamRef, onCapture]);

  // Function to toggle camera on/off
  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
    if (imgSrc) setImgSrc(null);
  };

  // Function to retake photo
  const retake = () => {
    setImgSrc(null);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold mb-2">Camera</h2>

      {isCameraActive ? (
        <div className="relative">
          {imgSrc ? (
            <div className="relative">
              <img src={imgSrc} alt="Captured" className="rounded-lg max-w-full h-auto" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                <Button
                  onClick={retake}
                  variant="secondary"
                  className="font-mono"
                >
                  Retake
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="rounded-lg"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button
                  onClick={capture}
                  className="font-mono"
                >
                  Capture
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[480px] w-[720px] bg-gray-100 dark:bg-gray-900 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Camera is currently off</p>
        </div>
      )}

      <Button
        onClick={toggleCamera}
        variant={isCameraActive ? "destructive" : "default"}
        className="mt-4 font-mono"
      >
        {isCameraActive ? "Turn Off Camera" : "Turn On Camera"}
      </Button>

      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
        <p>Note: Browsers require HTTPS for webcam access.</p>
        <p>Check <a href="https://caniuse.com/#feat=stream" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">browser compatibility</a> for more information.</p>
      </div>
    </div>
  );
};

export default WebcamComponent;
