import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { CSVParser } from '../utils/csvParser';
import { CSVUploadResult, ValidationError } from '../types/certificate';

interface CSVUploaderProps {
  onUploadComplete: (result: CSVUploadResult) => void;
  isLoading?: boolean;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ onUploadComplete, isLoading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<CSVUploadResult | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const result = await CSVParser.parseCSVFile(file);
      setUploadResult(result);
      onUploadComplete(result);
    } catch (error) {
      console.error('File upload error:', error);
      const errorResult: CSVUploadResult = {
        participants: [],
        errors: [{ row: 0, field: 'file', message: 'Failed to process file' }],
        totalRows: 0
      };
      setUploadResult(errorResult);
      onUploadComplete(errorResult);
    }
  }, [onUploadComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const clearResults = () => {
    setUploadResult(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Upload className="w-8 h-8 text-gray-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload CSV File
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Required column: <strong>name</strong><br />
              Optional columns: email, course, date, grade
            </p>
          </div>
          
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Choose File'}
          </button>
        </div>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Upload Results
            </h4>
            <button
              onClick={clearResults}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Summary */}
          {uploadResult.participants.length > 0 && (
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">
                Successfully processed {uploadResult.participants.length} participants
              </span>
            </div>
          )}

          {/* Error Summary */}
          {uploadResult.errors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">
                  {uploadResult.errors.length} error(s) found
                </span>
              </div>
              
              <div className="max-h-40 overflow-y-auto">
                {uploadResult.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 p-2 bg-red-50 border-l-4 border-red-400 mb-1">
                    <strong>Row {error.row}:</strong> {error.message}
                    {error.field !== 'file' && <span className="text-red-500"> (Field: {error.field})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-semibold text-gray-900">{uploadResult.totalRows}</div>
              <div className="text-gray-600">Total Rows</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-700">{uploadResult.participants.length}</div>
              <div className="text-green-600">Valid</div>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <div className="font-semibold text-red-700">{uploadResult.errors.length}</div>
              <div className="text-red-600">Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};