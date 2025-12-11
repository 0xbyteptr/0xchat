// Browser-friendly AES-GCM decryption for messages
// Requires NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY as a 64-char hex (32 bytes).

const hexToBytes = (hex: string): Uint8Array => {
  if (!hex || hex.length % 2 !== 0) return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

export async function decryptMessageIfPossible(params: {
  encrypted: string;
  iv: string;
  tag: string;
  keyHex?: string;
}): Promise<string | null> {
  const { encrypted, iv, tag, keyHex } = params;
  if (!encrypted || !iv || !tag || !keyHex) return null;

  try {
    const keyBytes = hexToBytes(keyHex);
    if (keyBytes.length !== 32) return null; // Require 256-bit key

    const cipherBytes = hexToBytes(encrypted);
    const tagBytes = hexToBytes(tag);
    const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
    combined.set(cipherBytes, 0);
    combined.set(tagBytes, cipherBytes.length);

    const ivBytes = hexToBytes(iv);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes.buffer as ArrayBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes.buffer as ArrayBuffer },
      cryptoKey,
      combined
    );

    return new TextDecoder().decode(plainBuffer);
  } catch (error) {
    console.warn("Client decrypt failed, returning ciphertext", error);
    return null;
  }
}
