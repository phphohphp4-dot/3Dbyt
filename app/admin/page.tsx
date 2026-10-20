import { createAdminClient } from "@/lib/supabase/admin";
import { ProjectsTable } from "@/components/admin/ProjectsTable";
import { LogoutButton } from "@/components/admin/LogoutButton";
import type { Project } from "@/types/project";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Project[]>();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projekty</h1>
        <LogoutButton />
      </div>
      <ProjectsTable projects={projects ?? []} />
    </main>
  );
}
