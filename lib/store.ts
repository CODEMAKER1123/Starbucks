'use client';

import {
  DEFAULT_PRICE,
  DEFAULT_SALES_TAX,
  DEFAULT_TECHNICIANS,
  DEFAULT_TOTAL_PRICE,
} from './constants';
import { Job } from './types';

function normalizeJob(job: Job): Job {
  const createdAt = job.createdAt || new Date().toISOString();
  const updatedAt = job.updatedAt || createdAt;

  return {
    ...job,
    price: job.price ?? DEFAULT_PRICE,
    salesTax: job.salesTax ?? DEFAULT_SALES_TAX,
    totalPrice: job.totalPrice ?? DEFAULT_TOTAL_PRICE,
    status: job.status || 'scheduled',
    createdAt,
    updatedAt,
  };
}

function normalizeTechnicians(technicians: string[]): string[] {
  const cleaned = technicians.map((t) => t.trim()).filter(Boolean);
  if (cleaned.length === 0) return DEFAULT_TECHNICIANS;
  return Array.from(new Set(cleaned));
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function getJobs(): Promise<Job[]> {
  const res = await fetch('/api/jobs', { cache: 'no-store' });
  const data = await parseJson<Job[]>(res);
  return Array.isArray(data) ? data.map(normalizeJob) : [];
}

export async function getJob(id: string): Promise<Job | null> {
  const res = await fetch(`/api/jobs/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  const data = await parseJson<Job>(res);
  return normalizeJob(data);
}

export async function saveJobs(jobs: Job[]): Promise<Job[]> {
  const normalized = jobs.map(normalizeJob);
  const res = await fetch('/api/jobs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized),
  });
  await parseJson<{ success: true }>(res);
  return normalized;
}

export async function addJobs(newJobs: Job | Job[]): Promise<number> {
  const toAdd = (Array.isArray(newJobs) ? newJobs : [newJobs]).map(normalizeJob);
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toAdd),
  });
  const data = await parseJson<{ success: boolean; count: number }>(res);
  return data.count;
}

export async function saveJob(job: Job): Promise<Job> {
  const existing = await getJob(job.id);
  if (!existing) {
    await addJobs(job);
    return normalizeJob(job);
  }
  const updated = await updateJob(job.id, job);
  if (!updated) throw new Error('Failed to save job');
  return updated;
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (res.status === 404) return null;
  const data = await parseJson<{ success: boolean; job: Job }>(res);
  return normalizeJob(data.job);
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
  await parseJson<{ success: true }>(res);
}

export async function getTechnicians(): Promise<string[]> {
  const res = await fetch('/api/technicians', { cache: 'no-store' });
  const data = await parseJson<string[]>(res);
  return Array.isArray(data) ? normalizeTechnicians(data) : DEFAULT_TECHNICIANS;
}

export async function saveTechnicians(technicians: string[]): Promise<string[]> {
  const normalized = normalizeTechnicians(technicians);
  const res = await fetch('/api/technicians', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized),
  });
  await parseJson<{ success: true; technicians: string[] }>(res);
  return normalized;
}
