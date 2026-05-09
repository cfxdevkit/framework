'use client';

import dynamic from 'next/dynamic';

const CreateStrategyView = dynamic(
  () => import('./CreateStrategyView').then((module) => module.CreateStrategyView),
  { ssr: false },
);

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default page export.
export default function CreateStrategyPage() {
  return <CreateStrategyView />;
}
