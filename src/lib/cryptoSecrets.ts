import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

// Server-only encryption for secrets we have to store per-business (e.g. a
// business's own Stripe secret key) but must never hand back to the
// browser in plaintext. AES-256-GCM with the key derived from
// STRIPE_KEY_ENCRYPTION_SECRET; stored as `iv:authTag:ciphertext`, each
// base64. Never import this from a 'use client' file.

export class SecretsNotConfiguredError extends Error {}

function getKey(): Buffer {
  const secret = process.env.STRIPE_KEY_ENCRYPTION_SECRET
  if (!secret) {
    throw new SecretsNotConfiguredError('STRIPE_KEY_ENCRYPTION_SECRET is not configured')
  }
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':')
}

export function decryptSecret(stored: string): string {
  const key = getKey()
  const [ivB64, authTagB64, ciphertextB64] = stored.split(':')
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted secret')
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()])
  return plaintext.toString('utf8')
}
