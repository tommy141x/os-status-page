import type { APIRoute } from "astro";
import { loadConfig } from "@/lib/server-utils";
import nodemailer from "nodemailer";

let config = await loadConfig();

export const GET: APIRoute = async () => {
  return new Response("Use POST to send mail.", { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!config.mail.enabled) {
      return new Response("Mail sending is disabled.", { status: 403 });
    }

    const { smtp, send_from } = config.mail;
    const { subject, text, to } = await request.json();

    // Determine security based on port
    const secure = smtp.port === "465";

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port),
      secure, // true for 465, false for other ports
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
      // Optionally configure for STARTTLS
      tls: {
        rejectUnauthorized: false, // Set to true if you want to reject unauthorized certificates
      },
    });

    const mailOptions = {
      from: send_from,
      to: to,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);

    return new Response("Mail sent successfully.", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Failed to send mail.", { status: 500 });
  }
};
