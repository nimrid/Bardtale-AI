import React, { useState, useEffect, useRef } from 'react';
import { createMusicTrack, fetchMusicTrackStatus, getMusicStreamUrl } from '../services/api';
import { Music, Play, Pause, Download, Loader2, Sparkles, RefreshCw, Wand2, Volume2, Clock, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MusicStudioProps {
  deviceId: string;
  isSdkAvailable: boolean;
  receiverWallet: string;
}

interface SongPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompt: string;
}

const PRESETS: SongPreset[] = [
  {
    id: 'witcher_ballad',
    name: 'Witcher Minstrel Ballad',
    icon: '🎻',
    description: 'A storytelling tavern ballad featuring acoustic lute, medieval fiddle, and emotional fantasy tempo.',
    prompt: 'A storytelling minstrel tavern ballad featuring acoustic lute, medieval fiddle, rhythmic bodhrán drum, emotional tempo, fantasy minstrel vibe like the witcher series'
  },
  {
    id: 'tavern_jig',
    name: 'Tavern Festive Jig',
    icon: '🍺',
    description: 'Upbeat medieval pub song with flute, hurdy-gurdy, and foot-stomping rhythm.',
    prompt: 'Upbeat medieval pub song with flute, hurdy-gurdy, foot-stomping rhythm, joyous tavern atmosphere, acoustic folk'
  },
  {
    id: 'heroic_legend',
    name: 'Heroic Bardic Legend',
    icon: '🐉',
    description: 'Dramatic orchestral fantasy ballad, lute solos, and cinematic storytelling tempo.',
    prompt: 'Dramatic orchestral fantasy ballad, acoustic guitar solos, heroic acoustic strings, cinematic storytelling tempo, epic tavern song'
  },
  {
    id: 'realm_lullaby',
    name: 'Realm Lullaby',
    icon: '🌌',
    description: 'Gentle harp, quiet acoustic lute, and soothing fairytale ambient soundscape.',
    prompt: 'Gentle harp, quiet acoustic lute, soothing fairytale melody, soft ambient fantasy soundscape, peaceful minstrel song'
  }
];

