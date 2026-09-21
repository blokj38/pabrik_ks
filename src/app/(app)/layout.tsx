import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar fullName={profile?.full_name ?? null} role={profile?.role ?? "kasir_sales"} />
      <main className="flex-1 overflow-x-hidden px-8 py-6">{children}</main>
    </div>
  );
}
