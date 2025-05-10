import React, { useState } from 'react';
import WebcamComponent from '@/components/WebcamComponent';
import { Button } from '@/components/ui/button';

const WebcamDemo: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    console.log('Image captured:', imageSrc);
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `psytrack-capture-${new Date().toISOString()}.jpg`;
      link.click();
    }
  };

  const handleClear = () => {
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Webcam Integration</h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <WebcamComponent onCapture={handleCapture} />
          </div>
          
          {capturedImage && (
            <div className="mt-8 p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4">Captured Image</h2>
              <div className="flex flex-col items-center">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="rounded-lg max-w-full h-auto mb-4" 
                />
                <div className="flex space-x-4">
                  <Button onClick={handleDownload} className="font-mono">
                    Download
                  </Button>
                  <Button onClick={handleClear} variant="outline" className="font-mono">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-2">Usage Notes</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Webcam access requires a secure context (HTTPS) in most browsers.</li>
              <li>For local development, localhost is considered secure.</li>
              <li>Users will be prompted to grant camera permissions.</li>
              <li>Images are captured client-side and not automatically uploaded anywhere.</li>
              <li>Check <a href="https://caniuse.com/#feat=stream" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">browser compatibility</a> for MediaStream API support.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamDemo;
