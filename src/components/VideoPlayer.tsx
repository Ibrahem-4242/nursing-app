'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Sparkles,
  ShieldCheck,
  Check,
  PictureInPicture2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import StudentActivityTracker from '@/components/StudentActivityTracker';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  subjectTitle?: string;
  lectureId?: string;
  duration?: string;
  onEnded?: () => void;
  className?: string;
}

export default function VideoPlayer({
  videoUrl,
  title,
  subjectTitle,
  lectureId,
  duration,
  onEnded,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { student } = useStudentAuth();

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [resumeNotice, setResumeNotice] = useState<number | null>(null);

  // Moving watermark coordinates for protection
  const [watermarkPos, setWatermarkPos] = useState({ top: 15, left: 15 });

  const storageKey = `nursing_video_resume_${lectureId || videoUrl.slice(-20)}`;

  // Format time helper (hh:mm:ss or mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Convert raw URL to proxied streaming URL if needed
  const streamSrc = React.useMemo(() => {
    if (!videoUrl) return '';
    if (videoUrl.startsWith('/api/video-stream')) {
      return lectureId ? `${videoUrl}&lectureId=${encodeURIComponent(lectureId)}` : videoUrl;
    }
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return `/api/video-stream?url=${encodeURIComponent(videoUrl)}${
        lectureId ? `&lectureId=${encodeURIComponent(lectureId)}` : ''
      }`;
    }
    if (videoUrl.startsWith('/api/files/')) {
      const fileId = videoUrl.replace('/api/files/', '');
      return `/api/video-stream?fileId=${encodeURIComponent(fileId)}${
        lectureId ? `&lectureId=${encodeURIComponent(lectureId)}` : ''
      }`;
    }
    return videoUrl;
  }, [videoUrl, lectureId]);

  // Handle Controls Timeout
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  // 1. Check for Resume Timestamp in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const time = parseFloat(saved);
        if (time > 10) {
          setResumeNotice(time);
        }
      }
    } catch {}
  }, [storageKey]);

  // 2. Panic Mode / Emergency Camouflage auto-stop listener
  useEffect(() => {
    const handlePanic = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.src = '';
      }
      setIsPlaying(false);
    };

    window.addEventListener('storage', (e) => {
      if (e.key === 'nursing_panic_mode' && e.newValue === 'true') {
        handlePanic();
      }
    });

    window.addEventListener('nursing-panic-mode-activated', handlePanic);

    return () => {
      window.removeEventListener('nursing-panic-mode-activated', handlePanic);
    };
  }, []);

  // 3. Move subtle watermark periodically to prevent video recording scraping
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 70) + 10,
        left: Math.floor(Math.random() * 70) + 10,
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // 4. Save resume position every 3s
  useEffect(() => {
    if (!isPlaying || currentTime <= 0) return;
    const interval = setInterval(() => {
      try {
        if (totalDuration > 0 && currentTime < totalDuration - 15) {
          localStorage.setItem(storageKey, String(Math.floor(currentTime)));
        } else if (currentTime >= totalDuration - 15) {
          localStorage.removeItem(storageKey);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, totalDuration, storageKey]);

  // Video Event Handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setTotalDuration(dur);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Calculate buffered progress
      const buffered = videoRef.current.buffered;
      if (buffered.length > 0 && videoRef.current.duration > 0) {
        const loadedEnd = buffered.end(buffered.length - 1);
        const percent = (loadedEnd / videoRef.current.duration) * 100;
        setBufferedPercent(Math.min(percent, 100));
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    resetControlsTimeout();
  };

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(newTime, totalDuration));
    setCurrentTime(videoRef.current.currentTime);
    resetControlsTimeout();
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const newTime = (percent / 100) * totalDuration;
    handleSeek(newTime);
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    handleSeek(videoRef.current.currentTime + seconds);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.7;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP not supported or rejected:', err);
    }
  };

  const resumeSavedTime = () => {
    if (resumeNotice && videoRef.current) {
      handleSeek(resumeNotice);
      setResumeNotice(null);
      if (!isPlaying) togglePlay();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyF', 'KeyM'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'Space' || e.code === 'KeyK') {
      togglePlay();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
      handleSkip(10);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
      handleSkip(-10);
    } else if (e.code === 'ArrowUp') {
      const v = Math.min(1, volume + 0.1);
      setVolume(v);
      if (videoRef.current) videoRef.current.volume = v;
    } else if (e.code === 'ArrowDown') {
      const v = Math.max(0, volume - 0.1);
      setVolume(v);
      if (videoRef.current) videoRef.current.volume = v;
    } else if (e.code === 'KeyF') {
      toggleFullscreen();
    } else if (e.code === 'KeyM') {
      toggleMute();
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 select-none shadow-2xl border border-slate-800 group focus:outline-none ${className}`}
      dir="ltr"
    >
      {/* ⏱️ Video Playback Dwell Time & Progress Tracker */}
      <StudentActivityTracker
        key={`video-tracker-${lectureId || videoUrl.slice(-15)}`}
        targetType="video"
        targetId={lectureId || videoUrl.slice(-20)}
        targetTitle={title}
        subjectTitle={subjectTitle}
        resourceTitle={`فيديو: ${title}`}
        active={isPlaying}
        details={{
          videoCurrentTime: Math.floor(currentTime),
          videoDuration: Math.floor(totalDuration),
          videoProgressPercent: Math.round(progressPercent),
          speed: playbackSpeed,
        }}
      />
      {/* 1. Main HTML5 Video Element */}
      <video
        ref={videoRef}
        src={streamSrc}
        playsInline
        preload="metadata"
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* 2. Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
            <span className="text-xs font-bold text-white tracking-wide">جاري تحميل البث التدفقي...</span>
          </div>
        </div>
      )}

      {/* 3. Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 space-y-3 z-30">
          <AlertCircle className="w-12 h-12 text-rose-500 animate-pulse" />
          <h4 className="text-base font-bold text-white">تعذر تشغيل مسار الفيديو</h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed" dir="rtl">
            تأكد من اتصالك بالإنترنت، أو أن صلاحية المحاضرة مفعلة بحسابك. إذا استمرت المشكلة أبلغ إدارة المنصة.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-lg shadow-teal-600/30"
          >
            إعادة المحاولة 🔄
          </button>
        </div>
      )}

      {/* 4. Center Play/Pause Overlay Button when paused */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-teal-500/90 hover:bg-teal-400 text-white flex items-center justify-center shadow-2xl shadow-teal-500/40 backdrop-blur-sm transition-all transform hover:scale-110 active:scale-95 z-20"
          aria-label="تشغيل الفيديو"
        >
          <Play className="w-9 h-9 fill-current ml-1" />
        </button>
      )}

      {/* 5. Resume Playback Toast */}
      {resumeNotice && (
        <div
          dir="rtl"
          className="absolute top-4 right-4 z-30 bg-slate-900/90 border border-teal-500/50 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>توقفت سابقاً عند الدقيقة <strong>{formatTime(resumeNotice)}</strong></span>
          <button
            type="button"
            onClick={resumeSavedTime}
            className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[11px] transition"
          >
            استئناف ⏩
          </button>
          <button
            type="button"
            onClick={() => setResumeNotice(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            تخطي
          </button>
        </div>
      )}

      {/* 6. Subtle Floating Anti-Recording Student Watermark */}
      {student && (
        <div
          style={{ top: `${watermarkPos.top}%`, left: `${watermarkPos.left}%` }}
          className="absolute z-10 pointer-events-none transition-all duration-1000 ease-in-out opacity-20 hover:opacity-40"
        >
          <span className="text-[11px] font-mono text-white/80 bg-black/40 px-2 py-0.5 rounded-md border border-white/10 whitespace-nowrap">
            {student.name} • {student.phone}
          </span>
        </div>
      )}

      {/* 7. Top Bar (Title & Lecture Subject) */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        dir="rtl"
      >
        <div className="flex items-center gap-2 text-white">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <div>
            <h4 className="text-xs sm:text-sm font-black line-clamp-1">{title}</h4>
            {subjectTitle && (
              <span className="text-[10px] text-teal-300 font-semibold">{subjectTitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-white/10 text-[10px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>بث محمي وموثق</span>
        </div>
      </div>

      {/* 8. Bottom Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber / Progress Bar */}
        <div className="relative w-full h-2 group/scrubber cursor-pointer flex items-center">
          {/* Buffer Progress */}
          <div
            style={{ width: `${bufferedPercent}%` }}
            className="absolute h-1.5 rounded-full bg-white/20 transition-all duration-200 pointer-events-none"
          />
          {/* Played Progress */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="absolute h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 pointer-events-none"
          />
          {/* Native Range Scrubber */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progressPercent || 0}
            onChange={handleScrubberChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="شريط تمرير الفيديو"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs gap-2 pt-1">
          {/* Left Controls: Play, Skip, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-white/15 transition text-white"
              title={isPlaying ? 'إيقاف مؤقت (Space)' : 'تشغيل (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="p-1.5 rounded-xl hover:bg-white/15 transition text-slate-300 hover:text-white"
              title="ترجيع 10 ثواني (ArrowLeft)"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="p-1.5 rounded-xl hover:bg-white/15 transition text-slate-300 hover:text-white"
              title="تقديم 10 ثواني (ArrowRight)"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-xl hover:bg-white/15 transition text-slate-300 hover:text-white"
                title={isMuted ? 'إلغاء الكتم (M)' : 'كتم الصوت (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-400 hidden sm:block"
                aria-label="مستوى الصوت"
              />
            </div>

            {/* Time Indicator */}
            <div className="text-[11px] sm:text-xs font-mono text-slate-300 ml-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span>{formatTime(totalDuration || (duration ? 0 : 0))}</span>
            </div>
          </div>

          {/* Right Controls: Speed, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 transition text-[11px] font-bold flex items-center gap-1"
                title="سرعة التشغيل"
              >
                <span>{playbackSpeed}x</span>
                <Settings className="w-3 h-3 text-slate-400" />
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-28 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-0.5 z-30">
                  <span className="text-[10px] text-slate-400 font-bold px-2 py-1 block border-b border-slate-800">
                    سرعة التشغيل
                  </span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSpeedChange(spd)}
                      className={`w-full px-2 py-1 rounded-lg text-xs font-bold text-left flex items-center justify-between transition ${
                        playbackSpeed === spd
                          ? 'bg-teal-500 text-slate-950 font-black'
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{spd}x</span>
                      {playbackSpeed === spd && <Check className="w-3 h-3 text-slate-950" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              type="button"
              onClick={togglePiP}
              className="p-1.5 rounded-xl hover:bg-white/15 transition text-slate-300 hover:text-white hidden sm:block"
              title="نافذة منبثقة (Picture-in-Picture)"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-white/15 transition text-white"
              title={isFullscreen ? 'تصغير الشاشة (F)' : 'ملء الشاشة (F)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
