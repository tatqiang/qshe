import React from 'react';
import { X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  titleName?: string;
  firstName?: string;
  lastName?: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  titleName = '',
  firstName = '',
  lastName = '',
}) => {
  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onReject}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 text-center">
                หนังสือให้ความยินยอมในการเปิดเผยข้อมูลส่วนบุคคล
              </h2>
              <p className="text-sm text-gray-500 text-center mt-1">
                (Personal Data Consent Form)
              </p>
            </div>
            <button
              onClick={onReject}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Date */}
            <div className="mb-4 text-sm">
              <span className="font-medium">วันที่</span> {currentDate}
            </div>

            {/* Consent Text */}
            <div className="mb-6 text-sm text-gray-700 leading-relaxed text-justify">
              <p className="mb-4" style={{ textIndent: '2em' }}>
                ข้าพเจ้า <span className="font-medium">{titleName ? `${titleName}${firstName}` : firstName} {lastName}</span> ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
              </p>
            </div>

            {/* Document Checklist */}
            <div className="mb-6">
              <p className="font-medium text-sm mb-3">
                ทั้งนี้เอกสารที่ข้าพเจ้าแนบมาด้วย มีดังนี้
              </p>
              <div className="space-y-2 text-sm ml-4">
                <div className="flex items-center">
                  <span className="mr-2">☑</span>
                  <span>สำเนาบัตรประชาชน (จำเป็น)</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-2">☐</span>
                  <span>สำเนาทะเบียนบ้าน</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-2">☐</span>
                  <span>สำเนาใบอนุญาตขับรถ โปรดระบุ ประเภท _________________</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">☑</span>
                  <span>ใบรับรองแพทย์, ประวัติทางด้านสุขภาพ (จำเป็น)</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-2">☐</span>
                  <span>สำเนาโฉนดที่ดิน</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-2">☐</span>
                  <span>อื่นๆ โปรดระบุ _________________</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">⚠️ โปรดอ่านและทำความเข้าใจก่อนกดยอมรับ:</span>
                <br />
                การกดปุ่ม "ยอมรับ" ถือว่าท่านได้อ่านและเข้าใจเนื้อหาข้างต้นแล้ว และยินยอมให้บริษัทฯ ดำเนินการตามที่ระบุไว้
              </p>
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onReject}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={onAccept}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              ยอมรับ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
