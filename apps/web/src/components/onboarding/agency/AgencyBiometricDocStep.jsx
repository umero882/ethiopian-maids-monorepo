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
  User,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AgencyBiometricDocStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [activeSection, setActiveSection] = useState('face');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const tradeLicenseRef = useRef(null);
  const investorIdRef = useRef(null);

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
    awardPoints(50, 'Representative photo captured');
    triggerCelebration('confetti-burst');
  }, [updateFormData, stopCamera, awardPoints, triggerCelebration]);

  // Retake photo
  const retakePhoto = () => {
    updateFormData({ facePhoto: null });
    startCamera();
  };

  // Handle document upload
  const handleDocumentUpload = (type, e) => {
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

    setIsUploading((prev) => ({ ...prev, [type]: true }));

    const reader = new FileReader();
    reader.onload = (event) => {
      updateFormData({
        [type]: {
          data: event.target.result,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      });
      setIsUploading((prev) => ({ ...prev, [type]: false }));
      awardPoints(40, `${type === 'tradeLicense' ? 'Trade license' : 'Investor ID'} uploaded`);
    };
    reader.readAsDataURL(file);
  };

  // Remove document
  const removeDocument = (type) => {
    updateFormData({ [type]: null });
    if (type === 'tradeLicense' && tradeLicenseRef.current) {
      tradeLicenseRef.current.value = '';
    }
    if (type === 'investorId' && investorIdRef.current) {
      investorIdRef.current.value = '';
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (formData.facePhoto && formData.tradeLicense && formData.investorId) {
      nextStep();
    }
  };

  // Check completion
  const completedCount =
    (formData.facePhoto ? 1 : 0) +
    (formData.tradeLicense ? 1 : 0) +
    (formData.investorId ? 1 : 0);

  const isComplete = completedCount === 3;

  // Render document upload section
  const renderDocumentUpload = (type, label, icon, inputRef) => {
    const doc = formData[type];
    const Icon = icon;

    return (
      <div className="space-y-3">
        {doc ? (
          <div className="bg-white/10 rounded-xl p-4 border border-green-500/50">
            <div className="flex items-center gap-3">
              {doc.type.startsWith('image/') ? (
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={doc.data}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{doc.name}</p>
                <p className="text-gray-400 text-xs">{(doc.size / 1024).toFixed(1)} KB</p>
                <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Uploaded
                </div>
              </div>
              <button
                onClick={() => removeDocument(type)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleDocumentUpload(type, e)}
              className="hidden"
              id={`agency-${type}-upload`}
            />
            <label
              htmlFor={`agency-${type}-upload`}
              className="block aspect-[3/2] max-w-[280px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all"
            >
              {isUploading[type] ? (
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-2" />
              ) : (
                <>
                  <Icon className="w-10 h-10 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm text-center px-4 mb-1">
                    Upload {label}
                  </p>
                  <p className="text-gray-500 text-xs">JPG, PNG, or PDF (max 10MB)</p>
                </>
              )}
            </label>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Identity & Documents"
        description="Verify your agency credentials"
        icon={Shield}
        showHeader={true}
      >
        <div className="mt-4 space-y-4">
          {/* Section tabs */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveSection('face')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border transition-all text-xs',
                activeSection === 'face'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photo</span>
              {formData.facePhoto && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            </button>
            <button
              onClick={() => setActiveSection('license')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border transition-all text-xs',
                activeSection === 'license'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>License</span>
              {formData.tradeLicense && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            </button>
            <button
              onClick={() => setActiveSection('investor')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border transition-all text-xs',
                activeSection === 'investor'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>Investor ID</span>
              {formData.investorId && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
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
                <p className="text-xs text-gray-400 text-center">
                  Photo of the authorized representative
                </p>

                {formData.facePhoto ? (
                  <div className="relative">
                    <div className="aspect-square max-w-[240px] mx-auto rounded-xl overflow-hidden border-2 border-green-500">
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
                      Done
                    </div>
                  </div>
                ) : cameraActive ? (
                  <div className="relative">
                    <div className="aspect-square max-w-[240px] mx-auto rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-900">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-40 h-48 border-2 border-dashed border-white/50 rounded-full" />
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="flex justify-center gap-3 mt-4">
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        size="sm"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        disabled={isCapturing}
                        size="sm"
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
                    <div className="aspect-square max-w-[240px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center">
                      <Camera className="w-10 h-10 text-gray-500 mb-3" />
                      <p className="text-gray-400 text-sm text-center px-4">
                        Take a clear photo
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

            {/* Trade License Section */}
            {activeSection === 'license' && (
              <motion.div
                key="license"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-xs text-gray-400 text-center">
                  Upload your valid trade license document
                </p>
                {renderDocumentUpload('tradeLicense', 'Trade License', Building2, tradeLicenseRef)}
              </motion.div>
            )}

            {/* Investor ID Section */}
            {activeSection === 'investor' && (
              <motion.div
                key="investor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-xs text-gray-400 text-center">
                  Upload investor's ID or passport
                </p>
                {renderDocumentUpload('investorId', 'Investor ID/Passport', User, investorIdRef)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Verification Progress</span>
              <span className="text-sm text-white font-medium">
                {completedCount}/3 complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <StepTip>
          Verified agencies receive a trust badge on their profile.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        isDisabled={!isComplete}
        nextLabel={isComplete ? 'Continue' : 'Complete All Steps'}
      />
    </div>
  );
};

export default AgencyBiometricDocStep;
