import { notFound } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Viewer3D } from "@/components/3d/Viewer3D";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/types/project";

interface ViewPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single<Project>();

  if (!project) {
    notFound();
  }

  if (project.status !== "completed" || !project.model_glb_url) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <Card className="max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            {project.status === "processing" ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <Clock className="h-10 w-10 text-primary" />
            )}
            <h1 className="text-xl font-semibold">
              {project.status === "processing"
                ? "Váš 3D model se právě zpracovává"
                : "Váš půdorys čeká na zpracování"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Jakmile bude model hotový, objeví se automaticky přímo na této
              stránce. Odkaz si uložte — pošleme vám ho i na e-mail{" "}
              <span className="font-medium">{project.client_email}</span>.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Viewer3D
          modelUrl={project.model_glb_url}
          projectName={`Byt — ${project.client_name}`}
        />
      </div>
    </main>
  );
}
