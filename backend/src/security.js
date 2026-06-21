
export const MAX_TEXT_LENGTH = 50000;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function sanitizeText(input) {
  let t = typeof input === 'string' ? input : '';
  t = t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  t = t.replace(/<[^>]*>/g, ' ');
  t = t
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|the\s+|your\s+)?previous\s+instructions/i,
  /ignore\s+all\s+instructions/i,
  /\byou\s+are\s+now\b/i,
  /\bnew\s+instructions\b/i,
  /\bsystem\s+prompt\b/i,
  /\bdisregard\s+your\b/i,
  /\bforget\s+everything\b/i,
];
const ROLE_PREFIX = /^\s*(system|assistant|user)\s*:/i;

export function detectInjection(text) {
  if (!text) return false;
  if (ROLE_PREFIX.test(text)) return true;
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

export function sniffImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export function validateImage(base64) {
  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return { ok: false, error: 'invalid_image', message: 'That image could not be read. Please try a different photo.' };
  }
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: 'invalid_image', message: 'That image could not be read. Please try a different photo.' };
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'image_too_large', message: 'That image is too large. Please use a photo under 10 MB.' };
  }
  const mediaType = sniffImageType(buffer);
  if (!mediaType) {
    return { ok: false, error: 'unsupported_image', message: 'Only JPEG, PNG, or WebP photos are supported. Try taking the photo again.' };
  }
  return { ok: true, buffer, mediaType };
}
