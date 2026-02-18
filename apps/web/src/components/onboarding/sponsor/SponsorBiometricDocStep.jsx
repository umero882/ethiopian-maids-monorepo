import React, { useState, useRef, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SponsorBiometricDocStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [activeSection, setActiveSection] = useState('face');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    updateFormData({ facePhoto: imageData });

    stopCamera();
    setIsCapturing(false);
    awardPoints(50, 'Face photo captured');
    triggerCelebration('confetti-burst');
  }, [updateFormData, stopCamera, awardPoints, triggerCelebration]);

  // Retake photo
  const retakePhoto = () => {
    updateFormData({ facePhoto: null });
    startCamera();
  };

  // Handle document upload
  const handleDocumentUpload = (e) => {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      updateFormData({
        idDocument: {
          data: event.target.result,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      });
      setIsUploading(false);
      awardPoints(50, 'ID document uploaded');
    };
    reader.readAsDataURL(file);
  };

  // Remove document
  const removeDocument = () => {
    updateFormData({ idDocument: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (formData.facePhoto && formData.idDocument) {
      nextStep();
    }
  };

  const isComplete = formData.facePhoto && formData.idDocument;

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
              <span className="text-sm">ID/Passport</span>
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
                  <div className="relative">
                    <div className="aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden border-2 border-green-500">
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
                ) : cameraActive ? (
                  <div className="relative">
                    <div className="aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-900">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-56 border-2 border-dashed border-white/50 rounded-full" />
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="flex justify-center gap-3 mt-4">
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        disabled={isCapturing}
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-square max-w-[280px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-500 mb-3" />
                      <p className="text-gray-400 text-sm text-center px-4">
                        Take a clear photo for verification
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
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
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
                {formData.idDocument ? (
                  <div className="relative">
                    <div className="bg-white/10 rounded-xl p-4 border border-green-500/50">
                      <div className="flex items-center gap-3">
                        {formData.idDocument.type.startsWith('image/') ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                            <img
                              src={formData.idDocument.data}
                              alt="ID Document"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {formData.idDocument.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {(formData.idDocument.size / 1024).toFixed(1)} KB
                          </p>
                          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                            <CheckCircle className="w-3 h-3" />
                            Uploaded successfully
                          </div>
                        </div>
                        <button
                          onClick={removeDocument}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="sponsor-doc-upload"
                    />

                    <label
                      htmlFor="sponsor-doc-upload"
                      className="block aspect-[3/2] max-w-[320px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all"
                    >
                      {isUploading ? (
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-3" />
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-500 mb-3" />
                          <p className="text-gray-400 text-sm text-center px-4 mb-1">
                            Upload your Emirates ID or Passport
                          </p>
                          <p className="text-gray-500 text-xs">
                            JPG, PNG, or PDF (max 10MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion status */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Verification Progress</span>
              <span className="text-sm text-white font-medium">
                {(formData.facePhoto ? 1 : 0) + (formData.idDocument ? 1 : 0)}/2 complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((formData.facePhoto ? 1 : 0) + (formData.idDocument ? 1 : 0)) * 50}%`,
                }}
              />
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
