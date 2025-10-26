import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase';
import { MemberRegistrationReport } from '../../components/member-form/MemberRegistrationReport';
import { Button } from '../../components/common/Button';
import { useUserRole } from '../../components/common/RoleGuard';
import toast from 'react-hot-toast';

interface MemberData {
  id: string;
  submission_number: string;
  form_data: any;
  status: string;
  submitted_at: string;
  company_id: string;
  project_id: string;
  token_id: string;
  companies?: {
    name: string;
    name_th?: string;
  };
  projects?: {
    name: string;
    name_th?: string;
  };
}

export const MemberReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { user, role, isAdmin } = useUserRole();

  console.log('🔐 [AUTH STATE]', {
    user,
    role,
    isAdmin,
    hasUser: !!user,
    userEmail: user?.email
  });
  
  const memberId = paramId || searchParams.get('id');
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!memberId) {
      toast.error('Member ID is required');
      navigate('/');
      return;
    }

    loadMemberData();
  }, [memberId]);

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('member_applications')
        .select(`
          *,
          companies (name, name_th),
          projects (name)
        `)
        .eq('id', memberId)
        .single();

      if (error) throw error;
      if (data) {
        setMember(data as any);
        console.log('📋 [MEMBER DATA] Loaded:', {
          id: (data as any).id,
          submission_number: (data as any).submission_number,
          status: (data as any).status,
          name: `${(data as any).form_data?.first_name} ${(data as any).form_data?.last_name}`
        });
      }
    } catch (err: any) {
      console.error('Error loading member:', err);
      toast.error('Failed to load member data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // Note: For actual PDF generation, you'd use a library like jsPDF or html2pdf
    // For now, we'll just trigger the print dialog
    toast.success('กดปุ่ม Print และเลือก "Save as PDF" จากเครื่องพิมพ์');
    window.print();
  };

  const handleEdit = async () => {
    // Get token from member data first
    if (!member?.token_id) {
      toast.error('ไม่พบข้อมูล token');
      return;
    }

    try {
      // Fetch the actual token value
      const { data: tokenData, error } = await (supabase
        .from('member_application_tokens') as any)
        .select('token')
        .eq('id', member.token_id)
        .single();

      if (error) throw error;

      if (!tokenData || !tokenData.token) {
        toast.error('ไม่พบ token ที่ถูกต้อง');
        return;
      }

      // Navigate with token, member ID, and returnUrl for proper redirect after save
      const returnUrl = `/member-report/${memberId}`;
      navigate(`/public/member-form?token=${tokenData.token}&id=${memberId}&returnUrl=${encodeURIComponent(returnUrl)}`);
    } catch (error) {
      console.error('Error getting token:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลด token');
    }
  };

  const handleApprove = () => {
    // Show confirmation modal instead of approving directly
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!user?.id) {
      toast.error('กรุณาเข้าสู่ระบบ');
      return;
    }

    try {
      const { error } = await (supabase
        .from('member_applications') as any)
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('อนุมัติสมาชิกเรียบร้อย');
      setShowApproveModal(false);
      loadMemberData(); // Reload to update status
      
      // Navigate back to admin members page after 1 second
      setTimeout(() => {
        navigate('/admin/members');
      }, 1000);
    } catch (err) {
      console.error('Error approving member:', err);
      toast.error('ไม่สามารถอนุมัติสมาชิกได้');
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!user?.id) {
      toast.error('กรุณาเข้าสู่ระบบ');
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    try {
      const { error } = await (supabase
        .from('member_applications') as any)
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          reviewer_notes: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('ปฏิเสธสมาชิกเรียบร้อย');
      setShowRejectModal(false);
      setRejectionReason('');
      loadMemberData(); // Reload to update status
      
      // Navigate back to admin members page after 1 second
      setTimeout(() => {
        navigate('/admin/members');
      }, 1000);
    } catch (err) {
      console.error('Error rejecting member:', err);
      toast.error('ไม่สามารถปฏิเสธสมาชิกได้');
    }
  };

  const canApprove = isAdmin; // Only system_admin and admin can approve (isAdmin includes both roles)
  const isPending = member?.status === 'pending';

  console.log('🔍 [MEMBER REPORT] Button visibility:', {
    user: user?.email,
    role,
    isAdmin,
    canApprove,
    status: member?.status,
    isPending,
    showApproveButtons: canApprove && isPending,
    allowedRoles: 'system_admin, admin'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">ไม่พบข้อมูลสมาชิก</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="member-report-page">
      {/* Action Bar - Hidden when printing */}
      <div className="action-bar no-print sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/members')}
              className="text-gray-600 hover:text-gray-900"
              title="กลับไปหน้าจัดการสมาชิก"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold">
                {member.form_data?.first_name} {member.form_data?.last_name}
              </h1>
              <p className="text-sm text-gray-600">
                {member.submission_number} • {member.companies?.name_th || member.companies?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Edit Icon - Show only for system_admin and admin */}
            {canApprove && (
              <button
                onClick={handleEdit}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="แก้ไข"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {/* Approve Icon - Show for admins when status is pending */}
            {canApprove && isPending && (
              <button
                onClick={handleApprove}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="อนุมัติ"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}

            {/* Reject Icon - Show for admins when status is pending */}
            {canApprove && isPending && (
              <button
                onClick={handleReject}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ปฏิเสธ"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Divider if action buttons exist */}
            {canApprove && (
              <div className="h-8 w-px bg-gray-300"></div>
            )}

            {/* Toggle Signature Button */}
            <Button
              variant={showSignatures ? "outline" : "primary"}
              onClick={() => setShowSignatures(!showSignatures)}
              className="flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showSignatures ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
              <span>{showSignatures ? 'ซ่อนลายเซ็น' : 'แสดงลายเซ็น'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>พิมพ์</span>
            </Button>

            <Button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>บันทึก PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-container bg-gray-100 py-8">
        <MemberRegistrationReport
          ref={reportRef}
          memberData={member.form_data}
          companyName={member.companies?.name}
          companyNameTh={member.companies?.name_th}
          projectName={member.projects?.name}
          submissionNumber={member.submission_number}
          submittedAt={member.submitted_at}
          showSignatures={showSignatures}
        />
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .action-bar,
          .report-container {
            background: white;
            padding: 0;
            margin: 0;
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

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">ยืนยันการอนุมัติ</h3>
              <p className="text-gray-600 text-center mb-6">
                คุณต้องการอนุมัติสมาชิก<br />
                <span className="font-semibold">
                  {member?.form_data?.first_name} {member?.form_data?.last_name}
                </span><br />
                รหัส: {member?.submission_number}
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={confirmApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ยืนยันการอนุมัติ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">ปฏิเสธการสมัคร</h3>
              <p className="text-gray-600 text-center mb-4">
                <span className="font-semibold">
                  {member?.form_data?.first_name} {member?.form_data?.last_name}
                </span><br />
                รหัส: {member?.submission_number}
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="กรุณาระบุเหตุผลในการปฏิเสธ..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={confirmReject}
                  className="bg-red-600 hover:bg-red-700"
                >
                  ยืนยันการปฏิเสธ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
