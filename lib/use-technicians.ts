'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_TECHNICIANS } from './constants';
import { getTechnicians } from './store';

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<string[]>(DEFAULT_TECHNICIANS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getTechnicians();
        if (!cancelled) setTechnicians(data);
      } catch {
        if (!cancelled) setTechnicians(DEFAULT_TECHNICIANS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return technicians;
}
