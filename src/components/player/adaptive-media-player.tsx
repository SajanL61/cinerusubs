'use client';

import type Hls from 'hls.js';
import { Captions, Expand, Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type TrackOption = { index: number; label: string };

const csrf = () => decodeURIComponent(document.cookie.split('; ').find((entry) => entry.startsWith('cinerusubs_csrf='))?.split('=').slice(1).join('=') || '');
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function AdaptiveMediaPlayer({ src, mimeType, poster, title, contentType, contentId, authenticated }: {
  src: string;
  mimeType: string;
  poster: string;
  title: string;
  contentType: 'movie' | 'episode';
  contentId: string;
  authenticated: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hls = useRef<Hls | null>(null);
  const lastSaved = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState(-1);
  const [qualities, setQualities] = useState<TrackOption[]>([]);
  const [audioTrack, setAudioTrack] = useState(0);
  const [audioTracks, setAudioTracks] = useState<TrackOption[]>([]);
  const [subtitleTrack, setSubtitleTrack] = useState(-1);
  const [subtitleTracks, setSubtitleTracks] = useState<TrackOption[]>([]);
  const [playerError, setPlayerError] = useState('');
  const isHls = /(?:mpegurl|\.m3u8(?:$|\?))/i.test(`${mimeType} ${src}`);

  const save = useCallback((force = false) => {
    const element = video.current;
    if (!authenticated || !element || (!force && Math.abs(element.currentTime - lastSaved.current) < 15)) return;
    lastSaved.current = element.currentTime;
    void fetch('/api/progress', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf() },
      body: JSON.stringify({ contentType, contentId, seconds: element.currentTime, duration: element.duration || 0, completed: element.duration > 0 && element.currentTime / element.duration > .92 }),
    });
  }, [authenticated, contentId, contentType]);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let disposed = false;
    setPlayerError('');
    setQualities([]);
    setAudioTracks([]);
    setSubtitleTracks([]);
    if (!isHls || element.canPlayType('application/vnd.apple.mpegurl')) {
      element.src = src;
      return () => { element.removeAttribute('src'); element.load(); };
    }
    void import('hls.js').then(({ default: HlsPlayer }) => {
      if (disposed) return;
      if (!HlsPlayer.isSupported()) {
        setPlayerError('Adaptive playback is not supported in this browser. Use the download options instead.');
        return;
      }
      const instance = new HlsPlayer({ enableWorker: true, startLevel: -1, capLevelToPlayerSize: true });
      hls.current = instance;
      instance.attachMedia(element);
      instance.on(HlsPlayer.Events.MEDIA_ATTACHED, () => instance.loadSource(src));
      const updateTracks = () => {
        setQualities(instance.levels.map((level, index) => ({ index, label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps` })));
        setAudioTracks(instance.audioTracks.map((track, index) => ({ index, label: track.name || track.lang || `Audio ${index + 1}` })));
        setSubtitleTracks(instance.subtitleTracks.map((track, index) => ({ index, label: track.name || track.lang || `Subtitles ${index + 1}` })));
      };
      instance.on(HlsPlayer.Events.MANIFEST_PARSED, updateTracks);
      instance.on(HlsPlayer.Events.AUDIO_TRACKS_UPDATED, updateTracks);
      instance.on(HlsPlayer.Events.SUBTITLE_TRACKS_UPDATED, updateTracks);
      instance.on(HlsPlayer.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === HlsPlayer.ErrorTypes.NETWORK_ERROR) instance.startLoad();
        else if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR) instance.recoverMediaError();
        else setPlayerError('The stream could not be played. Try another quality or use the download options.');
      });
    });
    return () => {
      disposed = true;
      hls.current?.destroy();
      hls.current = null;
      element.removeAttribute('src');
      element.load();
    };
  }, [isHls, src]);

  useEffect(() => {
    if (!authenticated) return;
    fetch(`/api/progress?contentType=${contentType}&contentId=${contentId}`).then((response) => response.ok ? response.json() : null).then((result) => {
      if (result?.progress && video.current) video.current.currentTime = result.progress.seconds;
    }).catch(() => undefined);
  }, [authenticated, contentId, contentType]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, select, textarea, button')) return;
      const element = video.current;
      if (!element) return;
      if (event.code === 'Space') { event.preventDefault(); if (element.paused) void element.play(); else element.pause(); }
      if (event.key === 'ArrowLeft') element.currentTime = Math.max(0, element.currentTime - 10);
      if (event.key === 'ArrowRight') element.currentTime = Math.min(element.duration || Infinity, element.currentTime + 10);
      if (event.key.toLocaleLowerCase() === 'm') { element.muted = !element.muted; setMuted(element.muted); }
      if (event.key.toLocaleLowerCase() === 'f') void container.current?.requestFullscreen();
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  const togglePlayback = () => playing ? video.current?.pause() : void video.current?.play();
  return <div className="cinema-player" ref={container}>
    <video ref={video} poster={poster} playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); save(true); }} onTimeUpdate={(event) => { setCurrent(event.currentTarget.currentTime); save(); }} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={() => save(true)} onVolumeChange={(event) => { setMuted(event.currentTarget.muted); setVolume(event.currentTarget.volume); }} />
    {playerError ? <div className="player-error" role="alert">{playerError}</div> : null}
    <button className="player-center" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlayback}>{playing ? <Pause /> : <Play />}</button>
    <div className="player-controls"><input aria-label="Playback position" type="range" min={0} max={duration || 0} step={.1} value={current} onChange={(event) => { if (video.current) video.current.currentTime = Number(event.target.value); setCurrent(Number(event.target.value)); }} /><div>
      <button aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlayback}>{playing ? <Pause /> : <Play />}</button>
      <button aria-label="Replay ten seconds" onClick={() => { if (video.current) video.current.currentTime = Math.max(0, video.current.currentTime - 10); }}><RotateCcw /></button>
      <button aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { if (video.current) { video.current.muted = !video.current.muted; setMuted(video.current.muted); } }}>{muted ? <VolumeX /> : <Volume2 />}</button>
      <input className="player-volume" aria-label="Volume" type="range" min={0} max={1} step={.05} value={muted ? 0 : volume} onChange={(event) => { const value = Number(event.target.value); if (video.current) { video.current.volume = value; video.current.muted = value === 0; } setVolume(value); setMuted(value === 0); }} />
      <span>{clock(current)} / {clock(duration)}</span><b>{title}</b>
      {qualities.length ? <select aria-label="Video quality" value={quality} onChange={(event) => { const value = Number(event.target.value); setQuality(value); if (hls.current) hls.current.currentLevel = value; }}><option value={-1}>Auto</option>{qualities.map((option) => <option value={option.index} key={option.index}>{option.label}</option>)}</select> : null}
      {audioTracks.length > 1 ? <select aria-label="Audio track" value={audioTrack} onChange={(event) => { const value = Number(event.target.value); setAudioTrack(value); if (hls.current) hls.current.audioTrack = value; }}>{audioTracks.map((option) => <option value={option.index} key={option.index}>{option.label}</option>)}</select> : null}
      {subtitleTracks.length ? <label className="player-track"><Captions aria-hidden="true" /><select aria-label="Subtitle track" value={subtitleTrack} onChange={(event) => { const value = Number(event.target.value); setSubtitleTrack(value); if (hls.current) hls.current.subtitleTrack = value; }}><option value={-1}>Off</option>{subtitleTracks.map((option) => <option value={option.index} key={option.index}>{option.label}</option>)}</select></label> : null}
      <select aria-label="Playback speed" value={speed} onChange={(event) => { const value = Number(event.target.value); setSpeed(value); if (video.current) video.current.playbackRate = value; }}>{[.5, .75, 1, 1.25, 1.5, 2].map((value) => <option value={value} key={value}>{value}×</option>)}</select>
      <button aria-label="Picture in picture" onClick={() => void video.current?.requestPictureInPicture?.()}><Expand /></button><button aria-label="Full screen" onClick={() => void container.current?.requestFullscreen()}><Maximize /></button>
    </div></div>
  </div>;
}
