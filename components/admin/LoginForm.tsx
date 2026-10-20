"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/app/admin/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn(formData);
      if (result && !result.success) {
        setError(result.error ?? "Přihlášení se nezdařilo.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Heslo</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Přihlašuji…" : "Přihlásit se"}
      </Button>
    </form>
  );
}
