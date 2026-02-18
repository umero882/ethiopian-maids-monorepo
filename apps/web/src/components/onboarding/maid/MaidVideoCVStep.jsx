import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { OptionalBadge } from '../shared/StepCard';
import { Button } from '@/components/ui/button';
import {
  Video,
  Camera,
  Image,
  Play,
  Pause,
  RefreshCw,
  X,
  Check,
  Clock,
  Upload,
  AlertCircle,
  Loader2,
  SkipForward,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_DURATION = 60; // 60 seconds max
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;

const MaidVideoCVStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  // Tab state
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'photos'

  // Video states
  const [mode, setMode] = useState('prompt'); // 'prompt', 'recording', 'preview', 'upload'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [shouldStartRecording, setShouldStartRecording] = useState(false);

  // Photo states
  const [photoError, setPhotoError] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const recordingTimeRef = useRef(0);

  // Get photos from form data
  const photos = formData.profilePhotos || [];

  // Phase 1: User clicks Record - show video element first
  const startRecording = useCallback(() => {
    setError(null);
    setIsInitializing(true);
    setMode('recording');
    setShouldStartRecording(true);
  }, []);

  // Phase 2: After video element is rendered, actually start recording
  useEffect(() => {
    if (!shouldStartRecording || !isInitializing) return;

    const initRecording = async () => {
      try {
        // Wait for video element to be in DOM
        await new Promise(resolve => requestAnimationFrame(resolve));

        if (!videoRef.current) {
          throw new Error('Video element not found');
        }

        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: true,
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
          setTimeout(resolve, 3000); // Timeout after 3 seconds
        });

        // Try to play
        if (videoRef.current) {
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('Autoplay warning:', playErr);
          }
        }

        // Create MediaRecorder
        let mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
          });
        } catch (e) {
          // Fallback for browsers that don't support vp9
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm',
          });
        }

        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          updateFormData({
            videoCV: {
              blob,
              url: videoUrl,
              duration: recordingTimeRef.current,
            },
          });
          setMode('preview');
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000);

        setIsRecording(true);
        setRecordingTime(0);
        recordingTimeRef.current = 0;
        setIsInitializing(false);
        setShouldStartRecording(false);

        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            const newTime = prev + 1;
            recordingTimeRef.current = newTime;
            if (newTime >= MAX_DURATION) {
              // Stop recording when max duration reached
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
              }
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
              }
              clearInterval(timerRef.current);
              setIsRecording(false);
              return MAX_DURATION;
            }
            return newTime;
          });
        }, 1000);
      } catch (err) {
        console.error('Error starting recording:', err);
        setIsInitializing(false);
        setShouldStartRecording(false);
        setMode('prompt');

        if (err.name === 'NotAllowedError') {
          setError('Camera/microphone access denied. Please allow permissions.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found.');
        } else {
          setError('Unable to access camera/microphone. Please check permissions.');
        }
      }
    };

    initRecording();
  }, [shouldStartRecording, isInitializing, updateFormData]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsRecording(false);
    setIsInitializing(false);
    setShouldStartRecording(false);
  }, []);

  // Cancel recording
  const cancelRecording = () => {
    stopRecording();
    setMode('prompt');
    setRecordingTime(0);
    recordingTimeRef.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Delete video
  const deleteVideo = () => {
    if (formData.videoCV?.url) {
      URL.revokeObjectURL(formData.videoCV.url);
    }
    updateFormData({ videoCV: null });
    setMode('prompt');
    setRecordingTime(0);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be less than 50MB');
      return;
    }

    setIsUploading(true);

    // Create URL and check duration
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      if (video.duration > MAX_DURATION) {
        setError(`Video must be ${MAX_DURATION} seconds or less`);
        URL.revokeObjectURL(videoUrl);
        setIsUploading(false);
        return;
      }

      updateFormData({
        videoCV: {
          blob: file,
          url: videoUrl,
          duration: Math.round(video.duration),
        },
      });
      setIsUploading(false);
      setMode('preview');
    };

    video.src = videoUrl;
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Photo upload handler
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setPhotoError(null);
    setIsUploadingPhoto(true);

    const currentPhotos = photos || [];
    const remainingSlots = MAX_PHOTOS - currentPhotos.length;

    if (files.length > remainingSlots) {
      setPhotoError(`You can only add ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}`);
      setIsUploadingPhoto(false);
      return;
    }

    // Process each file
    const processFiles = async () => {
      const newPhotos = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setPhotoError('Please upload only image files (JPEG, PNG)');
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setPhotoError('Each photo must be less than 5MB');
          continue;
        }

        // Read file as data URL
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newPhotos.push({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: dataUrl,
            name: file.name,
            size: file.size,
          });
        } catch (err) {
          console.error('Error reading file:', err);
        }
      }

      if (newPhotos.length > 0) {
        updateFormData({
          profilePhotos: [...currentPhotos, ...newPhotos],
        });
      }

      setIsUploadingPhoto(false);
      // Clear input
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    };

    processFiles();
  };

  // Delete photo
  const deletePhoto = (photoId) => {
    const updatedPhotos = photos.filter((p) => p.id !== photoId);
    updateFormData({ profilePhotos: updatedPhotos });

    // Adjust current index if needed
    if (currentPhotoIndex >= updatedPhotos.length && updatedPhotos.length > 0) {
      setCurrentPhotoIndex(updatedPhotos.length - 1);
    } else if (updatedPhotos.length === 0) {
      setCurrentPhotoIndex(0);
    }
  };

  // Navigate photos
  const goToPrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Handle continue (skip or complete)
  const handleContinue = () => {
    if (formData.videoCV) {
      awardPoints(50, 'Video CV added');
      triggerCelebration('confetti-burst');
    }
    if (photos.length >= MIN_PHOTOS) {
      awardPoints(30, 'Profile photos added');
    }
    nextStep();
  };

  // Render prompt mode
  const renderPrompt = () => (
    <div className="space-y-4">
      <div className="aspect-video max-w-[320px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-4">
        <Video className="w-12 h-12 text-gray-500 mb-3" />
        <p className="text-gray-400 text-sm text-center mb-2">
          Record a short video introducing yourself
        </p>
        <p className="text-gray-500 text-xs text-center">
          Up to {MAX_DURATION} seconds
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={startRecording}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Camera className="w-4 h-4 mr-2" />
          Record
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="border-white/30 text-white hover:bg-white/10"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <h4 className="text-white text-sm font-medium mb-2">Video Tips</h4>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>• Introduce yourself and your experience</li>
          <li>• Speak clearly in English or Arabic</li>
          <li>• Show your friendly personality</li>
          <li>• Good lighting and quiet environment</li>
        </ul>
      </div>
    </div>
  );

  // Render recording mode
  const renderRecording = () => (
    <div className="space-y-4">
      <div className="relative aspect-video max-w-[320px] mx-auto rounded-xl overflow-hidden border-2 border-red-500 bg-black">
        {/* Video element - always rendered */}
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
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <Loader2 className="w-10 h-10 text-red-400 animate-spin mb-3" />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        )}

        {/* Recording indicator */}
        {!isInitializing && (
          <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-red-500/90 rounded-full z-20">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-medium">REC</span>
          </div>
        )}

        {/* Timer */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-full z-20">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-mono">
            {formatTime(recordingTime)} / {formatTime(MAX_DURATION)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${(recordingTime / MAX_DURATION) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={cancelRecording}
          className="border-white/30 text-white hover:bg-white/10"
          disabled={isInitializing}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          onClick={stopRecording}
          className="bg-red-500 hover:bg-red-600"
          disabled={isInitializing}
        >
          <Pause className="w-4 h-4 mr-1" />
          Stop Recording
        </Button>
      </div>
    </div>
  );

  // Render preview mode
  const renderPreview = () => (
    <div className="space-y-4">
      <div className="relative aspect-video max-w-[320px] mx-auto rounded-xl overflow-hidden border-2 border-green-500 bg-gray-900">
        <video
          src={formData.videoCV?.url}
          controls
          className="w-full h-full object-cover"
        />

        {/* Success badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/90 rounded-full">
          <Check className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">Ready</span>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-full">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-white text-xs">
            {formatTime(formData.videoCV?.duration || 0)}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={deleteVideo}
          className="border-white/30 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Retake
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg justify-center"
      >
        <Check className="w-5 h-5 text-green-400" />
        <span className="text-green-400 text-sm">
          Video CV recorded successfully!
        </span>
      </motion.div>
    </div>
  );

  // Render photos tab
  const renderPhotosTab = () => (
    <div className="space-y-4">
      {/* Photo slideshow preview */}
      {photos.length > 0 && (
        <div className="relative aspect-[4/3] max-w-[320px] mx-auto rounded-xl overflow-hidden border-2 border-purple-500/50 bg-gray-900">
          <AnimatePresence mode="wait">
            <motion.img
              key={photos[currentPhotoIndex]?.id}
              src={photos[currentPhotoIndex]?.url}
              alt={`Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Photo counter */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-full text-white text-xs">
            {currentPhotoIndex + 1} / {photos.length}
          </div>

          {/* Delete button */}
          <button
            onClick={() => deletePhoto(photos[currentPhotoIndex]?.id)}
            className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentPhotoIndex(index)}
              className={cn(
                'w-12 h-12 rounded-lg overflow-hidden border-2 transition-all',
                index === currentPhotoIndex
                  ? 'border-purple-500 scale-110'
                  : 'border-white/20 hover:border-white/40'
              )}
            >
              <img
                src={photo.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => photos.length < MAX_PHOTOS && photoInputRef.current?.click()}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all',
          photos.length >= MAX_PHOTOS
            ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
            : 'border-white/20 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
        )}
      >
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={photos.length >= MAX_PHOTOS}
        />

        {isUploadingPhoto ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
            <p className="text-gray-300 text-sm">Uploading...</p>
          </div>
        ) : photos.length >= MAX_PHOTOS ? (
          <div className="flex flex-col items-center py-4">
            <Check className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-green-400 text-sm font-medium">Maximum photos reached</p>
            <p className="text-gray-500 text-xs mt-1">{MAX_PHOTOS} photos uploaded</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
              <Plus className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-gray-300 text-sm font-medium">
              {photos.length === 0 ? 'Add Profile Photos' : 'Add More Photos'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {photos.length} / {MAX_PHOTOS} photos
              {photos.length < MIN_PHOTOS && (
                <span className="text-yellow-500"> (min {MIN_PHOTOS} recommended)</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Photo error */}
      {photoError && (
        <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
          <AlertCircle className="w-4 h-4" />
          {photoError}
        </div>
      )}

      {/* Photo tips */}
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <h4 className="text-white text-sm font-medium mb-2">Photo Tips</h4>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>• Clear, well-lit photos</li>
          <li>• Show your face clearly in at least one photo</li>
          <li>• Professional appearance recommended</li>
          <li>• Photos will appear as a slideshow on your profile</li>
        </ul>
      </div>

      {/* Photo progress indicator */}
      {photos.length > 0 && photos.length < MIN_PHOTOS && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg justify-center"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 text-sm">
            Add {MIN_PHOTOS - photos.length} more photo{MIN_PHOTOS - photos.length !== 1 ? 's' : ''} for best results
          </span>
        </motion.div>
      )}

      {photos.length >= MIN_PHOTOS && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg justify-center"
        >
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-green-400 text-sm">
            Great! {photos.length} photos added
          </span>
        </motion.div>
      )}
    </div>
  );

  // Check if user has added media content
  const hasVideoOrPhotos = formData.videoCV || photos.length > 0;

  // Render video tab content
  const renderVideoTab = () => {
    if (mode === 'prompt') return renderPrompt();
    if (mode === 'recording') return renderRecording();
    if (mode === 'preview') return renderPreview();
    return null;
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Media Gallery"
        description="Add video intro and profile photos"
        icon={activeTab === 'video' ? Video : Image}
        showHeader={true}
      >
        <div className="flex items-center justify-end mb-2">
          <OptionalBadge />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('video')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all',
              activeTab === 'video'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            )}
          >
            <Video className="w-4 h-4" />
            Video CV
            {formData.videoCV && (
              <Check className="w-4 h-4 text-green-300" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all',
              activeTab === 'photos'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            )}
          >
            <Image className="w-4 h-4" />
            Photos
            {photos.length > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                photos.length >= MIN_PHOTOS ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'
              )}>
                {photos.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'video' ? (
              <motion.div
                key="video-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {renderVideoTab()}
              </motion.div>
            ) : (
              <motion.div
                key="photos-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderPhotosTab()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <StepTip>
          Profiles with video and photos get 3x more interest from families!
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        nextLabel={hasVideoOrPhotos ? 'Continue' : 'Skip for Now'}
      />

      {/* Skip hint */}
      {!hasVideoOrPhotos && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 text-xs flex items-center justify-center gap-1"
        >
          <SkipForward className="w-3 h-3" />
          You can add video and photos later from your dashboard
        </motion.p>
      )}
    </div>
  );
};

export default MaidVideoCVStep;
