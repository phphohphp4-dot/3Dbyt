"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_FLOOR_PLAN_TYPES,
  FLOOR_PLAN_BUCKET,
  MAX_FLOOR_PLAN_SIZE_MB,
} from "@/lib/constants";
import { generateProjectSlug } from "@/lib/slug";

export interface SubmitProjectResult {
  success: boolean;
  slug?: string;
  error?: string;
}

export async function submitProject(
  formData: FormData,
): Promise<SubmitProjectResult> {
  const clientName = (formData.get("client_name") as string | null)?.trim();
  const clientEmail = (formData.get("client_email") as string | null)?.trim();
  const file = formData.get("floor_plan") as File | null;

  if (!clientName) {
    return { success: false, error: "Zadejte prosím své jméno." };
  }
  if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return { success: false, error: "Zadejte prosím platný e-mail." };
  }
  if (!file || file.size === 0) {
    return { success: false, error: "Nahrajte prosím půdorys (PDF, PNG nebo JPG)." };
  }
  if (!ALLOWED_FLOOR_PLAN_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Nepodporovaný formát souboru. Použijte PDF, PNG nebo JPG.",
    };
  }
  if (file.size > MAX_FLOOR_PLAN_SIZE_MB * 1024 * 1024) {
    return {
      success: false,
      error: `Soubor je příliš velký (max. ${MAX_FLOOR_PLAN_SIZE_MB} MB).`,
    };
  }

  const supabase = createAdminClient();
  const slug = generateProjectSlug(clientName);
  const extension = file.name.split(".").pop() || "bin";
  const storagePath = `${slug}/floor-plan.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(FLOOR_PLAN_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Floor plan upload failed:", uploadError);
    return { success: false, error: "Nahrání souboru se nezdařilo. Zkuste to znovu." };
  }

  const { data: publicUrlData } = supabase.storage
    .from(FLOOR_PLAN_BUCKET)
    .getPublicUrl(storagePath);

  const { error: insertError } = await supabase.from("projects").insert({
    slug,
    client_name: clientName,
    client_email: clientEmail,
    status: "pending",
    floor_plan_url: publicUrlData.publicUrl,
  });

  if (insertError) {
    console.error("Project insert failed:", insertError);
    return { success: false, error: "Vytvoření projektu se nezdařilo. Zkuste to znovu." };
  }

  return { success: true, slug };
}
