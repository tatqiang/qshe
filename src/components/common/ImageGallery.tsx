import { useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { ImagePreviewModal } from './ImagePreviewModal';

interface ImageGalleryProps {
  images: string[];
  title?: string;
  className?: string;
  columns?: number;
  showCount?: boolean;
}

export function ImageGallery({
  images,
  title = 'Photo Gallery',
  className = '',
  columns = 4,
  showCount = true
}: ImageGalleryProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  if (images.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-2">📷</div>
        <p className="text-gray-500">No photos available</p>
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
  };

  return (
    <div className={className}>
      {/* Header */}
      {(title || showCount) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {showCount && (
            <span className="text-sm text-gray-500">
              {images.length} photo{images.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Photo Grid */}
      <div className={`grid gap-4 ${gridCols[Math.min(columns, 5) as keyof typeof gridCols]}`}>
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            onClick={() => openPreview(index)}
          >
            <div className="relative overflow-hidden rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <img
                src={image}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <div className="flex items-center space-x-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <EyeIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">View</span>
                </div>
              </div>
              
              {/* Photo Number */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <ImagePreviewModal
        images={images}
        initialIndex={previewIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
      />

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        💡 Click any photo to view full-size with zoom and navigation controls
      </div>
    </div>
  );
}
