import React from 'react';

interface DocumentWatermarkProps {
  projectName?: string;
  companyName?: string;
  customText?: string;
  opacity?: number;
}

export const DocumentWatermark: React.FC<DocumentWatermarkProps> = ({
  projectName,
  companyName,
  customText,
  opacity = 0.3
}) => {
  const defaultText = customText || `สำหรับใช้ในโครงการ ${projectName || 'STECON'} เท่านั้น`;
  
  return (
    <div 
      className="document-watermark"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        opacity: opacity
      }}
    >
      {/* Main watermark text - rotated */}
      <div
        style={{
          transform: 'rotate(-45deg)',
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'red',
          textAlign: 'center',
          lineHeight: 1.5,
          textShadow: '2px 2px 4px rgba(255,255,255,0.8), -2px -2px 4px rgba(255,255,255,0.8)',
          whiteSpace: 'nowrap',
          padding: '20px 40px',
          border: '4px solid red',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        }}
      >
        <div style={{ marginBottom: '10px' }}>สำเนาเอกสาร</div>
        <div style={{ fontSize: '32px' }}>{defaultText}</div>
        {companyName && (
          <div style={{ fontSize: '28px', marginTop: '10px' }}>
            บริษัท {companyName}
          </div>
        )}
      </div>

      {/* Corner watermarks */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'red',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '8px 16px',
          border: '2px solid red',
          borderRadius: '4px',
          textAlign: 'center'
        }}
      >
        สำเนาเอกสาร<br/>
        {new Date().toLocaleDateString('th-TH')}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'red',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '8px 16px',
          border: '2px solid red',
          borderRadius: '4px'
        }}
      >
        ห้ามนำไปใช้เพื่อวัตถุประสงค์อื่น
      </div>
    </div>
  );
};

// Striped watermark pattern (alternative style)
export const DocumentWatermarkStriped: React.FC<DocumentWatermarkProps> = ({
  projectName,
  customText,
  opacity = 0.25
}) => {
  const text = customText || `สำหรับโครงการ ${projectName || ''} เท่านั้น`;
  
  return (
    <div 
      className="document-watermark-striped"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10,
        opacity: opacity,
        overflow: 'hidden'
      }}
    >
      {/* Multiple diagonal stripes with text */}
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: `${index * 15}%`,
            left: '-20%',
            width: '140%',
            height: '80px',
            transform: 'rotate(-30deg)',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '2px solid red',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'red',
            textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
};
