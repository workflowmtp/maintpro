import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const RESET_SECRET = process.env.RESET_SECRET || 'maintpro-reset-default-secret';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function sign(data: string) {
  return crypto.createHmac('sha256', RESET_SECRET).update(data).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const timestamp = Date.now();
    const payload = `${userId}|${timestamp}`;
    const signature = sign(payload);
    const token = Buffer.from(`${payload}|${signature}`).toString('base64');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    return NextResponse.json({ success: true, link });
  } catch (error: any) {
    console.error('Reset password link error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Also export helpers for the reset page API
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, timestampStr, signature] = decoded.split('|');
    if (!userId || !timestampStr || !signature) return null;

    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > TOKEN_TTL_MS) return null;

    const expected = sign(`${userId}|${timestampStr}`);
    if (signature !== expected) return null;

    return { userId };
  } catch {
    return null;
  }
}
