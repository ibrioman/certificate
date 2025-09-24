import React, { useState, useCallback } from 'react';
import { Download, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { CertificateRenderer } from '../utils/certificateRenderer';
import { QRCodeGenerator } from '../utils/qrCodeGenerator';
import { Participant, CertificateTemplate } from '../types/certificate';

interface BatchGeneratorProps {
  participants: Participant[];
  template: CertificateTemplate;
  includeQR: boolean;
  baseUrl?: string;
}

interface GenerationProgress {
  current: number;
  total: number;
  currentParticipant: string;
  errors: string[];
}

export const BatchCertificateGenerator: React.FC<BatchGeneratorProps> = ({
  participants,
  template,
  includeQR,
  baseUrl = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    currentParticipant: '',
    errors: []
  });

  const generateBatchCertificates = useCallback(async () => {
    if (participants.length === 0) return;

    setIsGenerating(true);
    setProgress({
      current: 0,
      total: participants.length,
      currentParticipant: '',
      errors: []
    });

    const zip = new JSZip();
    const canvas = document.createElement('canvas');
    const renderer = new CertificateRenderer(canvas);
    const errors: string[] = [];

    try {
      // Generate QR codes if needed
      let qrCodes: Map<string, string> | null = null;
      if (includeQR) {
        try {
          qrCodes = await QRCodeGenerator.generateBatchQRCodes(
            participants.map(p => p.id),
            baseUrl
          );
        } catch (error) {
          console.error('Failed to generate QR codes:', error);
          errors.push('Failed to generate QR codes for verification');
        }
      }

      // Generate certificates
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentParticipant: participant.name
        }));

        try {
          const config = {
            template,
            participant,
            qrCodeUrl: qrCodes?.get(participant.id),
            includeQR: includeQR && qrCodes?.has(participant.id) === true
          };

          const certificateDataUrl = await renderer.renderCertificate(config);
          
          // Convert data URL to blob
          const response = await fetch(certificateDataUrl);
          const blob = await response.blob();
          
          // Add to zip
          const fileName = `certificate-${participant.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
          zip.file(fileName, blob);
          
        } catch (error) {
          console.error(`Failed to generate certificate for ${participant.name}:`, error);
          errors.push(`Failed to generate certificate for ${participant.name}`);
        }
      }

      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificates-batch-${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setProgress(prev => ({ ...prev, errors }));
      
    } catch (error) {
      console.error('Batch generation failed:', error);
      setProgress(prev => ({
        ...prev,
        errors: [...prev.errors, 'Batch generation failed']
      }));
    } finally {
      setIsGenerating(false);
    }
  }, [participants, template, includeQR, baseUrl]);

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Batch Certificate Generation</h3>
          </div>
          
          <div className="text-sm text-gray-500">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Generation Settings Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Generation Settings</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Template:</span>
              <span className="ml-2 font-medium">{template.name}</span>
            </div>
            <div>
              <span className="text-gray-600">QR Codes:</span>
              <span className="ml-2 font-medium">{includeQR ? 'Included' : 'Not included'}</span>
            </div>
            <div>
              <span className="text-gray-600">Format:</span>
              <span className="ml-2 font-medium">PNG</span>
            </div>
            <div>
              <span className="text-gray-600">Delivery:</span>
              <span className="ml-2 font-medium">ZIP Archive</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Generating certificates...
              </span>
              <span className="text-sm text-gray-500">
                {progress.current} of {progress.total}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {progress.currentParticipant && (
              <div className="text-sm text-gray-600">
                Processing: {progress.currentParticipant}
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {progress.errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">
                Generation Errors ({progress.errors.length})
              </span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              {progress.errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {!isGenerating && progress.current > 0 && progress.current === progress.total && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Successfully generated {progress.current - progress.errors.length} certificates
              </span>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateBatchCertificates}
          disabled={isGenerating || participants.length === 0}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Generating... ({Math.round(progressPercentage)}%)</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate All Certificates</span>
            </>
          )}
        </button>

        {participants.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-2">
            Upload a CSV file with participants to enable batch generation
          </p>
        )}
      </div>
    </div>
  );
};