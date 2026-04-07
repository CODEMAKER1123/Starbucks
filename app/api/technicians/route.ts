import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_TECHNICIANS } from '@/lib/constants';

const DATA_FILE = path.join(process.cwd(), 'data', 'technicians.json');

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_TECHNICIANS));
  }
}

function readTechs(): string[] {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return DEFAULT_TECHNICIANS;
  }
}

function writeTechs(techs: string[]) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(techs, null, 2));
}

export async function GET() {
  return NextResponse.json(readTechs());
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const techs = readTechs();
    const trimmed = name.trim();
    if (techs.includes(trimmed)) {
      return NextResponse.json({ error: 'Technician already exists' }, { status: 400 });
    }
    techs.push(trimmed);
    writeTechs(techs);
    return NextResponse.json({ success: true, technicians: techs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { name } = await req.json();
    const techs = readTechs();
    const filtered = techs.filter((t) => t !== name);
    writeTechs(filtered);
    return NextResponse.json({ success: true, technicians: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
