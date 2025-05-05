import { redirect } from "next/navigation";
import { Dashboard } from "~/app/_components/dashboard";
import { auth } from "~/server/auth";

export default async function DocumentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[3rem]">
          Your Documents
        </h1>
        <Dashboard />
      </div>
    </main>
  );
}