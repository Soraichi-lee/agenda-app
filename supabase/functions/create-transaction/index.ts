// Membuat transaksi Midtrans Snap dan mengembalikan snap token ke frontend.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { findItem } from '../_shared/catalog.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')!
    const isProd = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'

    // 1) Pastikan pengguna sudah login (JWT dari frontend).
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'Belum login' }, 401)

    // 2) Harga ditentukan server dari katalog, bukan dari browser.
    const { itemType, itemId } = await req.json()
    const item = findItem(String(itemType), String(itemId))
    if (!item) return json({ error: 'Item tidak dikenal' }, 400)

    // 3) Catat pesanan berstatus pending.
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const orderId = `AGD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const { error: insertError } = await admin.from('orders').insert({
      order_id: orderId,
      user_id: user.id,
      item_type: item.type,
      item_id: item.id,
      name: item.name,
      amount: item.amount,
    })
    if (insertError) return json({ error: 'Gagal membuat pesanan' }, 500)

    // 4) Minta snap token ke Midtrans.
    const snapUrl = isProd
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
    const res = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Basic ' + btoa(serverKey + ':'),
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: item.amount },
        item_details: [{ id: item.id, price: item.amount, quantity: 1, name: item.name.slice(0, 50) }],
        customer_details: { email: user.email },
      }),
    })
    const snap = await res.json()
    if (!res.ok || !snap.token) {
      await admin.from('orders').update({ status: 'failed' }).eq('order_id', orderId)
      return json({ error: 'Midtrans menolak transaksi', detail: snap }, 502)
    }

    return json({ token: snap.token, order_id: orderId })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
