import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { randomUUID } from "node:crypto";

let pool;
let resendClient;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 3,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
    });
  }

  return pool;
}

function requireField(body, field) {
  const value = String(body?.[field] || "").trim();
  if (!value) {
    throw new Error(`${field} is verplicht.`);
  }
  return value;
}

function createTransporter() {
  if (process.env.SMTP_HOST) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP_USER en SMTP_PASS ontbreken in Vercel Environment Variables.");
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER en EMAIL_PASS ontbreken in Vercel Environment Variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

function confirmationHtml(appointment) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Uw afspraak is bevestigd</h2>
      <p>Beste ${appointment.name},</p>
      <p>Bedankt voor uw afspraak bij Chase Prime Bank. Hieronder vindt u de gegevens van uw afspraak.</p>
      <table style="border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:6px 12px 6px 0;font-weight:bold">Service</td><td>${appointment.service}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;font-weight:bold">Datum</td><td>${appointment.date}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;font-weight:bold">Tijd</td><td>${appointment.time}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;font-weight:bold">Telefoon</td><td>${appointment.phone}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;font-weight:bold">Opmerking</td><td>${appointment.notes || "-"}</td></tr>
      </table>
      <p style="margin-top:18px">Met vriendelijke groet,<br>Chase Prime Bank</p>
    </div>
  `;
}

async function saveAppointment(appointment) {
  await getPool().execute(
    `INSERT INTO appointments
      (id, name, email, phone, service, appointment_date, appointment_time, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      appointment.id,
      appointment.name,
      appointment.email,
      appointment.phone,
      appointment.service,
      appointment.date,
      appointment.time,
      appointment.notes || null,
      appointment.createdAt
    ]
  );
}

async function sendConfirmationEmail(appointment) {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || "Chase Prime Bank <onboarding@resend.dev>";
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "chaseprimebank@gmail.com";

  if (resend) {
    const customerResult = await resend.emails.send({
      from,
      to: appointment.email,
      subject: "Bevestiging van uw afspraak - Chase Prime Bank",
      html: confirmationHtml(appointment)
    });

    if (customerResult.error) {
      throw new Error(customerResult.error.message || "Resend kon de klantmail niet versturen.");
    }

    const adminResult = await resend.emails.send({
      from,
      to: adminEmail,
      subject: "Nieuwe afspraak via de website",
      text: [
        "Nieuwe afspraak ontvangen:",
        `Naam: ${appointment.name}`,
        `E-mail: ${appointment.email}`,
        `Telefoon: ${appointment.phone}`,
        `Service: ${appointment.service}`,
        `Datum: ${appointment.date}`,
        `Tijd: ${appointment.time}`,
        `Opmerking: ${appointment.notes || "-"}`
      ].join("\n")
    });

    if (adminResult.error) {
      throw new Error(adminResult.error.message || "Resend kon de adminmail niet versturen.");
    }

    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to: appointment.email,
    subject: "Bevestiging van uw afspraak - Chase Prime Bank",
    html: confirmationHtml(appointment)
  });

  await transporter.sendMail({
    from,
    to: adminEmail,
    subject: "Nieuwe afspraak via de website",
    text: [
      "Nieuwe afspraak ontvangen:",
      `Naam: ${appointment.name}`,
      `E-mail: ${appointment.email}`,
      `Telefoon: ${appointment.phone}`,
      `Service: ${appointment.service}`,
      `Datum: ${appointment.date}`,
      `Tijd: ${appointment.time}`,
      `Opmerking: ${appointment.notes || "-"}`
    ].join("\n")
  });
}

async function listAppointments(res) {
  const [rows] = await getPool().execute(
    `SELECT
      id,
      name,
      email,
      phone,
      service,
      appointment_date AS date,
      appointment_time AS time,
      notes,
      created_at AS createdAt
     FROM appointments
     ORDER BY created_at DESC
     LIMIT 100`
  );

  res.status(200).json({ ok: true, appointments: rows });
}

async function createAppointment(req, res) {
  const appointment = {
    id: randomUUID(),
    name: requireField(req.body, "name"),
    email: requireField(req.body, "email").toLowerCase(),
    phone: requireField(req.body, "phone"),
    service: requireField(req.body, "service"),
    date: requireField(req.body, "date"),
    time: requireField(req.body, "time"),
    notes: String(req.body.notes || "").trim(),
    createdAt: new Date().toISOString()
  };

  await saveAppointment(appointment);
  await sendConfirmationEmail(appointment);

  res.status(201).json({
    ok: true,
    message: "Afspraak opgeslagen en bevestigingsmail verstuurd.",
    appointment
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      await listAppointments(res);
      return;
    }

    if (req.method === "POST") {
      await createAppointment(req, res);
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ ok: false, message: "Method not allowed" });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message || "De afspraak kon niet verwerkt worden."
    });
  }
}
