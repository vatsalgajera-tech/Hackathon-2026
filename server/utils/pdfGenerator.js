const PDFDocument = require('pdfkit');

const generateInvoicePDF = (invoice) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // ─── Header ───────────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 100).fill('#1a1a2e');
  doc.fillColor('#6366f1').fontSize(28).font('Helvetica-Bold').text('VendorBridge', 50, 30);
  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('AI Procurement & Vendor Management ERP', 50, 65);

  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', 400, 35, { align: 'right' });
  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text(invoice.invoiceNumber, 400, 60, { align: 'right' });

  // ─── Info Row ─────────────────────────────────────────────────────────────
  doc.fillColor('#1e293b');
  const vendor = invoice.vendorId;
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Vendor Details:', 50, 120);
  doc.fillColor('#334155').fontSize(10).font('Helvetica')
    .text(vendor?.companyName || 'N/A', 50, 138)
    .text(vendor?.email || '', 50, 153)
    .text(vendor?.phone || '', 50, 168)
    .text(`GST: ${vendor?.gstNumber || 'N/A'}`, 50, 183);

  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Invoice Details:', 350, 120);
  doc.fillColor('#334155').fontSize(10).font('Helvetica')
    .text(`Invoice No: ${invoice.invoiceNumber}`, 350, 138)
    .text(`PO No: ${invoice.poId?.poNumber || 'N/A'}`, 350, 153)
    .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-IN')}`, 350, 168)
    .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 350, 183)
    .text(`Status: ${invoice.status?.toUpperCase()}`, 350, 198);

  // ─── Items Table ──────────────────────────────────────────────────────────
  doc.rect(50, 220, 495, 30).fill('#6366f1');
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
    .text('Item', 60, 230)
    .text('Qty', 280, 230)
    .text('Unit Price', 340, 230)
    .text('Total', 440, 230);

  let y = 260;
  invoice.items.forEach((item, i) => {
    const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(50, y - 5, 495, 25).fill(bg);
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica')
      .text(item.name, 60, y)
      .text(item.quantity.toString(), 280, y)
      .text(`₹${item.unitPrice?.toLocaleString('en-IN')}`, 340, y)
      .text(`₹${item.totalPrice?.toLocaleString('en-IN')}`, 440, y);
    y += 25;
  });

  // ─── Totals ───────────────────────────────────────────────────────────────
  y += 15;
  doc.rect(350, y, 195, 1).fill('#e2e8f0');
  y += 10;
  doc.fillColor('#334155').fontSize(10).font('Helvetica')
    .text('Subtotal:', 360, y)
    .text(`₹${invoice.subtotal?.toLocaleString('en-IN')}`, 490, y, { align: 'right' });
  y += 20;
  doc.text(`GST (${invoice.gstRate}%):`, 360, y)
    .text(`₹${invoice.gstAmount?.toLocaleString('en-IN')}`, 490, y, { align: 'right' });
  y += 5;
  doc.rect(350, y + 10, 195, 1).fill('#6366f1');
  y += 20;
  doc.fillColor('#6366f1').fontSize(13).font('Helvetica-Bold')
    .text('TOTAL:', 360, y)
    .text(`₹${invoice.total?.toLocaleString('en-IN')}`, 490, y, { align: 'right' });

  // ─── Footer ───────────────────────────────────────────────────────────────
  doc.rect(0, 770, 595, 72).fill('#1a1a2e');
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
    .text('VendorBridge AI Procurement ERP | Generated electronically', 50, 790, { align: 'center' })
    .text('This is a computer-generated invoice and does not require a physical signature.', 50, 805, { align: 'center' });

  return doc;
};

module.exports = { generateInvoicePDF };
