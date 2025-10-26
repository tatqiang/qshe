import React, { forwardRef } from 'react';
import { PDFToImage } from './PDFToImage';

interface MemberRegistrationReportProps {
  memberData: any;
  companyName?: string;
  companyNameTh?: string;
  projectName?: string;
  submissionNumber?: string;
  submittedAt?: string;
  showSignatures?: boolean;
}

export const MemberRegistrationReport = forwardRef<HTMLDivElement, MemberRegistrationReportProps>(
  ({ memberData, companyName, companyNameTh, projectName, submissionNumber, submittedAt, showSignatures = true }, ref) => {
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Helper to normalize boolean values (handles string "true"/"false")
    const toBool = (value: any): boolean => {
      if (value === undefined || value === null || value === '') return false;
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        return lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1' || 
               lowerValue === 'เคย' || lowerValue === 'เป็น';
      }
      return Boolean(value);
    };

    const getCheckbox = (value: boolean | string | undefined) => {
      // Handle both boolean and string values
      if (value === undefined || value === null || value === '') return '☐';
      
      // Convert string "true"/"false" to boolean
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === 'เคย' || lowerValue === 'เป็น') {
          return '☑';
        }
        return '☐';
      }
      
      // Handle boolean
      return value === true ? '☑' : '☐';
    };

    // Helper function to translate education level to Thai
    const getEducationLevelThai = (level?: string) => {
      if (!level) return '';
      const educationMap: { [key: string]: string } = {
        'elementary': 'ประถมศึกษา',
        'junior_high': 'มัธยมต้น',
        'senior_high': 'มัธยมปลาย',
        'vocational': 'ปวช.',
        'diploma': 'ปวส.',
        'bachelor': 'ปริญญาตรี',
        'master': 'ปริญญาโท',
        'doctorate': 'ปริญญาเอก',
      };
      return educationMap[level.toLowerCase()] || level;
    };

    // Helper function to translate religion to Thai
    const getReligionThai = (religion?: string) => {
      if (!religion) return '';
      const religionMap: { [key: string]: string } = {
        'buddhism': 'พุทธ',
        'christian': 'คริสต์',
        'christianity': 'คริสต์',
        'islam': 'อิสลาม',
        'hindu': 'ฮินดู',
        'other': 'อื่นๆ',
      };
      return religionMap[religion.toLowerCase()] || religion;
    };

    return (
      <div ref={ref} className="print-report">
        {/* Page 1: Main Form */}
   
        <div  className="report-page">
          {/* Form Code - Above Header */}
          <div className="form-code">SF 82-069 : 7/10/59</div>
        
          {/* Grid Container with 2 rows */}
          <div className="report-grid">
            {/* Row 1: Header */}
            <div className="report-header" >
              <div className="header-content">
                <img 
                  src="https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/qshe-assets/logos/Logo-STECON.jpg" 
                  alt="STECON Logo" 
                  className="company-logo"
                />
                <div className="company-info">
                  <div className="company-name-th">บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน)</div>
                  <div className="company-name-en">Sino-Thai Engineering & Construction Public Company Limited</div>
                </div>
              </div>
            </div>

            {/* Row 2: Body Content */}
            <div className="report-body">
            {/* Title */}
            <div className="section-title">ประวัติส่วนตัว</div>

          {/* Personal Information - Using CSS Grid */}
          <div className="grid-row-name">
            <span className="label">ชื่อ</span>
            <span className="underline-value">{memberData?.first_name || ''}</span>
            <span className="label-2">นามสกุล</span>
            <span className="underline-value">{memberData?.last_name || ''}</span>
            <span className="label-2">เบอร์โทร</span>
            <span className="underline-value">{memberData?.phone || ''}</span>
          </div>

          {/* Address - Using CSS Grid */}
          <div className="label" style={{marginTop:'20px',marginBottom:'10px'}}>ที่อยู่ปัจจุบัน :</div>
          <div className="grid-row-address">
            <span className="label">เลขที่</span>
            <span className="underline-value">{memberData?.address_house_number || memberData?.address_number || ''}</span>
            <span className="label-2">หมู่</span>
            <span className="underline-value">{memberData?.address_moo || ''}</span>
            <span className="label-2">ซอย</span>
            <span className="underline-value">{memberData?.address_soi || ''}</span>
            <span className="label-2">ตำบล</span>
            <span className="underline-value">{memberData?.address_tambon || ''}</span>
          </div>

          <div className="grid-row-5col">
            <span className="label">อำเภอ</span>
            <span className="underline-value">{memberData?.address_amphoe || ''}</span>
            <span className="label-2">จังหวัด</span>
            <span className="underline-value">{memberData?.address_province || ''}</span>
            <span></span>
          </div>

          {/* Birth Date and Details */}
          <div className="grid-row-birth">
            <span className="label">เกิดวันที่</span>
            <span className="underline-value">
              {memberData?.birth_date ? new Date(memberData.birth_date).getDate().toString().padStart(2, '0') : ''}
            </span>
            <span className="label-2">เดือน</span>
            <span className="underline-value">
              {memberData?.birth_date ? new Date(memberData.birth_date).toLocaleDateString('th-TH', { month: 'long' }) : ''}
            </span>
            <span className="label-2">พ.ศ.</span>
            <span className="underline-value">
              {memberData?.birth_date ? (new Date(memberData.birth_date).getFullYear() + 543).toString() : ''}
            </span>
            <span className="label-2">อายุ</span>
            <span className="underline-value" style={{paddingLeft: '4px'}}>{memberData?.age || ''}</span>
            <span className="label">ปี</span>
            <span className="label">วุฒิการศึกษา</span>
            <span className="underline-value">{getEducationLevelThai(memberData?.education_level || memberData?.education)}</span>
          </div>

          <div className="grid-row-nationality">
            <span className="label-2">สัญชาติ</span>
            <span className="underline-value">{memberData?.nationality || ''}</span>
            <span className="label-2">ศาสนา</span>
            <span className="underline-value">{getReligionThai(memberData?.religion)}</span>
          </div>

          {/* ID Card */}
          <div className="grid-row-full">
            <span className="label">เลขที่บัตรประชาชน หรือหนังสือเดินทาง</span>
            <span className="underline-value">{memberData?.id_card_number || memberData?.passport_number || ''}</span>
          </div>

          {/* Position */}
          <div className="grid-row-full">
            <span className="label">สมัครเข้าทำงานในตำแหน่ง</span>
            <span className="underline-value">{memberData?.position_applied || memberData?.position || memberData?.job_title || ''}</span>
          </div>

          {/* Work History and Health Section */}
          <div className="section-title">ประวัติการทำงานและสุขภาพ</div>

          <div className="checkbox-grid">
            {/* Row 1: ประสบการณ์ก่อสร้าง */}
            <span className="checkbox-text">- ท่านมีประสบการณ์ในการทำงานก่อสร้างหรือไม่</span>
            <span className="checkbox-options">
              {getCheckbox(memberData?.has_construction_experience === false)} ไม่เคย
              &nbsp;&nbsp;
              {getCheckbox(memberData?.has_construction_experience === true)} เคย
              <span className="label">เป็นเวลา</span>
              <span className="underline-value">{memberData?.construction_experience_years || ''}</span>
              <span className="label">ปี</span>
            </span>

            {/* Row 2: กลัวความสูง */}
            <span className="checkbox-text">- ท่านเป็นโรคกลัวความสูงหรือมีอาการ เช่น ใจสั่นหน้ามืด มือเท้าเย็น อ่อนแรง หรือไม่</span>
            <span className="checkbox-options">
              {getCheckbox(memberData?.has_acrophobia === false)} ไม่เป็น
              &nbsp;&nbsp;
              {getCheckbox(memberData?.has_acrophobia === true)} เป็น
            </span>

            {/* Row 3: โรคประจำตัว */}
            <span className="checkbox-text">- ท่านมีโรคประจำตัวหรือไม่</span>
            <span className="checkbox-options">
              {getCheckbox(memberData?.has_chronic_disease === false)} ไม่เป็น
              &nbsp;&nbsp;
              {getCheckbox(memberData?.has_chronic_disease === true)} เป็น
              <span className="label">ระบุ</span>
              <span className="underline-value" style={{minWidth:'100px'}}>
                {memberData?.chronic_disease_details || memberData?.chronic_disease_detail || ''}
              </span>
            </span>

            {/* Row 4: ตาบอดสี */}
            <span className="checkbox-text">- ท่านตาบอดสีหรือไม่</span>
            <span className="checkbox-options">
              {getCheckbox((memberData?.has_color_blindness === false || memberData?.is_color_blind === false))} ไม่เป็น
              &nbsp;&nbsp;
              {getCheckbox((memberData?.has_color_blindness === true || memberData?.is_color_blind === true))} เป็น
            </span>

            {/* Row 5: โรคลมชัก */}
            <span className="checkbox-text">- ท่านเป็นโรคลมชักหรือไม่</span>
            <span className="checkbox-options">
              {getCheckbox(memberData?.has_epilepsy === false)} ไม่เป็น
              &nbsp;&nbsp;
              {getCheckbox(memberData?.has_epilepsy === true)} เป็น
            </span>

            {/* Row 6: อื่นๆ */}
            <span className="checkbox-text">- อื่น ๆ</span>
            <span className="underline-value" style={{minWidth:'100px'}}>
              {memberData?.other_health_conditions || ''}
            </span>
          </div>

          {/* Signatures - Grid 2 Columns x 3 Rows */}
          <div className="signature-section">
            {/* Row 1: Signature Images */}
            <div className="signature-image-box">
              {showSignatures && (memberData?.applicant_signature || memberData?.signature_applicant) && (
                <img 
                  src={memberData?.applicant_signature || memberData?.signature_applicant} 
                  alt="Applicant Signature" 
                  className="signature-image"
                />
              )}
            </div>
            <div className="signature-image-box">
              {showSignatures && (memberData?.supervisor_signature || memberData?.signature_supervisor) && (
                <img 
                  src={memberData?.supervisor_signature || memberData?.signature_supervisor} 
                  alt="Supervisor Signature" 
                  className="signature-image"
                />
              )}
            </div>

            {/* Row 2: Signature Labels */}
            <div className="signature-label">ลายเซ็น.............................................ผู้สมัคร</div>
            <div className="signature-label">ลายเซ็น.............................................ผู้ควบคุมงาน</div>

            {/* Row 3: Names */}
            <div className="signature-name">
              ({memberData?.first_name || ''} {memberData?.last_name || ''})
            </div>
            <div className="signature-name">
              ({memberData?.supervisor_name || '...........................................................'})
            </div>
          </div>

          {/* Footer */}
          <div className="report-footer">
            <div className="footer-notes">
              <div>โปรดแนบหลักฐาน</div>
              <div>1. สำเนาบัตรประชาชน</div>
              <div>2. ส่งเอกสารก่อนเข้าอบรมล่วงหน้า 1 วัน</div>
            </div>
            <div className="submission-info">
              <div>เลขที่การสมัคร: {submissionNumber}</div>
              <div>วันที่ส่ง: {formatDate(submittedAt)}</div>
              <div>โครงการ: {projectName}</div>
            </div>
          </div>
            </div> {/* End report-body */}
          </div> {/* End report-grid */}
        </div> {/* End report-page */}
   

        {/* Page 2: Consent Form */}
        <div className="report-page">
          {/* Single border box like page 1 */}
          <div style={{
            border: '2px solid #000',
            padding: '15px',
            minHeight: 'calc(297mm - 40px)'
          }}>
            {/* Header with Logo - right aligned */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '20px'
            }}>
              <img 
                src="https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/qshe-assets/logos/Logo-STECON.jpg" 
                alt="STECON Logo" 
                style={{
                  width: '80px',
                  height: 'auto'
                }}
              />
            </div>

            {/* Title */}
            <div style={{
              textAlign: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>หนังสือให้ความยินยอมในการเปิดเผยข้อมูลส่วนบุคคล</h2>
              <p style={{ fontSize: '16px' }}>(Personal Data Consent Form)</p>
            </div>

            {/* Date */}
            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <span>วันที่ {formatDate(submittedAt || new Date().toISOString())}</span>
            </div>

            {/* Consent Text */}
            <div style={{
              marginBottom: '25px',
              textAlign: 'justify',
              lineHeight: '1.8',
              fontSize: '14px'
            }}>
              <p style={{ marginBottom: '15px', textIndent: '2em' }}>
                ข้าพเจ้า {memberData?.title_name ? `${memberData.title_name}${memberData?.first_name || ''}` : memberData?.first_name || ''} {memberData?.last_name || ''} ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
              </p>
            </div>

            {/* Document Checklist */}
            <div style={{ marginBottom: '30px' }}>
              <p style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>
                ทั้งนี้เอกสารที่ข้าพเจ้าแนบมาด้วย มีดังนี้
              </p>
              <div style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '2' }}>
                <div>{getCheckbox(true)} สำเนาบัตรประชาชน (จำเป็น)</div>
                <div>{getCheckbox(false)} สำเนาทะเบียนบ้าน</div>
                <div>{getCheckbox(false)} สำเนาใบอนุญาตขับรถ โปรดระบุ ประเภท _________________</div>
                <div>{getCheckbox(true)} ใบรับรองแพทย์, ประวัติทางด้านสุขภาพ (จำเป็น)</div>
                <div>{getCheckbox(false)} สำเนาโฉนดที่ดิน</div>
                <div>{getCheckbox(memberData?.other_documents)} อื่นๆ โปรดระบุ _________________</div>
              </div>
            </div>

            {/* Signature Section */}
            <div style={{ marginTop: '60px' }}>
              <div className="signature-image-box">
                {showSignatures && memberData?.applicant_signature && (
                  <img 
                    src={memberData.applicant_signature} 
                    alt="Signature" 
                    className="signature-image"
                  />
                )}
              </div>
              <div className="signature-label" style={{
                borderTop: '1px solid #000',
                width: '250px',
                margin: '0 auto',
                paddingTop: '5px'
              }}>
                ลายเซ็น
              </div>
              <div className="signature-name">
                ({memberData?.first_name || ''} {memberData?.last_name || ''})
              </div>
              <div className="signature-name">
                ผู้ให้ความยินยอม
              </div>
            </div>
          </div>
        </div>

        {/* Page 3: ID Card Document */}
        {memberData?.document_id_card && (
          <div className="report-page document-page">
            <div className="document-title">สำเนาบัตรประชาชน</div>
            {memberData.document_id_card.toLowerCase().endsWith('.pdf') ? (
              <PDFToImage 
                pdfUrl={memberData.document_id_card}
                className="document-image"
                alt="ID Card"
              />
            ) : (
              <img 
                src={memberData.document_id_card} 
                alt="ID Card" 
                className="document-image"
              />
            )}
          </div>
        )}

        {/* Page 4: Medical Certificate */}
        {memberData?.document_medical_certificate && (
          <div className="report-page document-page">
            <div className="document-title">ใบรับรองแพทย์</div>
            {memberData.document_medical_certificate.toLowerCase().endsWith('.pdf') ? (
              <PDFToImage 
                pdfUrl={memberData.document_medical_certificate}
                className="document-image"
                alt="Medical Certificate"
              />
            ) : (
              <img 
                src={memberData.document_medical_certificate} 
                alt="Medical Certificate" 
                className="document-image"
              />
            )}
          </div>
        )}

        {/* Print Styles */}
        <style>{`
          .print-report {
            font-family: 'Sarabun', 'TH Sarabun New', Arial, sans-serif;
          }

          .report-page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            margin: 0 auto 20px;
            background: white;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            page-break-after: always;
            position: relative;
          }

          /* Grid Container - 2 Rows */
          .report-grid {
            display: grid;
            grid-template-rows: auto 1fr;
            gap: 0;
          }

          /* Row 1: Header with Double Border */
          .report-header {
            border: 3px double #000;
            padding: 10px;
          }

          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
          }

          /* Row 2: Body Content with Double Border */
          .report-body {
            border: 3px double #000;
            padding: 15px;
          }

          .company-logo {
            width: 80px;
            height: auto;
          }

          .company-info {
            flex: 1;
            text-align: center;
            padding: 0 15px;
          }

          .company-name-th {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .company-name-en {
            font-size: 12px;
          }

          .form-code {
            text-align: right;
            font-size: 12px;
            margin-bottom: 5px;
          }

          /* Section Title */
          .section-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 0px 0 15px;
            padding-bottom: 5px;
          }

          /* Form Fields */
          .form-section {
            margin-bottom: 15px;
          }

          /* Grid Layouts for Precise Column Control */
          .grid-row-name {
            display: grid;
            grid-template-columns: auto 1fr auto 1fr auto 1fr;
            gap: 5px;
            align-items: baseline;
            margin-bottom: 10px;
          }

          .grid-row-address {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr 3fr 1fr 5fr;
            gap: 5px;
            align-items: baseline;
            margin-bottom: 10px;
          }

          .grid-row-5col {
            display: grid;
            grid-template-columns: auto 3fr 1fr 3fr 3fr;
            gap: 5px;
            align-items: baseline;
            margin-bottom: 10px;
          }

          .grid-row-nationality {
            display: grid;
            grid-template-columns: 8% 10% 8% 20% 1fr;
            gap: 5px;
            align-items: baseline;
            margin-bottom: 10px;
          }

          .grid-row-birth {
            display: grid;
            grid-template-columns: auto 1.5fr 1.5fr 3fr 1fr 2fr 1fr 1fr 1fr 3fr 5fr;
            gap: 5px;
            align-items: baseline;
            margin-bottom: 10px;
          }

          .grid-row-full {
            display: grid;
            grid-template-columns: auto 1fr 1fr;
            gap: 10px;
            align-items: baseline;
            margin-bottom: 10px;
          }

          .form-row {
            display: flex;
            gap: 5px;
            margin-bottom: 10px;
            flex-wrap: wrap;
          }

          .form-field {
            display: flex;
            align-items: baseline;
            gap: 5px;
          }

          .form-field.inline-field {
            flex: 1;
            min-width: 150px;
          }

          .label {
            font-size: 14px;
            white-space: nowrap;
            line-height: 1.2;
            display: inline-block;
            vertical-align: baseline;
          }

          .label-2 {
            font-size: 14px;
            white-space: nowrap;
            padding: 0px 5px;
            text-align: right;
            line-height: 1.2;
            display: inline-block;
            vertical-align: baseline;
          }

          .underline-value {
            border-bottom: 1px dotted #000;
            min-width: 20px;
            padding: 0px 10px;
            font-size: 14px;
            line-height: 1.2;
            display: inline-block;
            vertical-align: baseline;
          }

          .underline-value.wide {
            min-width: 200px;
            flex: 1;
          }

          /* Checkbox Section - Grid Layout: Question (Left) | Checkbox (Right) */
          .checkbox-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 15px;
            margin: 15px 0;
            font-size: 14px;
            align-items: start;
            width: 100%;
          }

          .checkbox-text {
            text-align: left;
            line-height: 1.6;
            align-self: baseline;
          }

          .checkbox-options {
            display: flex;
            align-items: baseline;
            gap: 8px;
            white-space: nowrap;
            justify-content: flex-start;
            align-self: baseline;
          }

          /* อื่นๆ - underline style (same row as question) */
          .other-notes-inline {
            border-bottom: 1px dotted #000;
            min-height: 20px;
            padding: 4px 10px 0px;
            display: inline-block;
          }

          /* Signatures - Grid 2 Columns x 3 Rows */
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto;
            gap: 10px 20px;
            margin-top: 40px;
            margin-bottom: 30px;
          }

          .signature-image-box {
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60px;
          }

          .signature-label {
            font-size: 14px;
            text-align: center;
          }

          .signature-image {
            width: 200px;
            height: 80px;
            object-fit: contain;
          }

          .signature-name {
            font-size: 14px;
            text-align: center;
            margin-top: 5px;
          }

          /* Footer */
          .report-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }

          .footer-notes div {
            margin-bottom: 5px;
          }

          .submission-info {
            text-align: right;
          }

          .submission-info div {
            margin-bottom: 5px;
          }

          /* Document Pages */
          .document-page {
            text-align: center;
          }

          .document-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }

          .document-image {
            max-width: 100%;
            max-height: 250mm;
            object-fit: contain;
            border: 1px solid #ddd;
          }

          /* Print Styles */
          @media print {
            .report-page {
              margin: 0;
              border: none;
              box-shadow: none;
              page-break-after: always;
            }

            .report-page:last-child {
              page-break-after: auto;
            }

            body {
              background: white;
            }
          }

          @page {
            size: A4;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }
);

MemberRegistrationReport.displayName = 'MemberRegistrationReport';


