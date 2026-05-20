import nodemailer from "nodemailer";

let transporter = null;

function getMailConfig() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST || "";
  const user = process.env.SMTP_USER || process.env.MAIL_USERNAME || "";
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD || "";
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 465);
  const encryption = (process.env.SMTP_SECURE || process.env.MAIL_ENCRYPTION || "").toLowerCase();
  const secure = encryption ? encryption === "ssl" || encryption === "smtps" : port === 465;
  const fromAddress = process.env.MAIL_FROM || process.env.MAIL_FROM_ADDRESS || user;
  const fromName = process.env.MAIL_FROM_NAME || "LearnLink";
  const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

  return {
    enabled: Boolean(host && user && pass && fromAddress),
    host,
    user,
    pass,
    from,
    port,
    secure
  };
}

function getTransporter() {
  const config = getMailConfig();
  if (!config.enabled) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
  return transporter;
}

export function isMailConfigured() {
  return getMailConfig().enabled;
}

export async function sendMail({ to, subject, html, text }) {
  const config = getMailConfig();
  const activeTransporter = getTransporter();
  if (!config.enabled || !activeTransporter) return false;
  await activeTransporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html
  });
  return true;
}
