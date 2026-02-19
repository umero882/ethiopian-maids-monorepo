import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepTip } from '../shared/StepCard';
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

const SponsorBiometricDocStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [activeSection, setActiveSection] = useState('face');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSide, setUploadingSide] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const backFileInputRef = useRef(null);

  // Start camera with proper initialization
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      // Wait a frame for video element to render
      await new Promise(resolve => requestAnimationFrame(resolve));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          const video = videoRef.current;
          if (!video) { resolve(); return; }
          if (video.readyState >= 2) { resolve(); return; }
          const onReady = () => { video.removeEventListener('loadeddata', onReady); resolve(); };
          video.addEventListener('loadeddata', onReady);
          setTimeout(resolve, 3000); // timeout fallback
        });

        // Play the video
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Autoplay warning:', playErr);
        }
      }

      setCameraActive(true);
      setCameraLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraLoading(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is in use by another application.');
      } else {
        setCameraError(`Unable to access camera: ${err.message || 'Unknown error'}`);
      }
    }
  }, []);

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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture photo with proper canvas handling
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      // Mirror for selfie mode
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();

      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      if (imageData && imageData.length > 200) {
        updateFormData({ facePhoto: imageData });
        awardPoints(50, 'Face photo captured');
        triggerCelebration('confetti-burst');
      } else {
        setCameraError('Failed to capture photo. Please try again.');
      }
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }

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

  const handleContinue = () => {
    if (formData.facePhoto && formData.idDocument) {
      nextStep();
    }
  };

  const isComplete = formData.facePhoto && formData.idDocument;
  const progressCount = (formData.facePhoto ? 1 : 0) + (formData.idDocument ? 1 : 0) + (formData.idDocumentBack ? 1 : 0);

  // Helper to render a document upload card
  const renderDocUpload = (side, label, sublabel, inputId, inputRef) => {
    const doc = side === 'front' ? formData.idDocument : formData.idDocumentBack;
    return (
      <div>
        <p className="text-white text-sm font-medium mb-2">{label}</p>
        {doc ? (
          <div className="bg-white/10 rounded-xl p-3 border border-green-500/50">
            <div className="flex items-center gap-3">
              {doc.type?.startsWith('image/') ? (
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800">
                  <img src={doc.data} alt={`ID ${side}`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{doc.name}</p>
                <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                  <CheckCircle className="w-3 h-3" /> Uploaded
                </div>
              </div>
              <button onClick={() => removeDocument(side)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input ref={inputRef} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, side)} className="hidden" id={inputId} />
            <label htmlFor={inputId} className="block aspect-[3/2] max-w-[300px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all">
              {isUploading && uploadingSide === side ? (
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm text-center px-4">{sublabel}</p>
                  <p className="text-gray-500 text-xs mt-1">JPG, PNG, or PDF (max 10MB)</p>
                </>
              )}
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Identity Verification"
        description="Verify your identity for secure hiring"
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
              {formData.facePhoto && <CheckCircle className="w-4 h-4 text-green-400" />}
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
              <span className="text-sm">ID/Passport</span>
              {formData.idDocument && <CheckCircle className="w-4 h-4 text-green-400" />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Face Photo Section */}
            {activeSection === 'face' && (
              <motion.div key="face" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                {formData.facePhoto ? (
                  <div className="relative">
                    <div className="aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden border-2 border-green-500">
                      <img src={formData.facePhoto} alt="Captured face" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <Button size="sm" variant="outline" onClick={retakePhoto} className="bg-black/50 border-white/30 text-white hover:bg-black/70">
                        <RefreshCw className="w-4 h-4 mr-1" /> Retake
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/90 rounded-full text-xs text-white">
                      <CheckCircle className="w-3 h-3" /> Captured
                    </div>
                  </div>
                ) : cameraActive || cameraLoading ? (
                  <div className="relative">
                    <div className="aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden border-2 border-purple-500 bg-black relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: '100%', height: '100%',
                          objectFit: 'cover', transform: 'scaleX(-1)',
                          backgroundColor: '#000',
                        }}
                      />
                      {cameraLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-3" />
                          <p className="text-white text-sm">Starting camera...</p>
                        </div>
                      )}
                      {!cameraLoading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <div className="border-2 border-dashed border-white/60 rounded-full" style={{ width: '60%', height: '70%' }} />
                        </div>
                      )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex justify-center gap-3 mt-4">
                      <Button onClick={stopCamera} variant="outline" className="border-white/30 text-white hover:bg-white/10" disabled={cameraLoading}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                      <Button onClick={capturePhoto} disabled={isCapturing || cameraLoading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        {isCapturing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Camera className="w-4 h-4 mr-1" />}
                        Capture
                      </Button>
                    </div>
                    <div className="mt-3 text-center text-xs text-gray-400">
                      <p>• Position your face within the oval</p>
                      <p>• Ensure good lighting</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-square max-w-[280px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-500 mb-3" />
                      <p className="text-gray-400 text-sm text-center px-4">Take a clear photo for verification</p>
                    </div>
                    {cameraError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
                        <AlertCircle className="w-4 h-4" /> {cameraError}
                      </div>
                    )}
                    <Button onClick={startCamera} disabled={cameraLoading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      {cameraLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting Camera...</>
                      ) : (
                        <><Camera className="w-4 h-4 mr-2" /> Open Camera</>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Document Section */}
            {activeSection === 'document' && (
              <motion.div key="document" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {renderDocUpload('front', '📄 Front Side (Required)', 'Upload front of Emirates ID or Passport', 'sponsor-doc-front', fileInputRef)}
                {renderDocUpload('back', '📄 Back Side (Optional for Passport)', 'Upload back of Emirates ID', 'sponsor-doc-back', backFileInputRef)}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Passport</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Emirates ID (front + back)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion status */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Verification Progress</span>
              <span className="text-sm text-white font-medium">{progressCount}/3 complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressCount * 33.3}%` }} />
            </div>
          </div>
        </div>

        <StepTip>
          Verified sponsors get priority access to domestic worker profiles.
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

export default SponsorBiometricDocStep;
