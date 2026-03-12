import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL non configure dans .env' }, { status: 500 });
    }

    const n8nUser = process.env.N8N_BASIC_AUTH_USER || 'multiprint';
    const n8nPassword = process.env.N8N_BASIC_AUTH_PASSWORD || 'Admin@1234';
    const basicAuth = Buffer.from(`${n8nUser}:${n8nPassword}`).toString('base64');

    const body = await req.json();

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Bot webhook error:', error);
    return NextResponse.json({ error: 'Erreur de connexion au webhook n8n' }, { status: 500 });
  }
}
