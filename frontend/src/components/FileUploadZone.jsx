import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, FileText } from 'lucide-react';

/**
 * Drag & drop file upload zone supporting images and PDFs
 * Props:
 *   onFileSelect(file) — called when a valid file is chosen
 *   accept — mime types object (react-dropzone format)
 *   maxSize — bytes
 */
export default function FileUploadZone({ onFileSelect, preview, onClear }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onFileSelect(accepted[0]);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [],
      'application/pdf': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  if (preview) {
    return (
      <div className="relative border-2 border-primary-200 rounded-lg overflow-hidden">
        {preview.type === 'application/pdf' ? (
          <div className="h-40 flex flex-col items-center justify-center bg-surface gap-2">
            <FileText size={40} className="text-primary-500" />
            <p className="text-sm font-medium text-ink">{preview.name}</p>
            <p className="text-xs text-ink-muted">{(preview.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <img src={preview.url} alt="Preview" className="w-full h-56 object-cover" />
        )}
        <button
          onClick={onClear}
          className="absolute top-2 right-2 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-card hover:bg-gray-50"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-surface-low'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Upload size={22} className="text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">
              {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Receipts, UPI screenshots, PDF bank statements — max 10MB
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <FileImage size={14} /> JPG, PNG, WEBP
            <span>·</span>
            <FileText size={14} /> PDF
          </div>
        </div>
      </div>
      {fileRejections.length > 0 && (
        <p className="text-xs text-danger mt-2">
          {fileRejections[0].errors[0].message}
        </p>
      )}
    </div>
  );
}
