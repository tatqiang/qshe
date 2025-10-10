import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface ImagePreviewModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ImagePreviewModal({
  images,
  initialIndex,
  isOpen,
  onClose,
  title = 'Photo Preview'
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // Reset state when modal opens/closes or initial index changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 5));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.5, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const canGoNext = images.length > 1;
  const canGoPrevious = images.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium">{title}</h2>
            <span className="text-sm text-gray-300">
              {currentIndex + 1} of {images.length}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out (-)"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            
            <span className="text-sm min-w-[4rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoomLevel >= 5}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In (+)"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors"
              title="Reset Zoom (0)"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors ml-4"
              title="Close (Esc)"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Navigation Buttons */}
          {canGoPrevious && (
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
              title="Previous Image (←)"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}

          {canGoNext && (
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
              title="Next Image (→)"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div 
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={currentImage}
              alt={`Evidence photo ${currentIndex + 1}`}
              className="max-w-none object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                maxHeight: zoomLevel === 1 ? '85vh' : 'none',
                maxWidth: zoomLevel === 1 ? '85vw' : 'none',
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Thumbnail Strip (for multiple images) */}
        {images.length > 1 && (
          <div className="p-4 bg-black bg-opacity-50">
            <div className="flex justify-center space-x-2 overflow-x-auto max-w-full">
              {images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(index);
                    resetZoom();
                  }}
                  className={`
                    flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all
                    ${index === currentIndex 
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                      : 'border-gray-600 hover:border-gray-400'
                    }
                  `}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-md">
          <span className="hidden sm:inline">
            Use ← → keys to navigate • +/- to zoom • Drag to pan when zoomed
          </span>
          <span className="sm:hidden">
            Tap buttons to navigate and zoom
          </span>
        </div>
      </div>
    </div>
  );
}
