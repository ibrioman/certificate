import QRCode from 'qrcode';

export class QRCodeGenerator {
  private static readonly DEFAULT_OPTIONS = {
    width: 150,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const
  };

  static async generateQRCode(
    data: string, 
    options: Partial<typeof QRCodeGenerator.DEFAULT_OPTIONS> = {}
  ): Promise<string> {
    try {
      const qrOptions = { ...this.DEFAULT_OPTIONS, ...options };
      const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static async generateVerificationQR(participantId: string, baseUrl: string = ''): Promise<string> {
    const verificationUrl = `${baseUrl}/verify/${participantId}`;
    return this.generateQRCode(verificationUrl);
  }

  static async generateBatchQRCodes(
    participantIds: string[], 
    baseUrl: string = ''
  ): Promise<Map<string, string>> {
    const qrCodes = new Map<string, string>();
    
    const promises = participantIds.map(async (id) => {
      try {
        const qrCode = await this.generateVerificationQR(id, baseUrl);
        qrCodes.set(id, qrCode);
      } catch (error) {
        console.error(`Failed to generate QR code for participant ${id}:`, error);
      }
    });

    await Promise.all(promises);
    return qrCodes;
  }
}