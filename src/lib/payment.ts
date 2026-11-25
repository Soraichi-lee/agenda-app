import { supabase } from './supabase'

export type ItemType = 'premium' | 'theme' | 'hero' | 'freeze' | 'double'
export type PayResult = 'paid' | 'pending' | 'closed' | 'error'

type SnapCallbacks = {
  onSuccess?: () => void
  onPending?: () => void
  onError?: () => void
  onClose?: () => void
}
declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void }
  }
}

const SNAP_URL = import.meta.env.VITE_MIDTRANS_SNAP_URL ?? 'https://app.sandbox.midtrans.com/snap/snap.js'

function loadSnap(): Promise<void> {
  if (window.snap) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SNAP_URL
    s.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY)
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'))
    document.head.appendChild(s)
  })
}

/** Tunggu sampai webhook menandai pesanan lunas (maks ~30 detik). */
async function waitUntilPaid(orderId: string): Promise<boolean> {
  for (let i = 0; i < 15; i++) {
    const { data } = await supabase.from('orders').select('status').eq('order_id', orderId).maybeSingle()
    if (data?.status === 'paid') return true
    if (data?.status === 'failed') return false
    await new Promise((r) => setTimeout(r, 2000))
  }
  return false
}

/**
 * Alur pembayaran:
 *  1. minta snap token ke Edge Function create-transaction
 *  2. tampilkan popup Midtrans
 *  3. tunggu konfirmasi dari server (webhook), bukan dari popup
 */
export async function buyWithMoney(itemType: ItemType, itemId: string): Promise<PayResult> {
  try {
    const { data, error } = await supabase.functions.invoke('create-transaction', { body: { itemType, itemId } })
    if (error || !data?.token) return 'error'
    const { token, order_id } = data as { token: string; order_id: string }

    await loadSnap()
    const outcome = await new Promise<'finished' | 'closed' | 'error'>((resolve) => {
      window.snap!.pay(token, {
        onSuccess: () => resolve('finished'),
        onPending: () => resolve('finished'),
        onError: () => resolve('error'),
        onClose: () => resolve('closed'),
      })
    })
    if (outcome === 'error') return 'error'
    if (outcome === 'closed') {
      // Popup ditutup; bisa jadi pembayaran sudah masuk, cek sekali.
      const { data: o } = await supabase.from('orders').select('status').eq('order_id', order_id).maybeSingle()
      return o?.status === 'paid' ? 'paid' : 'closed'
    }
    return (await waitUntilPaid(order_id)) ? 'paid' : 'pending'
  } catch {
    return 'error'
  }
}
