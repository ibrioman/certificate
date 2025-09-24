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
  logoUrl?: string;
  signatureUrl?: string;
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