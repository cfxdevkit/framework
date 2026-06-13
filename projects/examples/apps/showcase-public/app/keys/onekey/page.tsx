import { SiteLayout } from '../../site-layout';
import { BackLink } from '../back-link';
import { OneKeyPanel } from './panel';
import { OneKeyReferralCard } from './widgets';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function OneKeyPage() {
  return (
    <SiteLayout>
      <BackLink />
      <OneKeyPanel />
      <OneKeyReferralCard />
    </SiteLayout>
  );
}
