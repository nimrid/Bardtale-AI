import React from 'react';
import { History, Sparkles, ShieldCheck, Wallet, Menu } from 'lucide-react';
import { BardtaleLogo } from './BardtaleLogo';

interface HeaderProps {
  mode: 'story' | 'music';
  onOpenMenu: () => void;
  isSdkAvailable: boolean;
  userAddress: string | null;
  onFetchAccounts: () => void;
  onOpenHistory: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  mode,
  onOpenMenu,
  isSdkAvailable, 
  userAddress, 
  onFetchAccounts, 
  onOpenHistory, 
  onReset 
}) => {
  const formatAddress = (addr: string) => {
    if (addr.length <= 14) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '12px 0',
      marginBottom: '20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Left: Bardtale AI Brand Logo */}
      <div onClick={onReset} style={{ cursor: 'pointer' }}>
        <BardtaleLogo 
          subtitle={mode === 'story' ? 'AI Storybook Commissions' : 'Bardic Music Studio'} 
        />
      </div>

      {/* Right Controls: Status + History + Sleek Hamburger Menu Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Wallet / Sandbox Status Badge */}
        {userAddress ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.72rem',
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'rgba(5, 211, 178, 0.15)',
            color: '#05D3B2',
            border: '1px solid rgba(5, 211, 178, 0.35)',
            fontWeight: 600,
            fontFamily: 'monospace'
          }} title={userAddress}>
            <Wallet size={13} /> {formatAddress(userAddress)}
          </div>
        ) : isSdkAvailable ? (
          <button 
            onClick={onFetchAccounts}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              padding: '6px 10px',
              borderRadius: '999px',
              background: 'rgba(5, 211, 178, 0.12)',
              color: '#05D3B2',
              border: '1px solid rgba(5, 211, 178, 0.3)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={13} /> Connect
          </button>
        ) : (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            padding: '5px 10px',
            borderRadius: '999px',
            background: 'rgba(246, 178, 33, 0.1)',
            color: '#F6B221',
            border: '1px solid rgba(246, 178, 33, 0.25)',
            fontWeight: 600
          }}>
            <Sparkles size={12} /> Sandbox
          </div>
        )}

        {/* Sleek Far-Right Hamburger Menu Button */}
        <button
          onClick={onOpenMenu}
          style={{
            height: '38px',
            padding: '0 14px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(246, 178, 33, 0.2) 0%, rgba(5, 211, 178, 0.2) 100%)',
            border: '1px solid rgba(246, 178, 33, 0.4)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease'
          }}
          title="Open Navigation Menu"
        >
          <Menu size={18} color="var(--primary-gold)" />
          <span>Menu</span>
        </button>
      </div>
    </header>
  );
};
