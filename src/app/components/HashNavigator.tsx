// src/app/components/HashNavigator.tsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function HashNavigator() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        // Smooth scroll to the element
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [pathname]);

  return null;
}
