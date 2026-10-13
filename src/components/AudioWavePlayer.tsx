'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

interface AudioWavePlayerProps {
  audioUrl: string;
  title: string;
  subjectTitle?: string;
}

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];
  return null;
}

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
}: AudioWavePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveContainerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [useDriveIframe, setUseDriveIframe] = useState(false);
  const [waveTick, setWaveTick] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const driveId = useMemo(() => extractGoogleDriveId(audioUrl), [audioUrl]);

  // Resolve effective stream URL (use our Range-capable proxy if Google Drive URL)
  const effectiveAudioSrc = useMemo(() => {
    if (!audioUrl) return '';
    if (driveId) {
      return `/api/audio-stream?id=${encodeURIComponent(driveId)}`;
    }
    return audioUrl;
  }, [audioUrl, driveId]);

  // Animate sound wave bars smoothly while playing
  useEffect(() => {
    if (!isPlaying && !useDriveIframe) return;
    const interval = setInterval(() => {
      setWaveTick((prev) => (prev + 1) % 1000);
    }, 90);
    return () => clearInterval(interval);
  }, [isPlaying, useDriveIframe]);

  // Reset states when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setUseDriveIframe(false);
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (audioEl) {
        audioEl.pause();
      }
    };
  }, []);

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
  };

  const handleWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveContainerRef.current || !duration || !isFinite(duration)) return;
    const rect = waveContainerRef.current.getBoundingClientRect();
    // In RTL or LTR, calculate click position along the waveform bar container (LTR inside waveform)
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
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
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

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white p-5 sm:p-7 border border-teal-500/30 shadow-2xl space-y-5 overflow-hidden relative">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Hidden HTML5 Audio Element */}
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
            setCurrentTime(e.currentTarget.currentTime);
            if (
              (!duration || !isFinite(duration)) &&
              e.currentTarget.duration &&
              isFinite(e.currentTarget.duration)
            ) {
              setDuration(e.currentTarget.duration);
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            setIsLoadingAudio(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
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

        {/* Mode / Speed Quick Pill */}
        <div className="flex items-center gap-2">
          {!useDriveIframe && (
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-black transition flex items-center gap-1.5 shadow-sm"
              title="تغيير سرعة الصوت"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span dir="ltr">{playbackRate}x</span>
            </button>
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

      {/* Google Drive Embedded Player (if Drive iframe mode is active) */}
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
                }
              }}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <span className="w-12 text-right text-slate-400">
              {formatTime(duration)}
            </span>
          </div>

          {/* Main Playback Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
              </button>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {isPlaying ? 'الموجة الصوتية نشطة 🌊' : 'اضغط تشغيل للاستماع للريكورد'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Rewind 10s */}
              <button
                type="button"
                onClick={() => skipSeconds(-10)}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1 text-xs font-bold"
                title="إرجاع 10 ثواني"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[10px]">-10s</span>
              </button>

              {/* Big Play / Pause Button */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-14 h-14 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-teal-500/30 active:scale-95 transition"
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
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1 text-xs font-bold"
                title="تقديم 10 ثواني"
              >
                <span className="text-[10px]">+10s</span>
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cycleSpeed}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-slate-700 transition"
              >
                السرعة: {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
