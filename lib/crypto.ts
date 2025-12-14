import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}


const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
let warnedMissingKey = false;
let warnedInvalidKey = false;

function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!keyHex) {
    if (!warnedMissingKey) {
      console.warn(
        "MESSAGE_ENCRYPTION_KEY is missing; storing messages unencrypted. Set a 64-char hex string in .env for AES-256-GCM encryption."
      );
      warnedMissingKey = true;
    }
    return null;
  }
  // Validate hex length (must be 64 hex chars => 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    if (!warnedInvalidKey) {
      console.warn(
        "MESSAGE_ENCRYPTION_KEY has invalid length or non-hex characters; storing messages unencrypted. Provide a 64-character hex string (32 bytes) in .env for AES-256-GCM."
      );
      warnedInvalidKey = true;
    }
    return null;
  }

  return Buffer.from(keyHex, "hex");
}

export function encryptMessage(plainText: string): { iv?: string; encrypted: string; tag?: string } {
  const key = getEncryptionKey();
  if (!key) {
    // Store plaintext when no key configured or invalid key (dev fallback)
    return { encrypted: plainText };
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      iv: iv.toString('hex'),
      encrypted: encrypted.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (err) {
    console.warn("encryptMessage failed, falling back to plaintext storage:", err);
    return { encrypted: plainText };
  }
}

export function decryptMessage({ iv, encrypted, tag }: { iv?: string; encrypted: string; tag?: string }): string {
  const key = getEncryptionKey();
  if (!key || !iv || !tag) {
    // No encryption used; return as-is
    return encrypted;
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
