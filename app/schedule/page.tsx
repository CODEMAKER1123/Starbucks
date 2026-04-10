'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Job } from '@/lib/types';
import { buildCompanyCamTimeAutofill } from '@/lib/companycam-time';
import { useTechnicians } from '@/lib/use-technicians';
import { getJobs, updateJob } from '@/lib/store';

type ViewMode = 'week' | 'month';

export default function SchedulePage() {
  const technicians = useTechnicians();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [bulkTech, setBulkTech] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkFillingTimes, setBulkFillingTimes] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getJobs();
        if (!cancelled) setJobs(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dates = view === 'week' ? getWeekDates(currentDate) : getMonthDates(currentDate);

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  }

  function toggleSelect(id: string) {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAssign() {
    if (!bulkTech || selectedJobs.size === 0) return;
    const updated = jobs.map((j) =>
      selectedJobs.has(j.id) ? { ...j, assignedTech: bulkTech, updatedAt: new Date().toISOString() } : j
    );

    for (const id of selectedJobs) {
      const job = updated.find((j) => j.id === id);
      if (job) {
        await updateJob(id, { assignedTech: bulkTech });
      }
    }

    setJobs(updated);
    setSelectedJobs(new Set());
    setBulkTech('');
  }

  async function bulkAutofillTimes() {
    if (selectedJobs.size === 0 || bulkFillingTimes) return;

    setBulkFillingTimes(true);
    setBulkStatus('Checking CompanyCam photo times...');

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const nextJobs = [...jobs];

    for (const id of selectedJobs) {
      const index = nextJobs.findIndex((job) => job.id === id);
      if (index === -1) continue;

      const job = nextJobs[index];

      try {
        const params = new URLSearchParams({ storeNumber: job.storeNumber });
        if (job.woNumber) params.set('woNumber', job.woNumber);

        const res = await fetch(`/api/companycam?${params.toString()}`);
        const data = await res.json();

        const photos = Array.isArray(data?.photos) ? data.photos : [];
        const result = buildCompanyCamTimeAutofill(job, photos);

        if (Object.keys(result.updates).length === 0) {
          skippedCount++;
          continue;
        }

        const updated = await updateJob(job.id, result.updates);
        if (updated) {
          nextJobs[index] = updated;
          updatedCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setJobs(nextJobs);
    setBulkFillingTimes(false);
    setBulkStatus(`CompanyCam batch fill done. Updated ${updatedCount}, skipped ${skippedCount}, errors ${errorCount}.`);
  }

  const headerLabel = view === 'week'
    ? `Week of ${dates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Schedule</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('week')} className={`px-3 py-1 rounded text-sm ${view === 'week' ? 'bg-[#00A4C7] text-white' : 'text-gray-400 hover:text-white'}`}>Week</button>
          <button onClick={() => setView('month')} className={`px-3 py-1 rounded text-sm ${view === 'month' ? 'bg-[#00A4C7] text-white' : 'text-gray-400 hover:text-white'}`}>Month</button>
        </div>
      </div>

      {/* Bulk assign */}
      {selectedJobs.size > 0 && (
        <div className="bg-[#111827] border border-[#00A4C7] rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-[#00A4C7]">{selectedJobs.size} selected</span>
            <select
              value={bulkTech}
              onChange={(e) => setBulkTech(e.target.value)}
              className="bg-[#0a0f1a] border border-[#374151] rounded px-2 py-1 text-sm text-gray-100"
            >
              <option value="">Assign tech...</option>
              {technicians.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={bulkAssign} disabled={!bulkTech} className="px-3 py-1 bg-[#00A4C7] text-white rounded text-sm disabled:opacity-50">Assign</button>
            <button
              onClick={bulkAutofillTimes}
              disabled={bulkFillingTimes}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
            >
              {bulkFillingTimes ? 'Filling Times...' : 'Fill Times from CompanyCam'}
            </button>
            <button onClick={() => setSelectedJobs(new Set())} className="px-3 py-1 text-gray-400 hover:text-white text-sm">Clear</button>
          </div>
          {bulkStatus && <p className="text-xs text-gray-400">{bulkStatus}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white px-3 py-1">&larr; Prev</button>
        <span className="text-white font-medium">{headerLabel}</span>
        <button onClick={() => navigate(1)} className="text-gray-400 hover:text-white px-3 py-1">Next &rarr;</button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading...</p>
      ) : (
        <div className={`grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-1`}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
          ))}

          {dates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayJobs = jobs.filter((j) => j.serviceDate === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dateStr}
                className={`min-h-[100px] bg-[#111827] rounded border p-2 ${
                  isToday ? 'border-[#00A4C7]' : 'border-[#1f2937]'
                }`}
              >
                <div className={`text-xs mb-1 ${isToday ? 'text-[#00A4C7] font-bold' : 'text-gray-500'}`}>
                  {date.getDate()}
                </div>
                {dayJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`text-xs p-1 mb-1 rounded cursor-pointer border ${
                      selectedJobs.has(job.id) ? 'border-[#00A4C7]' : 'border-transparent'
                    } ${
                      job.status === 'completed'
                        ? 'bg-green-900/30 text-green-400'
                        : job.assignedTech
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}
                    onClick={(e) => {
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        toggleSelect(job.id);
                      }
                    }}
                  >
                    <Link href={`/jobs/${job.id}`} className="block">
                      <div className="font-mono">#{job.storeNumber}</div>
                      <div className="text-[10px] opacity-70 truncate">{job.city}</div>
                      {job.assignedTech && (
                        <div className="text-[10px] opacity-50 truncate">{job.assignedTech.split(' ')[0]}</div>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-gray-500 flex gap-4">
        <span><span className="inline-block w-3 h-3 rounded bg-red-900/30 mr-1"></span>Unassigned</span>
        <span><span className="inline-block w-3 h-3 rounded bg-blue-900/30 mr-1"></span>Assigned</span>
        <span><span className="inline-block w-3 h-3 rounded bg-green-900/30 mr-1"></span>Completed</span>
        <span className="text-gray-600">Shift+Click to select multiple for bulk assign</span>
      </div>
    </div>
  );
}

function getWeekDates(d: Date): Date[] {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

function getMonthDates(d: Date): Date[] {
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const dates: Date[] = [];
  // fill from start of week
  for (let i = -startDay; i < 35; i++) {
    const date = new Date(year, month, 1 + i);
    dates.push(date);
  }
  return dates;
}
