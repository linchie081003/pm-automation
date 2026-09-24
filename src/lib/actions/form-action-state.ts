"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getActionErrorMessage } from "@/lib/action-error";

export type FormActionState = { error: string | null };

export async function runFormAction(run: () => Promise<void>): Promise<FormActionState> {
  try {
    await run();
    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { error: getActionErrorMessage(error) };
  }
}
