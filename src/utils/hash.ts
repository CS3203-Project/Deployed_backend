import { hash as _hash, compare } from 'bcrypt';

export async function hashPassword(plainText: string): Promise<string> {
  return await _hash(plainText, 10);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return await compare(plainText, hash);
}
