import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase';
import { DynamicFormField } from '../../components/member-form/DynamicFormField';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import toast from 'react-hot-toast';

interface FormField {
  id: string;
  field_key: string;
  field_type: string;
  label_th: string;
  label_en?: string;
  placeholder_th?: string;
  placeholder_en?: string;
  help_text_th?: string;
  help_text_en?: string;
  default_value?: string;
  is_required_by_default: boolean;
  is_visible_by_default: boolean;
  validation_rules?: any;
  options?: any[];
  depends_on?: any;
  section: string;
  display_order: number;
}

interface TokenData {
  id: string;
  token: string;
  project_id: string;
  company_id: string;
  form_template_id: string;
  current_uses: number;
  max_uses: number;
  projects?: { name: string; name_th?: string };
  companies?: { name: string; name_th?: string };
}

export const MemberFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const memberId = paramId || searchParams.get('id'); // Accept ID from URL param or query string
  const returnUrl = searchParams.get('returnUrl'); // Get return URL if provided

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      toast.error('Invalid token');
      navigate('/');
      return;
    }

    loadFormData();
  }, [token, memberId]);

  const loadFormData = async () => {
    setLoading(true);

    try {
      // Load token data
      const { data: tokenInfo, error: tokenError } = await (supabase
        .from('member_application_tokens') as any)
        .select(`
          *,
          projects (name),
          companies (name, name_th)
        `)
        .eq('token', token)
        .single();

      if (tokenError) throw tokenError;
      setTokenData(tokenInfo);

      // Load form fields through project configuration
      let formFields: FormField[] = [];

      if (tokenInfo.project_id) {
        // Step 1: Get project_form_config
        const { data: projectFormConfig, error: configError } = await (supabase
          .from('project_form_configs') as any)
          .select('id')
          .eq('project_id', tokenInfo.project_id)
          .eq('form_template_id', tokenInfo.form_template_id)
          .single();

        if (configError) {
          console.warn('No project config found, falling back to default fields:', configError);
          // Fallback: load default fields
          const { data: defaultFields, error: fieldsError } = await (supabase
            .from('form_fields') as any)
            .select('*')
            .eq('form_template_id', tokenInfo.form_template_id)
            .eq('is_visible_by_default', true)
            .order('display_order');

          if (fieldsError) throw fieldsError;
          formFields = defaultFields || [];
        } else {
          // Step 2: Get project_field_configs with form_fields data
          const { data: projectFields, error: fieldsError } = await (supabase
            .from('project_field_configs') as any)
            .select(`
              *,
              form_fields (*)
            `)
            .eq('project_form_config_id', projectFormConfig.id)
            .order('custom_display_order');

          if (fieldsError) throw fieldsError;

          // Filter visible fields (NULL or true counts as visible)
          const visibleFields = (projectFields || []).filter((pf: any) => 
            pf.is_visible !== false  // Show if NULL or true
          );

          // Merge project config with form field defaults
          formFields = visibleFields.map((pf: any) => ({
            ...pf.form_fields,
            // Override with project-specific settings
            is_required_by_default: pf.is_required ?? pf.form_fields.is_required_by_default,
            label_th: pf.custom_label_th || pf.form_fields.label_th,
            label_en: pf.custom_label_en || pf.form_fields.label_en,
            help_text_th: pf.custom_help_text_th || pf.form_fields.help_text_th,
            help_text_en: pf.custom_help_text_en || pf.form_fields.help_text_en,
            validation_rules: pf.custom_validation_rules || pf.form_fields.validation_rules,
            options: pf.custom_options || pf.form_fields.options,
            display_order: pf.custom_display_order ?? pf.form_fields.display_order,
          }));

          // Sort by display order
          formFields.sort((a, b) => a.display_order - b.display_order);
        }
      } else {
        // No project: use default fields
        const { data: defaultFields, error: fieldsError } = await (supabase
          .from('form_fields') as any)
          .select('*')
          .eq('form_template_id', tokenInfo.form_template_id)
          .eq('is_visible_by_default', true)
          .order('display_order');

        if (fieldsError) throw fieldsError;
        formFields = defaultFields || [];
      }

      setFields(formFields);

      // If editing, load existing member data
      if (memberId) {
        const { data: memberData, error: memberError } = await (supabase
          .from('member_applications') as any)
          .select('form_data')
          .eq('id', memberId)
          .single();

        if (memberError) throw memberError;
        setFormData(memberData.form_data || {});
      } else {
        // Set default values for new form
        const defaults: Record<string, any> = {};
        formFields?.forEach((field: FormField) => {
          if (field.default_value) {
            defaults[field.field_key] = field.default_value;
          }
        });
        setFormData(defaults);
      }
    } catch (err: any) {
      console.error('Error loading form:', err);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));

    // Clear error for this field
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      // Skip validation for read-only fields
      if (field.field_type === 'read_only_text') {
        return;
      }

      // Skip validation for fields that depend on other fields and are not visible
      if (field.depends_on) {
        const dependentValue = formData[field.depends_on.field];
        const expectedValue = field.depends_on.value;
        
        if (Array.isArray(expectedValue)) {
          if (!expectedValue.includes(dependentValue)) {
            return; // Skip this field
          }
        } else if (dependentValue !== expectedValue) {
          return; // Skip this field
        }
      }

      // Check required fields
      if (field.is_required_by_default) {
        const value = formData[field.field_key];
        
        if (value === undefined || value === null || value === '') {
          newErrors[field.field_key] = `กรุณากรอก${field.label_th}`;
        }
      }

      // Validate pattern for text fields
      if (field.validation_rules?.pattern && formData[field.field_key]) {
        const pattern = new RegExp(field.validation_rules.pattern);
        if (!pattern.test(formData[field.field_key])) {
          newErrors[field.field_key] = `รูปแบบ${field.label_th}ไม่ถูกต้อง`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File, fieldKey: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tokenData?.company_id}/${Date.now()}_${fieldKey}.${fileExt}`;
      const filePath = `member-applications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('qshe')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('qshe')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Form submitted!');
    console.log('📝 Form data:', formData);
    console.log('🔍 Validation starting...');

    if (!validateForm()) {
      console.error('❌ Validation failed');
      console.error('Errors:', errors);
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    console.log('✅ Validation passed');
    setSaving(true);

    try {
      // Upload files first
      const processedData = { ...formData };

      for (const field of fields) {
        if (field.field_type === 'file' && formData[field.field_key] instanceof File) {
          toast.loading(`กำลังอัปโหลด ${field.label_th}...`, { id: `upload-${field.field_key}` });
          
          const fileUrl = await uploadFile(formData[field.field_key], field.field_key);
          
          if (fileUrl) {
            processedData[field.field_key] = fileUrl;
            toast.success(`อัปโหลด ${field.label_th} สำเร็จ`, { id: `upload-${field.field_key}` });
          } else {
            toast.error(`ไม่สามารถอัปโหลด ${field.label_th} ได้`, { id: `upload-${field.field_key}` });
          }
        }
      }

      if (memberId) {
        // Update existing member
        const { error } = await (supabase
          .from('member_applications') as any)
          .update({
            form_data: processedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', memberId);

        if (error) throw error;
        toast.success('บันทึกข้อมูลสำเร็จ');
      } else {
        // Create new member
        const { error } = await (supabase
          .from('member_applications') as any)
          .insert({
            token_id: tokenData?.id,
            project_id: tokenData?.project_id,
            company_id: tokenData?.company_id,
            form_template_id: tokenData?.form_template_id,
            form_data: processedData,
            status: 'pending',
            submitted_by_name: `${processedData.first_name || ''} ${processedData.last_name || ''}`.trim(),
            submitted_by_phone: processedData.phone,
          });

        if (error) throw error;

        // Increment token usage count
        await (supabase
          .from('member_application_tokens') as any)
          .update({
            current_uses: tokenData!.current_uses + 1,
          })
          .eq('id', tokenData!.id);

        toast.success('บันทึกข้อมูลสำเร็จ');
      }

      // Navigate back - use returnUrl if provided, otherwise go to token summary
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate(`/public/member-apply?token=${token}`);
      }
    } catch (err: any) {
      console.error('Error saving form:', err);
      toast.error(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const groupFieldsBySection = () => {
    const sections: Record<string, FormField[]> = {};
    
    // Fields are already sorted by display_order, just group them
    fields.forEach((field) => {
      if (!sections[field.section]) {
        sections[field.section] = [];
      }
      sections[field.section].push(field);
    });

    // Sort fields within each section by display_order
    Object.keys(sections).forEach((sectionKey) => {
      sections[sectionKey].sort((a, b) => a.display_order - b.display_order);
    });

    return sections;
  };

  const getSectionTitle = (sectionKey: string): string => {
    const titles: Record<string, string> = {
      personal_info: 'ข้อมูลส่วนตัว',
      address: 'ที่อยู่',
      work_history: 'ประสบการณ์ทำงาน',
      health: 'ข้อมูลสุขภาพ',
      documents: 'เอกสารแนบ',
      consent: 'หนังสือให้ความยินยอม',
      signatures: 'ลายเซ็น',
    };
    return titles[sectionKey] || sectionKey;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return null;
  }

  const sections = groupFieldsBySection();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <Card className="mb-6 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {memberId ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มข้อมูลบุคลากร'}
          </h1>
          <div className="text-sm text-gray-600">
            <div><span className="font-medium">โครงการ:</span> {tokenData.projects?.name_th || tokenData.projects?.name}</div>
            <div><span className="font-medium">บริษัท:</span> {tokenData.companies?.name_th || tokenData.companies?.name}</div>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {Object.entries(sections).map(([sectionKey, sectionFields]) => (
            <Card key={sectionKey} className="mb-6 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                {getSectionTitle(sectionKey)}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionFields.map((field) => (
                  <div
                    key={field.id}
                    className={
                      field.field_type === 'textarea' ||
                      field.field_type === 'file' ||
                      field.field_type === 'signature' ||
                      field.field_type === 'read_only_text' ||
                      field.section === 'address' ||
                      field.field_key === 'id_card_number' ||
                      field.field_key === 'position_applied'
                        ? 'md:col-span-2'
                        : 'md:col-span-1'
                    }
                  >
                    <DynamicFormField
                      field={field}
                      value={formData[field.field_key]}
                      onChange={handleFieldChange}
                      error={errors[field.field_key]}
                      formData={formData}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (returnUrl) {
                  navigate(returnUrl);
                } else {
                  navigate(`/public/member-apply?token=${token}`);
                }
              }}
            >
              ยกเลิก
            </Button>
            <Button type="submit" loading={saving}>
              {memberId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</p>
        </div>
      </div>
    </div>
  );
};
