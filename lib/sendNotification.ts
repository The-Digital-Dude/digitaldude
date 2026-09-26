import { SITE_URL } from "@/lib/utils";

export type ContactSubmission = {
  name: string;
  workEmail: string;
  companyName: string;
  country: string;
  teamSize?: string;
  message: string;
  slotStart?: string;
  slotEnd?: string;
  meetUrl?: string | null;
};

function formatDisplayDate(isoString?: string): string {
  if (!isoString) return "To be confirmed";
  try {
    const d = new Date(isoString);
    return d.toUTCString().replace(":00 GMT", " UTC");
  } catch {
    return isoString;
  }
}

function formatCompactUtc(isoString: string): string {
  return isoString.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Builds direct 1-click calendar links for Google Calendar and Outlook.
 */
function buildCalendarLinks(submission: ContactSubmission) {
  if (!submission.slotStart) return null;

  const start = new Date(submission.slotStart);
  const end = submission.slotEnd
    ? new Date(submission.slotEnd)
    : new Date(start.getTime() + 30 * 60_000);

  const title = `Discovery Call: ${submission.companyName} × The Digital Dude`;
  const details = `30-minute discovery call with The Digital Dude to discuss your operations, workflows, and custom software systems.${submission.meetUrl ? `\n\nGoogle Meet Link: ${submission.meetUrl}` : ""}\n\nWebsite: https://www.digitaldude.co.uk\nContact: info@digitaldude.co.uk`;
  const location = submission.meetUrl || `Google Meet / Online Call`;

  const startCompact = formatCompactUtc(start.toISOString());
  const endCompact = formatCompactUtc(end.toISOString());

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startCompact}/${endCompact}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

  return { googleUrl, outlookUrl };
}

/**
 * Builds a responsive, branded HTML email confirmation for the client.
 */