export const MusicStudio: React.FC<MusicStudioProps> = ({ deviceId, isSdkAvailable, receiverWallet }) => {
  const [selectedPreset, setSelectedPreset] = useState<SongPreset>(PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState<string>(PRESETS[0].prompt);
  const [title, setTitle] = useState<string>('The Minstrel\'s Tale');
  const [duration, setDuration] = useState<number>(30);
  
  const [generating, setGenerating] = useState<boolean>(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [completedTrack, setCompletedTrack] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  const handleSelectPreset = (preset: SongPreset) => {
    setSelectedPreset(preset);
    setCustomPrompt(preset.prompt);
    setTitle(`${preset.name}`);
  };

  const handleGenerate = async () => {
    if (!deviceId) {
      alert('Device identifier not ready. Please refresh the page.');
      return;
    }

    setGenerating(true);
    setError(null);
    setCompletedTrack(null);
    setIsPlaying(false);

    try {
      const resp = await createMusicTrack(deviceId, customPrompt, title, duration);
      setActiveTrackId(resp.track_id);
    } catch (err: any) {
      setError(err.message || 'Failed to start music generation');
      setGenerating(false);
    }
  };

  // Poll for track status
  useEffect(() => {
    if (!activeTrackId || !generating) return;

    let pollTimer: any = setInterval(async () => {
      try {
        const track = await fetchMusicTrackStatus(activeTrackId);
        if (track.status === 'complete') {
          clearInterval(pollTimer);
          setCompletedTrack(track);
          setGenerating(false);
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } else if (track.status === 'failed') {
          clearInterval(pollTimer);
          setError('Music generation failed. Please try again.');
          setGenerating(false);
        }
      } catch (e) {
        console.error('Error polling track status:', e);
      }
    }, 2500);

    return () => clearInterval(pollTimer);
  }, [activeTrackId, generating]);

  // Audio Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setTotalDuration(audioRef.current.duration || duration);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const streamUrl = completedTrack ? getMusicStreamUrl(completedTrack.id) : '';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 10px' }}>
      {/* Studio Banner */}
      <div className="glass-panel" style={{ padding: '28px 24px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: 'rgba(5, 211, 178, 0.15)',
          color: '#05D3B2',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: '12px'
        }}>
          <Sparkles size={14} /> Stable Audio 2.5 API • 44.1kHz Stereo
        </div>

        <h2 className="font-serif gradient-text-gold" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          Bardic Music & Story Ballad Studio
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '580px', margin: '0 auto' }}>
          Compose authentic Witcher-style tavern songs, minstrel ballads, and fantasy soundscapes using Stable Audio 2.5 AI.
        </p>
      </div>

      {/* Preset Ballad Selector */}
      <div className="glass-panel" style={{ padding: '24px 20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wand2 size={16} color="var(--primary-gold)" /> Select Bardic Song Preset
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(5, 211, 178, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '2px solid #05D3B2' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{preset.icon}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {preset.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Customization Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
          {/* Song Title Field */}
          <div className="form-group">
            <div className="form-label" style={{ marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                <Music size={16} color="var(--primary-gold)" /> Song Title
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Appears on cover & audio metadata
              </span>
            </div>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Toss a Coin to Your Witcher / Ballad of Kaer Morhen"
            />
          </div>

          {/* Music Style Prompt Field */}
          <div className="form-group">
            <div className="form-label" style={{ marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                <Sparkles size={16} color="#05D3B2" /> Music Style Prompt (Stable Audio 2.5)
              </span>
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(5, 211, 178, 0.15)',
                color: '#05D3B2',
                fontWeight: 700
              }}>
                {customPrompt.length}/1000
              </span>
            </div>

            <textarea
              className="form-textarea"
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe instruments, mood, tempo, minstrel vocals, and storytelling style..."
            />

            {/* Quick-Add Prompt Modifier Tag Chips */}
            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                💡 Click to add instrument / style tag to prompt:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  'acoustic lute',
                  'medieval fiddle',
                  'rhythmic bodhrán drum',
                  'witcher minstrel vocal hums',
                  'tavern tavern claps',
                  '3/4 time signature',
                  'epic fantasy folk'
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!customPrompt.includes(tag)) {
                        setCustomPrompt(prev => prev ? `${prev}, ${tag}` : tag);
                      }
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(5, 211, 178, 0.2)';
                      e.currentTarget.style.borderColor = '#05D3B2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Audio Duration (Seconds)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[30, 60, 120, 180].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={duration === dur ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: '36px' }}
                >
                  <Clock size={14} /> {dur}s ({dur / 60}m)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Commission Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={handleGenerate}
            disabled={generating || !customPrompt.trim()}
            className="btn-primary"
            style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Composing Song...
              </>
            ) : (
              <>
                <Music size={18} /> Commission Ballad (2,500 NIM)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generation Progress Indicator */}
      {generating && (
        <div className="glass-panel" style={{ padding: '32px 20px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 16px auto',
            borderRadius: '50%',
            background: 'rgba(5, 211, 178, 0.15)',
            color: '#05D3B2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
            Composing Your Bardic Song
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Stable Audio 2.5 is synthesizing 44.1kHz stereo audio. This usually takes 15–30 seconds.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', color: '#FF4D4D', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.88rem' }}>{error}</p>
        </div>
      )}

      {/* Glassmorphic Audio Player */}
      {completedTrack && streamUrl && (
        <div className="glass-panel" style={{ padding: '28px 24px', marginBottom: '24px', position: 'relative' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(5, 211, 178, 0.15)',
            color: '#05D3B2',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '14px'
          }}>
            <CheckCircle size={14} /> Song Composed Successfully
          </div>

          <h3 className="font-serif gradient-text-gold" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
            {completedTrack.title || 'Bardic Ballad'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
            Prompt: "{completedTrack.prompt}"
          </p>

          {/* Hidden HTML5 Audio Element */}
          <audio
            ref={audioRef}
            src={streamUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Animated Waveform Visualizer */}
          <div style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            marginBottom: '20px',
            padding: '0 10px'
          }}>
            {Array.from({ length: 32 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '4px',
                  height: isPlaying ? `${Math.floor(12 + Math.sin(idx + currentTime * 5) * 16 + (idx % 5) * 4)}px` : '8px',
                  background: isPlaying ? 'linear-gradient(180deg, #F6B221 0%, #05D3B2 100%)' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  transition: 'height 0.15s ease'
                }}
              />
            ))}
          </div>

          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <button
              onClick={togglePlay}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F6B221 0%, #05D3B2 100%)',
                border: 'none',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(5, 211, 178, 0.3)'
              }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
            </button>

            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '80px' }}>
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
          </div>

          {/* Action Download Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href={streamUrl}
              download={`${completedTrack.title.replace(/\s+/g, '_')}.mp3`}
              className="btn-primary"
              style={{ textDecoration: 'none', maxWidth: '260px' }}
            >
              <Download size={18} /> Download MP3 Song
            </a>

            <button
              onClick={() => {
                setCompletedTrack(null);
                setActiveTrackId(null);
              }}
              className="btn-secondary"
            >
              <RefreshCw size={16} /> New Song
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
