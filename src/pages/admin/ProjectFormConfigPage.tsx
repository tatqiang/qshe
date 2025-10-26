import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/api/supabase';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Project {
  id: string;
  name: string;
}

interface FormTemplate {
  id: string;
  name_th: string;
  name_en: string;
}

interface FormField {
  id: string;
  field_key: string;
  label_th: string;
  label_en: string;
  field_type: string;
  section: string;
  is_required_by_default: boolean;
  is_visible_by_default: boolean;
  display_order: number;
}

interface ProjectFieldConfig {
  id: string;
  form_field_id: string;
  is_visible: boolean | null;
  is_required: boolean | null;
  custom_display_order: number | null;
}

export const ProjectFormConfigPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [projectFieldConfigs, setProjectFieldConfigs] = useState<ProjectFieldConfig[]>([]);
  const [projectFormConfigId, setProjectFormConfigId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<ProjectFieldConfig>>>(new Map());

  // Load projects
  useEffect(() => {
    loadProjects();
    loadFormTemplates();
  }, []);

  // Load fields when project and template are selected
  useEffect(() => {
    if (selectedProject && selectedTemplate) {
      loadProjectConfig();
    }
  }, [selectedProject, selectedTemplate]);

  const loadProjects = async () => {
    const { data, error } = await (supabase.from('projects') as any)
      .select('id, name')
      .order('name');
    
    if (error) {
      toast.error('Failed to load projects');
      return;
    }
    
    setProjects(data || []);
  };

  const loadFormTemplates = async () => {
    const { data, error } = await (supabase.from('form_templates') as any)
      .select('id, name_th, name_en')
      .eq('is_active', true)
      .order('name_th');
    
    if (error) {
      toast.error('Failed to load form templates');
      return;
    }
    
    setFormTemplates(data || []);
  };

  const loadProjectConfig = async () => {
    setLoading(true);
    
    try {
      // Get or create project_form_config
      let { data: config, error: configError } = await (supabase
        .from('project_form_configs') as any)
        .select('id')
        .eq('project_id', selectedProject)
        .eq('form_template_id', selectedTemplate)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Create if doesn't exist
      if (!config) {
        const { data: newConfig, error: createError } = await (supabase
          .from('project_form_configs') as any)
          .insert({
            project_id: selectedProject,
            form_template_id: selectedTemplate,
            is_enabled: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        config = newConfig;
      }

      setProjectFormConfigId(config.id);

      // Load form fields
      const { data: fields, error: fieldsError } = await (supabase
        .from('form_fields') as any)
        .select('*')
        .eq('form_template_id', selectedTemplate)
        .order('display_order');

      if (fieldsError) throw fieldsError;
      setFormFields(fields || []);

      // Load project field configs
      const { data: fieldConfigs, error: configsError } = await (supabase
        .from('project_field_configs') as any)
        .select('*')
        .eq('project_form_config_id', config.id);

      if (configsError) throw configsError;
      
      console.log('📊 Loaded field configs:', fieldConfigs?.length || 0);
      console.log('📝 Form fields:', fields?.length || 0);
      
      setProjectFieldConfigs(fieldConfigs || []);

    } catch (error: any) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const getFieldConfig = (fieldId: string) => {
    const config = projectFieldConfigs.find(c => c.form_field_id === fieldId);
    console.log(`🔍 Looking for config for field ${fieldId}:`, config ? 'FOUND' : 'NOT FOUND');
    return config;
  };

  const updateFieldConfig = async (fieldId: string, updates: Partial<ProjectFieldConfig>) => {
    try {
      const existingConfig = getFieldConfig(fieldId);

      if (existingConfig) {
        // Update existing
        const { error } = await (supabase
          .from('project_field_configs') as any)
          .update(updates)
          .eq('id', existingConfig.id);

        if (error) throw error;

        setProjectFieldConfigs(prev =>
          prev.map(c => c.id === existingConfig.id ? { ...c, ...updates } : c)
        );
      } else {
        // Create new - use UPSERT to handle duplicates
        const { data, error } = await (supabase
          .from('project_field_configs') as any)
          .upsert({
            project_form_config_id: projectFormConfigId,
            form_field_id: fieldId,
            ...updates,
          }, {
            onConflict: 'project_form_config_id,form_field_id',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (error) throw error;

        setProjectFieldConfigs(prev => {
          const existing = prev.find(c => c.form_field_id === fieldId);
          if (existing) {
            return prev.map(c => c.form_field_id === fieldId ? data : c);
          }
          return [...prev, data];
        });
      }

      // Auto-save feedback
      toast.success('Saved ✓', { duration: 1500 });
    } catch (error: any) {
      console.error('Error updating field config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) {
      toast('No changes to save', { icon: 'ℹ️' });
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;

      for (const [fieldId, updates] of pendingChanges) {
        await updateFieldConfig(fieldId, updates);
        successCount++;
      }

      setPendingChanges(new Map());
      setHasUnsavedChanges(false);
      toast.success(`Saved ${successCount} change(s)`);
    } catch (error) {
      toast.error('Failed to save all changes');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formFields.findIndex(f => f.id === active.id);
      const newIndex = formFields.findIndex(f => f.id === over.id);

      // Check if both fields are in the same section
      const activeField = formFields[oldIndex];
      const overField = formFields[newIndex];
      
      if (activeField.section !== overField.section) {
        toast.error('Cannot move fields between sections');
        return;
      }

      const newFields = arrayMove(formFields, oldIndex, newIndex);
      setFormFields(newFields);

      // Update custom_display_order for all fields in this section
      try {
        const sectionFields = newFields.filter(f => f.section === activeField.section);
        const updates = sectionFields.map((field, index) => ({
          field_id: field.id,
          custom_display_order: (index + 1) * 10,
        }));

        // Update each field's custom_display_order
        for (const update of updates) {
          await updateFieldConfig(update.field_id, {
            custom_display_order: update.custom_display_order,
          });
        }

        toast.success('✓ Field order saved', { duration: 2000 });
      } catch (error) {
        console.error('Error updating field order:', error);
        toast.error('Failed to update field order');
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group fields by section
  const groupFieldsBySection = () => {
    const sections: Record<string, FormField[]> = {};
    formFields.forEach(field => {
      if (!sections[field.section]) {
        sections[field.section] = [];
      }
      sections[field.section].push(field);
    });
    return sections;
  };

  // Get section title in Thai
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

  const fieldsBySection = groupFieldsBySection();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Project Form Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure which form fields are visible and required for each project. Drag to reorder fields <strong>within each section</strong>.
          </p>
        </div>
        
        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Auto-save enabled</span>
          </div>
        </div>
      </div>

      {/* Project and Template Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Form Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">-- Select Template --</option>
              {formTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name_th}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fields Configuration */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      )}

      {!loading && formFields.length > 0 && (
        <div className="space-y-6">
          {Object.entries(fieldsBySection).map(([sectionKey, sectionFields]) => (
            <div key={sectionKey} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  {getSectionTitle(sectionKey)}
                  <span className="ml-auto text-sm font-normal text-blue-100">
                    {sectionFields.length} fields
                  </span>
                </h2>
              </div>

              {/* Section Fields */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Field Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Visible
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Required
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <SortableContext
                      items={sectionFields.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sectionFields.map((field, index) => (
                        <SortableRow
                          key={field.id}
                          field={field}
                          index={index}
                          config={getFieldConfig(field.id)}
                          onUpdateConfig={updateFieldConfig}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>
          ))}
        </div>
      )}

      {!loading && formFields.length === 0 && selectedProject && selectedTemplate && (
        <div className="text-center py-12 text-gray-500">
          No fields found for this template
        </div>
      )}
    </div>
  );
};

// Sortable Row Component
interface SortableRowProps {
  field: FormField;
  index: number;
  config: ProjectFieldConfig | undefined;
  onUpdateConfig: (fieldId: string, updates: Partial<ProjectFieldConfig>) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ field, index, config, onUpdateConfig }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVisible = config?.is_visible ?? field.is_visible_by_default;
  const isRequired = config?.is_required ?? field.is_required_by_default;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${!isVisible ? 'bg-gray-50' : ''} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <td className="px-3 py-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 flex items-center gap-2"
        >
          <span className="text-xs font-mono text-gray-500">{(index + 1).toString().padStart(2, '0')}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="font-medium">{field.label_th}</div>
        <div className="text-sm text-gray-500">{field.field_key}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {field.field_type}
      </td>
      <td className="px-6 py-4 text-center">
        <input
          type="checkbox"
          checked={isVisible}
          onChange={(e) => onUpdateConfig(field.id, { is_visible: e.target.checked })}
          className="h-4 w-4 text-blue-600 rounded"
        />
      </td>
      <td className="px-6 py-4 text-center">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => onUpdateConfig(field.id, { is_required: e.target.checked })}
          disabled={!isVisible}
          className="h-4 w-4 text-blue-600 rounded disabled:opacity-50"
        />
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        Visible: {field.is_visible_by_default ? '✓' : '✗'} | 
        Required: {field.is_required_by_default ? '✓' : '✗'}
      </td>
    </tr>
  );
};
