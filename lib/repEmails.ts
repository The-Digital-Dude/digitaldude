import { sendBrevoEmail, wrapInEmailTemplate } from "@/lib/emailBrevo";
import { SITE_URL } from "@/lib/utils";
import { log } from "@/lib/logger";

interface RepPayoutEmailParams {
  repEmail: string;
  repName: string;
  milestoneType: "Meeting Bonus" | "Deal Commission";
  amount: number;
  currency: string;
  clientName: string;
  companyName?: string;
  transactionReference: string;
  payoutMethod: string;
  notes?: string;
}

/**
 * Dispatches an official milestone payout confirmation email to the Sales Representative via Brevo.
 */
export async function sendRepPayoutNotificationEmail(params: RepPayoutEmailParams) {
  const firstName = params.repName.trim().split(/\s+/)[0] || "there";
  const currencySymbol = params.currency === "BDT" ? "৳" : params.currency === "GBP" ? "£" : "$";
  const formattedAmount = `${currencySymbol}${params.amount.toLocaleString()}`;

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      🎉 Milestone Payout Dispatched!
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      Hi ${firstName}, congratulations! Your <strong>${params.milestoneType}</strong> milestone has been approved and processed.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; font-size: 13px; color: #1a1a4e; line-height: 1.8;">
        <tr>
          <td style="color: #6b6b90; width: 40%;"><strong>Milestone Type:</strong></td>
          <td style="font-weight: 700;">${params.milestoneType}</td>
        </tr>
        <tr>
          <td style="color: #6b6b90;"><strong>Opportunity / Client:</strong></td>
          <td style="font-weight: 700;">${params.clientName} ${params.companyName ? `(${params.companyName})` : ""}</td>
        </tr>
        <tr>
          <td style="color: #6b6b90;"><strong>Disbursed Amount:</strong></td>
          <td style="font-size: 18px; font-weight: 800; color: #10b981;">${formattedAmount} ${params.currency}</td>
        </tr>
        <tr>
          <td style="color: #6b6b90;"><strong>Payout Method:</strong></td>
          <td style="font-weight: 700; text-transform: uppercase;">${params.payoutMethod || "MFS / Bank Transfer"}</td>
        </tr>
        <tr>
          <td style="color: #6b6b90;"><strong>Transaction Ref / TrxID:</strong></td>
          <td style="font-family: monospace; font-weight: 700; color: #7b61ff;">${params.transactionReference || "COMPLETED"}</td>
        </tr>
        ${
          params.notes
            ? `<tr>
                <td style="color: #6b6b90;"><strong>Admin Notes:</strong></td>
                <td>${params.notes}</td>
              </tr>`
            : ""
        }
      </table>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 20px 0;">
      <tr>
        <td>
          <a href="${SITE_URL}/rep/dashboard" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(123, 97, 255, 0.25);">
            View Earnings Dashboard →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94a3b8;">
      Thank you for driving excellence and expansion with The Digital Dude. Keep up the phenomenal work!
    </p>
  `;

  return sendBrevoEmail({
    to: [{ email: params.repEmail, name: params.repName }],
    subject: `Payment Confirmed: ${formattedAmount} for ${params.milestoneType} — The Digital Dude`,
    htmlContent: wrapInEmailTemplate("Milestone Payout Dispatched", content),
  });
}
