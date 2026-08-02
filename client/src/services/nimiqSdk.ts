import { init, requestDeviceIdentifier } from '@nimiq/mini-app-sdk';

export interface NimiqSdkContext {
  isSdkAvailable: boolean;
  deviceId: string;
  language: string;
  userAddress: string | null;
  accounts: string[];
  nimiqProvider: any;
}

let cachedDeviceId: string | null = null;
let nimiqProviderInstance: any = null;
let userAccountsCache: string[] = [];

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  // Try official Mini App SDK requestDeviceIdentifier first
  try {
    const devId = await requestDeviceIdentifier({ reason: 'Illustrated story commissions and session history' });
    if (devId) {
      cachedDeviceId = devId;
      return devId;
    }
  } catch (err) {
    console.warn('Nimiq SDK requestDeviceIdentifier not available or fallback required:', err);
  }

  // Fallback for standalone browser testing / development
  let localDevId = localStorage.getItem('story_app_device_id');
  if (!localDevId) {
    localDevId = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem('story_app_device_id', localDevId);
  }
  cachedDeviceId = localDevId;
  return localDevId;
}

export function getProviderErrorMessage(value: unknown): string | null {
  if (typeof value !== 'object' || value === null)
    return null;

  if ('error' in value) {
    const maybeError = (value as { error?: { message?: unknown } }).error;
    if (maybeError && typeof maybeError.message === 'string')
      return maybeError.message;
  }

  return null;
}

export async function fetchUserAccounts(): Promise<string[]> {
  const win = window as any;
  const provider = nimiqProviderInstance || win.nimiq;

  if (provider && typeof provider.listAccounts === 'function') {
    try {
      const accounts = await provider.listAccounts();
      if (Array.isArray(accounts)) {
        userAccountsCache = accounts;
        return accounts;
      }
    } catch (e: any) {
      console.warn('Nimiq provider listAccounts failed or permission denied:', e);
    }
  }

  return userAccountsCache;
}

export async function initializeNimiqSdk(): Promise<NimiqSdkContext> {
  let isAvailable = false;
  const win = window as any;

  try {
    // 1. Initialize Nimiq Mini App SDK helper with 10s timeout
    const nimiq = await init({ timeout: 10000 });
    if (nimiq) {
      nimiqProviderInstance = nimiq;
      isAvailable = true;
    }
  } catch (e) {
    console.log('Nimiq Pay SDK initialization info: Running in browser or provider standby');
    if (win.nimiq) {
      nimiqProviderInstance = win.nimiq;
      isAvailable = true;
    }
  }

  // 2. Obtain device identifier using @nimiq/mini-app-sdk
  const deviceId = await getDeviceId();

  // 3. Obtain user language from window.nimiqPay.language (ISO 639-1 two-letter code e.g. 'en')
  const language = win.nimiqPay?.language || navigator.language?.split('-')[0] || 'en';

  // 4. Try fetching user accounts if provider is ready (silent request or cached)
  let accounts: string[] = [];
  if (isAvailable && nimiqProviderInstance && typeof nimiqProviderInstance.listAccounts === 'function') {
    try {
      const fetched = await nimiqProviderInstance.listAccounts();
      if (Array.isArray(fetched)) {
        accounts = fetched;
        userAccountsCache = fetched;
      }
    } catch (err) {
      console.log('listAccounts requires user action or confirmation dialog');
    }
  }

  return {
    isSdkAvailable: isAvailable,
    deviceId,
    language,
    userAddress: accounts.length > 0 ? accounts[0] : null,
    accounts,
    nimiqProvider: nimiqProviderInstance
  };
}

