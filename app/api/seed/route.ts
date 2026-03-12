import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { POLES, COMPANY_DEFAULT } from '@/lib/config';

export async function POST() {
  try {
    // Check if already seeded
    const poleCount = await prisma.pole.count();
    if (poleCount > 0) {
      return NextResponse.json({ message: 'Base de donnees deja initialisee', seeded: false });
    }

    // --- POLES ---
    for (const p of POLES) {
      await prisma.pole.create({ data: { id: p.id, nom: p.nom, code: p.code } });
    }

    // --- COMPANY INFO ---
    await prisma.companyInfo.create({
      data: {
        id: 'default',
        nom: COMPANY_DEFAULT.nom,
        adresse: COMPANY_DEFAULT.adresse,
        tel: COMPANY_DEFAULT.tel,
        email: COMPANY_DEFAULT.email,
        logo_text: COMPANY_DEFAULT.logo_text,
      },
    });

    // --- ADMIN PAR DEFAUT ---
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@maintpro.cm' } });
    if (!adminExists) {
      await prisma.user.create({
        data: {
          id: 'usr_admin',
          nom: 'Administrateur',
          email: 'admin@maintpro.cm',
          password: bcrypt.hashSync('admin1234', 10),
          login: 'admin',
          role: 'admin',
          pole_id: null,
          actif: true,
        },
      });
    }

    return NextResponse.json({
      message: 'Base de donnees initialisee avec succes!',
      seeded: true,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Erreur lors du seed: ' + error.message }, { status: 500 });
  }
}
