import { redirect } from 'next/navigation';

export default function DocumentPage({ params }: { params: { id: string } }) {
  if (params.id) {
    redirect(`/view/${params.id}`);
  }

  // Fallback redirect in case params.id is missing for some reason
  redirect('/editor');
}
