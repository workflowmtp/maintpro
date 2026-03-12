import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Map collection names to Prisma model names
const MODEL_MAP: Record<string, string> = {
  users: 'user',
  poles: 'pole',
  ateliers: 'atelier',
  techniciens: 'technicien',
  operateurs: 'operateur',
  chefs_atelier: 'chefAtelier',
  machines: 'machine',
  organes: 'organe',
  causes: 'cause',
  pieces: 'piece',
  interventions: 'intervention',
  actions: 'action',
  stock_movements: 'stockMovement',
  demandes_achat: 'demandeAchat',
  sous_traitances: 'sousTraitance',
  taches_preventives: 'tachePreventive',
  signalements: 'signalement',
  company_info: 'companyInfo',
};

function getModel(collection: string): any {
  const modelName = MODEL_MAP[collection];
  if (!modelName) return null;
  return (prisma as any)[modelName];
}

// GET — Fetch all items from a collection
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const model = getModel(collection);
    if (!model) {
      return NextResponse.json({ error: 'Collection inconnue: ' + collection }, { status: 404 });
    }

    const items = await model.findMany();

    // Strip password from users
    if (collection === 'users') {
      const safe = items.map((u: any) => {
        const { password, ...rest } = u;
        return rest;
      });
      return NextResponse.json(safe);
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — Create or upsert an item
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const model = getModel(collection);
    if (!model) {
      return NextResponse.json({ error: 'Collection inconnue: ' + collection }, { status: 404 });
    }

    const data = await req.json();

    if (data.id) {
      const existing = await model.findUnique({ where: { id: data.id } });
      if (existing) {
        const updated = await model.update({ where: { id: data.id }, data });
        return NextResponse.json(updated);
      }
    }

    const created = await model.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT — Update an item by id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const model = getModel(collection);
    if (!model) {
      return NextResponse.json({ error: 'Collection inconnue: ' + collection }, { status: 404 });
    }

    const data = await req.json();
    if (!data.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updated = await model.update({ where: { id: data.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — Delete an item by id (pass id as query param)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const model = getModel(collection);
    if (!model) {
      return NextResponse.json({ error: 'Collection inconnue: ' + collection }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await model.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
