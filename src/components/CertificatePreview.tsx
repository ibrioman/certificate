import React, { useRef, useEffect, useState } from 'react';
import { Download, Eye, Settings } from 'lucide-react';
import { CertificateRenderer } from '../utils/certificateRenderer';
import { CertificateConfig } from '../types/certificate';

interface CertificatePreviewProps {
  config: CertificateConfig;
  onConfigChange?: (config: CertificateConfig) => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ 
  config, 
  onConfigChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    renderCertificate();
  }, [config]);

  const renderCertificate = async () => {
    if (!canvasRef.current) return;

    setIsRendering(true);
    try {
      const renderer = new CertificateRenderer(canvasRef.current);
      const dataUrl = await renderer.renderCertificate(config);
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error('Failed to render certificate:', error);
    } finally {
      setIsRendering(false);
    }
  };

  const downloadCertificate = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.download = `certificate-${config.participant.name.replace(/\s+/g, '-')}.png`;
    link.href = previewUrl;
    link.click();
  };

  const handleTemplateChange = (field: string, value: any) => {
    if (!onConfigChange) return;

    const updatedConfig = {
      ...config,
      template: {
        ...config.template,
        [field]: value
      }
    };
    onConfigChange(updatedConfig);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Certificate Preview</h3>
          <span className="text-sm text-gray-500">
            ({config.participant.name})
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={downloadCertificate}
            disabled={isRendering || !previewUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && onConfigChange && (
        <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
          <h4 className="text-md font-semibold mb-4">Template Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Text
              </label>
              <input
                type="text"
                value={config.template.titleText}
                onChange={(e) => handleTemplateChange('titleText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Size
              </label>
              <input
                type="number"
                min="20"
                max="80"
                value={config.template.titleSize}
                onChange={(e) => handleTemplateChange('titleSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Color
              </label>
              <input
                type="color"
                value={config.template.titleColor}
                onChange={(e) => handleTemplateChange('titleColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Text
              </label>
              <textarea
                value={config.template.bodyText}
                onChange={(e) => handleTemplateChange('bodyText', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Use {name} for participant name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={config.template.backgroundColor}
                onChange={(e) => handleTemplateChange('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.includeQR}
                  onChange={(e) => onConfigChange({ ...config, includeQR: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Include QR Code</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex justify-center">
          {isRendering ? (
            <div className="flex items-center justify-center h-96 w-full bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Rendering certificate...</p>
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm"
              style={{ maxHeight: '600px' }}
            />
          )}
        </div>
        
        {previewUrl && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Certificate ready for download
          </div>
        )}
      </div>
    </div>
  );
};