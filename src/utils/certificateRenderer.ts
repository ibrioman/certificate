import { CertificateTemplate } from '../types/certificate';

interface CertificateConfig {
  template: CertificateTemplate;
  participant?: { name: string };
  qrCodeUrl?: string;
  includeQR?: boolean;
}

export class CertificateRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
  }

  async renderCertificate(config: CertificateConfig): Promise<void> {
    const { template, participant, qrCodeUrl, includeQR } = config;
    const participantName = participant?.name;

    // Set canvas size
    this.canvas.width = template.width || 800;
    this.canvas.height = template.height || 600;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fill background
    this.ctx.fillStyle = template.backgroundColor || '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render logo if present
    if (template.logoUrl) {
      await this.renderImage(template.logoUrl, template.logoPosition || 'center', 'top');
    }

    // Render title
    this.renderTitle(template.titleText, template.titleSize, template.titleColor);

    // Render body text with participant name styling
    this.renderBodyText(
      template.bodyText, 
      template.bodyTextSize, 
      template.bodyTextColor, 
      participantName, 
      template.participantNameSize, 
      template.participantNameColor
    );

    // Render signature if present
    if (template.signatureUrl) {
      await this.renderImage(template.signatureUrl, template.signaturePosition || 'center', 'bottom');
    }

    // Render QR code if enabled
    if (includeQR && qrCodeUrl) {
      await this.renderQRCode(qrCodeUrl);
    } else if (template.includeQRCode) {
      this.renderQRCodePlaceholder();
    }
  }

  private renderTitle(text: string, size: number, color: string): void {
    this.ctx.font = `bold ${size}px ${this.getFont('title')}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    const x = this.canvas.width / 2;
    const y = 80;
    
    this.ctx.fillText(text, x, y);
  }

  private getFont(type: 'title' | 'body'): string {
    // Default to Arial if no custom font is specified
    return 'Arial, sans-serif';
  }

  private renderBodyText(
    text: string, 
    size: number, 
    color: string, 
    participantName?: string,
    nameSize?: number,
    nameColor?: string
  ): void {
    const x = this.canvas.width / 2;
    const y = 250;
    const maxWidth = this.canvas.width - 100;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    // Check if text contains {name} placeholder and participant name is provided
    if (text.includes('{name}') && participantName) {
      const parts = text.split('{name}');
      let currentY = y;

      // Render text before name
      if (parts[0].trim()) {
        this.ctx.font = `${size}px ${this.getFont('body')}`;
        this.ctx.fillStyle = color;
        const beforeLines = this.wrapText(parts[0].trim(), maxWidth, size);
        for (const line of beforeLines) {
          this.ctx.fillText(line, x, currentY);
          currentY += size * 1.2;
        }
      }

      // Render participant name with special styling
      this.ctx.font = `bold ${nameSize || size}px ${this.getFont('body')}`;
      this.ctx.fillStyle = nameColor || color;
      this.ctx.fillText(participantName, x, currentY);
      currentY += (nameSize || size) * 1.2;

      // Render text after name
      if (parts[1].trim()) {
        this.ctx.font = `${size}px ${this.getFont('body')}`;
        this.ctx.fillStyle = color;
        const afterLines = this.wrapText(parts[1].trim(), maxWidth, size);
        for (const line of afterLines) {
          this.ctx.fillText(line, x, currentY);
          currentY += size * 1.2;
        }
      }
    } else {
      // Render normal text (replace {name} with participant name if provided)
      const finalText = participantName ? text.replace('{name}', participantName) : text;
      this.ctx.font = `${size}px ${this.getFont('body')}`;
      this.ctx.fillStyle = color;
      
      const lines = this.wrapText(finalText, maxWidth, size);
      let currentY = y;
      
      for (const line of lines) {
        this.ctx.fillText(line, x, currentY);
        currentY += size * 1.2;
      }
    }
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    this.ctx.font = `${fontSize}px ${this.getFont('body')}`;

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private async renderQRCode(qrCodeUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const size = 80;
        const x = this.canvas.width - size - 20;
        const y = this.canvas.height - size - 20;
        
        this.ctx.drawImage(img, x, y, size, size);
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load QR code:', qrCodeUrl);
        this.renderQRCodePlaceholder();
        resolve();
      };
      img.src = qrCodeUrl;
    });
  }

  private async renderImage(imageUrl: string, position: 'left' | 'center' | 'right', verticalPosition: 'top' | 'bottom'): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 150;
        const maxHeight = 100;
        
        // Calculate scaled dimensions
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * scale;
        const height = img.height * scale;

        // Calculate x position
        let x: number;
        switch (position) {
          case 'left':
            x = 50;
            break;
          case 'right':
            x = this.canvas.width - width - 50;
            break;
          default: // center
            x = (this.canvas.width - width) / 2;
        }

        // Calculate y position
        const y = verticalPosition === 'top' ? 20 : this.canvas.height - height - 20;

        this.ctx.drawImage(img, x, y, width, height);
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load image:', imageUrl);
        resolve(); // Continue rendering even if image fails
      };
      img.src = imageUrl;
    });
  }

  private renderQRCodePlaceholder(): void {
    const size = 80;
    const x = this.canvas.width - size - 20;
    const y = this.canvas.height - size - 20;

    // Draw QR code placeholder
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x, y, size, size);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('QR', x + size / 2, y + size / 2);
  }

  getDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }
}