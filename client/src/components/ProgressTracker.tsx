import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { fetchOrderStatus, getPageImageUrl } from '../services/api';
import { Feather, Paintbrush, BookOpenCheck, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ProgressTrackerProps {
  orderId: string;
  onComplete: (order: Order) => void;
  onFailed: () => void;
}

const STAGES: { status: OrderStatus; label: string; icon: any; percent: number }[] = [
  { status: 'paid', label: 'Payment Confirmed', icon: CheckCircle2, percent: 15 },
  { status: 'generating_text', label: 'Writing Story Narrative (Claude)...', icon: Feather, percent: 45 },
  { status: 'generating_images', label: 'Painting Illustrations (Stability AI)...', icon: Paintbrush, percent: 75 },
  { status: 'assembling_pdf', label: 'Binding PDF Book (ReportLab)...', icon: BookOpenCheck, percent: 92 },
  { status: 'complete', label: 'Storybook Complete!', icon: Sparkles, percent: 100 }
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ orderId, onComplete, onFailed }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timerId: any = null;
    let pollId: any = null;

    timerId = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    const checkStatus = async () => {
      try {
        const data = await fetchOrderStatus(orderId);
        setOrder(data);

        if (data.status === 'complete') {
          clearInterval(timerId);
          clearInterval(pollId);

          // Production Best Practice: Preload page 1 image into browser cache before showing reader
          if (data.id) {
            const img = new Image();
            let navigated = false;

            const navigate = () => {
              if (!navigated) {
                navigated = true;
                onComplete(data);
              }
            };

            img.onload = navigate;
            img.onerror = navigate;
            img.src = getPageImageUrl(data.id, 1);

            // Timeout safeguard (max 1.5s wait for preloader)
            setTimeout(navigate, 1500);
          } else {
            onComplete(data);
          }
        } else if (data.status === 'failed') {
          clearInterval(timerId);
          clearInterval(pollId);
          onFailed();
        }
      } catch (e) {
        console.error('Error polling order status:', e);
      }
    };

    checkStatus();
    pollId = setInterval(checkStatus, 3000);

    return () => {
      clearInterval(timerId);
      clearInterval(pollId);
    };
  }, [orderId]);

  const currentStatus = order?.status || 'paid';
  const currentStageIndex = STAGES.findIndex(s => s.status === currentStatus);
  const currentStage = STAGES[Math.max(0, currentStageIndex)] || STAGES[0];

  return (
    <div className="glass-panel" style={{ padding: '36px 20px', textAlign: 'center' }}>
      <div style={{
        width: '64px',
        height: '64px',
        margin: '0 auto 20px auto',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(246, 178, 33, 0.2) 0%, rgba(138, 63, 252, 0.2) 100%)',
        border: '2px solid rgba(246, 178, 33, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 24px rgba(246, 178, 33, 0.3)'
      }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary-gold)" />
      </div>

      <h2 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>
        Crafting Your Illustrated Story
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '28px' }}>
        Payment verified. AI engines are generating your personalized storybook.
      </p>

      {/* Progress Bar Container */}
      <div style={{ maxWidth: '440px', margin: '0 auto 28px auto' }}>
        <div style={{
          height: '10px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '10px'
        }}>
          <div style={{
            height: '100%',
            width: `${currentStage.percent}%`,
            background: 'linear-gradient(90deg, #F6B221 0%, #05D3B2 50%, #8A3FFC 100%)',
            borderRadius: '999px',
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>Stage: {currentStage.label}</span>
          <span>{elapsedSeconds}s elapsed</span>
        </div>
      </div>

      {/* Stage Steps List */}
      <div style={{
        maxWidth: '420px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        textAlign: 'left'
      }}>
        {STAGES.slice(1, 4).map((stage, idx) => {
          const StageIcon = stage.icon;
          const isDone = currentStageIndex > idx + 1 || currentStatus === 'complete';
          const isCurrent = currentStage.status === stage.status;

          return (
            <div
              key={stage.status}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isCurrent ? 'rgba(246, 178, 33, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: isCurrent ? '1px solid rgba(246, 178, 33, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: isDone ? 'rgba(5, 211, 178, 0.2)' : isCurrent ? 'rgba(246, 178, 33, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isDone ? '#05D3B2' : isCurrent ? 'var(--primary-gold)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <StageIcon size={16} />
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? 'var(--text-main)' : 'var(--text-muted)'
              }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
