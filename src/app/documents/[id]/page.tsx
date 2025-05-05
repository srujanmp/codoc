import { notFound, redirect } from "next/navigation";
import { DocumentView } from "~/app/_components/document-view";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const document = await api.document.getById({ id: params.id });
  if (!document) notFound();

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <DocumentView document={document} userId={session.user.id} />
    </main>
  );
}
