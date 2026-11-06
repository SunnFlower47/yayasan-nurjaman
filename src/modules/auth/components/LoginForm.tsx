"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction, type LoginActionResult } from "../actions/login.action";
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { Alert } from "@/components/shared/Alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/admin";

  const [state, formAction, isPending] = useActionState<
    LoginActionResult | null,
    FormData
  >(loginAction, null);

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="danger" title="Gagal Masuk">
          {state.error}
        </Alert>
      )}

      <input type="hidden" name="next" value={nextParam} />

      <div className="space-y-4">
        <Input
          id="username"
          name="username"
          label="Username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="contoh: admin"
          disabled={isPending}
        />

        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••••"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isPending}
        className="w-full"
      >
        {isPending ? "Memverifikasi..." : "Masuk ke Panel"}
      </Button>
    </form>
  );
}
