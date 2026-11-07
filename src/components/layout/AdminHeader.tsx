import { logoutAction } from "@/modules/auth";
import { Button } from "@/components/shared/Button";
import { User, LogOut } from "lucide-react";

interface AdminHeaderProps {
  user: {
    name: string;
    username: string;
  };
  roles: Array<{
    code: string;
    name: string;
  }>;
}

export function AdminHeader({ user, roles }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600">
          <User className="h-4 w-4" />
        </div>
        <div>
          <span className="block text-sm font-semibold leading-tight text-stone-900">
            {user.name}
          </span>
          <span className="font-mono text-xs text-stone-500">@{user.username}</span>
        </div>
        <div className="ml-2 flex items-center gap-1.5">
          {roles.map((r) => (
            <span
              key={r.code}
              className="inline-flex items-center rounded border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
            >
              {r.name}
            </span>
          ))}
        </div>
      </div>

      <form action={logoutAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-stone-600 hover:border-red-200 hover:text-red-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar</span>
        </Button>
      </form>
    </header>
  );
}
