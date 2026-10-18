'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Headphones,
  Sparkles,
  ExternalLink,
  Gauge,
  Radio,
  X,
  ChevronUp,
} from 'lucide-react';

export interface AudioWavePlayerProps {
  audioUrl: string;
  title: string;
  subjectTitle?: string;
  audioId?: string;
  lectureId?: string;
  isActiveTab?: boolean;
  onOpenFullPlayer?: () => void;
  className?: string;
}

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];
  return null;
}

interface AudioPositionRecord {
  currentTime: number;
  duration: number;
  timestamp: number;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2] as const;

const BASE_WAVE_PATTERN = [
  28, 45, 62, 38, 75, 90, 54, 82, 40, 68,
  95, 60, 48, 85, 72, 35, 64, 88, 52, 96,
  70, 42, 78, 92, 58, 84, 46, 74, 60, 86,
  50, 76, 94, 62, 44, 80, 66, 52, 70, 36,
];

export default function AudioWavePlayer({
  audioUrl,
  title,
  subjectTitle,
  audioId,
  lectureId,
  isActiveTab = true,
  onOpenFullPlayer,
  className = '',
}: AudioWavePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveContainerRef = useRef<HTMLDivElement | null>(null);
  const fullPlayerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [useDriveIframe, setUseDriveIframe] = useState(false);
  const [waveTick, setWaveTick] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Position memory state
  const [savedPosition, setSavedPosition] = useState<AudioPositionRecord | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [isDismissedMini, setIsDismissedMini] = useState(false);
  const [isOffScreen, setIsOffScreen] = useState(false);

  const driveId = useMemo(() => extractGoogleDriveId(audioUrl), [audioUrl]);

  // Unique key for localStorage
  const effectiveAudioId = useMemo(() => {
    if (audioId) return audioId;
    if (lectureId) return `lec-${lectureId}`;
    if (driveId) return driveId;
    return encodeURIComponent(audioUrl).replace(/[^a-zA-Z0-9_-]/g, '_').slice(-36);
  }, [audioId, lectureId, driveId, audioUrl]);

  const storageKey = `nursing_audio_pos_${effectiveAudioId}`;
  const lastSavedTimeRef = useRef<number>(0);

  // Resolve effective stream URL
  const effectiveAudioSrc = useMemo(() => {
    if (!audioUrl) return '';
    if (driveId) {
      return `/api/audio-stream?id=${encodeURIComponent(driveId)}`;
    }
    return audioUrl;
  }, [audioUrl, driveId]);

  // Load preferred playback speed from localStorage
  useEffect(() => {
    try {
      const storedSpeed = localStorage.getItem('nursing_audio_preferred_speed');
      if (storedSpeed) {
        const parsed = parseFloat(storedSpeed);
        if (SPEED_OPTIONS.includes(parsed as any)) {
          setPlaybackRate(parsed);
          if (audioRef.current) {
            audioRef.current.playbackRate = parsed;
          }
        }
      }
    } catch {}
  }, []);

  // 1. Check for previously saved position in localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: AudioPositionRecord = JSON.parse(raw);
        if (parsed.currentTime && parsed.currentTime > 5) {
          setSavedPosition(parsed);
          setShowResumeBanner(true);
        }
      }
    } catch {}
  }, [storageKey]);

  // 2. Animate sound wave bars smoothly while playing
  useEffect(() => {
    if (!isPlaying && !useDriveIframe) return;
    const interval = setInterval(() => {
      setWaveTick((prev) => (prev + 1) % 1000);
    }, 90);
    return () => clearInterval(interval);
  }, [isPlaying, useDriveIframe]);

  // 3. Track when the full player scrolls off-screen using IntersectionObserver
  useEffect(() => {
    if (!fullPlayerRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOffScreen(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(fullPlayerRef.current);
    return () => observer.disconnect();
  }, [isActiveTab]);

  // Helper to save position safely
  const saveCurrentPosition = useCallback(
    (time: number, dur: number) => {
      if (!storageKey || typeof window === 'undefined') return;
      if (!time || time < 3) return;

      // If near the end (within 5 seconds), clear memory
      if (dur && isFinite(dur) && time >= dur - 5) {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
        return;
      }

      try {
        const record: AudioPositionRecord = {
          currentTime: Math.floor(time),
          duration: dur && isFinite(dur) ? Math.floor(dur) : 0,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(record));
        lastSavedTimeRef.current = time;
      } catch {}
    },
    [storageKey]
  );

  // Reset states when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setUseDriveIframe(false);
    setIsDismissedMini(false);
  }, [audioUrl]);

  // Cleanup & save on unmount
  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (audioEl) {
        if (audioEl.currentTime > 3) {
          saveCurrentPosition(audioEl.currentTime, audioEl.duration);
        }
        audioEl.pause();
      }
    };
  }, [saveCurrentPosition]);

  const togglePlay = async () => {
    if (useDriveIframe) {
      setIsPlaying((prev) => !prev);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        saveCurrentPosition(audio.currentTime, duration);
      } else {
        setIsLoadingAudio(true);
        audio.playbackRate = playbackRate;
        await audio.play();
        setIsPlaying(true);
        setIsLoadingAudio(false);
      }
    } catch (err) {
      console.warn('[AudioWavePlayer] Play fallback:', err);
      setIsLoadingAudio(false);
      if (driveId) {
        setUseDriveIframe(true);
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (percent: number) => {
    const audio = audioRef.current;
    if (!audio || !duration || !isFinite(duration)) return;
    const clamped = Math.max(0, Math.min(1, percent));
    const newTime = clamped * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    saveCurrentPosition(newTime, duration);
  };

  const handleWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveContainerRef.current || !duration || !isFinite(duration)) return;
    const rect = waveContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    handleSeek(percent);
  };

  const skipSeconds = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const maxDur = duration && isFinite(duration) ? duration : audio.currentTime + 3600;
    const nextTime = Math.max(0, Math.min(maxDur, audio.currentTime + delta));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    saveCurrentPosition(nextTime, duration);
  };

  const handleSetSpeed = (newSpeed: number) => {
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    try {
      localStorage.setItem('nursing_audio_preferred_speed', String(newSpeed));
    } catch {}
  };

  const cycleSpeed = () => {
    const nextIdx = (SPEED_OPTIONS.indexOf(playbackRate as any) + 1) % SPEED_OPTIONS.length;
    const nextSpeed = SPEED_OPTIONS[nextIdx];
    handleSetSpeed(nextSpeed);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleResumePlayback = async () => {
    if (!savedPosition || !audioRef.current) return;
    const target = savedPosition.currentTime;
    audioRef.current.currentTime = target;
    setCurrentTime(target);
    setShowResumeBanner(false);

    try {
      setIsLoadingAudio(true);
      audioRef.current.playbackRate = playbackRate;
      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoadingAudio(false);
    } catch (err) {
      console.warn('[AudioWavePlayer] Resume error:', err);
      setIsLoadingAudio(false);
    }
  };

  const handleDismissResume = () => {
    setShowResumeBanner(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec) || sec < 0) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent =
    duration && isFinite(duration) && duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  // Determine whether to show the sticky floating mini bar
  // Shows when audio is playing or active, AND either activeTab !== audio OR full player is scrolled off-screen
  const shouldShowFloatingBar =
    !isDismissedMini &&
    (isPlaying || currentTime > 0) &&
    (!isActiveTab || isOffScreen);

  return (
    <>
      {/* Hidden / Shared HTML5 Audio Element (Always kept alive for smooth continuous background playback) */}
      {!useDriveIframe && effectiveAudioSrc && (
        <audio
          ref={audioRef}
          src={effectiveAudioSrc}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration;
            if (dur && isFinite(dur)) setDuration(dur);
          }}
          onDurationChange={(e) => {
            const dur = e.currentTarget.duration;
            if (dur && isFinite(dur)) setDuration(dur);
          }}
          onTimeUpdate={(e) => {
            const cur = e.currentTarget.currentTime;
            setCurrentTime(cur);
            const dur = e.currentTarget.duration;
            if ((!duration || !isFinite(duration)) && dur && isFinite(dur)) {
              setDuration(dur);
            }
            // Auto-save every 3 seconds
            if (Math.abs(cur - lastSavedTimeRef.current) >= 3) {
              saveCurrentPosition(cur, dur || duration);
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            setIsLoadingAudio(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            if (audioRef.current) {
              saveCurrentPosition(audioRef.current.currentTime, duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
            try {
              localStorage.removeItem(storageKey);
            } catch {}
          }}
          onError={() => {
            setIsLoadingAudio(false);
            setIsPlaying(false);
            if (driveId) {
              setUseDriveIframe(true);
            }
          }}
        />
      )}

      {/* 1. FULL WAVEFORM PLAYER (Rendered in Tab or In-Place) */}
      <div
        ref={fullPlayerRef}
        className={`${isActiveTab ? 'block' : 'hidden'} ${className}`}
        dir="rtl"
      >
        <div className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white p-5 sm:p-7 border border-teal-500/30 shadow-2xl space-y-5 overflow-hidden relative">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* 🌟 RESUME PLAYBACK POSITION BANNER */}
          {showResumeBanner && savedPosition && (
            <div className="relative z-20 p-4 rounded-2xl bg-gradient-to-r from-teal-950/90 via-slate-900/90 to-teal-950/90 border border-teal-400/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 text-right w-full sm:w-auto">
                <span className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex-shrink-0">
                  <Headphones className="w-5 h-5 text-teal-400 animate-pulse" />
                </span>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-teal-100 flex items-center gap-1.5">
                    <span>🎧 استئناف الاستماع من حيث توقفت (الدقيقة {formatTime(savedPosition.currentTime)})؟</span>
                  </h5>
                  <p className="text-[11px] text-teal-300/80 mt-0.5">
                    تم حفظ ثانية توقفك السابقة تلقائياً للمراجعة السريعة بدون إضاعة وقتك
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={handleResumePlayback}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>استئناف التشغيل الآن</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismissResume}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                  title="البدء من الدقيقة 00:00"
                >
                  البدء من البداية
                </button>
              </div>
            </div>
          )}

          {/* Top Header: Live Status & Track Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                  isPlaying
                    ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/20 scale-105'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <Headphones className={`w-6 h-6 ${isPlaying ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1">
                    <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'animate-ping text-emerald-400' : ''}`} />
                    <span>المشغل الصوتي الذكي للمحاضرة</span>
                  </span>
                  {isPlaying && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                      يعمل الآن 🎵
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-black text-white mt-0.5 line-clamp-1">
                  {title}
                </h4>
                {subjectTitle && (
                  <p className="text-[11px] text-slate-400">{subjectTitle}</p>
                )}
              </div>
            </div>

            {/* Quick Speed Switcher & Drive Mode */}
            <div className="flex items-center gap-2">
              {!useDriveIframe && (
                <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-teal-400" />
                    <span>السرعة:</span>
                  </span>
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSetSpeed(spd)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        playbackRate === spd
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              )}

              {driveId && (
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlaying(false);
                    setUseDriveIframe((prev) => !prev);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-[11px] font-bold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{useDriveIframe ? 'المشغل الموجي التفاعلي' : 'مشغل Drive المدمج'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Animated Moving Sound Wave Visualizer */}
          <div
            ref={waveContainerRef}
            onClick={handleWaveClick}
            dir="ltr"
            className="relative z-10 h-24 sm:h-28 px-3 sm:px-5 py-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-1 sm:gap-1.5 cursor-pointer select-none group overflow-hidden"
            title="اضغط في أي مكان على الموجة الصوتية لتقديم أو تأخير التسجيل"
          >
            {BASE_WAVE_PATTERN.map((baseHeight, idx) => {
              const barPercent = ((idx + 0.5) / BASE_WAVE_PATTERN.length) * 100;
              const isPassed = barPercent <= progressPercent;

              // Calculate animated wave height when playing
              let dynamicHeight = baseHeight;
              if (isPlaying) {
                const phase = (waveTick * 0.45 + idx * 0.65) % (Math.PI * 2);
                const secondary = Math.cos(waveTick * 0.25 - idx * 0.4);
                const modulation = Math.sin(phase) * 28 + secondary * 14;
                dynamicHeight = Math.max(14, Math.min(98, baseHeight + modulation));
              } else {
                dynamicHeight = Math.max(16, Math.round(baseHeight * 0.55));
              }

              return (
                <div
                  key={idx}
                  style={{ height: `${dynamicHeight}%` }}
                  className={`flex-1 min-w-[3px] max-w-[8px] rounded-full transition-all duration-100 ${
                    isPlaying
                      ? isPassed
                        ? 'bg-gradient-to-t from-teal-500 via-emerald-400 to-cyan-300 shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                        : 'bg-gradient-to-t from-teal-700/70 via-teal-500/50 to-emerald-400/50'
                      : isPassed
                      ? 'bg-teal-400'
                      : 'bg-slate-700/70 group-hover:bg-slate-600'
                  }`}
                />
              );
            })}
          </div>

          {/* Google Drive Embedded Player Fallback */}
          {useDriveIframe && driveId ? (
            <div className="space-y-3 relative z-10">
              <div className="rounded-2xl overflow-hidden border border-teal-500/30 bg-slate-900 shadow-inner">
                <iframe
                  src={`https://drive.google.com/file/d/${driveId}/preview`}
                  className="w-full h-24 sm:h-28 border-0"
                  allow="autoplay"
                  title={title}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>💡 اضغط زر التشغيل داخل مشغل Google Drive أعلاه للاستماع الفوري</span>
                <a
                  href={audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>فتح في نافذة مستقلة</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            /* Interactive Controls Bar */
            <div className="space-y-3 relative z-10">
              {/* Timeline Range Scrubber & Timestamps */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-300" dir="ltr">
                <span className="w-12 text-left text-teal-300 font-bold">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration && isFinite(duration) ? duration : 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (audioRef.current && duration && isFinite(duration)) {
                      audioRef.current.currentTime = val;
                      setCurrentTime(val);
                      saveCurrentPosition(val, duration);
                    }
                  }}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <span className="w-12 text-right text-slate-400">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Main Playback Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
                  </button>
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    {isPlaying ? 'جاري التشغيل في الخلفية أثناء التصفح 🌊' : 'اضغط تشغيل للاستماع للملخص'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Rewind 10s */}
                  <button
                    type="button"
                    onClick={() => skipSeconds(-10)}
                    className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-bold border border-slate-700/80 active:scale-95 cursor-pointer"
                    title="ترجيع 10 ثوانٍ للخلف"
                  >
                    <RotateCcw className="w-4 h-4 text-teal-400" />
                    <span className="font-mono text-[11px]">-10s</span>
                  </button>

                  {/* Big Play / Pause Button */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-teal-500/30 active:scale-95 transition cursor-pointer"
                    title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التسجيل الصوتي'}
                  >
                    {isLoadingAudio ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Forward 10s */}
                  <button
                    type="button"
                    onClick={() => skipSeconds(10)}
                    className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-bold border border-slate-700/80 active:scale-95 cursor-pointer"
                    title="تقديم 10 ثوانٍ للأمام"
                  >
                    <span className="font-mono text-[11px]">+10s</span>
                    <RotateCw className="w-4 h-4 text-teal-400" />
                  </button>
                </div>

                {/* Mobile Speed Pills */}
                <div className="flex sm:hidden items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-slate-800">
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSetSpeed(spd)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        playbackRate === spd
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cycleSpeed}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-slate-700 transition cursor-pointer"
                    title="السرعة الحالية"
                  >
                    السرعة: {playbackRate}x
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. STICKY FLOATING MINI-PLAYER (Plays continuously in background while browsing lecture/notes) */}
      {shouldShowFloatingBar && (
        <div
          dir="rtl"
          className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-3xl mx-auto z-50 p-3 sm:p-3.5 rounded-2xl bg-slate-950/95 text-white border-2 border-teal-500/50 shadow-2xl shadow-teal-950/80 backdrop-blur-md animate-in slide-in-from-bottom-3 flex items-center justify-between gap-3"
        >
          {/* Left/Start: Track Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isPlaying
                  ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Headphones className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-teal-400">
                  {isPlaying ? 'يعمل في الخلفية 🎧' : 'متوقف مؤقتاً ⏸️'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                  ({formatTime(currentTime)} / {formatTime(duration)})
                </span>
              </div>
              <h5 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                {title}
              </h5>
            </div>
          </div>

          {/* Middle: Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Rewind 10s */}
            <button
              type="button"
              onClick={() => skipSeconds(-10)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs cursor-pointer"
              title="ترجيع 10 ثوانٍ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center justify-center shadow-md shadow-teal-500/30 active:scale-95 transition cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              onClick={() => skipSeconds(10)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs cursor-pointer"
              title="تقديم 10 ثوانٍ"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Button */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-emerald-300 transition cursor-pointer"
              title="تغيير سرعة الصوت"
            >
              {playbackRate}x
            </button>
          </div>

          {/* Right/End: Full Player Action & Dismiss */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onOpenFullPlayer && (
              <button
                type="button"
                onClick={onOpenFullPlayer}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                title="فتح المشغل الكامل للمحاضرة"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>المشغل الكامل</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                setIsDismissedMini(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="إغلاق المشغل"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
