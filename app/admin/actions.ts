"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODEL_BUCKET, MAX_MODEL_SIZE_MB } from "@/lib/constants";
import type { ProjectStatus } from "@/types/project";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: "Nesprávný e-mail nebo heslo." };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateStatus(
  projectId: string,
  status: ProjectStatus,
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) {
    return { success: false, error: "Změna stavu se nezdařila." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function uploadModel(formData: FormData): Promise<ActionResult> {
  const projectId = formData.get("project_id") as string;
  const slug = formData.get("slug") as string;
  const file = formData.get("model_file") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "Vyberte prosím .glb soubor." };
  }
  if (!file.name.toLowerCase().match(/\.(glb|gltf)$/)) {
    return { success: false, error: "Podporovány jsou pouze soubory .glb nebo .gltf." };
  }
  if (file.size > MAX_MODEL_SIZE_MB * 1024 * 1024) {
    return { success: false, error: `Soubor je příliš velký (max. ${MAX_MODEL_SIZE_MB} MB).` };
  }

  const supabase = createAdminClient();
  const extension = file.name.split(".").pop();
  const storagePath = `${slug}/model.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(MODEL_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "model/gltf-binary",
      upsert: true,
    });

  if (uploadError) {
    console.error("Model upload failed:", uploadError);
    return { success: false, error: "Nahrání modelu se nezdařilo." };
  }

  const { data: publicUrlData } = supabase.storage
    .from(MODEL_BUCKET)
    .getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      model_glb_url: `${publicUrlData.publicUrl}?v=${Date.now()}`,
      status: "completed",
    })
    .eq("id", projectId);

  if (updateError) {
    console.error("Project update failed:", updateError);
    return { success: false, error: "Uložení modelu k projektu se nezdařilo." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/view/${slug}`);
  return { success: true };
}
