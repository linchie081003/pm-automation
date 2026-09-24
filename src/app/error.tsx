"use client";

import { useEffect } from "react";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = getActionErrorMessage(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--pdcc-border-light)] p-6">
      <div className="max-w-md rounded-xl border border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--pdcc-title)]">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-[var(--pdcc-body)]">{message}</p>
        {error.digest ? (
          <p className="mt-2 text-xs text-[var(--pdcc-muted)]">Referensi: {error.digest}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => reset()}>
            Coba lagi
          </Button>
          <Button type="button" variant="secondary" onClick={() => (window.location.href = "/portfolio")}>
            Ke Portfolio
          </Button>
        </div>
      </div>
    </div>
  );
}
