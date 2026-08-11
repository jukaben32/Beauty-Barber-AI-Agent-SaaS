// Script para crear un business de demo via Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run this script')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // First check if any business exists
  const { data: existingBusiness, error: listError } = await supabase
    .from('businesses')
    .select('id, slug, name')
    .limit(5)

  if (listError) {
    console.error('List error:', listError.message)
    return
  }

  if (existingBusiness && existingBusiness.length > 0) {
    console.log('Existing businesses:', JSON.stringify(existingBusiness, null, 2))
    console.log('Using slug:', existingBusiness[0].slug)
    return
  }

  console.log('No businesses found. Creating one...')

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Salon',
      slug: 'test-salon-demo',
      specialty: 'Hair & Beauty',
      description: 'Demo business for Voice Widget testing',
      timezone: 'America/Mexico_City',
      booking_deposit_amount: 49,
      payment_currency: 'USD',
      payment_chain_id: 137,
      onboarding_step: 'profile',
    })
    .select()

  if (error) {
    console.error('Create error:', error.message)
  } else {
    console.log('Created business:', JSON.stringify(data, null, 2))
  }
}

main().catch(console.error)
