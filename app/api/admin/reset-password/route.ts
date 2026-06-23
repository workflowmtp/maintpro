import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateResetToken } from '@/lib/reset-token';

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

    const token = generateResetToken(userId);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    return NextResponse.json({ success: true, link });
  } catch (error: any) {
    console.error('Reset password link error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
