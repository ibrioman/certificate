import { CertificateConfig } from '../types/certificate';

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

  async renderCertificate(config: CertificateConfig): Promise<string> {
    // Set canvas dimensions
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set background color
    this.ctx.fillStyle = config.backgroundColor || '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render logo if present
    if (config.logoImage) {
      await this.renderLogo(config);
    }

    // Render title
    this.renderTitle(config);

    // Render body text
    this.renderBodyText(config);

    // Render signature if present
    if (config.signatureImage) {
      await this.renderSignature(config);
    }

    // Render QR code if enabled
    if (config.includeQR) {
      await this.renderQRCode(config);
    }

    return this.canvas.toDataURL('image/png');
  }

  private renderTitle(config: CertificateConfig): void {
    this.ctx.fillStyle = config.titleColor || '#000000';
    this.ctx.font = `${config.titleSize || 36}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(config.titleText || 'Certificate', this.canvas.width / 2, 100);
  }

  private renderBodyText(config: CertificateConfig): void {
    this.ctx.fillStyle = config.bodyTextColor || '#000000';
    this.ctx.font = `${config.bodyTextSize || 18}px Arial`;
    this.ctx.textAlign = 'center';
    
    const bodyText = config.bodyText || 'This is to certify that {name} has successfully completed the requirements.';
    const lines = this.wrapText(bodyText, this.canvas.width - 100);
    
    lines.forEach((line, index) => {
      this.ctx.fillText(line, this.canvas.width / 2, 200 + (index * 30));
    });
  }

  private async renderLogo(config: CertificateConfig): Promise<void> {
    if (!config.logoImage) return;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 150;
        const maxHeight = 100;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        let x = 50; // Default left position
        if (config.logoPosition === 'center') {
          x = (this.canvas.width - width) / 2;
        } else if (config.logoPosition === 'right') {
          x = this.canvas.width - width - 50;
        }

        this.ctx.drawImage(img, x, 20, width, height);
        resolve();
      };
      img.onerror = () => resolve(); // Continue even if image fails to load
      img.src = config.logoImage;
    });
  }

  private async renderSignature(config: CertificateConfig): Promise<void> {
    if (!config.signatureImage) return;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 200;
        const maxHeight = 80;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        let x = 50; // Default left position
        if (config.signaturePosition === 'center') {
          x = (this.canvas.width - width) / 2;
        } else if (config.signaturePosition === 'right') {
          x = this.canvas.width - width - 50;
        }

        const y = this.canvas.height - height - 50;
        this.ctx.drawImage(img, x, y, width, height);
        resolve();
      };
      img.onerror = () => resolve(); // Continue even if image fails to load
      img.src = config.signatureImage;
    });
  }

  private async renderQRCode(config: CertificateConfig): Promise<void> {
    // Simple QR code placeholder - in a real implementation, you'd use a QR code library
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(this.canvas.width - 120, this.canvas.height - 120, 100, 100);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('QR', this.canvas.width - 70, this.canvas.height - 65);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

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
}