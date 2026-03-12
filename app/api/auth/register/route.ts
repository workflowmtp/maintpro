import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { nom, email, password, role, pole_id } = await req.json();

    if (!nom || !email || !password) {
      return NextResponse.json({ error: 'Nom, email et mot de passe sont obligatoires' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est deja utilise' }, { status: 409 });
    }

    // Generate a login from email (part before @)
    const login = email.split('@')[0];

    // Check if login already exists, append number if needed
    let finalLogin = login;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { login: finalLogin } })) {
      finalLogin = login + counter;
      counter++;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nom,
        email,
        password: hashedPassword,
        login: finalLogin,
        role: role || 'operateur',
        pole_id: pole_id || null,
        actif: true,
      },
    });

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
