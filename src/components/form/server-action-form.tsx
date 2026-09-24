"use client";

import { useActionState } from "react";
import type { FormActionState } from "@/lib/actions/form-action-state";

type FormActionHandler = (prev: FormActionState, formData: FormData) => Promise<FormActionState>;

export function ServerActionForm({
  action,
  children,
  className,
}: {
  action: FormActionHandler;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className={className}>
      {state.error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-[var(--pdcc-danger-fg)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--pdcc-danger-fg)]"
        >
          {state.error}
        </p>
      ) : null}
      <fieldset disabled={pending} className="min-w-0 border-0 p-0 m-0 contents">
        {children}
      </fieldset>
    </form>
  );
}
