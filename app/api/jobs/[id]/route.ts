import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Job } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'jobs.json');

function readJobs(): Job[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJobs(jobs: Job[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobs = readJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await req.json();
  const jobs = readJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  jobs[idx] = { ...jobs[idx], ...updates, updatedAt: new Date().toISOString() };
  writeJobs(jobs);
  return NextResponse.json(jobs[idx]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobs = readJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  writeJobs(filtered);
  return NextResponse.json({ success: true });
}
