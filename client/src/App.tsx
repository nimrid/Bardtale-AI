import React, { useEffect, useState } from 'react';
import { Tier, CustomizationForm, Order } from './types';
import { initializeNimiqSdk, fetchUserAccounts } from './services/nimiqSdk';
import { fetchTiers, createOrder } from './services/api';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { TierSelector } from './components/TierSelector';
import { CustomizationFormComp } from './components/CustomizationForm';
import { PaymentCard } from './components/PaymentCard';
import { ProgressTracker } from './components/ProgressTracker';
import { ResultView } from './components/ResultView';
import { MusicStudio } from './components/MusicStudio';
import { OrderHistoryModal } from './components/OrderHistoryModal';

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
        const sdkContext = await initializeNimiqSdk();
        setIsSdkAvailable(sdkContext.isSdkAvailable);
        setDeviceId(sdkContext.deviceId);
        setUserAddress(sdkContext.userAddress);

        const tiersData = await fetchTiers();
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
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Bardtale AI Studio...</p>
      </div>
    );
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
        onSelectOrder={(ord) => {
          setMode('story');
          setCompletedOrder(ord);
          setActiveOrderId(ord.id);
          setStep(5);
        }}
      />
    </div>
  );
};
