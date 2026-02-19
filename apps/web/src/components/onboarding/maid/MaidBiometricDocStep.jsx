import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Upload,
  CheckCircle,
  X,
  RefreshCw,
  FileText,
  Shield,
  AlertCircle,
  Image,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MaidBiometricDocStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [activeSection, setActiveSection] = useState('face'); // 'face' or 'document'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [shouldStartCamera, setShouldStartCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSide, setUploadingSide] = useState(null); // 'front' or 'back'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const backFileInputRef = useRef(null);

  // Phase 1: User clicks "Open Camera" - show video element first
  const startCamera = useCallback(() => {
    setCameraError(null);
    setCameraLoading(true);
    setShouldStartCamera(true);
  }, []);

  // Phase 2: After video element is rendered, actually start the camera
  useEffect(() => {
    if (!shouldStartCamera || !cameraLoading) return;

    const initCamera = async () => {
      try {
        // Wait a frame for the video element to be in the DOM
        await new Promise(resolve => requestAnimationFrame(resolve));

        if (!videoRef.current) {
          throw new Error('Video element not found');
        }

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        streamRef.current = stream;

        // Attach stream to video element
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          const video = videoRef.current;
          if (!video) {
            resolve();
            return;
          }

          if (video.readyState >= 2) {
            resolve();
            return;
          }

          const handleLoadedData = () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            resolve();
          };

          video.addEventListener('loadeddata', handleLoadedData);

          // Timeout after 3 seconds
          setTimeout(resolve, 3000);
        });

        // Try to play
        if (videoRef.current) {
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('Autoplay warning:', playErr);
          }
        }

        setCameraActive(true);
        setCameraLoading(false);
        setShouldStartCamera(false);
      } catch (err) {
        console.error('Camera error:', err);
        setCameraLoading(false);
        setShouldStartCamera(false);

        if (err.name === 'NotAllowedError') {
          setCameraError('Camera access denied. Please allow camera permissions in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera found. Please connect a camera and try again.');
        } else if (err.name === 'NotReadableError') {
          setCameraError('Camera is in use by another application. Please close other apps using the camera.');
        } else {
          setCameraError(`Unable to access camera: ${err.message || 'Unknown error'}`);
        }
      }
    };

    initCamera();
  }, [shouldStartCamera, cameraLoading]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
    setShouldStartCamera(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    setIsCapturing(true);

    try {
      // Create canvas dynamically to avoid ref issues
      const canvas = canvasRef.current || document.createElement('canvas');
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      // Use actual video dimensions, fallback to defaults
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;

      // Mirror the image (selfie mode)
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();

      // Get image data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      // Verify we got actual image data (not empty/blank)
      if (imageData && imageData.length > 100) {
        updateFormData({ facePhoto: imageData });
        awardPoints(50, 'Face photo captured');
        triggerCelebration('confetti-burst');
      } else {
        console.error('Captured image is empty');
        setCameraError('Failed to capture photo. Please try again.');
      }
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }

    // Stop camera
    stopCamera();
    setIsCapturing(false);
  }, [updateFormData, stopCamera, awardPoints, triggerCelebration]);

  // Retake photo
  const retakePhoto = () => {
    updateFormData({ facePhoto: null });
    startCamera();
  };

  // Handle document upload (front or back)
  const handleDocumentUpload = (e, side = 'front') => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image or PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadingSide(side);

    const reader = new FileReader();
    reader.onload = (event) => {
      const docData = {
        data: event.target.result,
        name: file.name,
        type: file.type,
        size: file.size,
      };

      if (side === 'front') {
        updateFormData({ idDocument: docData });
        awardPoints(30, 'ID front uploaded');
      } else {
        updateFormData({ idDocumentBack: docData });
        awardPoints(20, 'ID back uploaded');
      }
      setIsUploading(false);
      setUploadingSide(null);
    };
    reader.readAsDataURL(file);
  };

  // Remove document
  const removeDocument = (side = 'front') => {
    if (side === 'front') {
      updateFormData({ idDocument: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      updateFormData({ idDocumentBack: null });
      if (backFileInputRef.current) backFileInputRef.current.value = '';
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (formData.facePhoto && formData.idDocument) {
      nextStep();
    }
  };

  // Check if step is complete
  const isComplete = formData.facePhoto && formData.idDocument;

  return (
    <div className="space-y-4">
      <StepCard
        title="Identity Verification"
        description="Capture your photo and upload ID"
        icon={Shield}
        showHeader={true}
      >
        <div className="mt-4 space-y-4">
          {/* Section tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSection('face')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all',
                activeSection === 'face'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              )}
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">Face Photo</span>
              {formData.facePhoto && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </button>
            <button
              onClick={() => setActiveSection('document')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all',
                activeSection === 'document'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              )}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">ID Document</span>
              {formData.idDocument && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Face Photo Section */}
            {activeSection === 'face' && (
              <motion.div
                key="face"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {formData.facePhoto ? (
                  /* Preview captured photo */
                  <div className="relative">
                    <div className="aspect-[3/4] max-w-[300px] mx-auto rounded-xl overflow-hidden border-2 border-green-500">
                      <img
                        src={formData.facePhoto}
                        alt="Captured face"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={retakePhoto}
                        className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retake
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/90 rounded-full text-xs text-white">
                      <CheckCircle className="w-3 h-3" />
                      Captured
                    </div>
                  </div>
                ) : cameraActive || cameraLoading ? (
                  /* Camera view */
                  <div className="relative">
                    <div className="aspect-[3/4] max-w-[300px] mx-auto rounded-xl overflow-hidden border-2 border-purple-500 bg-black relative">
                      {/* Video element - always rendered when camera is active/loading */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)',
                          backgroundColor: '#000',
                        }}
                      />

                      {/* Loading overlay */}
                      {cameraLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-3" />
                          <p className="text-white text-sm">Starting camera...</p>
                        </div>
                      )}

                      {/* Face guide overlay - centered oval */}
                      {!cameraLoading && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div
                              className="border-2 border-dashed border-white/60 rounded-full"
                              style={{ width: '60%', height: '65%', maxWidth: '160px', maxHeight: '200px' }}
                            />
                          </div>
                          {/* Corner guides */}
                          <div className="absolute inset-0 pointer-events-none z-20">
                            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/40 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/40 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/40 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/40 rounded-br-lg" />
                          </div>
                        </>
                      )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Capture controls */}
                    <div className="flex justify-center gap-3 mt-4">
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                        disabled={cameraLoading}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        disabled={isCapturing || cameraLoading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isCapturing ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 mr-1" />
                        )}
                        Capture
                      </Button>
                    </div>

                    {/* Guidelines */}
                    <div className="mt-4 text-center text-xs text-gray-400">
                      <p>• Position your face within the oval</p>
                      <p>• Ensure good lighting</p>
                      <p>• Look directly at the camera</p>
                    </div>
                  </div>
                ) : (
                  /* Start camera prompt */
                  <div className="space-y-4">
                    <div className="aspect-[3/4] max-w-[300px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-500 mb-3" />
                      <p className="text-gray-400 text-sm text-center px-4">
                        Take a clear photo of your face for verification
                      </p>
                    </div>

                    {cameraError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
                        <AlertCircle className="w-4 h-4" />
                        {cameraError}
                      </div>
                    )}

                    <Button
                      onClick={startCamera}
                      disabled={cameraLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {cameraLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Camera...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Open Camera
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Document Section */}
            {activeSection === 'document' && (
              <motion.div
                key="document"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Front Side */}
                <div>
                  <p className="text-white text-sm font-medium mb-2">📄 Front Side (Required)</p>
                  {formData.idDocument ? (
                    <div className="bg-white/10 rounded-xl p-3 border border-green-500/50">
                      <div className="flex items-center gap-3">
                        {formData.idDocument.type?.startsWith('image/') ? (
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800">
                            <img src={formData.idDocument.data} alt="ID Front" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{formData.idDocument.name}</p>
                          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                            <CheckCircle className="w-3 h-3" /> Front uploaded
                          </div>
                        </div>
                        <button onClick={() => removeDocument('front')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'front')} className="hidden" id="document-upload-front" />
                      <label htmlFor="document-upload-front" className="block aspect-[3/2] max-w-[300px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all">
                        {isUploading && uploadingSide === 'front' ? (
                          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-gray-500 mb-2" />
                            <p className="text-gray-400 text-sm text-center px-4">Upload front of ID/Passport</p>
                            <p className="text-gray-500 text-xs mt-1">JPG, PNG, or PDF (max 10MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Back Side */}
                <div>
                  <p className="text-white text-sm font-medium mb-2">📄 Back Side (Optional for Passport)</p>
                  {formData.idDocumentBack ? (
                    <div className="bg-white/10 rounded-xl p-3 border border-green-500/50">
                      <div className="flex items-center gap-3">
                        {formData.idDocumentBack.type?.startsWith('image/') ? (
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800">
                            <img src={formData.idDocumentBack.data} alt="ID Back" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{formData.idDocumentBack.name}</p>
                          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                            <CheckCircle className="w-3 h-3" /> Back uploaded
                          </div>
                        </div>
                        <button onClick={() => removeDocument('back')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input ref={backFileInputRef} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'back')} className="hidden" id="document-upload-back" />
                      <label htmlFor="document-upload-back" className="block aspect-[3/2] max-w-[300px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all">
                        {isUploading && uploadingSide === 'back' ? (
                          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-gray-500 mb-2" />
                            <p className="text-gray-400 text-sm text-center px-4">Upload back of ID</p>
                            <p className="text-gray-500 text-xs mt-1">Skip if using Passport</p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Document type hints */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Passport</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">National ID (front + back)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion status */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Verification Progress</span>
              <span className="text-sm text-white font-medium">
                {(formData.facePhoto ? 1 : 0) + (formData.idDocument ? 1 : 0) + (formData.idDocumentBack ? 1 : 0)}/3 complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((formData.facePhoto ? 1 : 0) + (formData.idDocument ? 1 : 0) + (formData.idDocumentBack ? 1 : 0)) * 33.3}%`,
                }}
              />
            </div>
          </div>
        </div>

        <StepTip>
          Your documents are encrypted and used only for identity verification.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        isDisabled={!isComplete}
        nextLabel={isComplete ? 'Continue' : 'Complete Both Steps'}
      />
    </div>
  );
};

export default MaidBiometricDocStep;
