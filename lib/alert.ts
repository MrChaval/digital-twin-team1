import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_KEY);

export async function sendAttackAlert({
  type,
  ip,
  severity,
  city,
  country,
}: {
  type: string;
  ip: string;
  severity: number;
  city?: string | null;
  country?: string | null;
}) {
  const alertEmail = process.env.ALERT_EMAIL;
  if (!alertEmail) {
    console.warn('[ALERT] ALERT_EMAIL not configured — skipping email alert');
    return;
  }

  const location = [city, country].filter(Boolean).join(', ') || 'Unknown';
  const timestamp = new Date().toUTCString();
  const severityColor = severity >= 7 ? '#ef4444' : severity >= 4 ? '#f59e0b' : '#10b981';
  const severityLabel = severity >= 7 ? 'CRITICAL' : severity >= 4 ? 'HIGH' : 'MEDIUM';

  try {
    await resend.emails.send({
      from: 'Protagon Defense <onboarding@resend.dev>',
      to: alertEmail,
      subject: `🚨 [${severityLabel}] Security Alert: ${type} — Severity ${severity}/10`,
      html: `
        <div style="font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 24px; border-radius: 8px; max-width: 600px; border-left: 4px solid ${severityColor};">
          <h2 style="color: ${severityColor}; margin: 0 0 16px; font-size: 18px;">⚠️ Threat Detected — Protagon Defense</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 12px 6px 0; color: #94a3b8; width: 40%;">Attack Type</td><td style="color: #f1f5f9; font-weight: bold;">${type}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; color: #94a3b8;">Source IP</td><td style="color: #f87171;">${ip}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; color: #94a3b8;">Severity</td><td style="color: ${severityColor}; font-weight: bold;">${severity}/10 — ${severityLabel}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; color: #94a3b8;">Location</td><td style="color: #f1f5f9;">${location}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; color: #94a3b8;">Timestamp (UTC)</td><td style="color: #f1f5f9;">${timestamp}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 12px; background: #1e293b; border-radius: 6px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This alert was triggered automatically by Protagon Defense threat monitoring.<br/>
              View live dashboard: <a href="https://protagondefense.io" style="color: #3b82f6;">protagondefense.io</a>
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    // Alert failure must never crash the security logging flow
    console.error('[ALERT] Failed to send attack alert email:', err);
  }
}
