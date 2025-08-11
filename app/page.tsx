'use client';

import dynamic from 'next/dynamic';

// Import the Terminal component dynamically to avoid SSR issues
const Terminal = dynamic(
  () => import('./components/Terminal'),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <Terminal />
    </main>
  );
}
