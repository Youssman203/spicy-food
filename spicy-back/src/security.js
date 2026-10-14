import { scrypt as scryptCallback, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [kind, salt, hash] = stored.split(':');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const key = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export function normalizePhone(input) {
  let value = input.replace(/[\s().-]/g, '');
  if (/^0[89]\d{8}$/.test(value)) value = `+243${value.slice(1)}`;
  if (/^243[89]\d{8}$/.test(value)) value = `+${value}`;
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  return value;
}
