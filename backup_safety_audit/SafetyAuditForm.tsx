// ============================================
// SAFETY AUDIT FORM V3 - MULTI-CATEGORY
// ============================================
// Complete form with dynamic category tabs
// Date: October 16, 2025
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { useCurrentProject, useCurrentUser } from '../../../contexts/AppContext';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';
import { HierarchicalAreaInput } from '../../common/HierarchicalAreaInput';
import { CompanyMultiSelect } from '../../common/CompanyMultiSelect';
import { getAllActiveRequirements } from '../../../services/safetyAuditService';
import SafetyAuditDetailView from './SafetyAuditDetailView';

import type {
  SafetyAuditFormData,
  ActiveAuditRequirement,
  RequirementsByCategory,
  CategoryScore,
} from '../../../types/safetyAudit';

// ============================================
// TYPES
// ============================================

interface SafetyAuditFormProps {
  onSubmit: (data: SafetyAuditFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<SafetyAuditFormData>;
  companies?: Array<{ id: string; name: string; name_th?: string }>;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

// ============================================
// CATEGORY TABS COMPONENT
// ============================================

interface CategoryTabsProps {
  categories: string[]; // ['cat01', 'cat02', 'cat03']
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categoryScores?: Record<string, CategoryScore>;
  categoryNames: Record<string, { code: string; name_th: string }>;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  categoryScores,
  categoryNames,
}) => {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex gap-1 p-2">
        {categories.map((catId) => {
          const info = categoryNames[catId];
          const score = categoryScores?.[catId];
          const isActive = catId === selectedCategory;

          return (
            <button
              key={catId}
              type="button"
              onClick={() => onCategoryChange(catId)}
              className={`
                flex-1 px-4 py-3 rounded-lg border-2 transition-all
                ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }
              `}
            >
              <div className="font-bold text-lg">{info?.code || catId}</div>
              {score && (
                <div className="text-xs mt-1 opacity-90">
                  {score.percentage.toFixed(0)}%
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// SCORE BUTTON GROUP COMPONENT
// ============================================

interface ScoreButtonGroupProps {
  value: number | null;
  onChange: (score: number | null) => void;
  disabled?: boolean;
}

const ScoreButtonGroup: React.FC<ScoreButtonGroupProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const scores: Array<{ value: number | null; label: string; color: string }> = [
    { value: 3, label: '3', color: 'bg-green-600 hover:bg-green-700 border-green-600' },
    { value: 2, label: '2', color: 'bg-blue-600 hover:bg-blue-700 border-blue-600' },
    { value: 1, label: '1', color: 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600' },
    { value: 0, label: '0', color: 'bg-red-600 hover:bg-red-700 border-red-600' },
    { value: null, label: 'N/A', color: 'bg-gray-600 hover:bg-gray-700 border-gray-600' },
  ];

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {scores.map((score, index) => {
        const isSelected = value === score.value;

        return (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onChange(score.value)}
            disabled={disabled}
            className={`
              min-w-[50px] px-4 py-2 rounded border-2 font-semibold transition-all
              ${
                isSelected
                  ? `${score.color} text-white`
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {score.label}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// REQUIREMENT CARD COMPONENT
// ============================================

interface RequirementCardProps {
  requirement: ActiveAuditRequirement;
  fieldPrefix: string;
  control: any;
  onScoreChange: (score: number | null) => void;
  disabled?: boolean;
}

const RequirementCard: React.FC<RequirementCardProps> = ({
  requirement,
  fieldPrefix,
  control,
  onScoreChange,
  disabled = false,
}) => {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">
          {requirement.item_number}. {requirement.description_th}
        </h4>
        <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
          Weight: {requirement.weight}
        </span>
      </div>

      {/* Criteria */}
      <p className="text-sm text-gray-600 mb-3 italic">
        {requirement.criteria_th}
      </p>

      {/* Score Buttons */}
      <Controller
        name={`${fieldPrefix}.score` as any}
        control={control}
        render={({ field }) => (
          <ScoreButtonGroup
            value={field.value}
            onChange={(score) => {
              field.onChange(score);
              onScoreChange(score);
            }}
            disabled={disabled}
          />
        )}
      />

      {/* Comment */}
      <div className="mt-3">
        <Controller
          name={`${fieldPrefix}.comment` as any}
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="Comment area"
              disabled={disabled}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          )}
        />
      </div>
    </div>
  );
};

// ============================================
// CATEGORY DESCRIPTION COMPONENT
// ============================================

interface CategoryDescriptionProps {
  categoryName: string;
  requirementCount: number;
}

const CategoryDescription: React.FC<CategoryDescriptionProps> = ({
  categoryName,
  requirementCount,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-900">{categoryName}</h3>
      <p className="text-sm text-blue-700 mt-1">
        {requirementCount} รายการตรวจสอบ
      </p>
    </div>
  );
};

// ============================================
// PHOTO SECTION COMPONENT
// ============================================

interface PhotoSectionProps {
  categoryId: string;
  categoryName: string;
  photos: Array<{ id: string; url: string; caption?: string }>;
  onAddPhotos: (files: FileList) => void;
  onRemovePhoto: (photoId: string) => void;
  onUpdateCaption: (photoId: string, caption: string) => void;
  onPhotoClick: (photoUrl: string, photoIndex: number) => void;
  disabled?: boolean;
}

const PhotoSection: React.FC<PhotoSectionProps> = ({
  categoryId,
  categoryName,
  photos,
  onAddPhotos,
  onRemovePhoto,
  onUpdateCaption,
  onPhotoClick,
  disabled = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddPhotos(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  // Debug logging
  console.log(`📸 PhotoSection for ${categoryId}: ${photos.length} photos`, photos);

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <PhotoIcon className="h-5 w-5 mr-2 text-blue-600" />
          Photos - {categoryName}
        </h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <PhotoIcon className="h-4 w-4 mr-2" />
          Add Photos
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <PhotoIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No photos added yet</p>
          <p className="text-sm mt-1">Click "Add Photos" to upload evidence photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group">
              <div 
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onPhotoClick(photo.url, index)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Audit photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePhoto(photo.id);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Remove photo"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}

              {/* Caption */}
              <input
                type="text"
                value={photo.caption || ''}
                onChange={(e) => onUpdateCaption(photo.id, e.target.value)}
                placeholder="Add caption..."
                disabled={disabled}
                className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// ============================================
// SCORE SUMMARY COMPONENT
// ============================================

interface ScoreSummaryProps {
  categoryScores: Record<string, CategoryScore>;
  categoryNames: Record<string, { code: string; name_th: string }>;
}

const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  categoryScores,
  categoryNames,
}) => {
  // Calculate overall score
  const overallScore = useMemo(() => {
    const scores = Object.values(categoryScores);
    if (scores.length === 0) return null;

    const totalScore = scores.reduce((sum, s) => sum + s.total_score, 0);
    const maxScore = scores.reduce((sum, s) => sum + s.max_score, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      totalScore,
      maxScore,
      percentage,
    };
  }, [categoryScores]);

  return (
    <Card className="mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
        Score Summary
      </h3>

      {/* Per-Category Scores */}
      <div className="space-y-2 mb-4">
        {Object.entries(categoryScores).map(([catId, score]) => {
          const info = categoryNames[catId];
          return (
            <div key={catId} className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Category {info?.code}: {info?.name_th}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {score.total_score.toFixed(1)} / {score.max_score.toFixed(1)}
                </span>
                <span
                  className={`text-sm font-bold px-2 py-1 rounded ${
                    score.percentage >= 80
                      ? 'bg-green-100 text-green-800'
                      : score.percentage >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {score.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Score */}
      {overallScore && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">
              Overall Score:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-700">
                {overallScore.totalScore.toFixed(1)} /{' '}
                {overallScore.maxScore.toFixed(1)}
              </span>
              <span
                className={`text-lg font-bold px-3 py-1 rounded ${
                  overallScore.percentage >= 80
                    ? 'bg-green-600 text-white'
                    : overallScore.percentage >= 60
                    ? 'bg-yellow-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {overallScore.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================
// MAIN FORM COMPONENT
// ============================================

const SafetyAuditForm: React.FC<SafetyAuditFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  companies = [],
  loading = false,
  mode = 'create',
}) => {
  // Form mode state - allows toggling between view and edit
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>(mode || 'create');
  
  // Check if in view or edit mode
  const isViewMode = formMode === 'view';
  const isEditMode = formMode === 'edit';
  const isCreateMode = formMode === 'create';
  
  // State
  const [requirementsByCategory, setRequirementsByCategory] =
    useState<RequirementsByCategory>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('cat01');
  const [categoryNames, setCategoryNames] = useState<
    Record<string, { code: string; name_th: string }>
  >({});
  const [loadingRequirements, setLoadingRequirements] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submission state
  
  // Photo state - organized by category
  const [photosByCategory, setPhotosByCategory] = useState<
    Record<string, Array<{ id: string; url: string; caption?: string; file?: File }>>
  >({});
  
  // Photo modal state
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    isOpen: boolean;
    photoUrl: string;
    photoIndex: number;
    categoryId: string;
  }>({
    isOpen: false,
    photoUrl: '',
    photoIndex: 0,
    categoryId: '',
  });
  
  // Debug: Log isSubmitting state changes
  useEffect(() => {
    console.log('🔄 isSubmitting state changed:', isSubmitting);
  }, [isSubmitting]);
  
  // Location state for HierarchicalAreaInput
  const [mainArea, setMainArea] = useState('');
  const [subArea1, setSubArea1] = useState('');
  const [subArea2, setSubArea2] = useState('');

  // Get current context
  const currentProject = useCurrentProject();
  const currentUser = useCurrentUser();
  
  // Toggle between view and edit modes
  const toggleEditMode = () => {
    if (formMode === 'view') {
      setFormMode('edit');
    } else if (formMode === 'edit') {
      setFormMode('view');
    }
  };
  
  // Check if user can edit (for future permission logic)
  const canUserEdit = () => {
    // For now, allow editing if user created the audit
    // You can add more complex logic here (time limits, roles, etc.)
    return true; // Simplified - add actual logic as needed
  };

  // React Hook Form
  const { control, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<SafetyAuditFormData>({
      defaultValues: {
        audit_date: new Date().toISOString().split('T')[0],
        project_id: currentProject?.id || '',
        activity: null,
        number_of_personnel: 0,
        resultsByCategory: {},
        audit_criteria_rev: {},
        photosByCategory: {},
      },
    });

  // Watch category scores for summary (watch all form values for real-time updates)
  const formValues = watch();

  // ============================================
  // LOAD REQUIREMENTS AND INITIAL DATA
  // ============================================

  useEffect(() => {
    loadAllRequirements();
  }, []);

  // Apply initialData when it changes (for edit OR view mode)
  useEffect(() => {
    if (initialData && (mode === 'edit' || mode === 'view')) {
      console.log('📝 Loading initial data for', mode, 'mode:', initialData);
      
      // Set basic fields
      if (initialData.audit_date) setValue('audit_date', initialData.audit_date);
      if (initialData.project_id) setValue('project_id', initialData.project_id);
      if (initialData.activity) setValue('activity', initialData.activity);
      if (initialData.number_of_personnel) setValue('number_of_personnel', initialData.number_of_personnel);
      if (initialData.specific_location) setValue('specific_location', initialData.specific_location);
      
      // Set location fields - use the text names from main_area, sub_area1, sub_area2 columns
      // NOT the IDs - HierarchicalAreaInput expects names as strings
      if (initialData.main_area) {
        setMainArea(initialData.main_area);
        setValue('main_area', initialData.main_area);
      }
      if (initialData.sub_area1) {
        setSubArea1(initialData.sub_area1);
        setValue('sub_area1', initialData.sub_area1);
      }
      if (initialData.sub_area2) {
        setSubArea2(initialData.sub_area2);
        setValue('sub_area2', initialData.sub_area2);
      }
      
      // Also set the IDs for submission
      if (initialData.main_area_id) setValue('main_area_id', initialData.main_area_id);
      if (initialData.sub_area1_id) setValue('sub_area1_id', initialData.sub_area1_id);
      if (initialData.sub_area2_id) setValue('sub_area2_id', initialData.sub_area2_id);
      
      // Set companies
      if (initialData.company_ids) {
        setSelectedCompanies(initialData.company_ids);
      }
      
      // Set results by category (will be merged after requirements load)
      if (initialData.resultsByCategory) {
        Object.keys(initialData.resultsByCategory).forEach((catId) => {
          setValue(`resultsByCategory.${catId}` as any, initialData.resultsByCategory[catId]);
        });
      }
      
      // Set audit criteria revisions
      if (initialData.audit_criteria_rev) {
        setValue('audit_criteria_rev', initialData.audit_criteria_rev);
      }
      
      // Set photos by category
      if (initialData.photosByCategory) {
        console.log('📸 Loading initial photos:', initialData.photosByCategory);
        console.log('📸 Photo keys:', Object.keys(initialData.photosByCategory));
        console.log('📸 Photo count per category:', Object.entries(initialData.photosByCategory).map(([k, v]) => `${k}: ${v.length}`));
        setPhotosByCategory(initialData.photosByCategory as any); // Cast to bypass TypeScript error
      } else {
        console.log('📸 No photos in initialData');
      }
    } else {
      console.log('📸 No initialData provided');
    }
  }, [initialData, mode]);

  const loadAllRequirements = async () => {
    try {
      setLoadingRequirements(true);
      const requirements = await getAllActiveRequirements();

      // Group by category_identifier
      const grouped = requirements.reduce((acc: RequirementsByCategory, req: any) => {
        const catId = req.category_identifier;
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(req);
        return acc;
      }, {});

      setRequirementsByCategory(grouped);

      // Extract category names
      const names: Record<string, { code: string; name_th: string }> = {};
      requirements.forEach((req: any) => {
        if (!names[req.category_identifier]) {
          names[req.category_identifier] = {
            code: req.category_code,
            name_th: req.category_name_th,
          };
        }
      });
      setCategoryNames(names);

      // Initialize results for each category
      Object.keys(grouped).forEach((catId) => {
        const catRequirements = grouped[catId];
        
        // Check if we have initialData results for this category
        const savedResults = initialData?.resultsByCategory?.[catId];
        
        if (savedResults && mode === 'edit') {
          // EDIT MODE: Merge saved results with requirements
          console.log(`📝 Merging saved results for ${catId}:`, savedResults);
          
          // Create a map of requirement_id -> saved result
          const savedResultsMap = new Map();
          savedResults.forEach((result: any) => {
            savedResultsMap.set(result.requirement_id, result);
          });
          
          // Map requirements and merge with saved data
          setValue(
            `resultsByCategory.${catId}` as any,
            catRequirements.map((req: ActiveAuditRequirement) => {
              const saved = savedResultsMap.get(req.requirement_id);
              return {
                requirement_id: req.requirement_id,
                category_id: req.category_id,
                score: saved?.score ?? null,
                comment: saved?.comment || '',
              };
            })
          );
        } else {
          // CREATE MODE: Initialize with empty results
          setValue(
            `resultsByCategory.${catId}` as any,
            catRequirements.map((req: ActiveAuditRequirement) => ({
              requirement_id: req.requirement_id,
              category_id: req.category_id,
              score: null,
              comment: '',
            }))
          );
        }

        // Track revision number AND category UUID for photo mapping
        if (catRequirements[0]) {
          setValue(
            `audit_criteria_rev.${catId}` as any,
            {
              revision_number: catRequirements[0].revision_number,
              category_id: catRequirements[0].category_id, // Store UUID for photo mapping
            }
          );
        }
      });

      // Set first category as default
      const firstCat = Object.keys(grouped)[0];
      if (firstCat) {
        setSelectedCategory(firstCat);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
    } finally {
      setLoadingRequirements(false);
    }
  };

  // ============================================
  // CALCULATE CATEGORY SCORE
  // ============================================

  const calculateCategoryScore = (categoryId: string): CategoryScore => {
    // Get results from current form values
    const results = formValues.resultsByCategory?.[categoryId] || [];
    const requirements = requirementsByCategory[categoryId] || [];

    console.log(`🧮 calculateCategoryScore(${categoryId}):`, {
      resultsCount: results.length,
      requirementsCount: requirements.length,
      results,
      requirements: requirements.map(r => ({ id: r.id, weight: r.weight }))
    });

    let totalScore = 0;
    let maxScore = 0;
    let itemCount = 0;
    let naCount = 0;

    results.forEach((result: any, index: number) => {
      const req = requirements[index];
      if (!req) {
        console.warn(`⚠️ No requirement at index ${index} for category ${categoryId}`);
        return;
      }

      console.log(`  🔍 Item ${index} RAW result object:`, result);

      itemCount++;
      if (result.score === null || result.score === undefined) {
        console.log(`  ❌ Item ${index}: score=N/A (score property: ${result.score}), weight=${req.weight}`);
        naCount++;
      } else {
        const itemScore = result.score * req.weight;
        const itemMax = 3 * req.weight;
        console.log(`  ✅ Item ${index}: score=${result.score}, weight=${req.weight}, itemScore=${itemScore}, itemMax=${itemMax}`);
        totalScore += itemScore;
        maxScore += itemMax;
      }
    });

    const weightedAvg = maxScore > 0 ? (totalScore / maxScore) * 3 : 0;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    console.log(`📊 Category ${categoryId} final:`, { totalScore, maxScore, weightedAvg, percentage });

    return {
      total_score: totalScore,
      max_score: maxScore,
      weighted_avg: weightedAvg,
      percentage,
      item_count: itemCount,
      na_count: naCount,
    };
  };

  // Get calculated scores for all categories
  // Use JSON.stringify to detect deep changes in nested objects
  const calculatedScores = useMemo(() => {
    console.log('🔄 Recalculating scores...');
    console.log('📋 ALL Form Values:', formValues);
    console.log('📊 formValues.resultsByCategory:', formValues.resultsByCategory);
    
    const scores: Record<string, CategoryScore> = {};
    Object.keys(requirementsByCategory).forEach((catId) => {
      const results = formValues.resultsByCategory?.[catId] || [];
      console.log(`📝 Category ${catId} has ${results.length} results:`, results);
      
      // Check first result in detail
      if (results.length > 0) {
        console.log(`  🔍 First result keys:`, Object.keys(results[0]));
        console.log(`  🔍 First result.score:`, results[0].score);
        console.log(`  🔍 First result:`, JSON.stringify(results[0], null, 2));
      }
      
      const score = calculateCategoryScore(catId);
      console.log(`✅ Category ${catId} calculated score:`, score);
      scores[catId] = score;
    });
    return scores;
  }, [JSON.stringify(formValues.resultsByCategory), requirementsByCategory]);

  // ============================================
  // CURRENT CATEGORY DATA
  // ============================================

  const currentRequirements = requirementsByCategory[selectedCategory] || [];
  const currentCategoryName =
    categoryNames[selectedCategory]?.name_th || 'Loading...';

  // ============================================
  // PHOTO HANDLERS
  // ============================================

  const handleAddPhotos = (categoryId: string, files: FileList) => {
    const newPhotos = Array.from(files).map((file) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      caption: '',
      file, // Keep file reference for upload
    }));

    setPhotosByCategory((prev) => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), ...newPhotos],
    }));
  };

  const handleRemovePhoto = (categoryId: string, photoId: string) => {
    setPhotosByCategory((prev) => {
      const categoryPhotos = prev[categoryId] || [];
      const photo = categoryPhotos.find((p) => p.id === photoId);
      
      // Revoke blob URL to free memory
      if (photo && photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url);
      }

      return {
        ...prev,
        [categoryId]: categoryPhotos.filter((p) => p.id !== photoId),
      };
    });
  };

  const handleUpdateCaption = (categoryId: string, photoId: string, caption: string) => {
    setPhotosByCategory((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).map((photo) =>
        photo.id === photoId ? { ...photo, caption } : photo
      ),
    }));
  };

  const openPhotoModal = (categoryId: string, photoUrl: string, photoIndex: number) => {
    setSelectedPhotoModal({
      isOpen: true,
      photoUrl,
      photoIndex,
      categoryId,
    });
  };

  const closePhotoModal = () => {
    setSelectedPhotoModal({
      isOpen: false,
      photoUrl: '',
      photoIndex: 0,
      categoryId: '',
    });
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const categoryPhotos = photosByCategory[selectedPhotoModal.categoryId] || [];
    const currentIndex = selectedPhotoModal.photoIndex;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : categoryPhotos.length - 1;
    } else {
      newIndex = currentIndex < categoryPhotos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedPhotoModal({
      isOpen: true,
      photoUrl: categoryPhotos[newIndex].url,
      photoIndex: newIndex,
      categoryId: selectedPhotoModal.categoryId,
    });
  };

  // ============================================
  // FORM SUBMIT
  // ============================================

  const onFormSubmit = async (data: SafetyAuditFormData) => {
    console.log('🚀 Form submit started, setting isSubmitting to true');
    setIsSubmitting(true);
    
    try {
      // Calculate overall scores from all categories
      const allScores = Object.values(calculatedScores);
      const totalScore = allScores.reduce((sum, cat) => sum + cat.total_score, 0);
      const maxPossibleScore = allScores.reduce((sum, cat) => sum + cat.max_score, 0);
      const weightedAverage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 3 : 0;
      const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      
      console.log('📊 Calculated scores:', {
        totalScore,
        maxPossibleScore,
        weightedAverage,
        percentageScore,
        categoryScores: calculatedScores
      });
      
      // Add calculated scores and photos
      const enrichedData: any = {
        ...data,
        company_ids: selectedCompanies,
        photosByCategory, // Include photos organized by category
        // Overall scores for the audit table
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        weighted_average: weightedAverage,
        percentage_score: percentageScore,
        // Category scores (stored in JSONB column)
        category_scores: calculatedScores,
      };
      
      console.log('⏳ Calling parent onSubmit NOW...');
      const startTime = Date.now();
      
      // Wait for the parent handler to complete
      await onSubmit(enrichedData);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ Parent onSubmit ACTUALLY completed after ${elapsed}ms`);
      
      // Success - let the finally block handle cleanup
    } catch (error) {
      console.error('❌ Form submission error:', error);
      throw error; // Re-throw to show error to user
    } finally {
      console.log('🏁 Setting isSubmitting to false NOW');
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (loadingRequirements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requirements...</p>
        </div>
      </div>
    );
  }

  // Render Detail View in View Mode
  if (isViewMode && initialData) {
    return (
      <>
        {/* Header with Back and Edit buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Safety Audit</h2>
              <p className="text-sm text-gray-600">View audit details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            {canUserEdit() && (
              <Button
                type="button"
                variant="primary"
                onClick={toggleEditMode}
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Detail View Component */}
        <SafetyAuditDetailView
          audit={initialData}
          companies={companies}
          categoryScores={calculatedScores}
          categoryNames={categoryNames}
          photosByCategory={photosByCategory}
          onPhotoClick={(photoUrl, photoIndex) => {
            // Find which category this photo belongs to
            for (const [catId, photos] of Object.entries(photosByCategory)) {
              const photoIdx = photos.findIndex(p => p.url === photoUrl);
              if (photoIdx !== -1) {
                openPhotoModal(catId, photoUrl, photoIdx);
                return;
              }
            }
          }}
          canEdit={canUserEdit()}
          onEdit={toggleEditMode}
          currentUser={currentUser}
          currentProject={currentProject}
        />
        
        {/* Debug: Log photos */}
        {console.log('🔍 View Mode - photosByCategory:', photosByCategory)}
        {console.log('🔍 View Mode - calculatedScores:', calculatedScores)}
        {console.log('🔍 View Mode - initialData:', initialData)}
      </>
    );
  }

  // Render Form in Create/Edit Mode
  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isCreateMode && 'New Safety Audit'}
              {isEditMode && 'Edit Safety Audit'}
            </h2>
            <p className="text-sm text-gray-600">
              {isCreateMode && 'Complete audit for all categories (A-G)'}
              {isEditMode && 'Update audit information'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          {isEditMode && initialData && (
            <Button
              type="button"
              variant="secondary"
              onClick={toggleEditMode}
            >
              View
            </Button>
          )}
        </div>
      </div>

      {/* General Information Section */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">General Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <Controller
              name="project_id"
              control={control}
              rules={{ required: 'Project is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  value={currentProject?.name || ''}
                  disabled
                  error={errors.project_id?.message}
                />
              )}
            />
          </div>

          {/* Audit Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Date *
            </label>
            <Controller
              name="audit_date"
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <Input
                  type="date"
                  {...field}
                  disabled={isViewMode}
                  error={errors.audit_date?.message}
                />
              )}
            />
          </div>

          {/* Created By - Display Only */}
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Created By
                </label>
                <div className="text-base font-semibold text-blue-700">
                  {currentUser
                    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown User'
                    : 'Not logged in'}
                </div>
                {currentUser?.email && (
                  <div className="text-sm text-blue-600 mt-1">
                    {currentUser.email}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 uppercase font-medium">Auditor</div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-blue-700">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <HierarchicalAreaInput
              projectId={currentProject?.id || ''}
              mainArea={mainArea}
              subArea1={subArea1}
              subArea2={subArea2}
              onMainAreaChange={(areaName) => setMainArea(areaName)}
              onSubArea1Change={(subAreaName) => setSubArea1(subAreaName)}
              onSubArea2Change={(subAreaName) => setSubArea2(subAreaName)}
              onLocationIdsChange={(locationIds) => {
                setValue('main_area_id', locationIds.main_area_id || null);
                setValue('sub_area1_id', locationIds.sub_area1_id || null);
                setValue('sub_area2_id', locationIds.sub_area2_id || null);
              }}
              disabled={isViewMode}
            />
          </div>

          {/* Specific Location */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specific Location <span className="text-gray-500 text-xs">(e.g., Building A, Floor 3, Room 305)</span>
            </label>
            <Controller
              name="specific_location"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter specific location details"
                  value={field.value || ''}
                  disabled={isViewMode}
                />
              )}
            />
          </div>

          {/* Companies */}
          <div className="md:col-span-2">
            <CompanyMultiSelect
              selectedCompanyIds={selectedCompanies}
              onSelectionChange={setSelectedCompanies}
              placeholder="Search or add companies..."
              label="Companies"
              required={false}
            />
          </div>

          {/* Activity */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity <span className="text-gray-500 text-xs">(What is being done in this area?)</span>
            </label>
            <Controller
              name="activity"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="e.g., Welding work, Scaffolding installation, Concrete pouring"
                  value={field.value || ''}
                  disabled={isViewMode}
                />
              )}
            />
          </div>

          {/* Personnel Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Personnel
            </label>
            <Controller
              name="number_of_personnel"
              control={control}
              render={({ field }) => (
                <Input 
                  type="number" 
                  min="0" 
                  {...field} 
                  disabled={isViewMode}
                />
              )}
            />
          </div>
        </div>
      </Card>

      {/* Category Tabs */}
      <CategoryTabs
        categories={Object.keys(requirementsByCategory)}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryScores={calculatedScores}
        categoryNames={categoryNames}
      />

      {/* Category Description */}
      <CategoryDescription
        categoryName={currentCategoryName}
        requirementCount={currentRequirements.length}
      />

      {/* Requirements List */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">
          Category {categoryNames[selectedCategory]?.code} - Requirements
        </h3>

        {currentRequirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No requirements found for this category
          </div>
        ) : (
          <div className="space-y-4">
            {currentRequirements.map((requirement, index) => (
              <RequirementCard
                key={requirement.requirement_id}
                requirement={requirement}
                fieldPrefix={`resultsByCategory.${selectedCategory}.${index}`}
                control={control}
                onScoreChange={() => {
                  // Trigger re-calculation (handled by useMemo)
                }}
                disabled={isViewMode}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Photo Section for Current Category */}
      <PhotoSection
        categoryId={selectedCategory}
        categoryName={currentCategoryName}
        photos={(() => {
          const photos = photosByCategory[selectedCategory] || [];
          console.log('📸 Rendering PhotoSection:', {
            selectedCategory,
            photosForCategory: photos,
            photoCount: photos.length,
            allPhotosByCategory: photosByCategory,
            photoKeys: Object.keys(photosByCategory)
          });
          return photos;
        })()}
        onAddPhotos={(files) => handleAddPhotos(selectedCategory, files)}
        onRemovePhoto={(photoId) => handleRemovePhoto(selectedCategory, photoId)}
        onUpdateCaption={(photoId, caption) => 
          handleUpdateCaption(selectedCategory, photoId, caption)
        }
        onPhotoClick={(photoUrl, photoIndex) => 
          openPhotoModal(selectedCategory, photoUrl, photoIndex)
        }
        disabled={isViewMode || isSubmitting}
      />

      {/* Score Summary */}
      {Object.keys(calculatedScores).length > 0 && (
        <ScoreSummary
          categoryScores={calculatedScores}
          categoryNames={categoryNames}
        />
      )}

      {/* Form Actions - Hide in View Mode */}
      {!isViewMode && (
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            size="lg"
            loading={isSubmitting}
          >
            {isCreateMode ? 'Create Audit' : 'Update Audit'}
          </Button>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {selectedPhotoModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-7xl max-h-full w-full h-full p-4 flex items-center justify-center">
            {/* Close button */}
            <button
              type="button"
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
              title="Close"
            >
              ✕
            </button>
            
            {/* Photo */}
            <img
              src={selectedPhotoModal.photoUrl}
              alt="Full size photo"
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation buttons */}
            {(() => {
              const categoryPhotos = photosByCategory[selectedPhotoModal.categoryId] || [];
              
              if (categoryPhotos.length > 1) {
                return (
                  <>
                    {/* Previous button */}
                    <button
                      type="button"
                      onClick={() => navigatePhoto('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-5xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-14 h-14 flex items-center justify-center"
                      title="Previous photo"
                    >
                      ‹
                    </button>
                    
                    {/* Next button */}
                    <button
                      type="button"
                      onClick={() => navigatePhoto('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-5xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-14 h-14 flex items-center justify-center"
                      title="Next photo"
                    >
                      ›
                    </button>
                  </>
                );
              }
              return null;
            })()}
            
            {/* Photo counter and caption */}
            {(() => {
              const categoryPhotos = photosByCategory[selectedPhotoModal.categoryId] || [];
              const currentPhoto = categoryPhotos[selectedPhotoModal.photoIndex];
              const categoryInfo = categoryNames[selectedPhotoModal.categoryId];
              
              return (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                  {/* Counter */}
                  {categoryPhotos.length > 1 && (
                    <div className="text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg mb-2">
                      Photo {selectedPhotoModal.photoIndex + 1} of {categoryPhotos.length}
                    </div>
                  )}
                  {/* Caption and Category */}
                  <div className="text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg max-w-2xl">
                    <div className="font-semibold">
                      Category {categoryInfo?.code}: {categoryInfo?.name_th}
                    </div>
                    {currentPhoto?.caption && (
                      <div className="mt-1 text-sm text-gray-300">
                        {currentPhoto.caption}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </form>
  );
};

// Add form submission handler wrapper
const SafetyAuditFormWithUser: React.FC<SafetyAuditFormProps> = (props) => {
  const currentUser = useCurrentUser();

  const handleSubmitWithUser = async (data: SafetyAuditFormData) => {
    // Enrich form data with current user information
    // IMPORTANT: Preserve all existing data (including scores calculated in the form)
    const enrichedData: any = {
      ...data, // This includes total_score, max_possible_score, etc. from onFormSubmit
      created_by: currentUser?.id || null,
      created_by_name: currentUser
        ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email
        : null,
    };

    console.log('📝 Submitting audit with user info and scores:', {
      created_by: enrichedData.created_by,
      created_by_name: enrichedData.created_by_name,
      total_score: enrichedData.total_score,
      max_possible_score: enrichedData.max_possible_score,
      weighted_average: enrichedData.weighted_average,
      percentage_score: enrichedData.percentage_score,
    });

    // IMPORTANT: await the parent onSubmit handler
    await props.onSubmit(enrichedData);
  };

  return <SafetyAuditForm {...props} onSubmit={handleSubmitWithUser} />;
};

export default SafetyAuditFormWithUser;
