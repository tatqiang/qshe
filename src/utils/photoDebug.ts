/**
 * Photo Debug Utility
 * Helps debug photo upload and thumbnail display issues
 */

export const PhotoDebugUtils = {
  /**
   * Create a test data URL for debugging thumbnails
   */
  createTestDataUrl(): string {
    // Create a simple 100x100 bright red square as a test image with white background
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // White background first
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 100, 100);
      
      // Bright red square in center
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(10, 10, 80, 80);
      
      // White text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST', 50, 55);
      
      // Add border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 100, 100);
    }
    
    return canvas.toDataURL('image/png');
  },

  /**
   * Validate if a data URL is properly formatted
   */
  validateDataUrl(dataUrl: string): boolean {
    return dataUrl.startsWith('data:image/') && dataUrl.includes('base64,');
  },

  /**
   * Get info about a data URL
   */
  getDataUrlInfo(dataUrl: string) {
    const parts = dataUrl.split(',');
    const header = parts[0];
    const data = parts[1];
    
    return {
      isValid: this.validateDataUrl(dataUrl),
      mimeType: header.match(/data:([^;]+)/)?.[1] || 'unknown',
      encoding: header.includes('base64') ? 'base64' : 'other',
      headerLength: header.length,
      dataLength: data?.length || 0,
      totalLength: dataUrl.length,
      preview: dataUrl.substring(0, 100) + '...'
    };
  },

  /**
   * Test if an image can be loaded from a data URL
   */
  testImageLoad(dataUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }
};

// Add to window for console debugging
if (typeof window !== 'undefined') {
  (window as any).PhotoDebugUtils = PhotoDebugUtils;
}
