export interface Participant {
  id: string;
  name: string;
  email?: string;
  course?: string;
  date?: string;
  grade?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  titleText: string;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  bodyText: string;
  bodyFont: string;
  bodySize: number;
  bodyColor: string;
  participantNameSize: number;
  participantNameColor: string;
  logoUrl?: string;
  logoPosition?: 'left' | 'center' | 'right';
  signatureUrl?: string;
  signaturePosition?: 'left' | 'center' | 'right';
}

export interface CertificateConfig {
  template: CertificateTemplate;
  participant: Participant;
  qrCodeUrl?: string;
  includeQR: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVUploadResult {
  participants: Participant[];
  errors: ValidationError[];
  totalRows: number;
}