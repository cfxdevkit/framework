import { SiteLayout } from '../../site-layout';
import { BackLink } from '../back-link';
import { MemoryPanel } from '../memory-panel';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function MemoryPage() {
  return (
    <SiteLayout>
      <BackLink />
      <MemoryPanel />
    </SiteLayout>
  );
}
