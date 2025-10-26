import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import toast from 'react-hot-toast';

interface TokenData {
  id: string;
  token: string;
  project_id: string;
  company_id: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  projects?: {
    name: string;
    name_th?: string;
  };
  companies?: {
    name: string;
    name_th?: string;
  };
}

interface MemberData {
  id: string;
  submission_number: string;
  form_data: any;
  status: string;
  submitted_at: string;
  submitted_by_name?: string;
}

export const MemberApplyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
      setLoading(false);
      return;
    }

    validateAndLoadToken();
  }, [token]);

  const validateAndLoadToken = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate token
      const { data: tokenInfo, error: tokenError } = await (supabase
        .from('member_application_tokens') as any)
        .select(`
          *,
          projects (name),
          companies (name, name_th)
        `)
        .eq('token', token)
        .single();

      if (tokenError) {
        if (tokenError.code === 'PGRST116') {
          setError('Invalid token. Please check your link.');
        } else {
          throw tokenError;
        }
        setLoading(false);
        return;
      }

      // Check if token is valid
      if (!tokenInfo.is_active) {
        setError('This registration link has been revoked.');
        setLoading(false);
        return;
      }

      if (new Date(tokenInfo.expires_at) < new Date()) {
        setError('This registration link has expired.');
        setLoading(false);
        return;
      }

      if (tokenInfo.current_uses >= tokenInfo.max_uses) {
        setError('Maximum number of registrations reached for this link.');
        setLoading(false);
        return;
      }

      setTokenData(tokenInfo);

      // Load existing members
      loadMembers(tokenInfo.id);
    } catch (err: any) {
      console.error('Error validating token:', err);
      setError(err.message || 'Failed to validate token');
      setLoading(false);
    }
  };

  const loadMembers = async (tokenId: string) => {
    try {
      const { data, error } = await (supabase
        .from('member_applications') as any)
        .select('id, submission_number, form_data, status, submitted_at, submitted_by_name')
        .eq('token_id', tokenId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error loading members:', err);
      toast.error('Failed to load member list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    navigate(`/public/member-form?token=${token}`);
  };

  const handleEditMember = (memberId: string) => {
    navigate(`/public/member-form?token=${token}&id=${memberId}`);
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to delete ${memberName || 'this member'}?`)) {
      return;
    }

    try {
      const { error } = await (supabase
        .from('member_applications') as any)
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member deleted successfully');
      
      // Reload members
      if (tokenData) {
        loadMembers(tokenData.id);
      }
    } catch (err: any) {
      console.error('Error deleting member:', err);
      toast.error('Failed to delete member');
    }
  };

  const handleDownloadReport = async () => {
    toast.loading('Generating report...', { id: 'download-report' });
    
    try {
      // TODO: Implement PNG report generation using html2canvas
      // Will be implemented in next step
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Report downloaded!', { id: 'download-report' });
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Failed to generate report', { id: 'download-report' });
    }
  };

  const getMemberDisplayName = (member: MemberData): string => {
    const firstName = member.form_data?.first_name || '';
    const lastName = member.form_data?.last_name || '';
    return `${firstName} ${lastName}`.trim() || member.submitted_by_name || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'อนุมัติ', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800' },
      under_review: { label: 'กำลังตรวจสอบ', color: 'bg-blue-100 text-blue-800' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Access</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.close()}>
            Close
          </Button>
        </Card>
      </div>
    );
  }

  if (!tokenData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <Card className="mb-6 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                แบบฟอร์มขึ้นทะเบียนบุคลากร
              </h1>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">โครงการ:</span>{' '}
                  {tokenData.projects?.name_th || tokenData.projects?.name}
                </div>
                <div>
                  <span className="font-medium">บริษัท:</span>{' '}
                  {tokenData.companies?.name_th || tokenData.companies?.name}
                </div>
                <div>
                  <span className="font-medium">จำนวนที่ลงทะเบียน:</span>{' '}
                  <span className="font-semibold">{tokenData.current_uses}</span> / {tokenData.max_uses} คน
                </div>
                <div>
                  <span className="font-medium">หมดอายุ:</span>{' '}
                  {new Date(tokenData.expires_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
            
            {/* Company Logo Placeholder */}
            <div className="ml-4 w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={handleAddMember}
            disabled={tokenData.current_uses >= tokenData.max_uses}
            className="flex-1 sm:flex-none"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มข้อมูลบุคลากร
          </Button>
          
          {members.length > 0 && (
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              className="flex-1 sm:flex-none"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              ดาวน์โหลดรายงาน (PNG)
            </Button>
          )}
        </div>

        {/* Members List */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            รายชื่อบุคลากรที่ลงทะเบียน ({members.length} คน)
          </h2>

          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg mb-2">ยังไม่มีข้อมูลบุคลากร</p>
              <p className="text-sm">กดปุ่ม "เพิ่มข้อมูลบุคลากร" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {getMemberDisplayName(member)}
                        </h3>
                        {getStatusBadge(member.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">รหัส:</span> {member.submission_number}
                        </div>
                        <div>
                          <span className="font-medium">ตำแหน่ง:</span>{' '}
                          {member.form_data?.position_applied || '-'}
                        </div>
                        <div>
                          <span className="font-medium">เบอร์โทร:</span>{' '}
                          {member.form_data?.phone || '-'}
                        </div>
                        <div>
                          <span className="font-medium">วันที่บันทึก:</span>{' '}
                          {new Date(member.submitted_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>

                    {/* Show Edit/Delete buttons only for pending status */}
                    {member.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditMember(member.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="แก้ไข"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id, getMemberDisplayName(member))}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="ลบ"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>ระบบขึ้นทะเบียนบุคลากร - QSHE Management System</p>
          <p className="mt-1">กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</p>
        </div>
      </div>
    </div>
  );
};
