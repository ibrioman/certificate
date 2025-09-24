import Papa from 'papaparse';
import { Participant, ValidationError, CSVUploadResult } from '../types/certificate';

export class CSVParser {
  private static readonly REQUIRED_FIELDS = ['name'];
  private static readonly OPTIONAL_FIELDS = ['email', 'course', 'date', 'grade'];
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  static async parseCSVFile(file: File): Promise<CSVUploadResult> {
    return new Promise((resolve) => {
      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        resolve({
          participants: [],
          errors: [{ row: 0, field: 'file', message: 'File size exceeds 5MB limit' }],
          totalRows: 0
        });
        return;
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        resolve({
          participants: [],
          errors: [{ row: 0, field: 'file', message: 'Please upload a CSV file' }],
          totalRows: 0
        });
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
        complete: (results) => {
          const { participants, errors } = this.processCSVData(results.data as any[]);
          resolve({
            participants,
            errors,
            totalRows: results.data.length
          });
        },
        error: (error) => {
          resolve({
            participants: [],
            errors: [{ row: 0, field: 'file', message: `CSV parsing error: ${error.message}` }],
            totalRows: 0
          });
        }
      });
    });
  }

  private static processCSVData(data: any[]): { participants: Participant[]; errors: ValidationError[] } {
    const participants: Participant[] = [];
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 1;
      const participant = this.validateAndCreateParticipant(row, rowNumber, errors);
      
      if (participant) {
        participants.push(participant);
      }
    });

    return { participants, errors };
  }

  private static validateAndCreateParticipant(
    row: any, 
    rowNumber: number, 
    errors: ValidationError[]
  ): Participant | null {
    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!row[field] || typeof row[field] !== 'string' || row[field].trim() === '') {
        errors.push({
          row: rowNumber,
          field,
          message: `${field} is required and cannot be empty`
        });
        return null;
      }
    }

    // Validate email format if provided
    if (row.email && !this.isValidEmail(row.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format'
      });
    }

    // Validate date format if provided
    if (row.date && !this.isValidDate(row.date)) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Invalid date format (expected: YYYY-MM-DD or MM/DD/YYYY)'
      });
    }

    // Create participant object
    const participant: Participant = {
      id: `participant_${rowNumber}_${Date.now()}`,
      name: this.sanitizeString(row.name),
      email: row.email ? this.sanitizeString(row.email) : undefined,
      course: row.course ? this.sanitizeString(row.course) : undefined,
      date: row.date ? this.formatDate(row.date) : undefined,
      grade: row.grade ? this.sanitizeString(row.grade) : undefined,
    };

    return participant;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}