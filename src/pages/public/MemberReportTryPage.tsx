import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase';
import { MemberRegistrationReport } from '../../components/member-form/MemberRegistrationReport_try';
import { Button } from '../../components/common/Button';
import toast from 'react-hot-toast';

export const MemberReportTryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadMemberData();
    }
  }, [id]);

  const loadMemberData = async () => {
    setLoading(true);
    console.log('🔍 [TRY REPORT] Loading member ID:', id);
    
    try {
      const { data, error } = await supabase
        .from('member_applications')
        .select(`
          *,
          projects (id, name, name_th),
          companies (id, name, name_th)
        `)
        .eq('id', id)
        .single();

      console.log('📊 [TRY REPORT] Query result:', { data, error });

      if (error) {
        console.error('❌ [TRY REPORT] Database error:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('⚠️ [TRY REPORT] No data found');
        toast.error('ไม่พบข้อมูลสมาชิก');
        navigate('/admin/members');
        return;
      }

      console.log('✅ [TRY REPORT] Data loaded successfully');
      setMemberData(data);
    } catch (error: any) {
      console.error('💥 [TRY REPORT] Error loading member:', error);
      toast.error(`ไม่สามารถโหลดข้อมูลได้: ${error.message || 'Unknown error'}`);
      // Don't auto-navigate on error - let user see the error
      // navigate('/admin/members');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
          <p className="mt-2 text-sm text-gray-500">Member ID: {id}</p>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 mb-4">ไม่สามารถโหลดข้อมูลสมาชิกได้</p>
          <p className="text-sm text-gray-500 mb-4">Member ID: {id}</p>
          <Button
            onClick={() => navigate('/admin/members')}
            variant="primary"
          >
            กลับไปหน้ารายการสมาชิก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🧪 ทดสอบรายงาน - {memberData.form_data?.first_name} {memberData.form_data?.last_name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                รหัส: {memberData.submission_number} | 
                บริษัท: {memberData.companies?.name_th || memberData.companies?.name} | 
                โครงการ: {memberData.projects?.name_th || memberData.projects?.name}
              </p>
              <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full inline-block">
                📝 ใช้ MemberRegistrationReport_try.tsx
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/members')}
              >
                ← กลับ
              </Button>
              <Button
                onClick={handlePrint}
              >
                🖨️ พิมพ์รายงาน
              </Button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <MemberRegistrationReport
            ref={reportRef}
            memberData={memberData.form_data}
            companyName={memberData.companies?.name}
            companyNameTh={memberData.companies?.name_th}
            projectName={memberData.projects?.name}
            submissionNumber={memberData.submission_number}
            submittedAt={memberData.submitted_at}
            showSignatures={true}
          />
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-800 text-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">🐛 Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <div className="text-gray-400">Member ID:</div>
              <div>{memberData.id}</div>
            </div>
            <div>
              <div className="text-gray-400">Submission Number:</div>
              <div>{memberData.submission_number}</div>
            </div>
            <div>
              <div className="text-gray-400">Status:</div>
              <div>{memberData.status}</div>
            </div>
            <div>
              <div className="text-gray-400">Submitted At:</div>
              <div>{new Date(memberData.submitted_at).toLocaleString('th-TH')}</div>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-blue-300 hover:text-blue-200">
              📦 View Raw Data
            </summary>
            <pre className="mt-2 p-4 bg-gray-900 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(memberData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};
