import React, { useEffect, useState } from 'react';
import { Tier, CustomizationForm, Order } from './types';
import { initializeNimiqSdk, fetchUserAccounts } from './services/nimiqSdk';
import { fetchTiers, createOrder, fetchOrderStatus } from './services/api';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { TierSelector } from './components/TierSelector';
import { CustomizationFormComp } from './components/CustomizationForm';
import { PaymentCard } from './components/PaymentCard';
import { ProgressTracker } from './components/ProgressTracker';
import { ResultView } from './components/ResultView';
import { MusicStudio } from './components/MusicStudio';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { Sparkles, Feather } from 'lucide-react';

const LOADING_QUOTES = [
  "Summoning minstrel lore & AI storytellers...",
  "Blending magical watercolor illustrations...",
  "Tuning lute strings for your bardic ballad...",
  "Syncing Nimiq Pay wallet consensus...",
  "Inscribing golden parchment scroll..."
];

export const LoadingScreen: React.FC = () => {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % LOADING_QUOTES.length);
    }, 650);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(circle at 50% 35%, rgba(246, 178, 33, 0.15) 0%, rgba(15, 23, 42, 0.98) 75%)',
      textAlign: 'center'
    }}>
      {/* Animated Glowing Badge */}
      <div style={{ position: 'relative', width: '76px', height: '76px', marginBottom: '20px' }}>
        <div style={{
          position: 'absolute',
          inset: '-10px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246, 178, 33, 0.4) 0%, rgba(5, 211, 178, 0) 75%)',
          animation: 'pulse 1.8s infinite ease-in-out'
        }} />
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #F6B221 0%, #05D3B2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 30px rgba(5, 211, 178, 0.35)',
          position: 'relative',
          zIndex: 1
        }}>
          <Sparkles size={38} color="#0F172A" />
        </div>
      </div>

      <h1 className="font-serif gradient-text-gold" style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
        Bardtale AI Studio
      </h1>

      <p style={{
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        minHeight: '26px',
        marginBottom: '24px',
        fontWeight: 500,
        transition: 'all 0.25s ease'
      }}>
        {LOADING_QUOTES[quoteIdx]}
      </p>

      {/* Shimmering Progress Indicator */}
      <div style={{
        width: '180px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '999px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, #F6B221, #05D3B2)',
          borderRadius: '999px',
          animation: 'loadingBar 1.2s infinite ease-in-out'
        }} />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [mode, setMode] = useState<'story' | 'music'>('story');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [isSdkAvailable, setIsSdkAvailable] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [receiverWallet, setReceiverWallet] = useState<string>('');
  
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  
  const [form, setForm] = useState<CustomizationForm>({
    character_name: '',
    theme: '',
    tone: 'Whimsical & Heartwarming',
    special_detail: ''
  });

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function setup() {
      try {
        const [sdkContext, tiersData] = await Promise.all([
          initializeNimiqSdk().catch(err => {
            console.warn('SDK init fallback:', err);
            return { isSdkAvailable: false, deviceId: 'dev_local', language: 'en', userAddress: null, accounts: [], nimiqProvider: null };
          }),
          fetchTiers().catch(err => {
            console.warn('Tiers fetch fallback:', err);
            return {
              receiver_wallet: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000',
              tiers: [
                { id: 'mini', name: 'Mini Storybook', pages: 3, illustrations: 3, nim_amount: 500, badge: 'Popular', accent: '#05D3B2', description: '3 illustrated pages story' },
                { id: 'standard', name: 'Standard Quest', pages: 5, illustrations: 5, nim_amount: 1000, badge: 'Recommended', accent: '#F6B221', description: '5 illustrated pages story' },
                { id: 'deluxe', name: 'Deluxe Epic', pages: 8, illustrations: 8, nim_amount: 2000, badge: 'Best Value', accent: '#A855F7', description: '8 illustrated pages story' }
              ] as Tier[]
            };
          })

        ]);

        setIsSdkAvailable(sdkContext.isSdkAvailable);
        setDeviceId(sdkContext.deviceId);
        setUserAddress(sdkContext.userAddress);

        setTiers(tiersData.tiers);
        setReceiverWallet(tiersData.receiver_wallet);
        
        if (tiersData.tiers.length > 1) {
          setSelectedTier(tiersData.tiers[1]);
        } else if (tiersData.tiers.length > 0) {
          setSelectedTier(tiersData.tiers[0]);
        }
      } catch (err) {
        console.error('App setup error:', err);
      } finally {
        setLoading(false);
      }
    }
    setup();
  }, []);

  const handleFetchAccounts = async () => {
    try {
      const accounts = await fetchUserAccounts();
      if (accounts && accounts.length > 0) {
        setUserAddress(accounts[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch user accounts:', err);
    }
  };

  const handleFormChange = (fields: Partial<CustomizationForm>) => {
    setForm(prev => ({ ...prev, ...fields }));
  };

  const handleCreateOrder = async () => {
    if (!selectedTier || !deviceId) return;
    setLoading(true);
    try {
      const orderResp = await createOrder(deviceId, selectedTier.id, form);
      setActiveOrderId(orderResp.order_id);
      setStep(3); // Proceed to Payment
    } catch (err: any) {
      alert(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    setStep(4); // Proceed to Progress Tracker
  };

  const handleGenerationComplete = (order: Order) => {
    setCompletedOrder(order);
    setStep(5); // Proceed to Result View
  };

  const handleReset = () => {
    setStep(1);
    setActiveOrderId(null);
    setCompletedOrder(null);
  };

  if (loading && step === 1 && tiers.length === 0) {
    return <LoadingScreen />;
  }


  return (
    <div className="mini-app-container">
      {/* Top Mobile Header */}
      <Header
        mode={mode}
        onOpenMenu={() => setIsMenuOpen(true)}
        isSdkAvailable={isSdkAvailable}
        userAddress={userAddress}
        onFetchAccounts={handleFetchAccounts}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
      />

      {/* Collapsible Slide-over Sidebar Drawer */}
      <SidebarNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        mode={mode}
        onSelectMode={setMode}
        isSdkAvailable={isSdkAvailable}
        userAddress={userAddress}
        onFetchAccounts={handleFetchAccounts}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main>
        {mode === 'music' ? (
          <MusicStudio
            deviceId={deviceId}
            isSdkAvailable={isSdkAvailable}
            receiverWallet={receiverWallet}
            userAddress={userAddress}
            onFetchAccounts={handleFetchAccounts}
          />
        ) : (

          <>
            {step === 1 && (
              <TierSelector
                tiers={tiers}
                selectedTier={selectedTier}
                onSelectTier={setSelectedTier}
                onContinue={() => setStep(2)}
              />
            )}

            {step === 2 && selectedTier && (
              <CustomizationFormComp
                selectedTier={selectedTier}
                form={form}
                onChange={handleFormChange}
                onBack={() => setStep(1)}
                onContinue={handleCreateOrder}
              />
            )}

            {step === 3 && selectedTier && activeOrderId && (
              <PaymentCard
                tier={selectedTier}
                customization={form}
                orderId={activeOrderId}
                receiverWallet={receiverWallet}
                userAddress={userAddress}
                isSdkAvailable={isSdkAvailable}
                onFetchAccounts={handleFetchAccounts}
                onPaymentSuccess={handlePaymentSuccess}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && activeOrderId && (
              <ProgressTracker
                orderId={activeOrderId}
                onComplete={handleGenerationComplete}
                onFailed={() => {
                  alert('Generation failed. Please try again or check logs.');
                  setStep(3);
                }}
              />
            )}

            {step === 5 && completedOrder && (
              <ResultView
                order={completedOrder}
                onNewCommission={handleReset}
              />
            )}
          </>
        )}
      </main>

      <OrderHistoryModal
        deviceId={deviceId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectOrder={async (ord) => {
          setMode('story');
          try {
            const fullOrder = await fetchOrderStatus(ord.id);
            setCompletedOrder(fullOrder);
          } catch (e) {
            console.error('Failed to fetch full order status:', e);
            setCompletedOrder(ord);
          }
          setActiveOrderId(ord.id);
          setStep(5);
        }}
      />
    </div>
  );
};

