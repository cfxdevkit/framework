import { SiteLayout } from '../../site-layout';
import { BackLink } from '../back-link';
import { LedgerPanel } from '../ledger-panel';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function LedgerPage() {
  return (
    <SiteLayout>
      <BackLink />
      <LedgerPanel />
    </SiteLayout>
  );
}
