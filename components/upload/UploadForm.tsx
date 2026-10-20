"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitProject } from "@/app/actions/submit-project";
import { ALLOWED_FLOOR_PLAN_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (!ALLOWED_FLOOR_PLAN_TYPES.includes(selected.type)) {
      setError("Nepodporovaný formát. Použijte PDF, PNG nebo JPG.");
      return;
    }
    setError(null);
    setFile(selected);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0] ?? null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (file) formData.set("floor_plan", file);

    startTransition(async () => {
      const result = await submitProject(formData);
      if (!result.success) {
        setError(result.error ?? "Něco se nepovedlo. Zkuste to znovu.");
        return;
      }
      router.push(`/view/${result.slug}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2">
            {file.type === "application/pdf" ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <ImageIcon className="h-5 w-5 text-primary" />
            )}
            <span className="text-sm font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">
                Přetáhněte sem svůj půdorys, nebo klikněte pro výběr
              </p>
              <p className="text-sm text-muted-foreground">
                Podporované formáty: PDF, PNG, JPG (max. 25 MB)
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client_name">Jméno a příjmení</Label>
          <Input id="client_name" name="client_name" required placeholder="Jan Novák" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_email">E-mail</Label>
          <Input
            id="client_email"
            name="client_email"
            type="email"
            required
            placeholder="jan@novak.cz"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Nahrávám…" : "Odeslat půdorys"}
      </Button>
    </form>
  );
}
