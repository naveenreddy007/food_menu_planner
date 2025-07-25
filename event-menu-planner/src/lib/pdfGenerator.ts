import jsPDF from 'jspdf';
import type { MenuSelection, BusinessInfo } from '@/types';
import { formatPrice } from './menuValidation';

interface PDFGeneratorOptions {
  businessInfo: BusinessInfo;
  selections: MenuSelection[];
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    eventDate?: string;
    eventType?: string;
    guestCount?: number;
  };
}

export class MenuPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  generateMenuPDF(options: PDFGeneratorOptions): void {
    const { businessInfo, selections, customerInfo } = options;

    // Add header
    this.addHeader(businessInfo);
    
    // Add customer info if provided
    if (customerInfo) {
      this.addCustomerInfo(customerInfo);
    }

    // Add menu selections
    this.addMenuSelections(selections);

    // Add footer
    this.addFooter(businessInfo);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${businessInfo.name.replace(/\s+/g, '_')}_Menu_${timestamp}.pdf`;

    // Download the PDF
    this.doc.save(filename);
  }

  private addHeader(businessInfo: BusinessInfo): void {
    // Business name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(40, 40, 40);
    
    const businessNameWidth = this.doc.getTextWidth(businessInfo.name);
    const businessNameX = (this.pageWidth - businessNameWidth) / 2;
    this.doc.text(businessInfo.name, businessNameX, this.currentY);
    
    this.currentY += 10;

    // Tagline
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    
    const tagline = 'Professional Catering Services';
    const taglineWidth = this.doc.getTextWidth(tagline);
    const taglineX = (this.pageWidth - taglineWidth) / 2;
    this.doc.text(tagline, taglineX, this.currentY);
    
    this.currentY += 15;

    // Contact info
    this.doc.setFontSize(10);
    this.doc.setTextColor(80, 80, 80);
    
    const contactInfo = [
      `📞 ${businessInfo.contact.phone}`,
      `✉️ ${businessInfo.contact.email}`,
      `📍 ${businessInfo.contact.address}`
    ];

    contactInfo.forEach(info => {
      const infoWidth = this.doc.getTextWidth(info);
      const infoX = (this.pageWidth - infoWidth) / 2;
      this.doc.text(info, infoX, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 10;

    // Decorative line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 15;
  }

  private addCustomerInfo(customerInfo: any): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(40, 40, 40);
    this.doc.text('Event Details', this.margin, this.currentY);
    
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);

    const details = [
      customerInfo.name && `Customer: ${customerInfo.name}`,
      customerInfo.email && `Email: ${customerInfo.email}`,
      customerInfo.phone && `Phone: ${customerInfo.phone}`,
      customerInfo.eventDate && `Event Date: ${customerInfo.eventDate}`,
      customerInfo.eventType && `Event Type: ${customerInfo.eventType}`,
      customerInfo.guestCount && `Guest Count: ${customerInfo.guestCount}`,
    ].filter(Boolean);

    details.forEach(detail => {
      if (detail) {
        this.doc.text(detail, this.margin, this.currentY);
        this.currentY += 5;
      }
    });

    this.currentY += 10;

    // Decorative line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 15;
  }

  private addMenuSelections(selections: MenuSelection[]): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(40, 40, 40);
    this.doc.text('Selected Menu Items', this.margin, this.currentY);
    
    this.currentY += 15;

    // Table headers
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(80, 80, 80);
    
    const headers = ['Item', 'Description', 'Qty', 'Price', 'Total'];
    const columnWidths = [50, 80, 20, 25, 25];
    const startX = this.margin;
    
    let currentX = startX;
    headers.forEach((header, index) => {
      this.doc.text(header, currentX, this.currentY);
      currentX += columnWidths[index];
    });

    this.currentY += 8;

    // Header line
    this.doc.setDrawColor(150, 150, 150);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 8;

    // Menu items
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);

    let grandTotal = 0;

    selections.forEach((selection) => {
      const { item, quantity } = selection;
      const itemTotal = item.price * quantity;
      grandTotal += itemTotal;

      // Check if we need a new page
      if (this.currentY > this.pageHeight - 50) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      currentX = startX;

      // Item name
      const itemName = this.truncateText(item.name, 45);
      this.doc.text(itemName, currentX, this.currentY);
      currentX += columnWidths[0];

      // Description
      const description = this.truncateText(item.description, 70);
      this.doc.text(description, currentX, this.currentY);
      currentX += columnWidths[1];

      // Quantity
      this.doc.text(quantity.toString(), currentX, this.currentY);
      currentX += columnWidths[2];

      // Price
      this.doc.text(formatPrice(item.price), currentX, this.currentY);
      currentX += columnWidths[3];

      // Total
      this.doc.text(formatPrice(itemTotal), currentX, this.currentY);

      this.currentY += 8;

      // Dietary restrictions
      if (item.dietaryRestrictions && item.dietaryRestrictions.length > 0) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(120, 120, 120);
        const restrictions = item.dietaryRestrictions.join(', ');
        this.doc.text(`(${restrictions})`, startX, this.currentY);
        this.doc.setFontSize(10);
        this.doc.setTextColor(60, 60, 60);
        this.currentY += 6;
      }

      // Special notes
      if (item.specialNotes) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(100, 100, 100);
        const notes = this.truncateText(item.specialNotes, 100);
        this.doc.text(`Note: ${notes}`, startX, this.currentY);
        this.doc.setFontSize(10);
        this.doc.setTextColor(60, 60, 60);
        this.currentY += 6;
      }

      this.currentY += 3;
    });

    // Total line
    this.currentY += 5;
    this.doc.setDrawColor(150, 150, 150);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 10;

    // Grand total
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(40, 40, 40);
    
    const totalText = `Grand Total: ${formatPrice(grandTotal)}`;
    const totalWidth = this.doc.getTextWidth(totalText);
    this.doc.text(totalText, this.pageWidth - this.margin - totalWidth, this.currentY);

    this.currentY += 20;
  }

  private addFooter(businessInfo: BusinessInfo): void {
    // Terms and conditions
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(80, 80, 80);
    this.doc.text('Terms & Conditions:', this.margin, this.currentY);
    
    this.currentY += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);

    const terms = [
      '• All prices are subject to change based on final guest count and menu modifications.',
      '• A 50% deposit is required to confirm your booking.',
      '• Final guest count must be confirmed 48 hours before the event.',
      '• Cancellations made less than 72 hours before the event may incur charges.',
      '• We accommodate dietary restrictions with advance notice.',
    ];

    terms.forEach(term => {
      if (this.currentY > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      
      const lines = this.doc.splitTextToSize(term, this.pageWidth - 2 * this.margin);
      this.doc.text(lines, this.margin, this.currentY);
      this.currentY += lines.length * 4;
    });

    // Footer info
    const footerY = this.pageHeight - 20;
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    
    const footerText = `Generated on ${new Date().toLocaleDateString()} | ${businessInfo.name}`;
    const footerWidth = this.doc.getTextWidth(footerText);
    this.doc.text(footerText, (this.pageWidth - footerWidth) / 2, footerY);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Utility function to generate PDF
export function generateMenuPDF(options: PDFGeneratorOptions): void {
  const generator = new MenuPDFGenerator();
  generator.generateMenuPDF(options);
}