/**
 * Encryption utilities for BYOK API keys
 *
 * Uses AES-256-GCM for secure encryption of user API keys.
 * Requires BYOK_ENCRYPTION_KEY environment variable (32-byte base64 encoded).
 *
 * Generate a key with: openssl rand -base64 32
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits

/**
 * Get the encryption key from environment variable
 * @throws Error if BYOK_ENCRYPTION_KEY is not configured
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.BYOK_ENCRYPTION_KEY
  if (!keyBase64) {
    throw new Error(
      'BYOK_ENCRYPTION_KEY environment variable is not configured. ' +
        'Generate one with: openssl rand -base64 32',
    )
  }

  const key = Buffer.from(keyBase64, 'base64')
  if (key.length !== 32) {
    throw new Error(
      `BYOK_ENCRYPTION_KEY must be 32 bytes (256 bits). Got ${key.length} bytes. ` +
        'Generate a valid key with: openssl rand -base64 32',
    )
  }

  return key
}

/**
 * Encrypt an API key using AES-256-GCM
 * @param plaintext - The API key to encrypt
 * @returns Base64 encoded string containing IV + ciphertext + auth tag
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])

  const authTag = cipher.getAuthTag()

  // Combine IV + encrypted data + auth tag
  const combined = Buffer.concat([iv, encrypted, authTag])

  return combined.toString('base64')
}

/**
 * Decrypt an API key using AES-256-GCM
 * @param ciphertext - Base64 encoded string containing IV + ciphertext + auth tag
 * @returns The decrypted API key
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decryptApiKey(ciphertext: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(ciphertext, 'base64')

  // Extract IV, encrypted data, and auth tag
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH,
  )

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Extract the last N characters of an API key for display purposes
 * @param apiKey - The full API key
 * @param length - Number of characters to show (default: 4)
 * @returns String like "...xxxx"
 */
export function getApiKeyLastChars(apiKey: string, length: number = 4): string {
  if (apiKey.length <= length) {
    return '...' + apiKey
  }
  return '...' + apiKey.slice(-length)
}

/**
 * Check if encryption is properly configured
 * @returns true if BYOK_ENCRYPTION_KEY is set and valid
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}
