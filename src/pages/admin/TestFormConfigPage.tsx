import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase';
import { useAppContext } from '../../contexts/AppContext';
import toast from 'react-hot-toast';

interface FormField {
  id: string;
  field_key: string;
  label_th: string;
  label_en: string;
  field_type: string;
  section: string;
  display_order: number;
  is_required_by_default: boolean;
  is_visible_by_default: boolean;
  placeholder_th?: string;
  help_text_th?: string;
  options?: any;
}

interface FieldConfig {
  is_visible: boolean | null;
  is_required: boolean | null;
  custom_display_order: number | null;
}

export const TestFormConfigPage: React.FC = () => {
  const { project: selectedProject } = useAppContext();
  const [searchParams] = useSearchParams();
  
  // Use URL params if provided, otherwise use context
  const projectId = searchParams.get('project_id') || selectedProject?.id;
  const templateId = searchParams.get('template_id');
  
  const [projectName, setProjectName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState<Array<FormField & { config: FieldConfig }>>([]);
  const [loading, setLoading] = useState(true);
  const [autoTemplateId, setAutoTemplateId] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('🔍 [DEBUG] TestFormConfig State:', {
      selectedProject,
      projectId,
      templateId,
      autoTemplateId,
    });
  }, [selectedProject, projectId, templateId, autoTemplateId]);

  useEffect(() => {
    // Auto-detect template if not provided
    const initPage = async () => {
      console.log('🔍 [DEBUG] Initializing page...', { projectId, templateId });
      
      if (projectId && !templateId) {
        console.log('🔍 [DEBUG] Auto-detecting template...');
        // Get the member application template
        const { data: template, error } = await (supabase.from('form_templates') as any)
          .select('id')
          .eq('code', 'MEMBER_APPLICATION')
          .single();
        
        if (error) {
          console.error('❌ [ERROR] Failed to get template:', error);
          toast.error('Failed to load form template');
          return;
        }
        
        if (template) {
          console.log('✅ [DEBUG] Template found:', template.id);
          setAutoTemplateId(template.id);
        } else {
          console.error('❌ [ERROR] No template found');
        }
      }
    };
    
    initPage();
  }, [projectId, templateId]);

  useEffect(() => {
    const finalTemplateId = templateId || autoTemplateId;
    console.log('🔍 [DEBUG] Checking if ready to load...', {
      projectId,
      templateId,
      autoTemplateId,
      finalTemplateId,
      ready: !!(projectId && finalTemplateId),
    });
    
    if (projectId && finalTemplateId) {
      console.log('✅ [DEBUG] Loading data...');
      loadData(finalTemplateId);
    } else {
      console.log('⏳ [DEBUG] Not ready yet - waiting for project or template');
      setLoading(false);
    }
  }, [projectId, templateId, autoTemplateId]);

  const loadData = async (finalTemplateId: string) => {
    console.log('📊 [DEBUG] loadData called with:', { projectId, finalTemplateId });
    
    if (!projectId || projectId === 'YOUR_PROJECT_ID') {
      console.error('❌ [ERROR] Invalid projectId:', projectId);
      setLoading(false);
      return;
    }
    
    if (!finalTemplateId || finalTemplateId === 'YOUR_TEMPLATE_ID') {
      console.error('❌ [ERROR] Invalid templateId:', finalTemplateId);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Get project name
      console.log('🔍 [DEBUG] Step 1: Fetching project name for ID:', projectId);
      const { data: project, error: projectError } = await (supabase.from('projects') as any)
        .select('name')
        .eq('id', projectId)
        .single();
      
      console.log('📊 [DEBUG] Project query result:', { project, projectError });
      setProjectName(project?.name || selectedProject?.name || '');

      // Get template name
      console.log('🔍 [DEBUG] Step 2: Fetching template name for ID:', finalTemplateId);
      const { data: template, error: templateError } = await (supabase.from('form_templates') as any)
        .select('name_th')
        .eq('id', finalTemplateId)
        .single();
      
      console.log('📊 [DEBUG] Template query result:', { template, templateError });
      setTemplateName(template?.name_th || '');

      // Get project_form_config
      console.log('🔍 [DEBUG] Step 3: Fetching project_form_config...', { projectId, finalTemplateId });
      const { data: config, error: configError } = await (supabase.from('project_form_configs') as any)
        .select('id')
        .eq('project_id', projectId)
        .eq('form_template_id', finalTemplateId)
        .single();

      console.log('📊 [DEBUG] Config query result:', { config, configError });

      if (!config) {
        console.error('❌ [ERROR] No configuration found!');
        toast.error('No configuration found for this project + template combination');
        return;
      }

      // Get all field configs
      console.log('🔍 [DEBUG] Step 4: Fetching field configs for config ID:', config.id);
      const { data: projectFields, error: fieldsError } = await (supabase
        .from('project_field_configs') as any)
        .select(`
          *,
          form_fields (*)
        `)
        .eq('project_form_config_id', config.id)
        .order('custom_display_order');

      console.log('📊 [DEBUG] Field configs query result:', { 
        count: projectFields?.length || 0, 
        fieldsError,
        sample: projectFields?.[0]
      });

      // Filter visible and merge
      const visibleFields = (projectFields || [])
        .filter((pf: any) => pf.is_visible !== false)
        .map((pf: any) => ({
          ...pf.form_fields,
          config: {
            is_visible: pf.is_visible,
            is_required: pf.is_required,
            custom_display_order: pf.custom_display_order,
          },
          // Merge with config
          is_required_by_default: pf.is_required ?? pf.form_fields.is_required_by_default,
          display_order: pf.custom_display_order ?? pf.form_fields.display_order,
        }));

      console.log('📊 [DEBUG] Visible fields after filter:', {
        total: projectFields?.length || 0,
        visible: visibleFields.length,
        sample: visibleFields[0]
      });

      // Sort by display order
      visibleFields.sort((a: any, b: any) => a.display_order - b.display_order);

      console.log('✅ [DEBUG] Setting fields:', visibleFields.length);
      setFields(visibleFields);
    } catch (error: any) {
      console.error('❌ [ERROR] Exception in loadData:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const groupFieldsBySection = () => {
    const sections: Record<string, typeof fields> = {};
    fields.forEach((field) => {
      if (!sections[field.section]) {
        sections[field.section] = [];
      }
      sections[field.section].push(field);
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
      signatures: 'ลายเซ็น',
    };
    return titles[sectionKey] || sectionKey;
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-2xl font-bold mb-2">No Project Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select a project from the project dropdown in the navigation bar.
          </p>
          <p className="text-sm text-gray-500">
            Or provide project_id and template_id as URL parameters.
          </p>
        </div>
      </div>
    );
  }

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

  const sections = groupFieldsBySection();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">🧪 Test Form Configuration Display</h1>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Project:</span> {projectName}</p>
            <p><span className="font-medium">Template:</span> {templateName}</p>
            <p><span className="font-medium">Total Visible Fields:</span> {fields.length}</p>
          </div>
        </div>

        {/* Configuration Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">Field Configuration Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Key</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visible</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {field.display_order}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getSectionTitle(field.section)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {field.field_key}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {field.label_th}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {field.field_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {field.config.is_visible !== false ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {field.is_required_by_default ? (
                        <span className="text-red-600 font-semibold">*</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Preview Grouped by Sections */}
        <div className="space-y-6">
          {Object.entries(sections).map(([sectionKey, sectionFields]) => (
            <div key={sectionKey} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                {getSectionTitle(sectionKey)}
              </h2>
              
              <div className="space-y-4">
                {sectionFields.map((field) => (
                  <div key={field.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label_th}
                          {field.is_required_by_default && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {field.field_key}
                          </span>
                          {' • '}
                          <span>{field.field_type}</span>
                          {' • '}
                          <span>Order: {field.display_order}</span>
                        </div>
                        {field.placeholder_th && (
                          <div className="mt-1 text-xs text-gray-400">
                            Placeholder: {field.placeholder_th}
                          </div>
                        )}
                        {field.help_text_th && (
                          <div className="mt-1 text-xs text-blue-600">
                            ℹ️ {field.help_text_th}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          field.config.is_visible !== false 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {field.config.is_visible !== false ? '👁️ Visible' : '🚫 Hidden'}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          field.is_required_by_default 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {field.is_required_by_default ? '* Required' : 'Optional'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Mock Input */}
                    <div className="mt-2">
                      {field.field_type === 'textarea' ? (
                        <textarea 
                          className="w-full border rounded px-3 py-2 text-sm"
                          placeholder={field.placeholder_th}
                          disabled
                        />
                      ) : field.field_type === 'select' ? (
                        <select className="w-full border rounded px-3 py-2 text-sm" disabled>
                          <option>-- Select --</option>
                        </select>
                      ) : field.field_type === 'radio' ? (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input type="radio" disabled />
                            <span className="text-sm">Option 1</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" disabled />
                            <span className="text-sm">Option 2</span>
                          </label>
                        </div>
                      ) : (
                        <input 
                          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                          className="w-full border rounded px-3 py-2 text-sm"
                          placeholder={field.placeholder_th}
                          disabled
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
