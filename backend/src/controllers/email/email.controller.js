import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import pino from "pino";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  logger.error("Credenciales de correo no definidas. Asegúrate de que EMAIL_USER y EMAIL_PASS estén en el archivo .env");
  throw new Error("Credenciales de correo no definidas");
}

logger.info(`Configurando transporter con EMAIL_USER: ${process.env.EMAIL_USER}`);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    logger.error({ error: error.message }, "Error al verificar el transporter de nodemailer");
  } else {
    logger.info("Transporter verificado exitosamente");
  }
});

const formatAmount = (amount) => {
  if (!amount) return "N/A";
  let numericAmount = amount.toString().replace(/CLP/gi, "").trim();
  let numAmount = parseFloat(numericAmount.replace(/\./g, "").replace(",", "."));
  if (isNaN(numAmount)) return "N/A";
  return `$${numAmount.toLocaleString("es-CL")}`;
};

// Función para capitalizar la primera letra de un string
const capitalizeFirstLetter = (string) => {
  if (!string) return "N/A";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const formatDate = (date) => {
  if (!date) return "N/A";
  let parsedDate;
  
  // Si la fecha ya está en formato ISO (por ejemplo, 2025-06-04T00:00:00.000Z)
  if (typeof date === "string" && date.includes("T")) {
    parsedDate = DateTime.fromISO(date, { zone: "utc" });
  } 
  // Si la fecha está en formato dd/MM/yyyy (por ejemplo, 04/06/2025)
  else if (typeof date === "string" && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    parsedDate = DateTime.fromFormat(date, "dd/MM/yyyy", { zone: "America/Argentina/Tucuman" });
  } 
  // Si es un objeto Date
  else if (date instanceof Date) {
    parsedDate = DateTime.fromJSDate(date, { zone: "America/Argentina/Tucuman" });
  } 
  // Otros casos
  else {
    parsedDate = DateTime.fromJSDate(new Date(date), { zone: "America/Argentina/Tucuman" });
  }

  if (!parsedDate.isValid) return "N/A";
  return parsedDate.toFormat("dd/MM/yyyy");
};

export const sendEmail = async (req, res) => {
  const { recipients, subject, message, attachment, emails } = req.body;

  if (recipients && Array.isArray(recipients) && subject && message) {
    if (recipients.length === 0) {
      return res.status(400).json({ message: "El arreglo de destinatarios no puede estar vacío" });
    }

    const validEmails = recipients.every((email) => /\S+@\S+\.\S+/.test(email));
    if (!validEmails) {
      return res.status(400).json({ message: "Uno o más correos son inválidos" });
    }

    if (recipients.length > 100) {
      return res.status(400).json({ message: "Máximo 100 destinatarios por solicitud" });
    }

    const sanitizedMessage = sanitizeHtml(message, {
      allowedTags: ["b", "i", "em", "strong", "p", "br", "div", "span", "h1", "h2", "h3", "img"],
      allowedAttributes: { img: ["src", "alt"] },
    });

    const mailOptions = {
      from: `"Valladares" <${process.env.EMAIL_USER}>`,
      to: recipients.join(", "),
      subject,
      html: sanitizedMessage,
    };

    if (attachment) {
      if (typeof attachment === "object" && attachment.format === "pdf") {
        const doc = new PDFDocument({
          size: [500, 300],
          margin: 30,
        });
        let buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => { });

        const logoPath = path.join(__dirname, "../../assets/logo.png");
        let logoAdded = false;
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 30, 20, { width: 60 });
            logger.info("Logo agregado exitosamente al PDF");
            logoAdded = true;
          } catch (error) {
            logger.error({ error: error.message }, "Error al agregar el logo al PDF");
          }
        } else {
          logger.warn(`Archivo de logo no encontrado en: ${logoPath}`);
        }

        const titleFontSize = 18;
        doc.fontSize(titleFontSize);
        const titleWidth = doc.widthOfString("Valladares");
        const titleX = logoAdded ? 30 + 60 + 10 : (500 - titleWidth) / 2;
        const titleY = logoAdded ? 40 : 40;
        doc.fillColor("#000000").fontSize(titleFontSize).text("Valladares", titleX, titleY);

        const comprobanteFontSize = 22;
        doc.fontSize(comprobanteFontSize);
        const comprobanteWidth = doc.widthOfString("Comprobante");
        const comprobanteX = 500 - 30 - comprobanteWidth;
        doc.fillColor("#04a45c").text("Comprobante", comprobanteX, 30);
        doc.fillColor("#04a45c").rect(30, 80, 440, 2).fill();

        doc.fillColor("#6C757D").fontSize(12).text("Información del Estudiante", 30, 90);
        doc.fillColor("#000000")
          .fontSize(10)
          .text(`Nombre y Apellido: ${attachment.student.name || "N/A"} ${attachment.student.lastName || ""}`, 30, 110);
        doc.fillColor("#000000").fontSize(10).text(`Dni: ${attachment.student.dni || "N/A"}`, 30, 125);

        // Determinar si es un pago o una cuota
        if (attachment.cuota) {
          doc.fillColor("#6C757D").fontSize(12).text("Detalle de la Cuota", 30, 140);
          doc.fillColor("#000000").fontSize(10).text(`Mes: ${attachment.cuota.date || "N/A"}`, 30, 160);
          doc.fillColor("#000000").fontSize(10).text(`Monto: ${formatAmount(attachment.cuota.amount)}`, 30, 175);
          doc.fillColor("#000000").fontSize(10).text(`Método de Pago: ${attachment.cuota.paymentmethod || "N/A"}`, 30, 190);
          doc.fillColor("#000000").fontSize(10).text(`Fecha de Pago: ${formatDate(attachment.cuota.paymentdate)}`, 30, 205);
        } else if (attachment.payment) {
          doc.fillColor("#6C757D").fontSize(12).text("Detalle del Pago", 30, 140);
          doc.fillColor("#000000").fontSize(10).text(`Concepto: ${capitalizeFirstLetter(attachment.payment.concept)}`, 30, 160);
          doc.fillColor("#000000").fontSize(10).text(`Monto: ${formatAmount(attachment.payment.amount)}`, 30, 175);
          doc.fillColor("#000000").fontSize(10).text(`Método de Pago: ${attachment.payment.paymentMethod}`, 30, 190);
          doc.fillColor("#000000").fontSize(10).text(`Fecha de Pago: ${formatDate(attachment.payment.paymentDate)}`, 30, 205);
        }

        doc.fillColor("#000000").fontSize(10).text(`Fecha de Emisión: ${DateTime.fromJSDate(new Date()).setZone("America/Argentina/Tucuman").toFormat("dd/MM/yyyy")}`, 30, 220);

        doc.end();

        const pdfBuffer = await new Promise((resolve) => {
          doc.on("end", () => {
            resolve(Buffer.concat(buffers));
          });
        });

        mailOptions.attachments = [
          {
            filename: attachment.filename || "comprobante.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ];
      } else {
        mailOptions.attachments = [
          {
            filename: "comprobante.png",
            content: Buffer.from(attachment, "base64"),
            contentType: "image/png",
          },
        ];
      }
    }

    try {
      await transporter.sendMail(mailOptions);
      logger.info({ recipients: recipients.length, subject }, "Correos enviados");
      return res.status(200).json({ message: "Correos enviados exitosamente" });
    } catch (error) {
      logger.error({ error: error.message, recipients }, "Error al enviar correos");
      return res.status(500).json({ message: "Error al enviar correos", error: error.message });
    }
  }

  if (emails && Array.isArray(emails)) {
    if (emails.length === 0) {
      return res.status(400).json({ message: "El arreglo de correos no puede estar vacío" });
    }

    if (emails.length > 100) {
      return res.status(400).json({ message: "Máximo 100 correos por solicitud" });
    }

    const failedEmails = [];

    for (const email of emails) {
      const { recipient, subject, message } = email;

      if (!recipient || !/\S+@\S+\.\S+/.test(recipient) || !subject || !message) {
        failedEmails.push({ recipient: recipient || "desconocido", error: "Datos inválidos" });
        continue;
      }

      const sanitizedMessage = sanitizeHtml(message, {
        allowedTags: ["b", "i", "em", "strong", "p", "br", "div", "span", "h1", "h2", "h3", "img"],
        allowedAttributes: { img: ["src", "alt"] },
      });

      const mailOptions = {
        from: `"Valladares" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject,
        html: sanitizedMessage,
      };

      try {
        await transporter.sendMail(mailOptions);
        logger.info({ recipient, subject }, "Correo enviado");
      } catch (error) {
        logger.error({ error: error.message, recipient }, "Error al enviar correo");
        failedEmails.push({ recipient, error: error.message });
      }
    }

    if (failedEmails.length > 0) {
      return res.status(207).json({
        message: `Se enviaron ${emails.length - failedEmails.length} de ${emails.length} correos`,
        failed: failedEmails,
      });
    }

    return res.status(200).json({ message: `Correos enviados exitosamente (${emails.length})` });
  }

  return res.status(400).json({ message: "Formato de solicitud inválido" });
};