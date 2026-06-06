const nodemailer = require('nodemailer');
const { generateInvoicePDF } = require('./pdfGenerator');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendInvoiceEmail = async (invoice, recipientEmail) => {
  const transporter = createTransporter();
  const pdfDoc = generateInvoicePDF(invoice);

  const pdfBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });

  const mailOptions = {
    from: `"VendorBridge ERP" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from VendorBridge`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #6366f1; margin: 0;">VendorBridge</h1>
          <p style="color: #94a3b8; margin: 5px 0 0;">AI Procurement ERP</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b;">Invoice ${invoice.invoiceNumber}</h2>
          <p style="color: #64748b;">Dear ${invoice.vendorId?.contactName || 'Vendor'},</p>
          <p style="color: #64748b;">Please find your invoice attached to this email.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #e2e8f0;">
              <td style="padding: 10px; font-weight: bold;">Invoice Number</td>
              <td style="padding: 10px;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Amount Due</td>
              <td style="padding: 10px; color: #6366f1; font-weight: bold;">₹${invoice.total?.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #e2e8f0;">
              <td style="padding: 10px; font-weight: bold;">Due Date</td>
              <td style="padding: 10px;">${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</td>
            </tr>
          </table>
        </div>
        <div style="background: #1a1a2e; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from VendorBridge ERP</p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `${invoice.invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendInvoiceEmail };
