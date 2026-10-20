"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/admin/actions";

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      <LogOut className="mr-1.5 h-4 w-4" />
      Odhlásit se
    </Button>
  );
}
