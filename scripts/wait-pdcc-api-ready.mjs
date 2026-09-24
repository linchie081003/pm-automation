const base = process.env.PDCC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:4000";
const healthUrl = `${base}/api/v1/health`;
const maxAttempts = 90;

async function healthOk() {
  const res = await fetch(healthUrl, { cache: "no-store" });
  if (!res.ok) return false;
  const body = await res.json();
  return body.ok === true && body.features?.wizardDrafts === true;
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    if (await healthOk()) {
      await new Promise((r) => setTimeout(r, 400));
      if (await healthOk()) {
        console.log(`PDCC API ready (${healthUrl}) — wizardDrafts OK`);
        process.exit(0);
      }
      console.warn(`[${attempt}/${maxAttempts}] API belum stabil di ${base}, menunggu…`);
    }
  } catch {
    console.warn(`[${attempt}/${maxAttempts}] Menunggu ${healthUrl}…`);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

console.error(
  `PDCC API tidak siap: ${healthUrl} harus mengembalikan features.wizardDrafts=true. Jalankan: npm run dev (dari root).`,
);
process.exit(1);
