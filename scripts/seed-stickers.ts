// Run with: npx tsx scripts/seed-stickers.ts
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
import { STICKERS } from '../src/lib/stickers-data.ts'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use raw fetch to bypass Supabase SDK browser-detection guard on sb_secret_ keys.
// Prefer resolution=merge-duplicates performs an upsert on the unique `numero` column.
const res = await fetch(`${url}/rest/v1/stickers`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'X-Client-Info': 'supabase-js-node/2.0.0',
  },
  body: JSON.stringify(STICKERS),
})

if (!res.ok) {
  const text = await res.text()
  console.error(`Seed failed (${res.status}):`, text)
  process.exit(1)
}

console.log(`Seeded ${STICKERS.length} stickers OK`)
