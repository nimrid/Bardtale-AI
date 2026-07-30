import React from 'react';
import { Tier } from '../types';
import { Book, Image, Check, Zap } from 'lucide-react';

interface TierSelectorProps {
  tiers: Tier[];
  selectedTier: Tier | null;
  onSelectTier: (tier: Tier) => void;
  onContinue: () => void;
}

export const TierSelector: React.FC<TierSelectorProps> = ({ tiers, selectedTier, onSelectTier, onContinue }) => {
  return (
    <div className="glass-panel" style={{ padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>
          Select Your Story Commission Tier
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto' }}>
          Choose your desired story length and illustration count. Each book is custom generated and compiled into a styled PDF.
        </p>
      </div>

      <div className="tier-grid" style={{ marginBottom: '28px' }}>
        {tiers.map((tier) => {
          const isSelected = selectedTier?.id === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => onSelectTier(tier)}
              style={{
                background: isSelected ? 'rgba(30, 38, 66, 0.95)' : 'rgba(17, 23, 41, 0.6)',
                border: isSelected ? `2px solid ${tier.accent}` : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px 18px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isSelected ? `0 12px 28px ${tier.accent}33` : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none'
              }}
            >
              {tier.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  background: tier.accent,
                  color: '#0F172A',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {tier.badge}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {tier.name}
                  </h3>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                    background: isSelected ? tier.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0F172A'
                  }}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', minHeight: '36px' }}>
                  {tier.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <Book size={15} color={tier.accent} />
                    <span><strong>{tier.pages} Pages</strong> Storybook</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <Image size={15} color={tier.accent} />
                    <span><strong>{tier.illustrations} AI Artwork{tier.illustrations > 1 ? 's' : ''}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Stake Price</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: tier.accent }}>
                  {tier.nim_amount} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>NIM</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onContinue}
          disabled={!selectedTier}
          className="btn-primary"
          style={{ maxWidth: '340px' }}
        >
          <Zap size={18} /> Continue to Customization
        </button>
      </div>
    </div>
  );
};
