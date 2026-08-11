export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function emailShell(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:24px;color:#fff;">
          <div style="font-size:14px;opacity:.9;">Clara - AI booking receptionist</div>
          <div style="font-size:26px;font-weight:700;line-height:1.2;margin-top:8px;">${escapeHtml(title)}</div>
        </div>
        <div style="padding:24px;line-height:1.7;font-size:15px;">${body}</div>
      </div>
      <div style="text-align:center;color:#64748b;font-size:12px;margin-top:16px;">
        Sent by the booking assistant automation.
      </div>
    </div>
  </body>
</html>`
}
