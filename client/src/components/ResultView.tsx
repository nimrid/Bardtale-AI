import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { getPdfDownloadUrl, getPageImageUrl } from '../services/api';
import { Download, Share2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, ImageOff, RefreshCw, Loader2, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultViewProps {
  order: Order;
  onNewCommission: () => void;
}

interface StoryImageProps {
  orderId: string;
  pageNum: number;
}

const StoryImage: React.FC<StoryImageProps> = ({ orderId, pageNum }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [useStaticFallback, setUseStaticFallback] = useState<boolean>(false);
  const [imgKey, setImgKey] = useState<number>(Date.now());

  const primaryUrl = `${getPageImageUrl(orderId, pageNum)}?t=${imgKey}`;
  const staticUrl = `/storage/images/${orderId}/page_${pageNum}.png?t=${imgKey}`;

  const currentSrc = useStaticFallback ? staticUrl : primaryUrl;

  const handleImageError = () => {
    if (retryCount < 4) {
      const delay = (retryCount + 1) * 800;
      setTimeout(() => {
        if (retryCount === 1) {
          setUseStaticFallback(true);
        }
        setRetryCount(prev => prev + 1);
        setImgKey(Date.now());
      }, delay);
    } else {
      setLoading(false);
      setError(true);
    }
  };

  const handleManualRetry = () => {
    setLoading(true);
    setError(false);
    setRetryCount(0);
    setUseStaticFallback(false);
    setImgKey(Date.now());
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      minHeight: '320px'
    }}>
      {loading && !error && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem'
        }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary-gold)" />
          <span>Rendering AI Artwork...</span>
        </div>
      )}

      {!error ? (
        <img
          key={`${pageNum}-${imgKey}`}
          src={currentSrc}
          alt={`Page ${pageNum} illustration`}
          onLoad={() => setLoading(false)}
          onError={handleImageError}
          style={{
            maxWidth: '100%',
            maxHeight: '340px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            objectFit: 'contain',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ImageOff size={40} color="var(--primary-gold)" />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
            Image Display Pending
          </p>
          <button
            onClick={handleManualRetry}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 16px', minHeight: '36px' }}
          >
            <RefreshCw size={14} /> Reload Image
          </button>
        </div>
      )}
    </div>
  );
};

export const ResultView: React.FC<ResultViewProps> = ({ order, onNewCommission }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, []);

  const pages = order.pages || [];
  const currentPage = pages[currentPageIndex] || null;
  const pdfUrl = getPdfDownloadUrl(order.id);

  // Check if current page is an illustrated page according to selected tier
  const illustratedPages = order.illustrated_pages || [1];
  const hasIllustration = currentPage ? illustratedPages.includes(currentPage.page_number) : false;

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: order.story_title || 'My Illustrated Story',
        text: `Check out my personalized AI storybook commissioned with Nimiq Pay!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 14px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
          marginBottom: '10px'
        }}>
          <CheckCircle size={14} /> Commission Complete & Verified
        </div>

        <h2 className="font-serif gradient-text-gold" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
          {order.story_title || 'Your Illustrated Story'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Custom {order.tier.toUpperCase()} Tier • {pages.length} Pages • {illustratedPages.length} AI Artwork{illustratedPages.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Action Buttons Group */}
      <div className="action-button-group" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ maxWidth: '280px', textDecoration: 'none' }}
        >
          <Download size={18} /> Download PDF Book
        </a>

        <button onClick={handleShare} className="btn-secondary">
          <Share2 size={16} /> Share Link
        </button>

        <button onClick={onNewCommission} className="btn-secondary">
          <RotateCcw size={16} /> New Story
        </button>
      </div>

      {/* Interactive Mobile-First Storybook Reader */}
      {pages.length > 0 && currentPage && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Reader Header Bar */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Page {currentPageIndex + 1} of {pages.length} {hasIllustration ? '🎨 (Illustrated)' : '📖 (Text Chapter)'}
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handlePrev}
                disabled={currentPageIndex === 0}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', minHeight: '36px', opacity: currentPageIndex === 0 ? 0.4 : 1 }}
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <button
                onClick={handleNext}
                disabled={currentPageIndex === pages.length - 1}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', minHeight: '36px', opacity: currentPageIndex === pages.length - 1 ? 0.4 : 1 }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Book Page Content Layout */}
          {hasIllustration ? (
            <div className="reader-grid">
              {/* Illustration Column with StoryImage */}
              <div className="reader-illustration-col" style={{
                background: '#070B14',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                minHeight: '320px'
              }}>
                <StoryImage
                  key={`story-img-${order.id}-${currentPage.page_number}`}
                  orderId={order.id}
                  pageNum={currentPage.page_number}
                />
              </div>

              {/* Story Text Column */}
              <div className="reader-text-col" style={{
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary-gold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '12px'
                }}>
                  Chapter Page {currentPage.page_number}
                </div>

                <p className="font-serif" style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.65,
                  color: '#F3F4F6',
                  marginBottom: '18px'
                }}>
                  {currentPage.text}
                </p>

                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '12px',
                  fontStyle: 'italic'
                }}>
                  Illustration Prompt: "{currentPage.illustration_prompt}"
                </div>
              </div>
            </div>
          ) : (
            /* Full Width Pure Text Story Page (No Empty Image Placeholder Forced) */
            <div style={{
              padding: '40px 28px',
              maxWidth: '680px',
              margin: '0 auto',
              textAlign: 'center',
              minHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 16px auto',
                borderRadius: '50%',
                background: 'rgba(246, 178, 33, 0.12)',
                color: 'var(--primary-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={20} />
              </div>

              <div style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--primary-gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '16px'
              }}>
                Chapter Page {currentPage.page_number}
              </div>

              <p className="font-serif" style={{
                fontSize: '1.25rem',
                lineHeight: 1.75,
                color: '#F3F4F6',
                marginBottom: '24px'
              }}>
                {currentPage.text}
              </p>

              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                paddingTop: '16px',
                fontStyle: 'italic'
              }}>
                Scene Note: "{currentPage.illustration_prompt}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
