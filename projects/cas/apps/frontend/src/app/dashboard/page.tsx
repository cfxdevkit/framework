'use client';

import dynamic from 'next/dynamic';

const CasConsole = dynamic(
  () => import('../../components/CasConsole').then((module) => module.CasConsole),
  { ssr: false },
);

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default page export.
export default function DashboardPage() {
  return <CasConsole />;
}
