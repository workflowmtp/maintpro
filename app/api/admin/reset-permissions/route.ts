import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// Reset all role_permissions in DB to match current defaults from roles.ts
export async function POST() {
  try {
    const results: { roleId: string; count: number }[] = [];

    for (const [roleId, roleDef] of Object.entries(ROLES)) {
      const permissions = roleDef.permissions;
      // Upsert: create or update the role permission record
      await prisma.rolePermission.upsert({
        where: { id: roleId },
        update: { permissions },
        create: { id: roleId, permissions },
      });
      results.push({ roleId, count: permissions.length });
    }

    return NextResponse.json({ success: true, updated: results });
  } catch (error) {
    console.error('Reset permissions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
