// mail.ts
import nodemailer from "nodemailer";
import { Database } from "bun:sqlite";
import { loadConfig } from "@/lib/server-utils";

const db = new Database("statusdb.sqlite");

const mailA: string = `

  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.5; overflow-x: hidden;">
      <div style="background-color: #F4F4F4; padding: 20px; box-sizing: border-box;">
          <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-sizing: border-box;">


  `;
const mailB: string = `
</div>
</div>
</body>
</html>
  `;

export async function sendMail(info) {
  try {
    const config = await loadConfig();

    if (!config.mail.enabled) {
      console.log("Mail sending is disabled. No action taken.");
      return; // Early exit if mail is disabled
    }

    const { smtp, send_from } = config.mail;

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

    // Fetch emails from the database
    const emails = db
      .query("SELECT email FROM subscriptions")
      .all()
      .map((row) => row.email);

    if (emails.length === 0) {
      throw new Error("No emails found.");
    }

    const mailOptions = {
      from: `"${config.name}" <${send_from}>`,
      to: emails.join(", "), // Send to all fetched emails
      subject: info.subject,
      html: mailA + info.html + mailB,
    };

    await transporter.sendMail(mailOptions);

    console.log("Mail sent successfully.");
  } catch (error) {
    console.error("Failed to send mail:", error);
    throw error;
  }
}
