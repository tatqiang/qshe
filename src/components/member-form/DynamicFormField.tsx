import React, { useState, useRef, useEffect } from 'react';
import { convertPDFToImage, isPDF } from '../../utils/pdfToImage';
import { SignatureModal } from './SignatureModal';

interface FieldOption {
  value: string;
  label_th: string;
  label_en?: string;
}

interface ValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  accept?: string[];
  maxSize?: number;
}

interface DependsOn {
  field: string;
  value: string | string[];
}

interface FormField {
  id: string;
  field_key: string;
  field_type: string;
  label_th: string;
  label_en?: string;
  placeholder_th?: string;
  placeholder_en?: string;
  help_text_th?: string;
  help_text_en?: string;
  default_value?: string;
  is_required_by_default: boolean;
  validation_rules?: ValidationRules;
  options?: FieldOption[];
  depends_on?: DependsOn;
  section: string;
}

interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldKey: string, value: any) => void;
  error?: string;
  formData: Record<string, any>; // For conditional field visibility
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  formData,
}) => {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Check if field should be visible based on depends_on
  const isVisible = (): boolean => {
    if (!field.depends_on) return true;

    const dependentValue = formData[field.depends_on.field];
    
    if (Array.isArray(field.depends_on.value)) {
      return field.depends_on.value.includes(dependentValue);
    }
    
    return dependentValue === field.depends_on.value;
  };

  // Auto-calculate age from birth_date
  useEffect(() => {
    if (field.field_key === 'age' && formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age !== value) {
        onChange(field.field_key, age);
      }
    }
  }, [formData.birth_date, field.field_key, value]);

  if (!isVisible()) {
    return null;
  }

  const renderLabel = () => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label_th}
      {field.is_required_by_default && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const renderHelpText = () => {
    if (!field.help_text_th) return null;
    return (
      <p className="text-xs text-gray-500 mt-1">{field.help_text_th}</p>
    );
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <p className="text-xs text-red-500 mt-1">{error}</p>
    );
  };

  // TEXT INPUT
  if (field.field_type === 'text') {
    return (
      <div className="mb-4">
        {renderLabel()}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(field.field_key, e.target.value)}
          placeholder={field.placeholder_th}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          required={field.is_required_by_default}
          minLength={field.validation_rules?.minLength}
          maxLength={field.validation_rules?.maxLength}
          pattern={field.validation_rules?.pattern}
        />
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // NUMBER INPUT
  if (field.field_type === 'number') {
    return (
      <div className="mb-4">
        {renderLabel()}
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(field.field_key, e.target.value ? Number(e.target.value) : '')}
          placeholder={field.placeholder_th}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          required={field.is_required_by_default}
          min={field.validation_rules?.min}
          max={field.validation_rules?.max}
          disabled={field.field_key === 'age'} // Age is auto-calculated
        />
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // DATE INPUT
  if (field.field_type === 'date') {
    return (
      <div className="mb-4">
        {renderLabel()}
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(field.field_key, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          required={field.is_required_by_default}
        />
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // SELECT DROPDOWN
  if (field.field_type === 'select') {
    return (
      <div className="mb-4">
        {renderLabel()}
        <select
          value={value || ''}
          onChange={(e) => onChange(field.field_key, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          required={field.is_required_by_default}
        >
          <option value="">เลือก...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label_th}
            </option>
          ))}
        </select>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // RADIO BUTTONS
  if (field.field_type === 'radio') {
    return (
      <div className="mb-4">
        {renderLabel()}
        <div className="space-y-2">
          {field.options?.map((opt) => {
            // Convert option value to string for HTML attribute
            const optValueStr = String(opt.value);
            // Normalize current value for comparison
            const currentValueStr = value === null || value === undefined ? '' : String(value);
            
            return (
              <label key={optValueStr} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.field_key}
                  value={optValueStr}
                  checked={currentValueStr === optValueStr}
                  onChange={(e) => {
                    // Convert string back to original type (boolean or string)
                    const selectedValue = opt.value;
                    onChange(field.field_key, selectedValue);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  required={field.is_required_by_default}
                />
                <span className="text-sm text-gray-700">{opt.label_th}</span>
              </label>
            );
          })}
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // TEXTAREA
  if (field.field_type === 'textarea') {
    return (
      <div className="mb-4">
        {renderLabel()}
        <textarea
          value={value || ''}
          onChange={(e) => onChange(field.field_key, e.target.value)}
          placeholder={field.placeholder_th}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          required={field.is_required_by_default}
          minLength={field.validation_rules?.minLength}
          maxLength={field.validation_rules?.maxLength}
        />
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // FILE UPLOAD
  if (field.field_type === 'file') {
    const [converting, setConverting] = useState(false);
    const [convertingMessage, setConvertingMessage] = useState('กำลังประมวลผล...');
    const [showThumbnail, setShowThumbnail] = useState(true);

    // Function to add watermark text to image
    const addWatermarkToImage = async (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Cannot get canvas context'));
              return;
            }

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Add watermark text (2 lines, 45 degree rotation)
            const line1 = 'ใช้สำหรับเป็นหลักฐานประกอบ';
            const line2 = 'การลงทะเบียนเท่านั้น';
            
            // Calculate font size based on image width (responsive)
            const fontSize = Math.max(20, Math.floor(img.width / 25));
            ctx.font = `bold ${fontSize}px 'Sarabun', 'TH Sarabun New', Arial, sans-serif`;
            
            // Set text style - blue with 50% transparency
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Save current context state
            ctx.save();
            
            // Move to center and rotate 45 degrees counter-clockwise
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((-45 * Math.PI) / 180);
            
            // Draw two lines of text
            const lineHeight = fontSize * 1.2;
            ctx.fillText(line1, 0, -lineHeight / 2);
            ctx.fillText(line2, 0, lineHeight / 2);
            
            // Restore context state
            ctx.restore();

            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Cannot convert canvas to blob'));
                return;
              }
              
              // Create new file with watermark
              const watermarkedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              
              resolve(watermarkedFile);
            }, file.type);
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size
      if (field.validation_rules?.maxSize && file.size > field.validation_rules.maxSize) {
        alert(`ไฟล์ใหญ่เกินไป (สูงสุด ${Math.round(field.validation_rules.maxSize / 1024 / 1024)} MB)`);
        return;
      }

      let finalFile = file;

      // Convert PDF to image if it's a PDF file
      if (isPDF(file)) {
        try {
          setConverting(true);
          setConvertingMessage('กำลังแปลง PDF เป็นรูปภาพ...');
          console.log('Converting PDF to image...');
          finalFile = await convertPDFToImage(file);
          console.log('PDF converted successfully:', finalFile.name);
        } catch (error) {
          console.error('Failed to convert PDF:', error);
          alert('ไม่สามารถแปลง PDF เป็นรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
          setConverting(false);
          return;
        } finally {
          setConverting(false);
        }
      }

      // Add watermark to ID card image
      if (field.field_key === 'document_id_card' && finalFile.type.startsWith('image/')) {
        try {
          setConverting(true);
          setConvertingMessage('กำลังเพิ่มข้อความลงบนรูปภาพ...');
          console.log('Adding watermark to ID card...');
          finalFile = await addWatermarkToImage(finalFile);
          console.log('Watermark added successfully');
        } catch (error) {
          console.error('Failed to add watermark:', error);
          // Continue without watermark if it fails
        } finally {
          setConverting(false);
        }
      }

      setLocalFile(finalFile);
      onChange(field.field_key, finalFile);
    };

    // Check if value is a URL (existing uploaded file)
    const isExistingFile = typeof value === 'string' && value.startsWith('http');
    const fileName = isExistingFile ? value.split('/').pop()?.split('_').slice(1).join('_') : 'Uploaded file';
    
    // Check if file is an image (for thumbnail display)
    const isImage = (file: File | string): boolean => {
      if (typeof file === 'string') {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
      }
      return file.type.startsWith('image/');
    };

    // Get image URL for thumbnail
    const getThumbnailUrl = (): string | null => {
      if (localFile && isImage(localFile)) {
        return URL.createObjectURL(localFile);
      }
      if (isExistingFile && isImage(value)) {
        return value;
      }
      return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
      <div className="mb-4">
        {renderLabel()}
        {converting && (
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-700">{convertingMessage}</span>
            </div>
          </div>
        )}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
          <input
            type="file"
            onChange={handleFileChange}
            accept={field.validation_rules?.accept?.join(',')}
            {...(field.validation_rules?.accept?.some(type => type.startsWith('image/')) && { capture: 'environment' as any })}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required={field.is_required_by_default && !value && !localFile}
            disabled={converting}
          />
          {(localFile || value) && (
            <div className="mt-3">
              {/* File info and thumbnail */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-700">ไฟล์:</span>
                      <span className="text-gray-900 truncate">{localFile?.name || fileName}</span>
                      {localFile && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          ({Math.round(localFile.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                    
                    {/* Thumbnail preview */}
                    {thumbnailUrl && showThumbnail && (
                      <div className="mt-2 mb-2">
                        <img 
                          src={thumbnailUrl} 
                          alt="Preview" 
                          className="max-w-full h-auto max-h-48 rounded-lg border border-gray-300 object-contain bg-white"
                        />
                      </div>
                    )}
                    
                    {/* Toggle and View buttons */}
                    <div className="flex gap-2 mt-2">
                      {thumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => setShowThumbnail(!showThumbnail)}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
                        >
                          {showThumbnail ? '🔼 ซ่อนรูป' : '🔽 แสดงรูป'}
                        </button>
                      )}
                      {(thumbnailUrl || value) && (
                        <a
                          href={thumbnailUrl || value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          ดูไฟล์
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }  // SIGNATURE PAD (now using modal)
  if (field.field_type === 'signature') {
    return (
      <div className="mb-4">
        {renderLabel()}
        
        {/* Signature Preview or Button */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          {value ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">
                ลายเซ็นที่บันทึกไว้:
              </div>
              <div className="border border-gray-300 rounded bg-white p-2 flex items-center justify-center min-h-[120px]">
                <img 
                  src={value} 
                  alt="Signature" 
                  className="max-w-full max-h-[200px] object-contain"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(true)}
                  className="flex-1 px-4 py-2 text-sm text-blue-600 border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  เซ็นใหม่
                </button>
                <button
                  type="button"
                  onClick={() => onChange(field.field_key, '')}
                  className="px-4 py-2 text-sm text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ลบลายเซ็น
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="w-full px-6 py-8 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg transition-colors flex flex-col items-center space-y-2 bg-gray-50 hover:bg-blue-50"
            >
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-gray-600 font-medium">คลิกเพื่อลงลายเซ็น</span>
              <span className="text-sm text-gray-500">เปิด modal สำหรับลงลายเซ็น</span>
            </button>
          )}
        </div>

        {/* Signature Modal */}
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={(signatureData) => onChange(field.field_key, signatureData)}
          existingSignature={value}
          title={field.label_th}
        />

        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // READ-ONLY TEXT (for consent declarations, etc.)
  if (field.field_type === 'read_only_text' || field.field_type === 'info') {
    const options = field.options as any;
    const contentTh = options?.content_th || field.help_text_th || '';
    const contentEn = options?.content_en || field.help_text_en || '';
    const dateLabelTh = options?.date_label_th || 'วันที่';
    const showDate = options?.show_date !== false;

    // Replace placeholders with actual form data
    // Support both {{key}} and {key} formats
    const replacePlaceholders = (text: string): string => {
      // First, handle double curly braces {{key}}
      let result = text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        
        // Special handling for name with title prefix
        if (trimmedKey === 'first_name' && formData.title_name) {
          return `${formData.title_name}${formData.first_name || ''}`;
        }
        
        return formData[trimmedKey] || match;
      });

      // Then, handle single curly braces {key}
      result = result.replace(/\{([^}]+)\}/g, (match, key) => {
        const trimmedKey = key.trim();
        
        // Special handling for name with title prefix
        if (trimmedKey === 'first_name' && formData.title_name) {
          return `${formData.title_name}${formData.first_name || ''}`;
        }
        
        return formData[trimmedKey] || match;
      });

      return result;
    };

    const processedContent = replacePlaceholders(contentTh);
    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="mb-6 col-span-full">
        {renderLabel()}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-base text-gray-700 leading-relaxed">
          {showDate && (
            <div className="mb-4 text-left">
              <span className="font-medium">{dateLabelTh}</span> {currentDate}
            </div>
          )}
          <p className="whitespace-pre-line text-justify" style={{ textIndent: '2em' }}>
            {processedContent}
          </p>
        </div>
        {renderHelpText()}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="text-sm text-red-500">
        Unsupported field type: {field.field_type}
      </p>
    </div>
  );
};
