const { Resend } = require("resend");

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.EMAIL_FROM || "KNUST Lost & Found <onboarding@resend.dev>";

/**
 * Sends an email via Resend. Never throws — logs and swallows failures so
 * that a broken/missing email config never breaks the actual app flow
 * (reporting, claiming, approving) that triggered it.
 */
async function sendMail({ to, subject, html }) {
  if (!resend) {
    console.log(`[mail] Skipped (no RESEND_API_KEY set) — would have sent "${subject}" to ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    console.log(`[mail] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

const wrapper = (title, bodyHtml) => `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <div style="background:#00563F; padding: 20px 24px; border-radius: 4px 4px 0 0;">
      <span style="color:#ffffff; font-size:18px; font-weight:700;">KNUST Lost &amp; Found</span>
    </div>
    <div style="border:1px solid #DCD7C9; border-top:none; border-radius: 0 0 4px 4px; padding: 24px;">
      <h2 style="color:#172420; font-size:17px; margin:0 0 12px;">${title}</h2>
      ${bodyHtml}
    </div>
    <p style="color:#8a8a8a; font-size:12px; margin-top:16px;">
      You're receiving this because you have an active report or claim on the
      KNUST Campus Lost &amp; Found Management System.
    </p>
  </div>
`;

function claimSubmittedEmail({ ownerName, itemTitle, claimantName, message }) {
  return wrapper(
    "Someone submitted a claim on your report",
    `
      <p style="color:#172420; font-size:14px; line-height:1.5;">
        Hi ${ownerName}, <strong>${claimantName}</strong> just submitted a claim on your report
        for <strong>${itemTitle}</strong>:
      </p>
      <blockquote style="border-left:3px solid #C98A2C; margin:12px 0; padding:8px 14px; color:#444; font-size:14px; background:#FBF1DF;">
        ${message}
      </blockquote>
      <p style="color:#172420; font-size:14px; line-height:1.5;">
        Log in and open your report to review the claim and, if it checks out,
        an admin can approve it to mark the item as recovered.
      </p>
    `
  );
}

function contactCard({ contactName, contactEmail, contactPhone }) {
  return `
    <div style="background:#FBF1DF; border-left:3px solid #C98A2C; margin:12px 0; padding:10px 14px; border-radius:2px;">
      <p style="margin:0 0 2px; color:#172420; font-size:13px; font-weight:600;">${contactName}</p>
      <p style="margin:0; color:#172420; font-size:14px;">
        <a href="mailto:${contactEmail}" style="color:#00563F;">${contactEmail}</a>
      </p>
      ${contactPhone ? `<p style="margin:2px 0 0; color:#172420; font-size:14px;">
        <a href="tel:${contactPhone}" style="color:#00563F;">${contactPhone}</a>
      </p>` : ""}
    </div>
  `;
}

function claimApprovedEmail({ claimantName, itemTitle, contactName, contactEmail, contactPhone }) {
  return wrapper(
    "Your claim was approved",
    `
      <p style="color:#172420; font-size:14px; line-height:1.5;">
        Hi ${claimantName}, good news — your claim on <strong>${itemTitle}</strong> has been
        approved by an admin. The item is now marked <strong>Recovered</strong>.
      </p>
      <p style="color:#172420; font-size:14px; line-height:1.5;">
        You can now contact the reporter directly to arrange collection:
      </p>
      ${contactCard({ contactName, contactEmail, contactPhone })}
    `
  );
}

function itemRecoveredEmail({ ownerName, itemTitle, contactName, contactEmail, contactPhone }) {
  return wrapper(
    "Your item has been claimed",
    `
      <p style="color:#172420; font-size:14px; line-height:1.5;">
        Hi ${ownerName}, an admin approved a claim on your report for
        <strong>${itemTitle}</strong>. It's now marked <strong>Recovered</strong>.
      </p>
      <p style="color:#172420; font-size:14px; line-height:1.5;">
        You can contact the claimant directly to arrange handover:
      </p>
      ${contactCard({ contactName, contactEmail, contactPhone })}
    `
  );
}

function claimRejectedEmail({ claimantName, itemTitle }) {
  return wrapper(
    "Update on your claim",
    `
      <p style="color:#172420; font-size:14px; line-height:1.5;">
        Hi ${claimantName}, your claim on <strong>${itemTitle}</strong> wasn't approved this time.
        If you believe this was a mistake, you're welcome to submit a new claim with more
        identifying details.
      </p>
    `
  );
}

module.exports = { sendMail, claimSubmittedEmail, claimApprovedEmail, claimRejectedEmail, itemRecoveredEmail };
