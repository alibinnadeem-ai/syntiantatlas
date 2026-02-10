/**
 * Email template helpers for Syntiant Atlas transactional emails.
 * Provides a consistent, responsive HTML wrapper with branding.
 */

export function wrapInTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
    }
    table, td {
      mso-table-lspace: 0;
      mso-table-rspace: 0;
      border-collapse: collapse;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f6f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .email-wrapper {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
    .email-header {
      background-color: #1a2744;
      padding: 28px 32px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .email-header .subtitle {
      color: #8fa3bf;
      font-size: 12px;
      font-weight: 400;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .email-body {
      background-color: #ffffff;
      padding: 32px;
      line-height: 1.6;
      color: #333333;
      font-size: 15px;
    }
    .email-body h2 {
      color: #1a2744;
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
    .email-body p {
      margin: 0 0 14px 0;
      color: #4a5568;
    }
    .email-body .highlight-box {
      background-color: #f0f4ff;
      border-left: 4px solid #1a2744;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .email-body .highlight-box p {
      margin: 4px 0;
      color: #1a2744;
      font-weight: 500;
    }
    .email-body .btn {
      display: inline-block;
      background-color: #1a2744;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 600;
      margin: 16px 0;
    }
    .email-body .btn:hover {
      background-color: #253a5e;
    }
    .email-body .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .email-body .status-approved {
      background-color: #e6ffed;
      color: #1b7a3d;
    }
    .email-body .status-rejected {
      background-color: #ffe6e6;
      color: #c53030;
    }
    .email-body .status-pending {
      background-color: #fff8e6;
      color: #b7791f;
    }
    .email-footer {
      background-color: #f8f9fb;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e8ecf1;
      border-radius: 0 0 8px 8px;
    }
    .email-footer p {
      color: #8898a8;
      font-size: 12px;
      margin: 4px 0;
      line-height: 1.5;
    }
    .email-footer a {
      color: #1a2744;
      text-decoration: underline;
    }
    @media only screen and (max-width: 620px) {
      .email-wrapper {
        width: 100% !important;
        padding: 0 12px;
      }
      .email-header,
      .email-body,
      .email-footer {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color: #1a2744; padding: 28px 32px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Syntiant Atlas</h1>
              <p class="subtitle" style="color: #8fa3bf; font-size: 12px; font-weight: 400; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Fractional Real Estate Investments</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="email-body" style="background-color: #ffffff; padding: 32px; line-height: 1.6; color: #333333; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color: #f8f9fb; padding: 24px 32px; text-align: center; border-top: 1px solid #e8ecf1; border-radius: 0 0 8px 8px;">
              <p style="color: #8898a8; font-size: 12px; margin: 4px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Syntiant Atlas Inc. &mdash; Fractional Real Estate Investment Platform</p>
              <p style="color: #8898a8; font-size: 12px; margin: 4px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <a href="https://syntiantatlas.com/settings/notifications" style="color: #1a2744; text-decoration: underline;">Manage notification preferences</a>
                &nbsp;|&nbsp;
                <a href="https://syntiantatlas.com/unsubscribe" style="color: #1a2744; text-decoration: underline;">Unsubscribe</a>
              </p>
              <p style="color: #b0bcc8; font-size: 11px; margin-top: 12px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">This is an automated message. Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
