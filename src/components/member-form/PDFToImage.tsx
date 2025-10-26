import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker - use local version instead of CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

interface PDFToImageProps {
  pdfUrl: string;
  className?: string;
  alt?: string;
}

export const PDFToImage: React.FC<PDFToImageProps> = ({ pdfUrl, className, alt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Calculate scale to fit A4 width (210mm ≈ 794px at 96dpi)
        const viewport = page.getViewport({ scale: 1 });
        const scale = 794 / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Prepare canvas
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        // Render PDF page into canvas context
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext as any).promise;
        setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        setError('ไม่สามารถแสดง PDF ได้');
        setLoading(false);
      }
    };

    renderPDF();
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            เปิดไฟล์ PDF
          </a>
        </div>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} />;
};
