import { log } from "@/lib/logger";

/** Telegram alerts for positive replies and failures. A no-op when unconfigured; never throws. */
export async function notify(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: message.slice(0, 3500), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) log("warn", { message: "Telegram notification failed", context: { status: res.status } });
  } catch (error) {
    log("warn", { message: "Telegram notification error", error });
  }
}
