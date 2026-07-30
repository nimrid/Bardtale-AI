import React from 'react';
import { BookOpen, Music, History, ShieldCheck, Wallet, X, Sparkles, ChevronRight, Wand2 } from 'lucide-react';
import { BardtaleLogo } from './BardtaleLogo';

interface SidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'story' | 'music';
  onSelectMode: (mode: 'story' | 'music') => void;
  isSdkAvailable: boolean;
  userAddress: string | null;
  onFetchAccounts: () => void;
  onOpenHistory: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  isOpen,
  onClose,
  mode,
  onSelectMode,
  isSdkAvailable,
  userAddress,
  onFetchAccounts,
  onOpenHistory
}) => {
  if (!isOpen) return null;

  const formatAddress = (addr: string) => {
    if (addr.length <= 14) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex'
    }}>
      {/* Dark Glassmorphic Backdrop - Tap to hide menu */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 11, 20, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.25s ease'
        }}
      />

      {/* Slide-over Drawer Panel */}
      <div style={{
        position: 'relative',
        width: '82%',
        maxWidth: '320px',
        height: '100%',
        background: '#0B1120',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '10px 0 40px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 20px',
        overflowY: 'auto',
        zIndex: 1001,
        animation: 'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div>
          {/* Drawer Top Header & Close Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '30px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <BardtaleLogo size={34} subtitle="AI Story & Audio Studio" />
            <button
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Creation Studios
            </div>

            {/* Storybook Option */}
            <div
              onClick={() => {
                onSelectMode('story');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '14px',
                background: mode === 'story' ? 'linear-gradient(135deg, rgba(246, 178, 33, 0.18) 0%, rgba(230, 138, 0, 0.18) 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: mode === 'story' ? '1.5px solid #F6B221' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: mode === 'story' ? 'linear-gradient(135deg, #F6B221 0%, #E68A00 100%)' : 'rgba(255, 255, 255, 0.06)',
                  color: mode === 'story' ? '#0F172A' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: mode === 'story' ? '#F6B221' : 'var(--text-main)' }}>
                    Storybooks
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Illustrated AI Tales (500-3K NIM)
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color={mode === 'story' ? '#F6B221' : 'var(--text-muted)'} />
            </div>

            {/* Music Studio Option */}
            <div
              onClick={() => {
                onSelectMode('music');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '14px',
                background: mode === 'music' ? 'linear-gradient(135deg, rgba(5, 211, 178, 0.18) 0%, rgba(2, 138, 117, 0.18) 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: mode === 'music' ? '1.5px solid #05D3B2' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: mode === 'music' ? 'linear-gradient(135deg, #05D3B2 0%, #028A75 100%)' : 'rgba(255, 255, 255, 0.06)',
                  color: mode === 'music' ? '#0F172A' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Music size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: mode === 'music' ? '#05D3B2' : 'var(--text-main)' }}>
                    Music Studio
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Bardic Witcher Ballads (2.5K NIM)
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color={mode === 'music' ? '#05D3B2' : 'var(--text-muted)'} />
            </div>

            {/* History Option */}
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '16px', marginBottom: '4px' }}>
              Account & Records
            </div>

            <div
              onClick={() => {
                onOpenHistory();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer'
              }}
            >
              <History size={18} color="var(--primary-gold)" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Commission History
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  View past stories & songs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Bottom Wallet & Network Info */}
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {userAddress ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(5, 211, 178, 0.12)',
              border: '1px solid rgba(5, 211, 178, 0.3)',
              color: '#05D3B2',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}>
              <Wallet size={16} /> {formatAddress(userAddress)}
            </div>
          ) : isSdkAvailable ? (
            <button
              onClick={() => {
                onFetchAccounts();
                onClose();
              }}
              className="btn-primary"
              style={{ padding: '10px 16px', fontSize: '0.82rem', minHeight: '40px' }}
            >
              <ShieldCheck size={16} /> Connect Nimiq Wallet
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: '#F6B221',
              fontWeight: 600
            }}>
              <Sparkles size={14} /> Nimiq Pay Sandbox Active
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
