/** Pesan error yang aman ditampilkan ke user. */
export function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return "Terjadi kesalahan. Coba lagi atau hubungi administrator.";
}
