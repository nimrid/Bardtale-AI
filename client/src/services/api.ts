import { Tier, Order, CreateOrderResponse, CustomizationForm } from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://bardtale-ai.onrender.com').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api`;

export async function fetchTiers(): Promise<{ receiver_wallet: string; tiers: Tier[] }> {
  const res = await fetch(`${API_BASE}/tiers`);
  if (!res.ok) throw new Error('Failed to fetch pricing tiers');
  return res.json();
}

export async function createOrder(deviceId: string, tierId: string, customization: CustomizationForm): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: deviceId,
      tier: tierId,
      customization_fields: customization
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create order');
  }
  return res.json();
}

export async function confirmOrderPayment(orderId: string, txHash?: string, walletAddress?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/confirm-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_hash: txHash,
      wallet_address: walletAddress,
      mock_confirm: true
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to confirm payment on server');
  }
  return res.json();
}

export async function fetchOrderStatus(orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`);
  if (!res.ok) throw new Error('Failed to fetch order status');
  const data = await res.json();
  if (data.order_id && !data.id) {
    data.id = data.order_id;
  }
  return data;
}

export async function fetchDeviceOrders(deviceId: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders?device_id=${encodeURIComponent(deviceId)}`);
  if (!res.ok) throw new Error('Failed to fetch device order history');
  return res.json();
}

export function getPdfDownloadUrl(orderId: string): string {
  return `${API_BASE}/orders/${orderId}/download`;
}

export function getPageImageUrl(orderId: string, pageNum: number): string {
  return `${API_BASE}/orders/${orderId}/images/${pageNum}`;
}

export async function createMusicTrack(deviceId: string, prompt: string, title?: string, duration: number = 30): Promise<{ track_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/music/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: deviceId,
      prompt,
      title: title || 'Bardic Ballad',
      duration,
      nim_amount: 2500.0
    })
  });
  if (!res.ok) throw new Error('Failed to start music generation task');
  return res.json();
}

export async function fetchMusicTrackStatus(trackId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/music/${trackId}/status`);
  if (!res.ok) throw new Error('Failed to fetch music status');
  return res.json();
}

export async function fetchDeviceMusicHistory(deviceId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/music?device_id=${encodeURIComponent(deviceId)}`);
  if (!res.ok) throw new Error('Failed to fetch music history');
  return res.json();
}

export function getMusicStreamUrl(trackId: string): string {
  return `${API_BASE}/music/${trackId}/stream`;
}
