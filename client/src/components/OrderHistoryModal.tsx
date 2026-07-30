import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { fetchDeviceOrders, getPdfDownloadUrl } from '../services/api';
import { X, BookOpen, Download } from 'lucide-react';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && deviceId) {
      setLoading(true);
      fetchDeviceOrders(deviceId)
        .then(setOrders)
        .catch(err => console.error('Failed to load order history:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, deviceId]);

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
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Your Commission History
          </h3>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', minHeight: '34px', minWidth: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Device ID: <code style={{ color: 'var(--primary-gold)' }}>{deviceId.substring(0, 16)}...</code>
        </p>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading history...</p>
          ) : orders.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No past commissions found on this device.</p>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F3F4F6' }}>
                    {ord.story_title || `${ord.customization_fields.character_name}'s Story`}
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
                  {ord.status === 'complete' && (
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
                      >
                        <Download size={13} />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
