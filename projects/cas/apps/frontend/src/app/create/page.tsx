import { redirect } from 'next/navigation';

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default export.
export default function CreatePage() {
  redirect('/');
}
