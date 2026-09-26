type ContactSubmission = {
  name: string;
  workEmail: string;
  companyName: string;
  country: string;
  teamSize?: string;
  message: string;
};

/**
 * Best-effort email notification for a new contact submission.
 * No-ops safely if RESEND_API_KEY isn't set, so the form still works
 * (submission is stored in Supabase) before email is wired up.
 */
export async function sendNotification(submission: ContactSubmission) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || "info@digitaldude.co.uk";

  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Digital Dude Website <noreply@digitaldude.online>",
        to: notifyEmail,
        subject: `New enquiry from ${submission.name} (${submission.companyName})`,
        text: [
          `Name: ${submission.name}`,
          `Work email: ${submission.workEmail}`,
          `Company: ${submission.companyName}`,
          `Country: ${submission.country}`,
          `Team size: ${submission.teamSize || "Not provided"}`,
          "",
          "What they'd like to fix:",
          submission.message,
        ].join("\n"),
      }),
    });

    return { sent: res.ok, reason: res.ok ? undefined : `Resend responded ${res.status}` };
  } catch (error) {
    return { sent: false, reason: (error as Error).message };
  }
}
