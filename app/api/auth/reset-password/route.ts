import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/app/api/admin/reset-password/route';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token et nouveau mot de passe requis' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caracteres' }, { status: 400 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Lien invalide ou expire' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'Mot de passe modifie' });
  } catch (error: any) {
    console.error('Reset password verify error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
