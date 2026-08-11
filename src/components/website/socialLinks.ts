import type { ComponentType } from 'react'
import { SiFacebook, SiInstagram, SiPinterest, SiTiktok, SiYoutube } from 'react-icons/si'
import { FaLinkedin } from 'react-icons/fa6'
import type { Website } from '@/types'

type SocialField = 'socialYoutube' | 'socialFacebook' | 'socialInstagram' | 'socialTiktok' | 'socialLinkedin' | 'socialPinterest'

export const SOCIAL_PLATFORMS: Array<{ field: SocialField; label: string; icon: ComponentType<{ className?: string }> }> = [
  { field: 'socialYoutube', label: 'YouTube', icon: SiYoutube },
  { field: 'socialFacebook', label: 'Facebook', icon: SiFacebook },
  { field: 'socialInstagram', label: 'Instagram', icon: SiInstagram },
  { field: 'socialTiktok', label: 'TikTok', icon: SiTiktok },
  { field: 'socialLinkedin', label: 'LinkedIn', icon: FaLinkedin },
  { field: 'socialPinterest', label: 'Pinterest', icon: SiPinterest },
]

type ConfiguredSocialLink = { field: SocialField; label: string; icon: ComponentType<{ className?: string }>; url: string }

export function configuredSocialLinks(website: Pick<Website, SocialField>): ConfiguredSocialLink[] {
  return SOCIAL_PLATFORMS.map((platform) => ({ ...platform, url: website[platform.field] })).filter(
    (platform): platform is ConfiguredSocialLink => Boolean(platform.url)
  )
}
