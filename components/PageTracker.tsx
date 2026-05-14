'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    const timeout = setTimeout(() => {
      try {
        navigator.sendBeacon('/api/track', JSON.stringify({ path: pathname }));
      } catch {}
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
