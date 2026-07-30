import React from 'react';

interface BardtaleLogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
}

export const BardtaleLogo: React.FC<BardtaleLogoProps> = ({ 
  size = 38, 
  showText = true,
  subtitle = "AI Stories, Artworks & Ballads" 
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      {/* Icon Badge */}
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #F6B221 0%, #05D3B2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(246, 178, 33, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Custom SVG Feather Quill + Music Note Symbol */}
        <svg 
          width={size * 0.62} 
          height={size * 0.62} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#0F172A" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Feather Quill */}
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L3 13.5V18h4.5z" />
          <line x1="16" y1="8" x2="2" y2="22" />
          {/* Musical Note Accent */}
          <circle cx="17.5" cy="17.5" r="2.5" fill="#0F172A" stroke="none" />
          <path d="M20 17.5V10.5L15 12" strokeWidth="2" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 900, 
            letterSpacing: '-0.02em', 
            lineHeight: 1.1,
            margin: 0
          }}>
            Bardtale <span className="gradient-text-gold">AI</span>
          </h1>
          {subtitle && (
            <p style={{ 
              fontSize: '0.72rem', 
              color: 'var(--text-muted)', 
              fontWeight: 500,
              margin: '2px 0 0 0'
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
