// Menerima notifikasi pembayaran dari Midtrans, memverifikasi signature,
// lalu memberi item/premium ke pengguna. Deploy dengan --no-verify-jwt.
import { createClient } from 'npm:@supabase/supabase-js@2'

async function sha512(text: string) {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  // Dashboard Midtrans baru punya Server Key dan Signature Secret Key.
  // Notifikasi dianggap asli bila signature cocok dengan salah satunya.
  const secrets = [
    Deno.env.get('MIDTRANS_SERVER_KEY'),
    Deno.env.get('MIDTRANS_SIGNATURE_SECRET_KEY'),
  ].filter((k): k is string => !!k)

  const n = await req.json()
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = n

  // 1) Tolak notifikasi palsu: signature = SHA512(order_id + status_code + gross_amount + key)
  let valid = false
  for (const key of secrets) {
    if ((await sha512(`${order_id}${status_code}${gross_amount}${key}`)) === signature_key) {
      valid = true
      break
    }
  }
  if (!valid) return new Response('Invalid signature', { status: 401 })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 2) Cocokkan dengan pesanan di database, termasuk nominalnya.
  const { data: order } = await admin.from('orders').select('*').eq('order_id', order_id).maybeSingle()
  if (!order) return new Response('Order not found', { status: 404 })
  if (Math.round(Number(gross_amount)) !== order.amount) return new Response('Amount mismatch', { status: 400 })

  const paid =
    transaction_status === 'settlement' ||
    (transaction_status === 'capture' && fraud_status === 'accept')
  const failed = ['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)

  if (paid) {
    const { error } = await admin.rpc('fulfill_order', { p_order_id: order_id })
    if (error) return new Response('Fulfill error', { status: 500 }) // Midtrans akan mengirim ulang
  } else if (failed && order.status === 'pending') {
    await admin.from('orders').update({ status: 'failed' }).eq('order_id', order_id)
  }

  return new Response('OK', { status: 200 })
})