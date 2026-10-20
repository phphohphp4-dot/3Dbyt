import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProjectDetailForm } from "@/components/admin/ProjectDetailForm";
import type { Project } from "@/types/project";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zpět na přehled
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{project.client_name}</CardTitle>
            <StatusBadge status={project.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="font-medium">{project.client_email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vytvořeno</dt>
              <dd className="font-medium">
                {new Date(project.created_at).toLocaleString("cs-CZ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-medium">{project.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Původní půdorys</dt>
              <dd>
                <Button
                  variant="link"
                  className="h-auto p-0"
                  render={
                    <a href={project.floor_plan_url} target="_blank" download>
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Stáhnout
                    </a>
                  }
                />
              </dd>
            </div>
          </dl>

          <ProjectDetailForm project={project} />
        </CardContent>
      </Card>
    </main>
  );
}
