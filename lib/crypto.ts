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

function getEncryptionKey(): Buffer {
  const keyHex = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("MESSAGE_ENCRYPTION_KEY is missing. Set it in your .env as a 64-char hex string.");
  }
  return Buffer.from(keyHex, "hex");
}

export function encryptMessage(plainText: string): { iv: string; encrypted: string; tag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptMessage({ iv, encrypted, tag }: { iv: string; encrypted: string; tag: string }): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
