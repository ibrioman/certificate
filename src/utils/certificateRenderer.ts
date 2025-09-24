import { CertificateConfig } from '../types/certificate';

export class CertificateRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentTemplate: any;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
  }

  async renderCertificate(config: CertificateConfig): Promise<string> {
    const { template, participant, qrCodeUrl, includeQR } = config;
    
    // Store template reference for position methods
    this.currentTemplate = template;
    
    // Set canvas dimensions
    this.canvas.width = template.width;
    this.canvas.height = template.height;

    // Clear canvas and set background
    this.ctx.fillStyle = template.backgroundColor;
    this.ctx.fillRect(0, 0, template.width, template.height);

    try {
      // Draw border
      await this.drawBorder();

      // Draw logo if provided
      if (template.logoUrl) {
        await this.drawLogo(template.logoUrl);
      }

      // Draw title
      await this.drawTitle(template, participant);

      // Draw body text
      await this.drawBodyText(template, participant);

      // Draw signature if provided
      if (template.signatureUrl) {
        await this.drawSignature(template.signatureUrl);
      }

      // Draw QR code if enabled and provided
      if (includeQR && qrCodeUrl) {
        await this.drawQRCode(qrCodeUrl);
      }

      // Draw date
      await this.drawDate(participant.date || new Date().toLocaleDateString());

      return this.canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('Certificate rendering failed:', error);
      throw new Error('Failed to render certificate');
    }
  }

  private async drawBorder(): Promise<void> {
    const borderWidth = 8;
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FFD700');

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = borderWidth;
    this.ctx.strokeRect(
      borderWidth / 2, 
      borderWidth / 2, 
      this.canvas.width - borderWidth, 
      this.canvas.height - borderWidth
    );

    // Inner border
    this.ctx.strokeStyle = '#DAA520';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(20, 20, this.canvas.width - 40, this.canvas.height - 40);
  }

  private async drawLogo(logoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoSize = 80;
        const position = this.getLogoPosition();
        let x: number;
        
        switch (position) {
          case 'left':
            x = 50;
            break;
          case 'right':
            x = this.canvas.width - logoSize - 50;
            break;
          default: // center
            x = (this.canvas.width - logoSize) / 2;
        }
        
        const y = 40;
        this.ctx.drawImage(img, x, y, logoSize, logoSize);
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load logo, continuing without it');
        resolve();
      };
      img.src = logoUrl;
    });
  }

  private async drawTitle(template: any, participant: any): Promise<void> {
    this.ctx.font = `bold ${template.titleSize}px ${template.titleFont}`;
    this.ctx.fillStyle = template.titleColor;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const titleY = template.logoUrl ? 180 : 120;
    this.ctx.fillText(template.titleText, this.canvas.width / 2, titleY);
  }

  private async drawBodyText(template: any, participant: any): Promise<void> {
    this.ctx.font = `${template.bodySize}px ${template.bodyFont}`;
    this.ctx.fillStyle = template.bodyColor;
    this.ctx.textAlign = 'center';

    const bodyY = template.logoUrl ? 280 : 220;
    const bodyText = template.bodyText;
    
    // Split text by {name} placeholder to handle participant name styling separately
    const parts = bodyText.split('{name}');
    
    if (parts.length === 2) {
      // Text has {name} placeholder - render with special styling for name
      const beforeName = parts[0].trim();
      const afterName = parts[1].trim();
      
      let currentY = bodyY;
      
      // Render text before name
      if (beforeName) {
        const beforeLines = this.wrapText(beforeName, this.canvas.width - 100);
        beforeLines.forEach((line, index) => {
          this.ctx.fillText(line, this.canvas.width / 2, currentY + (index * (template.bodySize + 10)));
        });
        currentY += beforeLines.length * (template.bodySize + 10);
      }
      
      // Render participant name with special styling
      this.ctx.font = `bold ${template.participantNameSize}px ${template.bodyFont}`;
      this.ctx.fillStyle = template.participantNameColor;
      this.ctx.fillText(participant.name, this.canvas.width / 2, currentY);
      currentY += template.participantNameSize + 15;
      
      // Reset font for remaining text
      this.ctx.font = `${template.bodySize}px ${template.bodyFont}`;
      this.ctx.fillStyle = template.bodyColor;
      
      // Render text after name
      if (afterName) {
        const afterLines = this.wrapText(afterName, this.canvas.width - 100);
        afterLines.forEach((line, index) => {
          this.ctx.fillText(line, this.canvas.width / 2, currentY + (index * (template.bodySize + 10)));
        });
        currentY += afterLines.length * (template.bodySize + 10);
      }
      
      // Update bodyY for subsequent elements
      const finalBodyY = currentY;
      
      // Draw course name if available
      if (participant.course) {
        this.ctx.font = `italic ${template.bodySize - 4}px ${template.bodyFont}`;
        this.ctx.fillText(
          `Course: ${participant.course}`, 
          this.canvas.width / 2, 
          finalBodyY + 30
        );
      }

      // Draw grade if available
      if (participant.grade) {
        this.ctx.font = `bold ${template.bodySize - 2}px ${template.bodyFont}`;
        this.ctx.fillText(
          `Grade: ${participant.grade}`, 
          this.canvas.width / 2, 
          finalBodyY + (participant.course ? 60 : 30)
        );
      }
    } else {
      // No {name} placeholder - render normally with participant name replacement
      const fullText = bodyText.replace('{name}', participant.name);
      const lines = this.wrapText(fullText, this.canvas.width - 100);
      lines.forEach((line, index) => {
        this.ctx.fillText(line, this.canvas.width / 2, bodyY + (index * (template.bodySize + 10)));
      });
      
      // Draw course name if available
      if (participant.course) {
        this.ctx.font = `italic ${template.bodySize - 4}px ${template.bodyFont}`;
        this.ctx.fillText(
          `Course: ${participant.course}`, 
          this.canvas.width / 2, 
          bodyY + (lines.length * (template.bodySize + 10)) + 30
        );
      }

      // Draw grade if available
      if (participant.grade) {
        this.ctx.font = `bold ${template.bodySize - 2}px ${template.bodyFont}`;
        this.ctx.fillText(
          `Grade: ${participant.grade}`, 
          this.canvas.width / 2, 
          bodyY + (lines.length * (template.bodySize + 10)) + 60
        );
      }
    }
  }
    lines.forEach((line, index) => {
      this.ctx.fillText(line, this.canvas.width / 2, bodyY + (index * (template.bodySize + 10)));
    });

    // Draw course name if available
    if (participant.course) {
      this.ctx.font = `italic ${template.bodySize - 4}px ${template.bodyFont}`;
      this.ctx.fillText(
        `Course: ${participant.course}`, 
        this.canvas.width / 2, 
        bodyY + (lines.length * (template.bodySize + 10)) + 30
      );
    }

    // Draw grade if available
    if (participant.grade) {
      this.ctx.font = `bold ${template.bodySize - 2}px ${template.bodyFont}`;
      this.ctx.fillText(
        `Grade: ${participant.grade}`, 
        this.canvas.width / 2, 
        bodyY + (lines.length * (template.bodySize + 10)) + 60
      );
    }
  }

  private async drawSignature(signatureUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const sigWidth = 150;
        const sigHeight = 60;
        const position = this.getSignaturePosition();
        let x: number;
        
        switch (position) {
          case 'left':
            x = 50;
            break;
          case 'center':
            x = (this.canvas.width - sigWidth) / 2;
            break;
          default: // right
            x = this.canvas.width - sigWidth - 50;
        }
        
        const y = this.canvas.height - sigHeight - 80;
        this.ctx.drawImage(img, x, y, sigWidth, sigHeight);
        
        // Add signature line
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + sigHeight + 10);
        this.ctx.lineTo(x + sigWidth, y + sigHeight + 10);
        this.ctx.stroke();
        
        // Add signature label
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Authorized Signature', x + sigWidth / 2, y + sigHeight + 25);
        
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load signature, continuing without it');
        resolve();
      };
      img.src = signatureUrl;
    });
  }

  private async drawQRCode(qrCodeUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const qrSize = 100;
        const x = 50;
        const y = this.canvas.height - qrSize - 50;
        this.ctx.drawImage(img, x, y, qrSize, qrSize);
        
        // Add QR code label
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#666666';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Scan to verify', x + qrSize / 2, y + qrSize + 15);
        
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load QR code, continuing without it');
        resolve();
      };
      img.src = qrCodeUrl;
    });
  }

  private async drawDate(date: string): Promise<void> {
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#333333';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Date: ${date}`, this.canvas.width / 2, this.canvas.height - 30);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
  
  private getLogoPosition(): 'left' | 'center' | 'right' {
    return this.currentTemplate?.logoPosition || 'center';
  }
  
  private getSignaturePosition(): 'left' | 'center' | 'right' {
    return this.currentTemplate?.signaturePosition || 'right';
  }
}