'use client';

import { useEffect, useState } from 'react';
import { getTechnicians, saveTechnicians } from '@/lib/store';

export default function SettingsPage() {
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getTechnicians();
        if (!cancelled) setTechnicians(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addTech() {
    if (!newName.trim()) return;
    setMessage('');
    const trimmed = newName.trim();
    if (technicians.includes(trimmed)) {
      setMessage('Technician already exists');
      return;
    }

    const updated = await saveTechnicians([...technicians, trimmed]);
    setTechnicians(updated);
    setNewName('');
    setMessage(`Added ${trimmed}`);
  }

  async function removeTech(name: string) {
    setMessage('');
    const updated = await saveTechnicians(technicians.filter((tech) => tech !== name));
    setTechnicians(updated);
    setMessage(`Removed ${name}`);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage technicians and preferences</p>
      </div>

      <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Technicians</h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <div className="space-y-2 mb-4">
            {technicians.map((tech) => (
              <div key={tech} className="flex items-center justify-between p-3 bg-[#0a0f1a] rounded border border-[#1f2937]">
                <span className="text-white text-sm">{tech}</span>
                <button
                  onClick={() => removeTech(tech)}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
            {technicians.length === 0 && (
              <p className="text-gray-500 text-sm">No technicians. Add one below.</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTech(); }}
            placeholder="New technician name"
            className="flex-1 bg-[#0a0f1a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-[#00A4C7] focus:outline-none"
          />
          <button
            onClick={addTech}
            disabled={!newName.trim()}
            className="px-4 py-2 bg-[#00A4C7] text-white rounded text-sm font-medium hover:bg-[#0090b0] transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {message && (
          <p className="text-[#00A4C7] text-sm mt-3">{message}</p>
        )}
      </div>
    </div>
  );
}
