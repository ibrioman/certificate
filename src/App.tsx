import React, { useState, useCallback } from 'react';
import { Award, Users, Settings, Download } from 'lucide-react';
import { CSVUploader } from './components/CSVUploader';
import { CertificatePreview } from './components/CertificatePreview';
import { BatchCertificateGenerator } from './components/BatchCertificateGenerator';
import { QRCodeGenerator } from './utils/qrCodeGenerator';
import { CSVUploadResult, Participant, CertificateTemplate, CertificateConfig } from './types/certificate';

const defaultTemplate: CertificateTemplate = {
  id: 'default',
  name: 'Classic Certificate',
  width: 800,
  height: 600,
  backgroundColor: '#FFFFFF',
  titleText: 'Certificate of Achievement',
  titleFont: 'Arial',
  titleSize: 36,
  titleColor: '#2C3E50',
  bodyText: 'This is to certify that {name} has successfully completed the requirements and is hereby awarded this certificate.',
  bodyFont: 'Arial',
  bodySize: 18,
  bodyColor: '#34495E',
  logoPosition: 'center',
  signaturePosition: 'right'
};

const sampleParticipant: Participant = {
  id: 'sample',
  name: 'John Doe',
  email: 'john.doe@example.com',
  course: 'Web Development Fundamentals',
  date: 'December 15, 2024',
  grade: 'A+'
};

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant>(sampleParticipant);
  const [template, setTemplate] = useState<CertificateTemplate>(defaultTemplate);
  const [includeQR, setIncludeQR] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'batch'>('upload');
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadComplete = useCallback(async (result: CSVUploadResult) => {
    setParticipants(result.participants);
    
    if (result.participants.length > 0) {
      setSelectedParticipant(result.participants[0]);
      setActiveTab('preview');
    }
  }, []);

  const handleConfigChange = useCallback((config: CertificateConfig) => {
    setTemplate(config.template);
    setIncludeQR(config.includeQR);
  }, []);

  // Generate QR code for preview
  React.useEffect(() => {
    const generateQR = async () => {
      if (includeQR && selectedParticipant) {
        try {
          const qr = await QRCodeGenerator.generateVerificationQR(
            selectedParticipant.id,
            window.location.origin
          );
          setQrCodeUrl(qr);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
          setQrCodeUrl('');
        }
      } else {
        setQrCodeUrl('');
      }
    };

    generateQR();
  }, [includeQR, selectedParticipant]);

  const certificateConfig: CertificateConfig = {
    template,
    participant: selectedParticipant,
    qrCodeUrl,
    includeQR
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Certificate Generator</h1>
                <p className="text-sm text-gray-500">Professional certificate generation system</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {participants.length > 0 && (
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {participants.length} participant{participants.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              1. Upload Data
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              disabled={participants.length === 0}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : participants.length === 0
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              2. Preview & Customize
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              disabled={participants.length === 0}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'batch'
                  ? 'border-blue-500 text-blue-600'
                  : participants.length === 0
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              3. Generate Batch
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Participant Data</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload a CSV file containing participant information. The file should include a 'name' column 
                and optionally 'email', 'course', 'date', and 'grade' columns.
              </p>
            </div>
            
            <CSVUploader onUploadComplete={handleUploadComplete} isLoading={isLoading} />
            
            {/* Sample CSV Format */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Sample CSV Format:</h3>
                <pre className="text-sm text-blue-800 bg-white p-3 rounded border overflow-x-auto">
{`name,email,course,date,grade
John Doe,john@example.com,Web Development,2024-12-15,A+
Jane Smith,jane@example.com,Data Science,2024-12-15,A
Bob Johnson,bob@example.com,UI/UX Design,2024-12-15,B+`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview & Customize</h2>
              <p className="text-gray-600">
                Preview how certificates will look and customize the template settings.
              </p>
            </div>

            {/* Participant Selector */}
            {participants.length > 1 && (
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Participant:
                </label>
                <select
                  value={selectedParticipant.id}
                  onChange={(e) => {
                    const participant = participants.find(p => p.id === e.target.value);
                    if (participant) setSelectedParticipant(participant);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <CertificatePreview 
              config={certificateConfig}
              onConfigChange={handleConfigChange}
            />
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Batch Certificates</h2>
              <p className="text-gray-600">
                Generate certificates for all participants and download them as a ZIP file.
              </p>
            </div>

            <BatchCertificateGenerator
              participants={participants}
              template={template}
              includeQR={includeQR}
              baseUrl={window.location.origin}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Professional Certificate Generation System</p>
            <p className="mt-1">Built with React, TypeScript, and HTML5 Canvas</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;