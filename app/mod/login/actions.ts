'use server';

import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs'; // kept for fallback if you later use a hash

function clean(v?: string) {
  // trim + strip one pair of surrounding quotes if present
  return (v ?? '').trim().replace(/^['"]|['"]$/g, '');
}

export async function authenticate(formData: FormData) {
  const typed = String(formData.get('password') ?? '');

  // Prefer simple plain password if provided, else fallback to bcrypt hash
  const plain = clean(process.env.MOD_PASSWORD);
  const hash = clean(process.env.MOD_PASSWORD_HASH);
  const secret = clean(process.env.AUTH_SECRET);
  const ttl = Number(process.env.AUTH_TTL_SECONDS || 60 * 60 * 24 * 30);

  if (!secret) {
    return { success: false, error: 'Server env not configured (missing AUTH_SECRET).' };
  }
  if (!plain && !hash) {
    return { success: false, error: 'No password configured. Set MOD_PASSWORD or MOD_PASSWORD_HASH.' };
  }

  // tiny delay to slow down brute force
  await new Promise((r) => setTimeout(r, 150));

  let ok = false;
  if (plain) {
    ok = typed === plain; // simple equality
  } else if (hash) {
    ok = await bcrypt.compare(typed, hash); // fallback to bcrypt if you kept a hash
  }

  if (!ok) return { success: false, error: 'Invalid password.' };

  const token = await new SignJWT({ role: 'mod' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(new TextEncoder().encode(secret));

  const jar = await cookies(); // Next 15: cookies() is async
  jar.set('mod_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ttl,
  });

  return { success: true };
}

export async function logout() {
  const jar = await cookies();
  jar.set('mod_auth', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
