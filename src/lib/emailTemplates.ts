type PasswordResetEmailInput = {
    code: string;
    expiresMinutes: number;
};

function escapeHtml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function passwordResetCodeEmail(input: PasswordResetEmailInput) {
    const code = escapeHtml(input.code);
    const expiresMinutes = input.expiresMinutes;

    const subject = 'Reset your Belife password';

    const text = [
        'Belife Password Reset',
        '',
        `Your password reset verification code is: ${input.code}`,
        '',
        `This code will expire in ${expiresMinutes} minutes.`,
        '',
        'If you didn\'t request this password reset, please ignore this email.',
        '',
        'For security reasons, never share this code with anyone.',
    ].join('\n');

    const preheader = `Reset your Belife password using code: ${code}. Valid for ${expiresMinutes} minutes.`;

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${subject}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>

    <!-- Main Container -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f9fafb;">
      <tr>
        <td align="center" style="padding:48px 24px;">
          <!-- Card Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;">
            
            <!-- Logo Section -->
            <tr>
              <td style="padding:0 0 32px 0;text-align:center;">
                <div style="display:inline-block;background:#000000;border-radius:12px;padding:10px 20px;">
                  <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Belife</span>
                </div>
              </td>
            </tr>

            <!-- Main Card -->
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding:40px 40px 0 40px;">
                      <h1 style="margin:0;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Reset your password</h1>
                      <p style="margin:12px 0 0 0;font-size:16px;line-height:1.5;color:#6b7280;">
                        We received a request to reset your password. Use the verification code below to continue.
                      </p>
                    </td>
                  </tr>

                  <!-- Code Section -->
                  <tr>
                    <td style="padding:32px 40px;">
                      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:28px 24px;text-align:center;">
                        <div style="font-size:13px;font-weight:500;color:#6b7280;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">
                          Verification code
                        </div>
                        <div style="font-size:36px;letter-spacing:8px;font-weight:700;color:#000000;font-family:monospace;">
                          ${code}
                        </div>
                      </div>
                      
                      <!-- Expiry Notice -->
                      <div style="margin-top:20px;text-align:center;">
                        <div style="display:inline-block;background:#fef3c7;border-radius:8px;padding:8px 16px;">
                          <span style="font-size:13px;color:#92400e;font-weight:500;">
                            ⏰ This code expires in ${expiresMinutes} minutes
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Instructions -->
                  <tr>
                    <td style="padding:0 40px 24px 40px;">
                      <div style="border-top:1px solid #e5e7eb;padding-top:24px;">
                        <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#374151;">How to reset your password:</h3>
                        <ol style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.6;">
                          <li style="margin-bottom:8px;">Enter the verification code on the password reset page</li>
                          <li style="margin-bottom:8px;">Create a new strong password</li>
                          <li style="margin-bottom:8px;">Log in with your new password</li>
                        </ol>
                      </div>
                    </td>
                  </tr>

                  <!-- Security Note -->
                  <tr>
                    <td style="padding:0 40px 32px 40px;">
                      <div style="background:#f0fdf4;border-radius:10px;padding:14px 16px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                          <span style="font-size:20px;">🔒</span>
                          <span style="font-size:13px;color:#166534;line-height:1.4;">
                            <strong>Security tip:</strong> Never share this code with anyone. Belife staff will never ask for your verification code.
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer Note -->
                  <tr>
                    <td style="padding:0 40px 40px 40px;">
                      <p style="margin:0;font-size:13px;line-height:1.5;color:#9ca3af;">
                        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:32px 0 0 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:16px 24px;text-align:center;">
                      <p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;">
                        Belife — Secure password recovery
                      </p>
                      <p style="margin:0;font-size:11px;color:#d1d5db;">
                        © ${new Date().getFullYear()} Belife. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    return { subject, text, html };
}