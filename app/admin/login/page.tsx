import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Přihlášení do administrace</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
