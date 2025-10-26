import React, { useState, useEffect } from 'react';
import { PlusIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import SafetyAuditForm from './SafetyAuditForm';
import { Button } from '../../common/Button';
import { supabase } from '../../../lib/api/supabase';
import { createAudit, uploadAuditPhoto } from '../../../services/safetyAuditService';

const SafetyAuditDashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  // Mock data for development
  const mockCategories = [
    {
      id: '1',
      category_code: 'A',
      category_id: 'sfs21sw',
      name_th: 'ความพร้อมของผู้ปฏิบัติงาน',
      name_en: 'Worker Readiness',
      description: null,
      display_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      category_code: 'B',
      category_id: 'e2r532d',
      name_th: 'Tools & Equipment',
      name_en: 'Tools & Equipment',
      description: null,
      display_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      category_code: 'C',
      category_id: 'ddsd12a',
      name_th: 'Hot Work',
      name_en: 'Hot Work',
      description: null,
      display_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockCompanies = [
    { id: '1', name: 'Company A', name_th: 'บริษัท เอ' },
    { id: '2', name: 'Company B', name_th: 'บริษัท บี' },
    { id: '3', name: 'Company C', name_th: 'บริษัท ซี' },
  ];

  // Load audits from database
  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('safety_audits')
        .select(`
          *,
          projects:project_id (name),
          users:auditor_id (first_name, last_name, first_name_thai, last_name_thai, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('✅ Loaded audits:', data);
      setAudits(data || []);
    } catch (error) {
      console.error('❌ Failed to load audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAuditId(null);
    setSelectedAudit(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleViewAudit = async (auditId: string) => {
    try {
      // Load full audit data including results and companies
      const { data: audit, error: auditError } = await supabase
        .from('safety_audits')
        .select(`
          *,
          projects:project_id (name),
          users:auditor_id (first_name, last_name, first_name_thai, last_name_thai, email),
          main_areas:main_area_id (main_area_name),
          sub_areas_1:sub_area1_id (sub_area1_name),
          sub_areas_2:sub_area2_id (sub_area2_name)
        `)
        .eq('id', auditId)
        .single();
      
      if (auditError) throw auditError;
      
      console.log('📍 Loaded audit with areas:', audit);
      
      // Load audit results
      const { data: results, error: resultsError } = await supabase
        .from('safety_audit_results')
        .select('*')
        .eq('audit_id', auditId);
      
      if (resultsError) throw resultsError;
      
      console.log('📊 Loaded results:', results);
      
      // Load audit companies
      const { data: companies, error: companiesError } = await supabase
        .from('safety_audit_companies')
        .select('company_id, companies(id, name, name_th)')
        .eq('audit_id', auditId);
      
      if (companiesError) throw companiesError;
      
      // Load category information using the view
      const { data: allRequirements } = await supabase
        .from('v_active_audit_requirements')
        .select('requirement_id, category_identifier');
      
      // Create a map of requirement_id -> category_identifier
      const requirementCategoryMap = new Map();
      allRequirements?.forEach((req: any) => {
        requirementCategoryMap.set(req.requirement_id, req.category_identifier);
      });
      
      // Transform data to match form structure
      const resultsByCategory: any = {};
      if (results) {
        results.forEach((result: any) => {
          // Get category from the map
          const categoryIdentifier = requirementCategoryMap.get(result.requirement_id);
          if (categoryIdentifier) {
            if (!resultsByCategory[categoryIdentifier]) {
              resultsByCategory[categoryIdentifier] = [];
            }
            resultsByCategory[categoryIdentifier].push({
              requirement_id: result.requirement_id,
              category_id: result.category_id,
              score: result.score,
              comment: result.comment || '',
            });
          }
        });
      }
      
      console.log('📋 Results by category:', resultsByCategory);
      
      // Load photos and organize by category
      const { data: photos, error: photosError } = await supabase
        .from('safety_audit_photos')
        .select('*')
        .eq('audit_id', auditId)
        .order('display_order', { ascending: true });
      
      if (photosError) {
        console.error('❌ Failed to load photos:', photosError);
      }
      
      console.log('📸 Loaded photos:', photos);
      
      // Create category UUID to local ID mapping from audit_criteria_rev
      const categoryUUIDToLocalId = new Map<string, string>();
      if (audit.audit_criteria_rev) {
        Object.entries(audit.audit_criteria_rev).forEach(([localId, revData]: [string, any]) => {
          if (revData?.category_id) {
            categoryUUIDToLocalId.set(revData.category_id, localId);
          }
        });
      }
      
      // Organize photos by local category ID (cat01, cat02, etc.)
      const photosByCategory: any = {};
      if (photos && photos.length > 0) {
        photos.forEach((photo: any) => {
          // Convert category UUID back to local ID
          let localCategoryId = 'unknown';
          
          if (photo.category_id) {
            // Has category UUID - map to local ID
            localCategoryId = categoryUUIDToLocalId.get(photo.category_id) || 'unknown';
          } else {
            // No category UUID (old photos) - try to guess from first category
            // This is for backward compatibility
            const firstCategory = Object.keys(categoryUUIDToLocalId.values()).length > 0
              ? Array.from(categoryUUIDToLocalId.values())[0]
              : 'cat01';
            localCategoryId = firstCategory;
          }
          
          if (!photosByCategory[localCategoryId]) {
            photosByCategory[localCategoryId] = [];
          }
          
          photosByCategory[localCategoryId].push({
            id: photo.id,
            url: photo.photo_url,
            caption: photo.caption || '',
            file: null, // Existing photo, no file object
          });
        });
      }
      
      console.log('📋 Photos by category:', photosByCategory);
      
      const formData = {
        ...audit,
        // Override with actual area names from the joined tables if the text columns are empty
        main_area: audit.main_area || audit.main_areas?.main_area_name || '',
        sub_area1: audit.sub_area1 || audit.sub_areas_1?.sub_area1_name || '',
        sub_area2: audit.sub_area2 || audit.sub_areas_2?.sub_area2_name || '',
        company_ids: companies?.map((c: any) => c.company_id) || [],
        resultsByCategory,
        photosByCategory,
      };
      
      setSelectedAuditId(auditId);
      setSelectedAudit(formData);
      setFormMode('view'); // Start in view mode, not edit
      setShowForm(true);
      
    } catch (error) {
      console.error('❌ Failed to load audit:', error);
      alert('Failed to load audit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleFormSubmit = async (data: any): Promise<void> => {
    console.log('📋 Dashboard: Form submitted:', data);
    console.log('📋 Dashboard: Mode is:', formMode);
    console.log('📋 Dashboard: Selected audit ID:', selectedAuditId);
    console.log('🔵 handleFormSubmit START - this should log FIRST');
    console.time('Total submit time'); // Track total time
    
    try {
      if (formMode === 'edit' && selectedAuditId) {
        // UPDATE MODE: Update existing audit
        console.log('📝 Dashboard: Starting UPDATE mode for audit:', selectedAuditId);
        console.time('Update audit header');
        
        // Update audit header
        const { error: updateError } = await supabase
          .from('safety_audits')
          .update({
            audit_date: data.audit_date,
            project_id: data.project_id,
            main_area_id: data.main_area_id,
            sub_area1_id: data.sub_area1_id,
            sub_area2_id: data.sub_area2_id,
            main_area: data.main_area || null,
            sub_area1: data.sub_area1 || null,
            sub_area2: data.sub_area2 || null,
            specific_location: data.specific_location || null,
            activity: data.activity || null,
            number_of_personnel: parseInt(data.number_of_personnel) || 0,
            auditor_id: data.created_by, // Use app-level user ID
            audit_criteria_rev: data.audit_criteria_rev || {},
            // Save calculated scores
            total_score: data.total_score || 0,
            max_possible_score: data.max_possible_score || 0,
            weighted_average: data.weighted_average || 0,
            percentage_score: data.percentage_score || 0,
            category_scores: data.category_scores || {},
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedAuditId);
        
        console.timeEnd('Update audit header');
        if (updateError) throw updateError;
        
        // Update companies - delete old and insert new
        console.time('Update companies');
        await supabase
          .from('safety_audit_companies')
          .delete()
          .eq('audit_id', selectedAuditId);
        
        if (data.company_ids && data.company_ids.length > 0) {
          const companyRecords = data.company_ids.map((companyId: string, index: number) => ({
            audit_id: selectedAuditId,
            company_id: companyId,
            primary_company: index === 0,
          }));
          
          const { error: companyError } = await supabase
            .from('safety_audit_companies')
            .insert(companyRecords);
          
          if (companyError) throw companyError;
        }
        console.timeEnd('Update companies');
        
        // Update results - delete old and insert new
        console.time('Update results');
        await supabase
          .from('safety_audit_results')
          .delete()
          .eq('audit_id', selectedAuditId);
        
        if (data.resultsByCategory) {
          const allResults: any[] = [];
          
          Object.entries(data.resultsByCategory).forEach(([categoryKey, results]: [string, any]) => {
            if (Array.isArray(results)) {
              results.forEach((result: any) => {
                allResults.push({
                  audit_id: selectedAuditId,
                  requirement_id: result.requirement_id,
                  score: result.score,
                  comment: result.comment || null,
                });
              });
            }
          });
          
          if (allResults.length > 0) {
            const { error: resultsError } = await supabase
              .from('safety_audit_results')
              .insert(allResults);
            
            if (resultsError) {
              console.error('❌ Failed to save results:', resultsError);
              throw resultsError;
            }
            
            console.log(`✅ Updated ${allResults.length} audit results`);
          }
        }
        console.timeEnd('Update results');
        
        console.log('✅ Dashboard: UPDATE completed');
        
        // Upload photos - delete old and upload new
        if (data.photosByCategory) {
          console.time('Upload photos');
          
          // Delete old photos
          await supabase
            .from('safety_audit_photos')
            .delete()
            .eq('audit_id', selectedAuditId);
          
          // Get category mapping from audit_criteria_rev to convert local IDs to UUIDs
          const categoryMapping = new Map<string, string>();
          if (data.audit_criteria_rev) {
            Object.entries(data.audit_criteria_rev).forEach(([localId, revData]: [string, any]) => {
              if (revData?.category_id) {
                categoryMapping.set(localId, revData.category_id);
              }
            });
          }
          
          console.log('📋 Category mapping:', Object.fromEntries(categoryMapping));
          
          // Upload new photos (one photo = one upload, linked to category UUID)
          let photoCount = 0;
          for (const [localCategoryId, photos] of Object.entries(data.photosByCategory)) {
            if (Array.isArray(photos) && photos.length > 0) {
              const categoryUUID = categoryMapping.get(localCategoryId);
              console.log(`📸 Uploading ${photos.length} photos for ${localCategoryId} (UUID: ${categoryUUID})`);
              
              for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                // Check if photo has a file (new upload)
                if (photo.file) {
                  try {
                    await uploadAuditPhoto(selectedAuditId, photo.file, {
                      category_id: categoryUUID || null, // Use actual category UUID
                      caption: photo.caption || null,
                      uploaded_by: data.created_by || null,
                      display_order: i,
                    });
                    photoCount++;
                  } catch (photoError) {
                    console.error(`❌ Failed to upload photo ${i + 1} for category ${localCategoryId}:`, photoError);
                    // Continue with other photos
                  }
                }
              }
            }
          }
          
          console.log(`✅ Uploaded ${photoCount} photos`);
          console.timeEnd('Upload photos');
        }
        
        // Reload list
        console.time('Load audits time');
        await loadAudits();
        console.timeEnd('Load audits time');
        
      } else {
        // CREATE MODE: Create new audit
        console.log('➕ Dashboard: Starting CREATE mode');
        console.log('📊 Dashboard received scores:', {
          total_score: data.total_score,
          max_possible_score: data.max_possible_score,
          weighted_average: data.weighted_average,
          percentage_score: data.percentage_score,
          category_scores: data.category_scores
        });
        
        const auditData = {
          audit_date: data.audit_date,
          project_id: data.project_id,
          main_area_id: data.main_area_id,
          sub_area1_id: data.sub_area1_id,
          sub_area2_id: data.sub_area2_id,
          main_area: data.main_area || null,
          sub_area1: data.sub_area1 || null,
          sub_area2: data.sub_area2 || null,
          specific_location: data.specific_location || null,
          activity: data.activity || null,
          number_of_personnel: parseInt(data.number_of_personnel) || 0,
          auditor_id: data.created_by,
          company_ids: data.company_ids || [],
          audit_criteria_rev: data.audit_criteria_rev || {},
          // Save calculated scores
          total_score: data.total_score || 0,
          max_possible_score: data.max_possible_score || 0,
          weighted_average: data.weighted_average || 0,
          percentage_score: data.percentage_score || 0,
          category_scores: data.category_scores || {},
        };
        
        console.log('📤 Sending to createAudit():', auditData);
        
        const audit = await createAudit(auditData);
        
        console.log('✅ Audit created successfully:', audit);
        
        // Save results to safety_audit_results table
        if (data.resultsByCategory) {
          const allResults: any[] = [];
          
          Object.entries(data.resultsByCategory).forEach(([categoryKey, results]: [string, any]) => {
            if (Array.isArray(results)) {
              results.forEach((result: any) => {
                allResults.push({
                  audit_id: audit.id,
                  requirement_id: result.requirement_id,
                  score: result.score,
                  comment: result.comment || null,
                });
              });
            }
          });
          
          console.log('💾 About to insert results into safety_audit_results:', allResults);
          
          if (allResults.length > 0) {
            const { error: resultsError } = await supabase
              .from('safety_audit_results')
              .insert(allResults);
            
            if (resultsError) {
              console.error('❌ Failed to save results:', resultsError);
              throw resultsError;
            }
            
            console.log(`✅ Saved ${allResults.length} audit results`);
            console.log('⚡ Database triggers should now recalculate scores...');
          } else {
            console.warn('⚠️ No results to save - this is why scores are 0!');
          }
        }
        
        // Upload photos
        if (data.photosByCategory) {
          console.time('Upload photos');
          
          // Get category mapping from audit_criteria_rev to convert local IDs to UUIDs
          const categoryMapping = new Map<string, string>();
          if (data.audit_criteria_rev) {
            Object.entries(data.audit_criteria_rev).forEach(([localId, revData]: [string, any]) => {
              if (revData?.category_id) {
                categoryMapping.set(localId, revData.category_id);
              }
            });
          }
          
          console.log('📋 Category mapping:', Object.fromEntries(categoryMapping));
          
          let photoCount = 0;
          for (const [localCategoryId, photos] of Object.entries(data.photosByCategory)) {
            if (Array.isArray(photos) && photos.length > 0) {
              const categoryUUID = categoryMapping.get(localCategoryId);
              console.log(`📸 Uploading ${photos.length} photos for ${localCategoryId} (UUID: ${categoryUUID})`);
              
              for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                // Check if photo has a file (new upload)
                if (photo.file) {
                  try {
                    await uploadAuditPhoto(audit.id, photo.file, {
                      category_id: categoryUUID || null, // Use actual category UUID
                      caption: photo.caption || null,
                      uploaded_by: data.created_by || null,
                      display_order: i,
                    });
                    photoCount++;
                  } catch (photoError) {
                    console.error(`❌ Failed to upload photo ${i + 1} for category ${localCategoryId}:`, photoError);
                    // Continue with other photos
                  }
                }
              }
            }
          }
          
          console.log(`✅ Uploaded ${photoCount} photos`);
          console.timeEnd('Upload photos');
        }
        
        console.log('✅ Dashboard: CREATE completed');
        
        // Fetch the audit again to see the recalculated scores from triggers
        const { data: updatedAudit, error: fetchError } = await supabase
          .from('safety_audits')
          .select('id, total_score, max_possible_score, weighted_average, percentage_score, category_scores')
          .eq('id', audit.id)
          .single();
        
        if (!fetchError && updatedAudit) {
          console.log('🔄 AFTER triggers fired - Updated audit scores from database:', updatedAudit);
        }
        
        // Reload list
        console.time('Load audits time');
        await loadAudits();
        console.timeEnd('Load audits time');
      }
      
      console.log('✅ Dashboard: All operations completed');
      console.timeEnd('Total submit time');
      
      // Close form
      console.log('Closing form...');
      setShowForm(false);
      
      // Show success message after form closes
      setTimeout(() => {
        alert(formMode === 'edit' 
          ? '✅ Safety Audit updated successfully!' 
          : '✅ Safety Audit created successfully!');
      }, 100);
      
    } catch (error) {
      console.error('❌ Dashboard: Failed to save audit:', error);
      alert('Failed to save audit: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error; // Re-throw to propagate to form
    }
    
    console.log('🎯 handleFormSubmit returning');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedAuditId(null);
    setSelectedAudit(null);
  };

  if (showForm) {
    return (
      <SafetyAuditForm
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        companies={mockCompanies}
        mode={formMode} // Pass the actual mode (view/edit/create)
        initialData={selectedAudit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Safety Audit</h1>
                <p className="text-sm text-gray-600">Conduct and manage safety audits</p>
              </div>
            </div>

            <Button variant="primary" onClick={handleCreateNew}>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Audit
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">Loading audits...</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ClipboardDocumentCheckIcon className="h-20 w-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Safety Audit Module
            </h2>
            <p className="text-gray-600 mb-6">
              Create comprehensive safety audits with checklist requirements, scoring, and photo evidence
            </p>
            <Button variant="primary" onClick={handleCreateNew} size="lg">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Audit
            </Button>

          {/* Feature List */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">7 Audit Categories</h3>
              <p className="text-sm text-gray-600">
                Worker Readiness, Tools & Equipment, Hot Work, High Work, LOTO, Confined Space, Crane Lifting
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Weighted Scoring</h3>
              <p className="text-sm text-gray-600">
                Each requirement has a weight (1-5) for accurate compliance calculation
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Photo Evidence</h3>
              <p className="text-sm text-gray-600">
                Attach photos to specific requirements with GPS location data
              </p>
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Audits</h2>
              <p className="text-sm text-gray-600 mt-1">
                {audits.length} audit{audits.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewAudit(audit.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {audit.audit_number}
                        </h3>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Project:</span>{' '}
                          {audit.projects?.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(audit.audit_date).toLocaleDateString('th-TH')}
                        </div>
                        <div>
                          <span className="font-medium">Auditor:</span>{' '}
                          {audit.users 
                            ? `${audit.users.first_name_thai || audit.users.first_name || ''} ${audit.users.last_name_thai || audit.users.last_name || ''}`.trim() || audit.users.email
                            : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Personnel:</span>{' '}
                          {audit.number_of_personnel || 0} people
                        </div>
                      </div>
                      
                      {audit.activity && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Activity:</span> {audit.activity}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <p className="text-xs text-gray-500">
                        Created {new Date(audit.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetyAuditDashboard;
