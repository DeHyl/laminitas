// Run with: npx tsx scripts/seed-stickers.ts
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
import { STICKERS } from '../src/lib/stickers-data.ts'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const headers = {
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates,return=minimal',
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'X-Client-Info': 'supabase-js-node/2.0.0',
}

// Upsert all stickers in batches of 200 (merge-duplicates on unique `numero`)
const BATCH = 200
let inserted = 0

for (let i = 0; i < STICKERS.length; i += BATCH) {
  const batch = STICKERS.slice(i, i + BATCH)
  const res = await fetch(`${url}/rest/v1/stickers?on_conflict=numero`, {
    method: 'POST',
    headers,
    body: JSON.stringify(batch),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Seed failed at batch ${i}-${i + BATCH} (${res.status}):`, text)
    process.exit(1)
  }

  inserted += batch.length
  console.log(`Inserted ${inserted}/${STICKERS.length}...`)
}

console.log(`✓ Seeded ${STICKERS.length} stickers OK`)
