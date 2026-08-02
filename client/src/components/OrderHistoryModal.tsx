import React, { useEffect, useState, useRef } from 'react';
import { Order } from '../types';
import { fetchDeviceOrders, fetchDeviceMusicHistory, getPdfDownloadUrl, getMusicStreamUrl, confirmOrderPayment } from '../services/api';
import { X, BookOpen, Download, Music, Play, Pause, Clock, Sparkles, RefreshCw } from 'lucide-react';

interface OrderHistoryModalProps {
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  deviceId,
  isOpen,
  onClose,
  onSelectOrder
}) => {
  const [activeTab, setActiveTab] = useState<'stories' | 'music'>('stories');
  const [orders, setOrders] = useState<Order[]>([]);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Audio Playback state for history modal
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && deviceId) {
      setLoading(true);
      Promise.all([
        fetchDeviceOrders(deviceId).catch(() => []),
        fetchDeviceMusicHistory(deviceId).catch(() => [])
      ])
        .then(([fetchedOrders, fetchedMusic]) => {
          setOrders(fetchedOrders);
          setMusicTracks(fetchedMusic);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, deviceId]);

  const togglePlayMusic = (trackId: string) => {
    if (playingTrackId === trackId) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(trackId);
    }
  };

  const handleVerifyAndStartStory = async (ord: Order) => {
    setProcessingOrderId(ord.id);
    try {
      await confirmOrderPayment(ord.id, 'NIM_TX_' + Date.now());
      onSelectOrder(ord);
      onClose();
    } catch (err: any) {
      console.error('Failed to verify order payment:', err);
      // Even if error occurs, proceed to select order so user can view progress
      onSelectOrder(ord);
      onClose();
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px'
    }}>
      {/* Hidden audio player element */}
      {playingTrackId && (
        <audio
          ref={audioRef}
          src={getMusicStreamUrl(playingTrackId)}
          autoPlay
          onEnded={() => setPlayingTrackId(null)}
        />
      )}

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px',
        position: 'relative'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Your Commission History
          </h3>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              setPlayingTrackId(null);
              onClose();
            }}
            className="btn-secondary"
            style={{ padding: '6px', minHeight: '34px', minWidth: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setActiveTab('stories')}
            className={activeTab === 'stories' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '6px 12px', fontSize: '0.82rem', minHeight: '36px' }}
          >
            <BookOpen size={14} /> Storybooks ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={activeTab === 'music' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '6px 12px', fontSize: '0.82rem', minHeight: '36px' }}
          >
            <Music size={14} /> Music Tracks ({musicTracks.length})
          </button>
        </div>

        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Device ID: <code style={{ color: 'var(--primary-gold)' }}>{deviceId.substring(0, 16)}...</code>
        </p>

        {/* List Content */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading commission history...
            </p>
          ) : activeTab === 'stories' ? (
            /* Storybooks Tab */
            orders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No past storybook commissions found on this device.
              </p>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F3F4F6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={14} color="var(--primary-gold)" /> {ord.story_title || `${ord.customization_fields.character_name}'s Story`}
                    </h4>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span>{ord.tier.toUpperCase()} Tier</span>
                      <span>•</span>
                      <span>{ord.nim_amount} NIM</span>
                      <span>•</span>
                      <span style={{ color: ord.status === 'complete' ? '#05D3B2' : 'var(--primary-gold)' }}>
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {ord.status === 'complete' ? (
                      <>
                        <button
                          onClick={() => { onSelectOrder(ord); onClose(); }}
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', minHeight: '32px' }}
                        >
                          <BookOpen size={13} /> Read
                        </button>

                        <a
                          href={getPdfDownloadUrl(ord.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', minHeight: '32px', textDecoration: 'none' }}
                          title="Download PDF"
                        >
                          <Download size={13} />
                        </a>
                      </>
                    ) : (
                      <button
                        onClick={() => handleVerifyAndStartStory(ord)}
                        disabled={processingOrderId === ord.id}
                        className="btn-primary"
                        style={{ padding: '5px 12px', fontSize: '0.75rem', minHeight: '32px' }}
                      >
                        {processingOrderId === ord.id ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} /> Verify & Generate
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (

            /* Music Tracks Tab */
            musicTracks.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No past music compositions found on this device.
              </p>
            ) : (
              musicTracks.map((track) => {
                const streamUrl = getMusicStreamUrl(track.id);
                const isThisPlaying = playingTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(5, 211, 178, 0.2)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F3F4F6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Music size={14} color="#05D3B2" /> {track.title || 'Bardic Ballad'}
                      </h4>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span><Clock size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {track.duration}s</span>
                        <span>•</span>
                        <span>{track.nim_amount || 2500} NIM</span>
                        <span>•</span>
                        <span style={{ color: track.status === 'complete' ? '#05D3B2' : 'var(--primary-gold)' }}>
                          {track.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {track.status === 'complete' && (
                        <>
                          <button
                            onClick={() => togglePlayMusic(track.id)}
                            className={isThisPlaying ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '5px 10px', fontSize: '0.75rem', minHeight: '32px' }}
                          >
                            {isThisPlaying ? <Pause size={13} /> : <Play size={13} />}
                            {isThisPlaying ? ' Pause' : ' Play'}
                          </button>

                          <a
                            href={streamUrl}
                            download={`${(track.title || 'bardic_ballad').replace(/\s+/g, '_')}.mp3`}
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.75rem', minHeight: '32px', textDecoration: 'none' }}
                            title="Download MP3"
                          >
                            <Download size={13} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};

