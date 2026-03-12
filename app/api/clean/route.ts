import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Delete all demo data in correct order (respect foreign key constraints)
    await prisma.stockMovement.deleteMany({});
    await prisma.action.deleteMany({});
    await prisma.sousTraitance.deleteMany({});
    await prisma.demandeAchat.deleteMany({});
    await prisma.signalement.deleteMany({});
    await prisma.intervention.deleteMany({});
    await prisma.tachePreventive.deleteMany({});
    await prisma.piece.deleteMany({});
    await prisma.organe.deleteMany({});
    await prisma.machine.deleteMany({});
    await prisma.cause.deleteMany({});
    await prisma.chefAtelier.deleteMany({});
    await prisma.operateur.deleteMany({});
    await prisma.technicien.deleteMany({});
    await prisma.atelier.deleteMany({});
    await prisma.pole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.companyInfo.deleteMany({});

    return NextResponse.json({ message: 'Toutes les donnees ont ete supprimees', cleaned: true });
  } catch (error: any) {
    console.error('Clean error:', error);
    return NextResponse.json({ error: 'Erreur: ' + error.message }, { status: 500 });
  }
}
