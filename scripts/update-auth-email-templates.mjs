/**
 * Push Genlyn-branded Auth email templates to the linked Supabase project.
 * Requires Supabase CLI login (Management API token in keychain).
 *
 * Usage: node scripts/update-auth-email-templates.mjs
 */
import { execSync } from "node:child_process";

function getAccessToken() {
  let raw = execSync('security find-generic-password -s "Supabase CLI" -w', {
    encoding: "utf8",
  }).trim();
  if (raw.startsWith("go-keyring-base64:")) {
    raw = Buffer.from(raw.slice("go-keyring-base64:".length), "base64").toString(
      "utf8",
    );
  }
  return raw.trim();
}

const PROJECT_REF = "nepmwdctmilbsgbmiyea";

const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    {{ if eq .Data.freshys_signup "1" }}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;">
      <tr><td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:24px;padding:36px 32px;">
          <tr><td>
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#5B8DEF;">Freshys</p>
            <h1 style="margin:16px 0 12px;font-size:28px;line-height:1.15;color:#111;">Confirm your email</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#555;">Tap the button below to verify your address and finish setting up Freshys.</p>
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px;">Verify email</a>
            <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#888;">If you didn’t create an account, you can ignore this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    {{ else }}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;">
      <tr><td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:28px;padding:40px 32px;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
          <tr><td>
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#4f6ef7;">Genlyn</p>
            <h1 style="margin:18px 0 12px;font-size:30px;line-height:1.1;color:#0f172a;">Confirm your email</h1>
            <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#475569;">
              One more step to unlock your family account across Earnly, Scholars Notes, Ballr, and Freshys.
            </p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.55;color:#64748b;">
              This link expires soon and can only be used once.
            </p>
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 30px;border-radius:999px;">
              Verify my email
            </a>
            <p style="margin:32px 0 0;font-size:13px;line-height:1.55;color:#94a3b8;">
              If the button doesn’t work, paste this link into your browser:<br />
              <span style="word-break:break-all;color:#64748b;">{{ .ConfirmationURL }}</span>
            </p>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">
              Didn’t create a Genlyn account? You can safely ignore this email.
            </p>
          </td></tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">© Genlyn · genlyn.app</p>
      </td></tr>
    </table>
    {{ end }}
  </body>
</html>`;

const recoveryHtml = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:28px;padding:40px 32px;">
          <tr><td>
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#4f6ef7;">Genlyn</p>
            <h1 style="margin:18px 0 12px;font-size:28px;line-height:1.15;color:#0f172a;">Reset your password</h1>
            <p style="margin:0 0 28px;font-size:16px;line-height:1.55;color:#475569;">
              Choose a new password for your Genlyn family account.
            </p>
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 30px;border-radius:999px;">
              Set new password
            </a>
            <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">
              If you didn’t request this, you can ignore this email.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const body = {
  mailer_autoconfirm: false,
  mailer_allow_unverified_email_sign_ins: false,
  external_email_enabled: true,
  mailer_secure_email_change_enabled: true,
  smtp_sender_name: "Genlyn",
  mailer_subjects_confirmation:
    '{{ if eq .Data.freshys_signup "1" }}Confirm your Freshys email{{ else }}Confirm your Genlyn email{{ end }}',
  mailer_templates_confirmation_content: confirmationHtml,
  mailer_subjects_recovery: "Reset your Genlyn password",
  mailer_templates_recovery_content: recoveryHtml,
};

const token = getAccessToken();
const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error("Failed to update auth config:", res.status, text.slice(0, 500));
  process.exit(1);
}

const data = JSON.parse(text);
console.log("Updated auth email config:");
console.log("  mailer_autoconfirm:", data.mailer_autoconfirm);
console.log("  smtp_sender_name:", data.smtp_sender_name);
console.log("  smtp_admin_email:", data.smtp_admin_email);
console.log("  confirmation subject:", data.mailer_subjects_confirmation);
console.log(
  "\nNote: SMTP still sends from",
  data.smtp_admin_email,
  "- switch to admin@genlyn.app when you have the mailbox app password.",
);
