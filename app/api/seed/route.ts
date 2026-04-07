import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SEED_JOBS, DEFAULT_PRICE } from '@/lib/constants';
import { Job } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'jobs.json');

export async function POST() {
  const now = new Date().toISOString();
  const jobs: Job[] = SEED_JOBS.map((s) => ({
    id: uuidv4(),
    storeNumber: s.storeNumber,
    address: s.address,
    city: s.city,
    state: s.state,
    price: DEFAULT_PRICE,
    serviceDate: s.date,
    nightNumber: s.night,
    status: 'scheduled' as const,
    createdAt: now,
    updatedAt: now,
  }));

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  return NextResponse.json({ success: true, count: jobs.length });
}
