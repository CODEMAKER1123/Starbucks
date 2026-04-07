'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_TECHNICIANS } from './constants';

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<string[]>(DEFAULT_TECHNICIANS);

  useEffect(() => {
    fetch('/api/technicians')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTechnicians(data);
      })
      .catch(() => {});
  }, []);

  return technicians;
}
