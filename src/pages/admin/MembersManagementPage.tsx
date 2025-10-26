import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useGlobalState';
import { useCurrentProject } from '../../contexts/AppContext';
import { supabase } from '../../lib/api/supabase';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { CompanySingleSelect } from '../../components/common/CompanySingleSelect';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../../types';

interface MemberApplication {
  id: string;
  submission_number: string;
  form_data: any;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submitted_at: string;
  submitted_by_name?: string;
  submitted_by_phone?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  projects?: { name: string; name_th?: string };
  companies?: { name: string; name_th?: string };
}

interface Project {
  id: string;
  name: string;
  name_th?: string;
}

interface Company {
  id: string;
  name: string;
  name_th?: string;
}

interface TokenData {
  id: string;
  token: string;
  project_id: string;
  company_id: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  projects?: { name: string };
  companies?: { name: string; name_th?: string };
}

export const MembersManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentProject = useCurrentProject();

  // Tab state
  const [activeTab, setActiveTab] = useState<'applications' | 'tokens'>('applications');

  // Applications state
  const [members, setMembers] = useState<MemberApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Tokens state
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [tokenMembers, setTokenMembers] = useState<MemberApplication[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Token form state
  const [selectedCompanyToken, setSelectedCompanyToken] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [maxUses, setMaxUses] = useState(5);

  console.log('🎯 [MEMBERS] Component mounted', { user: user?.id, role: user?.role });

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    console.log('🔄 [MEMBERS] useEffect triggered');
    loadProjects();
    loadCompanies();
    if (activeTab === 'applications') {
      loadMembers();
    } else {
      loadTokens();
    }
  }, [selectedProject, selectedCompany, selectedStatus, searchQuery, activeTab]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      console.log('🔍 [MEMBERS] Loading members...', { selectedProject, selectedCompany, selectedStatus });
      
      let query = supabase
        .from('member_applications')
        .select(`
          *,
          projects (name),
          companies (name)
        `)
        .order('submitted_at', { ascending: false });

      // Apply filters
      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }
      if (selectedCompany) {
        query = query.eq('company_id', selectedCompany);
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [MEMBERS] Query error:', error);
        throw error;
      }

      console.log('✅ [MEMBERS] Data loaded:', data?.length, 'members');

      // Client-side search filter
      let filteredData = data || [];
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter((member: MemberApplication) => 
          member.form_data?.first_name?.toLowerCase().includes(lowerQuery) ||
          member.form_data?.last_name?.toLowerCase().includes(lowerQuery) ||
          member.form_data?.phone?.includes(lowerQuery) ||
          member.submission_number?.toLowerCase().includes(lowerQuery)
        );
        console.log('🔍 [MEMBERS] Filtered by search:', filteredData.length, 'members');
      }

      setMembers(filteredData);
    } catch (err) {
      console.error('❌ [MEMBERS] Error loading members:', err);
      toast.error('ไม่สามารถโหลดข้อมูลสมาชิกได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string } } = {
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

  const handleViewReport = (memberId: string) => {
    navigate(`/member-report/${memberId}`);
  };

  // ============ TOKEN MANAGEMENT FUNCTIONS ============

  const loadTokens = async () => {
    setLoadingTokens(true);
    try {
      const { data, error } = await supabase
        .from('member_application_tokens')
        .select(`
          *,
          projects (name),
          companies (name, name_th)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (err) {
      console.error('Error loading tokens:', err);
      toast.error('Failed to load tokens');
    } finally {
      setLoadingTokens(false);
    }
  };

  const generateToken = async () => {
    if (!selectedCompanyToken) {
      toast.error('Please select a company');
      return;
    }

    if (!currentProject) {
      toast.error('No default project selected. Please select a project first.');
      return;
    }

    setLoadingTokens(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data: formTemplate, error: formError } = await (supabase
        .from('form_templates')
        .select('id')
        .eq('code', 'MEMBER_APPLICATION')
        .single() as any);

      if (formError) throw formError;
      if (!formTemplate) throw new Error('Form template not found');

      const tokenData = {
        token: Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        project_id: currentProject.id,
        form_template_id: formTemplate.id,
        company_id: selectedCompanyToken,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
        current_uses: 0,
        is_active: true,
        created_by: user?.id || null,
      };

      const { error } = await (supabase
        .from('member_application_tokens')
        .insert([tokenData] as any) as any);

      if (error) throw error;

      toast.success('Token created successfully!');
      setShowCreateForm(false);
      resetTokenForm();
      loadTokens();
    } catch (err: any) {
      console.error('Error creating token:', err);
      toast.error(err.message || 'Failed to create token');
    } finally {
      setLoadingTokens(false);
    }
  };

  const resetTokenForm = () => {
    setSelectedCompanyToken('');
    setExpiresInDays(30);
    setMaxUses(999);
  };

  const copyTokenLink = (token: string) => {
    const link = `${window.location.origin}/public/member-apply?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const viewTokenMembers = async (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setLoadingMembers(true);
    
    try {
      const { data, error } = await supabase
        .from('member_applications')
        .select('*')
        .eq('token_id', tokenId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setTokenMembers(data || []);
    } catch (err) {
      console.error('Error loading members:', err);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const closeMembersModal = () => {
    setSelectedTokenId(null);
    setTokenMembers([]);
  };

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;

    try {
      const updateData = {
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user?.id || null,
      };

      const { error } = await (supabase
        .from('member_application_tokens') as any)
        .update(updateData)
        .eq('id', tokenId);

      if (error) throw error;
      toast.success('Token revoked');
      loadTokens();
    } catch (err) {
      console.error('Error revoking token:', err);
      toast.error('Failed to revoke token');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสมาชิก</h1>
          <p className="text-sm text-gray-600 mt-1">
            {activeTab === 'applications' 
              ? 'อนุมัติ/ปฏิเสธ การสมัครสมาชิก'
              : 'สร้างและจัดการ Token สำหรับการสมัครสมาชิก'
            }
          </p>
        </div>

        {/* Create Token Button (Tokens Tab) */}
        {activeTab === 'tokens' && (
          <Button 
            onClick={() => setShowCreateForm(true)} 
            disabled={!currentProject}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            สร้าง Token
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('applications')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'applications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>คำขอสมัคร ({members.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'tokens'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Tokens ({tokens.length})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Applications Tab Content */}
      {activeTab === 'applications' && (
        <>
      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหา
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ชื่อ, เบอร์โทร, รหัส..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โครงการ
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name_th || project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บริษัท
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name_th || company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">รอตรวจสอบ</option>
                <option value="under_review">กำลังตรวจสอบ</option>
                <option value="approved">อนุมัติ</option>
                <option value="rejected">ไม่อนุมัติ</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รหัส
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บริษัท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  โครงการ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เบอร์โทร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สมัคร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    ไม่พบข้อมูลสมาชิก
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.submission_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.form_data?.first_name} {member.form_data?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.companies?.name_th || member.companies?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.projects?.name_th || member.projects?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.form_data?.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.submitted_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {/* View Report Button */}
                      <button
                        onClick={() => handleViewReport(member.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="ดูรายงาน"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}

      {/* Tokens Tab Content */}
      {activeTab === 'tokens' && (
        <>
          {/* No Project Warning */}
          {!currentProject && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-1">ไม่ได้เลือกโครงการ</h3>
                  <p className="text-sm text-yellow-700">
                    กรุณาเลือกโครงการเริ่มต้นก่อนสร้าง Token สำหรับการสมัครสมาชิก
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Create Token Form */}
          {showCreateForm && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">สร้าง Token ใหม่</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetTokenForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Project Info */}
                {currentProject && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium">โครงการ:</span>
                        <span className="ml-2 font-semibold">{currentProject.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company */}
                <div>
                  <CompanySingleSelect
                    selectedCompanyId={selectedCompanyToken}
                    onSelectionChange={setSelectedCompanyToken}
                    placeholder="ค้นหาหรือเพิ่มบริษัท..."
                    label="บริษัท"
                    required={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    เลือกบริษัทที่จะใช้ลิงก์สมัครสมาชิกนี้
                  </p>
                </div>

                {/* Expires in Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมดอายุใน (วัน)
                  </label>
                  <input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Token จะหมดอายุวันที่ {new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')}
                  </p>
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนการสมัครสูงสุด
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 5)}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    จำนวนคนสูงสุดที่สามารถสมัครผ่านลิงก์นี้ (1-20 คน)
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetTokenForm();
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={generateToken}
                  loading={loadingTokens}
                  disabled={!selectedCompanyToken}
                >
                  สร้าง Token
                </Button>
              </div>
            </Card>
          )}

          {/* Tokens List */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Token ที่ใช้งานได้</h2>

            {loadingTokens && tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มี Token สร้างใหม่เพื่อเริ่มต้น
              </div>
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            token.is_active && new Date(token.expires_at) > new Date()
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {token.is_active && new Date(token.expires_at) > new Date() ? 'ใช้งานได้' : 'ไม่ใช้งาน'}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {token.current_uses} คน
                          </span>
                          <span className="text-sm text-gray-600">
                            สร้างเมื่อ {new Date(token.created_at).toLocaleDateString('th-TH')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="truncate">
                            <span className="text-gray-600">โครงการ:</span>{' '}
                            <span className="font-medium">{token.projects?.name}</span>
                          </div>
                          <div className="truncate">
                            <span className="text-gray-600">บริษัท:</span>{' '}
                            <span className="font-medium">{token.companies?.name_th || token.companies?.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">การใช้งาน:</span>{' '}
                            <span className="font-medium">{token.current_uses} / {token.max_uses}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">หมดอายุ:</span>{' '}
                            <span className="font-medium">{new Date(token.expires_at).toLocaleDateString('th-TH')}</span>
                          </div>
                        </div>

                        <div className="mt-2">
                          <code className="block text-xs bg-gray-100 px-2 py-1 rounded break-all">
                            {window.location.origin}/public/member-apply?token={token.token}
                          </code>
                        </div>
                      </div>

                      <div className="flex lg:flex-col flex-row gap-2 lg:ml-4">
                        <button
                          onClick={() => viewTokenMembers(token.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded flex-1 lg:flex-none"
                          title="ดูรายชื่อสมาชิก"
                        >
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => copyTokenLink(token.token)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded flex-1 lg:flex-none"
                          title="คัดลอกลิงก์"
                        >
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {token.is_active && (
                          <button
                            onClick={() => revokeToken(token.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded flex-1 lg:flex-none"
                            title="ยกเลิก Token"
                          >
                            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Token Members Modal */}
          {selectedTokenId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                  <div>
                    <h2 className="text-xl font-semibold">สมาชิกที่สมัคร</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {tokenMembers.length} คนสมัครผ่าน Token นี้
                    </p>
                  </div>
                  <button
                    onClick={closeMembersModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {loadingMembers ? (
                    <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
                  ) : tokenMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-500">ยังไม่มีสมาชิกสมัคร</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tokenMembers.map((member) => (
                        <div
                          key={member.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-lg">
                                  {member.form_data?.first_name} {member.form_data?.last_name}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  member.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : member.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {member.status === 'approved' ? 'อนุมัติ' : member.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอตรวจสอบ'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">รหัส:</span>{' '}
                                  <span className="font-medium">{member.submission_number}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">เบอร์โทร:</span>{' '}
                                  <span className="font-medium">{member.form_data?.phone || member.submitted_by_phone}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">อีเมล:</span>{' '}
                                  <span className="font-medium">{member.form_data?.email || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">สมัครเมื่อ:</span>{' '}
                                  <span className="font-medium">
                                    {new Date(member.submitted_at).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="ml-4">
                              <button
                                onClick={() => {
                                  closeMembersModal();
                                  handleViewReport(member.id);
                                }}
                                className="px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md border border-green-200 transition-colors flex items-center space-x-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>ดูรายงาน</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end p-6 border-t space-x-3">
                  <Button
                    variant="outline"
                    onClick={closeMembersModal}
                  >
                    ปิด
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
