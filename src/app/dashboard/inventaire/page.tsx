import { redirect } from 'next/navigation';

export default function LegacyInventaireRedirect() {
  redirect('/dashboard/owner/inventaire');
}
