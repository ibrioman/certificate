import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  type: 'logo' | 'signature';
  currentImageUrl?: string;
  position: 'left' | 'center' | 'right';
  onImageUpload: (imageUrl: string | undefined) => void;
  onPositionChange: (position: 'left' | 'center' | 'right') => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  type,
  currentImageUrl,
  position,
  onImageUpload,
  onPositionChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const maxFileSize = type === 'logo' ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB for logo, 2MB for signature
  const acceptedFormats = type === 'logo' 
    ? '.png,.jpg,.jpeg,.svg'
    : '.png,.jpg,.jpeg';

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${maxFileSize / (1024 * 1024)}MB`;
    }

    // Check file type
    const validTypes = type === 'logo' 
      ? ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
      : ['image/png', 'image/jpeg', 'image/jpg'];
    
    if (!validTypes.includes(file.type)) {
      return `Invalid file type. Supported formats: ${acceptedFormats}`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    setError('');
    setIsUploading(true);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      return;
    }

    try {
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Failed to upload image');
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = () => {
    onImageUpload(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {type === 'logo' ? 'Company Logo' : 'Signature'}
        </label>
        {currentImageUrl && (
          <button
            onClick={removeImage}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {currentImageUrl ? (
          <div className="space-y-2">
            <img
              src={currentImageUrl}
              alt={`${type} preview`}
              className="mx-auto max-h-20 max-w-full object-contain"
            />
            <button
              onClick={openFileDialog}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Replace {type}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <button
                onClick={openFileDialog}
                disabled={isUploading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : `Upload ${type}`}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                {acceptedFormats.replace(/\./g, '').toUpperCase()} • Max {maxFileSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Position Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position
        </label>
        <div className="flex space-x-2">
          {(['left', 'center', 'right'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onPositionChange(pos)}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                position === pos
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};