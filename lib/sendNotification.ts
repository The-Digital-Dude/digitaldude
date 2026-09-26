type ContactSubmission = {
  name: string;
  workEmail: string;
  companyName: string;
  country: string;
  teamSize?: string;
  message: string;
};

/**
 * Best-effort email notification for a new contact submission, sent via Brevo.
 * No-ops safely if BREVO_API_KEY isn't set, so the form still works
 * (submission is stored in Supabase) before email is wired up.
 */
export async function sendNotification(submission: ContactSubmission) {
  const apiKey = process.env.BREVO_API_KEY;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || "info@digitaldude.co.uk";

  if (!apiKey) {
    return { sent: false, reason: "BREVO_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "The Digital Dude Website", email: "noreply@digitaldude.co.uk" },
        to: [{ email: notifyEmail }],
        subject: `New enquiry from ${submission.name} (${submission.companyName})`,
        textContent: [
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

    return { sent: res.ok, reason: res.ok ? undefined : `Brevo responded ${res.status}` };
  } catch (error) {
    return { sent: false, reason: (error as Error).message };
  }
}
