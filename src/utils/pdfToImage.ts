import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

/**
 * Convert PDF file to image (PNG)
 * @param file - PDF File object
 * @param scale - Scale factor for rendering (default: 2 for high quality)
 * @returns Promise<File> - PNG image file
 */
export async function convertPDFToImage(file: File, scale: number = 2): Promise<File> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get first page
    const page = await pdf.getPage(1);
    
    // Set up canvas
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;
    
    // Convert canvas to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png', 0.95);
    });
    
    // Create File from Blob
    const fileName = file.name.replace(/\.pdf$/i, '.png');
    const imageFile = new File([blob], fileName, { type: 'image/png' });
    
    return imageFile;
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    throw error;
  }
}

/**
 * Check if a file is PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
