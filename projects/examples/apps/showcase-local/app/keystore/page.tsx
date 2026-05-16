import { redirect } from 'next/navigation';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function KeystorePage() {
  redirect('/');
}
