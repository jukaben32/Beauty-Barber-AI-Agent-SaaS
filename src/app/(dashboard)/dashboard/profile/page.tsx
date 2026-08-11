import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser, getBusinessMembership } from '@/services/business'
import { ProfileManager } from '@/components/dashboard/ProfileManager'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const membership = await getBusinessMembership(supabase, business.id, user.id)
  const role = business.ownerId === user.id ? 'owner' : (membership?.role ?? 'staff')

  return (
    <ProfileManager
      email={user.email ?? ''}
      fullName={typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''}
      role={role}
      businessName={business.name}
    />
  )
}