function buildCustomerEmailHtml(submission: ContactSubmission): string {
  const firstName = submission.name.split(" ")[0] || submission.name;
  const formattedTime = formatDisplayDate(submission.slotStart);
  const calendarLinks = buildCalendarLinks(submission);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your call is confirmed with The Digital Dude</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a4e; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fa; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e6ff; box-shadow: 0 4px 12px rgba(26, 26, 78, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #1a1a4e; padding: 32px 36px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <img src="${SITE_URL}/logo-full-white.png" alt="The Digital Dude" width="160" style="display: block; max-width: 160px; height: auto; margin-bottom: 8px;" />
                    <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 13px; font-weight: 500; letter-spacing: 0.2px;">We build systems that scale.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <span style="display: inline-block; background-color: #f4f3ff; color: #5b4fe8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 12px; border-radius: 9999px; margin-bottom: 16px;">
                Call Confirmed
              </span>
              
              <h1 style="margin: 0 0 16px 0; color: #1a1a4e; font-size: 24px; font-weight: 800; line-height: 1.3;">
                Hi ${firstName}, your call is booked.
              </h1>
              
              <p style="margin: 0 0 24px 0; color: rgba(26, 26, 78, 0.8); font-size: 15px; line-height: 1.6;">
                Thanks for reaching out to <strong>The Digital Dude</strong>. We’ve reserved your slot and our founder is preparing for our discussion about your operations and software goals.
              </p>

              <!-- Booking Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f3ff; border: 1px solid #e8e6ff; border-radius: 12px; margin-bottom: 24px; padding: 20px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: rgba(26, 26, 78, 0.6); font-weight: 600; width: 110px;">Date &amp; Time:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1a4e; font-weight: 700;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: rgba(26, 26, 78, 0.6); font-weight: 600;">Duration:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1a4e; font-weight: 600;">30 minutes</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: rgba(26, 26, 78, 0.6); font-weight: 600;">Company:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1a4e; font-weight: 600;">${submission.companyName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: rgba(26, 26, 78, 0.6); font-weight: 600;">Location:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #5b4fe8; font-weight: 700;">
                          ${
                            submission.meetUrl
                              ? `<a href="${submission.meetUrl}" target="_blank" rel="noopener noreferrer" style="color: #5b4fe8; text-decoration: underline;">Google Meet Video Room</a>`
                              : "We'll send the video call link by email before the call"
                          }
                        </td>
                      </tr>
                    </table>

                    ${
                      submission.meetUrl
                        ? `
                    <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #e8e6ff;">
                      <a href="${submission.meetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #5b4fe8; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 10px 22px; border-radius: 9999px;">
                        Join Google Meet Video Call &rarr;
                      </a>
                    </div>
                    `
                        : ""
                    }
                  </td>
                </tr>
              </table>

              ${
                calendarLinks
                  ? `
              <!-- 1-Click Calendar Add -->
              <div style="margin-bottom: 28px; text-align: left;">
                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #1a1a4e;">Add to your calendar:</p>
                <a href="${calendarLinks.googleUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #5b4fe8; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 8px; margin-right: 8px; margin-bottom: 8px;">
                  + Google Calendar
                </a>
                <a href="${calendarLinks.outlookUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #ffffff; color: #1a1a4e; border: 1px solid #e8e6ff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 8px; margin-bottom: 8px;">
                  + Outlook / Office 365
                </a>
              </div>
              `
                  : ""
              }

              <!-- What to Expect -->
              <h2 style="margin: 0 0 14px 0; color: #1a1a4e; font-size: 16px; font-weight: 700;">
                What happens on the call:
              </h2>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                    <div style="background-color: #5b4fe8; color: #ffffff; font-size: 11px; font-weight: 700; width: 20px; height: 20px; border-radius: 50%; text-align: center; line-height: 20px;">1</div>
                  </td>
                  <td style="padding: 8px 0; vertical-align: middle; color: rgba(26, 26, 78, 0.85); font-size: 14px; line-height: 1.5;">
                    We map out how your business and operations run today.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                    <div style="background-color: #5b4fe8; color: #ffffff; font-size: 11px; font-weight: 700; width: 20px; height: 20px; border-radius: 50%; text-align: center; line-height: 20px;">2</div>
                  </td>
                  <td style="padding: 8px 0; vertical-align: middle; color: rgba(26, 26, 78, 0.85); font-size: 14px; line-height: 1.5;">
                    We highlight bottlenecks, spreadsheets, and manual tasks slowing you down.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                    <div style="background-color: #5b4fe8; color: #ffffff; font-size: 11px; font-weight: 700; width: 20px; height: 20px; border-radius: 50%; text-align: center; line-height: 20px;">3</div>
                  </td>
                  <td style="padding: 8px 0; vertical-align: middle; color: rgba(26, 26, 78, 0.85); font-size: 14px; line-height: 1.5;">
                    If there is a fit, you will receive a fixed-scope, fixed-price proposal within 48 hours.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: rgba(26, 26, 78, 0.7); font-size: 14px; line-height: 1.6;">
                Need to reschedule or share additional project notes in advance? Simply reply directly to this email or reach us at <a href="mailto:info@digitaldude.co.uk" style="color: #5b4fe8; text-decoration: none; font-weight: 600;">info@digitaldude.co.uk</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f3ff; border-top: 1px solid #e8e6ff; padding: 24px 36px; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #1a1a4e; font-size: 13px; font-weight: 700;">
                The Digital Dude
              </p>
              <p style="margin: 0; color: rgba(26, 26, 78, 0.6); font-size: 12px; line-height: 1.5;">
                UK-registered software development team · <a href="${SITE_URL}" style="color: #5b4fe8; text-decoration: none; font-weight: 600;">digitaldude.co.uk</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends both:
 * 1. An internal notification to the agency team (CONTACT_NOTIFY_EMAIL).
 * 2. A branded confirmation email to the person who booked the call with 1-click calendar links.
 */
export async function sendNotification(submission: ContactSubmission) {
  const apiKey = process.env.BREVO_API_KEY;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || "info@digitaldude.co.uk";

  if (!apiKey) {
    return { sent: false, reason: "BREVO_API_KEY not configured" };
  }

  const sender = { name: "The Digital Dude", email: "info@digitaldude.co.uk" };
  const replyTo = { name: "The Digital Dude", email: "info@digitaldude.co.uk" };
  const calendarLinks = buildCalendarLinks(submission);

  try {
    // 1. Send customer branded confirmation email
    const customerPromise = fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        replyTo,
        to: [{ email: submission.workEmail, name: submission.name }],
        subject: `Your call is confirmed with The Digital Dude`,
        htmlContent: buildCustomerEmailHtml(submission),
        textContent: [
          `Hi ${submission.name.split(" ")[0]},`,
          "",
          `Your 30-minute call with The Digital Dude is confirmed for ${formatDisplayDate(submission.slotStart)}.`,
          "",
          `Company: ${submission.companyName}`,
          `Duration: 30 minutes`,
          `Format: Google Meet / Video call`,
          "",
          calendarLinks
            ? `Add to Google Calendar: ${calendarLinks.googleUrl}\nAdd to Outlook: ${calendarLinks.outlookUrl}\n`
            : "",
          "What to expect:",
          "1. We will map how your business and operations run today.",
          "2. We will identify bottlenecks and manual workflows slowing you down.",
          "3. If there is a fit, you will receive a fixed proposal within 48 hours.",
          "",
          "If you have any questions or need to reschedule, reply directly to this email or contact info@digitaldude.co.uk.",
          "",
          "— The Digital Dude Team",
          "https://www.digitaldude.co.uk",
        ].join("\n"),
      }),
    });

    // 2. Send internal notification email to the agency team
    const internalPromise = fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        replyTo: { email: submission.workEmail, name: submission.name },
        to: [{ email: notifyEmail }],
        subject: `New booking: ${submission.name} (${submission.companyName})`,
        textContent: [
          `New call booking received from website:`,
          "",
          `Name: ${submission.name}`,
          `Work email: ${submission.workEmail}`,
          `Company: ${submission.companyName}`,
          `Country: ${submission.country}`,
          `Team size: ${submission.teamSize || "Not provided"}`,
          `Slot time: ${formatDisplayDate(submission.slotStart)}`,
          `Meet link: ${submission.meetUrl || "Not created — check Google Calendar integration"}`,
          "",
          "Message / Fix description:",
          submission.message,
        ].join("\n"),
      }),
    });

    const [customerRes, internalRes] = await Promise.all([customerPromise, internalPromise]);

    const isOk = customerRes.ok && internalRes.ok;
    return {
      sent: isOk,
      reason: isOk
        ? undefined
        : `Brevo responses - Customer: ${customerRes.status}, Internal: ${internalRes.status}`,
    };
  } catch (error) {
    return { sent: false, reason: (error as Error).message };
  }
}
