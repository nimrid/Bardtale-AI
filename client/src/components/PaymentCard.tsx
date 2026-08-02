import React, { useState } from 'react';
import { Tier, CustomizationForm } from '../types';
import { ArrowLeft, Wallet, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { requestNimPayment } from '../services/nimiqSdk';
import { confirmOrderPayment } from '../services/api';


interface PaymentCardProps {
  tier: Tier;
  customization: CustomizationForm;
  orderId: string;
  receiverWallet: string;
  userAddress?: string | null;
  isSdkAvailable: boolean;
  onFetchAccounts?: () => void;
  onPaymentSuccess: (orderId: string) => void;
  onBack: () => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  tier,
  customization,
  orderId,
  receiverWallet,
  userAddress,
  isSdkAvailable,
  onFetchAccounts,
  onPaymentSuccess,
  onBack
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stepStatus, setStepStatus] = useState<string>('Ready for payment');

  const lunaAmount = tier.nim_amount * 100000;

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      setStepStatus('Opening Nimiq Wallet...');
      
      // Step 1: Trigger NIM payment via SDK sendBasicTransactionWithData
      const payResult = await requestNimPayment(tier.nim_amount, receiverWallet, orderId);
      
      if (!payResult.success) {
        throw new Error('Wallet payment was not completed');
      }

      setStepStatus('Verifying payment server-side...');
      
      // Step 2: Server-side payment verification (GATES GENERATION)
      const confirmResult = await confirmOrderPayment(orderId, payResult.txHash);
      
      if (confirmResult.success) {
        setStepStatus('Payment confirmed! Starting AI generation...');
        onPaymentSuccess(orderId);
      } else {
        throw new Error(confirmResult.message || 'Server verification failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMsg(err.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <button onClick={onBack} disabled={isProcessing} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: '36px' }}>
          <ArrowLeft size={15} /> Edit Details
        </button>

        <div style={{
          fontSize: '0.75rem',
          padding: '5px 10px',
          borderRadius: '999px',
          background: 'rgba(5, 211, 178, 0.12)',
          color: '#05D3B2',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontWeight: 600
        }}>
          <Lock size={13} /> Payment-Gated Generation
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>
          Confirm & Pay {tier.nim_amount} NIM
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Your payment gates the Anthropic & Stability AI pipelines on our server.
        </p>
      </div>


      {/* Payer Account Box */}
      <div style={{
        background: 'rgba(5, 211, 178, 0.08)',
        border: '1px solid rgba(5, 211, 178, 0.25)',
        borderRadius: '14px',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={16} color="#05D3B2" />
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Nimiq Payer Wallet</span>
            {userAddress ? (
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#05D3B2', fontWeight: 600 }}>
                {userAddress}
              </span>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nimiq Wallet Connected
              </span>
            )}
          </div>
        </div>

        {!userAddress && isSdkAvailable && onFetchAccounts && (
          <button 
            onClick={onFetchAccounts}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: '30px' }}
          >
            <ShieldCheck size={13} /> Load Accounts
          </button>
        )}
      </div>

      {/* Order Summary Box */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Order Reference</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-main)' }}>#{orderId.substring(0, 8)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Selected Tier</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: tier.accent }}>{tier.name}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', fontSize: '0.82rem', marginBottom: '14px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Character:</span> <strong style={{ display: 'block' }}>{customization.character_name}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Theme:</span> <strong style={{ display: 'block' }}>{customization.theme}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Pages:</span> <strong>{tier.pages} Pages</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Artworks:</span> <strong>{tier.illustrations} Artworks</strong>
          </div>
        </div>

        <div style={{
          background: 'rgba(246, 178, 33, 0.1)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid rgba(246, 178, 33, 0.3)'
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'block' }}>Total Stake Amount</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              ({lunaAmount.toLocaleString()} Luna)
            </span>
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-gold)' }}>
            {tier.nim_amount} NIM
          </span>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '12px 14px',
          color: '#FCA5A5',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!isSdkAvailable ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          padding: '18px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FCA5A5', marginBottom: '6px' }}>
            🔒 Nimiq Pay App Required
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
            Storybook commissions and AI generations can only be purchased inside the Nimiq Pay app.
          </p>
          <a 
            href={`nimiqpay://miniapp?url=${encodeURIComponent(window.location.origin)}`}
            className="btn-primary"
            style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.82rem', textDecoration: 'none' }}
          >
            Open in Nimiq Pay App
          </a>
        </div>
      ) : (
        <div>
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="btn-primary"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>{stepStatus}</span>
              </>
            ) : (
              <>
                <Wallet size={18} /> Confirm & Pay {tier.nim_amount} NIM
              </>

            )}
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '14px' }}>
        🔒 Mediated by Nimiq Pay native confirmation dialogs. Keys never leave your wallet.
      </p>
    </div>
  );
};


