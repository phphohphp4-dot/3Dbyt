"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateStatus, uploadModel } from "@/app/admin/actions";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/types/project";

export function ProjectDetailForm({ project }: { project: Project }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isStatusPending, startStatusTransition] = useTransition();
  const [isUploadPending, startUploadTransition] = useTransition();

  function handleStatusChange(value: ProjectStatus | null) {
    if (!value) return;
    startStatusTransition(async () => {
      const result = await updateStatus(project.id, value);
      if (result.success) {
        toast.success("Stav projektu byl aktualizován.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Změna stavu se nezdařila.");
      }
    });
  }

  function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("project_id", project.id);
    formData.set("slug", project.slug);

    startUploadTransition(async () => {
      const result = await uploadModel(formData);
      if (result.success) {
        toast.success("3D model byl nahrán a projekt je nyní hotový.");
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.error ?? "Nahrání modelu se nezdařilo.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label>Stav projektu</Label>
        <Select
          defaultValue={project.status}
          onValueChange={handleStatusChange}
          disabled={isStatusPending}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleUploadSubmit} className="space-y-3">
        <Label htmlFor="model_file">Nahrát hotový 3D model (.glb / .gltf)</Label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            id="model_file"
            name="model_file"
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mr-1.5 h-4 w-4" />
            Vybrat soubor
          </Button>
          {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          <Button type="submit" disabled={!fileName || isUploadPending}>
            {isUploadPending ? "Nahrávám…" : "Nahrát model"}
          </Button>
        </div>
        {project.model_glb_url && (
          <p className="text-sm text-muted-foreground">
            Aktuální model je nahraný —{" "}
            <a
              href={`/view/${project.slug}`}
              target="_blank"
              className="text-primary hover:underline"
            >
              zobrazit prohlídku
            </a>
          </p>
        )}
      </form>
    </div>
  );
}
