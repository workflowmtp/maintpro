require('dotenv').config();

const h = process.env.DB_HOST;
const p = process.env.DB_PORT || '5432';
const n = process.env.DB_NAME;
const u = encodeURIComponent(process.env.DB_USER);
const pw = encodeURIComponent(process.env.DB_PASSWORD);

const urls = [
    { label: 'No params', url: `postgresql://${u}:${pw}@${h}:${p}/${n}` },
    { label: 'sslmode=require', url: `postgresql://${u}:${pw}@${h}:${p}/${n}?sslmode=require` },
    { label: 'sslmode=prefer', url: `postgresql://${u}:${pw}@${h}:${p}/${n}?sslmode=prefer` },
    { label: 'sslmode=disable', url: `postgresql://${u}:${pw}@${h}:${p}/${n}?sslmode=disable` },
    { label: 'connect_timeout=30', url: `postgresql://${u}:${pw}@${h}:${p}/${n}?connect_timeout=30` },
    { label: 'connect_timeout=30&sslmode=disable', url: `postgresql://${u}:${pw}@${h}:${p}/${n}?connect_timeout=30&sslmode=disable` },
    { label: 'connect_timeout=30&sslmode=require', url: `postgresql://${u}:${pw}@${h}:${p}/${n}?connect_timeout=30&sslmode=require` },
];

const { PrismaClient } = require('@prisma/client');

async function test() {
    for (const cfg of urls) {
        console.log('\n--- Testing:', cfg.label, '---');
        console.log('URL:', cfg.url.replace(pw, '****'));
        const prisma = new PrismaClient({ datasources: { db: { url: cfg.url } } });
        try {
            await prisma.$connect();
            console.log('SUCCESS!');
            await prisma.$disconnect();
            return;
        } catch (e) {
            console.log('FAILED:', e.message.split('\n')[0]);
            await prisma.$disconnect().catch(() => {});
        }
    }
    console.log('\n\nAll Prisma tests failed. Trying raw pg...');
    const { Client } = require('pg');
    const rawConfigs = [
        { label: 'pg no SSL', ssl: false },
        { label: 'pg SSL rejectUnauthorized=false', ssl: { rejectUnauthorized: false } },
    ];
    for (const cfg of rawConfigs) {
        console.log('\n--- Testing:', cfg.label, '---');
        const client = new Client({
            host: process.env.DB_HOST,
            port: parseInt(p),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: cfg.ssl,
            connectionTimeoutMillis: 15000,
        });
        try {
            await client.connect();
            const res = await client.query('SELECT NOW()');
            console.log('SUCCESS! Server time:', res.rows[0].now);
            await client.end();
            return;
        } catch (e) {
            console.log('FAILED:', e.message);
            try { await client.end(); } catch {}
        }
    }
}
test();