export async function runThreeProviderRequests(): Promise<{
  accounts: string[] | null;
  consensus: boolean | null;
  blockNumber: number | null;
}> {
  const win = window as any;
  const provider = nimiqProviderInstance || win.nimiq;

  if (!provider) {
    return {
      accounts: ['NQ07-TEST-DEMO-ACCOUNT-01'],
      consensus: true,
      blockNumber: 348920
    };
  }

  const [accountsResult, consensusResult, blockResult] = await Promise.all([
    typeof provider.listAccounts === 'function' ? provider.listAccounts() : Promise.resolve([]),
    typeof provider.isConsensusEstablished === 'function' ? provider.isConsensusEstablished() : Promise.resolve(true),
    typeof provider.getBlockNumber === 'function' ? provider.getBlockNumber() : Promise.resolve(0),
  ]);

  const accountsError = getProviderErrorMessage(accountsResult);
  if (accountsError) {
    throw new Error(accountsError);
  }

  return {
    accounts: Array.isArray(accountsResult) ? accountsResult : [],
    consensus: Boolean(consensusResult),
    blockNumber: typeof blockResult === 'number' ? blockResult : 0
  };
}

function extractTxHash(res: any): string {
  if (typeof res === 'string' && res.trim().length > 0) return res;
  if (res && typeof res === 'object') {
    return res.hash || res.txHash || res.transactionHash || res.id || 'NIM_TX_' + Date.now();
  }
  return 'NIM_TX_' + Date.now();
}

export async function requestNimPayment(
  amountNim: number, 
  recipientAddress: string,
  orderId?: string
): Promise<{ success: boolean; txHash?: string }> {
  console.log(`Requesting ${amountNim} NIM payment to ${recipientAddress} for Order #${orderId || ''}`);
  const win = window as any;
  const provider = nimiqProviderInstance || win.nimiq;
  const valueLuna = Math.round(amountNim * 1e5); // 1 NIM = 100,000 Luna

  // 1. Try sendBasicTransactionWithData (Nimiq Provider API)
  if (provider && typeof provider.sendBasicTransactionWithData === 'function') {
    try {
      const res = await provider.sendBasicTransactionWithData({
        recipient: recipientAddress,
        value: valueLuna,
        data: orderId ? `Story Commission #${orderId.substring(0, 8)}` : 'Storybook Commission'
      });
      const txHash = extractTxHash(res);
      return { success: true, txHash };
    } catch (e: any) {
      console.error('Nimiq provider sendBasicTransactionWithData failed:', e);
      if (e?.name === 'PermissionDeniedError' || e?.message?.includes('PermissionDeniedError')) {
        throw new Error('Transaction request was declined in Nimiq Pay.');
      }
      throw new Error(e?.message || 'Transaction failed in Nimiq Pay wallet.');
    }
  }

  // 2. Try sendBasicTransaction (Nimiq Provider API)
  if (provider && typeof provider.sendBasicTransaction === 'function') {
    try {
      const res = await provider.sendBasicTransaction({
        recipient: recipientAddress,
        value: valueLuna
      });
      const txHash = extractTxHash(res);
      return { success: true, txHash };
    } catch (e: any) {
      console.error('Nimiq provider sendBasicTransaction failed:', e);
      if (e?.name === 'PermissionDeniedError' || e?.message?.includes('PermissionDeniedError')) {
        throw new Error('Transaction request was declined in Nimiq Pay.');
      }
      throw new Error(e?.message || 'Transaction failed in Nimiq Pay wallet.');
    }
  }

  // 3. Try legacy / custom requestPayment if available
  if (provider && typeof provider.requestPayment === 'function') {
    try {
      const result = await provider.requestPayment({
        recipient: recipientAddress,
        amount: valueLuna,
        label: 'Illustrated Story Commission'
      });
      const txHash = extractTxHash(result);
      return {
        success: true,
        txHash
      };
    } catch (e: any) {
      console.error('Nimiq provider requestPayment failed:', e);
      throw new Error(e?.message || 'Payment was cancelled or failed in wallet.');
    }
  }

  // 4. Standalone Browser fallback - Throw error because payments & generations require Nimiq Pay
  console.warn('Attempted NIM payment outside Nimiq Pay provider');
  throw new Error('Nimiq Pay App Required: Payments and AI generations can only be executed inside Nimiq Pay. Please open this Mini App inside Nimiq Pay.');
}





