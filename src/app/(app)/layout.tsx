import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1">
      <Nav isAdmin={session.rol === "ADMIN"} nombre={session.nombre} />
      <main className="flex-1 overflow-x-hidden pb-16 sm:pb-0">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
