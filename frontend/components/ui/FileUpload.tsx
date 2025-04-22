import { useState, useRef } from 'react';

interface FileUploadProps {
  onUpload: (content: string) => void;
  acceptedFileTypes?: string;
}

export default function FileUpload({ onUpload, acceptedFileTypes = ".txt,.md,.pdf" }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = acceptedFileTypes.split(',').map(type => type.replace('.', '').trim());
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`);
      return;
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB');
      return;
    }
    
    setFileName(file.name);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onUpload(content || '');
    };
    
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    reader.readAsText(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mt-2">
      <div 
        className={`max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
            >
              <span>Upload a file</span>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={acceptedFileTypes}
                onChange={handleFileInputChange}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">
            {acceptedFileTypes.replaceAll('.', '')} files up to 10MB
          </p>
        </div>
      </div>
      
      {fileName && (
        <p className="mt-2 text-sm text-gray-600">
          Uploaded: <span className="font-medium">{fileName}</span>
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
} 