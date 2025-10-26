import React from 'react';
import type { SafetyAuditFormData } from '../../../types/safetyAudit';

interface SafetyAuditDetailViewProps {
  audit: Partial<SafetyAuditFormData> & { 
    id?: string;
    created_at?: string;
    audit_number?: string;
  };
  companies?: Array<{ id: string; name: string; name_th?: string }>;
  categoryScores?: Record<string, { 
    total_score: number; 
    max_score: number; 
    percentage: number;
  }>;
  categoryNames: Record<string, { code: string; name_th: string }>;
  photosByCategory?: Record<string, Array<{ id: string; url: string; caption?: string }>>;
  onPhotoClick?: (photoUrl: string, photoIndex: number) => void;
  canEdit?: boolean;
  onEdit?: () => void;
  currentUser?: any;
  currentProject?: any;
}

const SafetyAuditDetailView: React.FC<SafetyAuditDetailViewProps> = ({
  audit,
  companies = [],
  categoryScores = {},
  categoryNames,
  photosByCategory = {},
  onPhotoClick,
  canEdit = false,
  onEdit,
  currentUser,
  currentProject,
}) => {
  // Get all categories with results
  const categories = Object.keys(audit.resultsByCategory || {});

  // Get overall score
  const getOverallScore = () => {
    const scores = Object.values(categoryScores);
    if (scores.length === 0) return { percentage: 0, total_score: 0, max_score: 0 };
    
    const totalScore = scores.reduce((sum, cat) => sum + cat.total_score, 0);
    const totalMax = scores.reduce((sum, cat) => sum + cat.max_score, 0);
    const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    
    return { percentage, total_score: totalScore, max_score: totalMax };
  };

  const overallScore = getOverallScore();

  // Get score color based on percentage
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 75) return 'bg-blue-100 text-blue-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Combined Safety Audit Information - Single Blue Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <div>
            <h3 className="font-medium text-blue-900 flex items-center text-base sm:text-lg">
              📋 Safety Audit Report
            </h3>
            {audit.created_at && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Created: {new Date(audit.created_at).toLocaleDateString()} {new Date(audit.created_at).toLocaleTimeString()}
              </p>
            )}
          </div>
          {canEdit && onEdit && (
            <button
              type="button"
              className="px-3 py-1.5 sm:px-4 sm:py-2 border text-xs sm:text-sm rounded flex items-center space-x-1.5 sm:space-x-2 font-medium border-blue-600 text-blue-600 bg-white hover:bg-blue-50"
              onClick={onEdit}
              title="Edit this audit"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
          )}
        </div>
        
        {/* Basic Information Section */}
        <div className="mb-3 sm:mb-6">
          <h4 className="font-medium text-blue-800 mb-2 sm:mb-4 text-sm sm:text-base">📋 Audit Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Project: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{currentProject?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Audit Date: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">
                {audit.audit_date ? new Date(audit.audit_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Main Area: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{audit.main_area || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Sub Area 1: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{audit.sub_area1 || 'Not specified'}</span>
            </div>
            {audit.sub_area2 && (
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Sub Area 2: </span>
                <span className="text-sm sm:text-base text-gray-900 font-medium">{audit.sub_area2}</span>
              </div>
            )}
          </div>

          {/* Specific Location */}
          {audit.specific_location && (
            <div className="mb-2 sm:mb-4">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Specific Location: </span>
              <div className="mt-1 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded border text-sm sm:text-base text-gray-900">
                {audit.specific_location}
              </div>
            </div>
          )}

          {/* Activity and Personnel */}
          {audit.activity && (
            <div className="mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Activity: </span>
              <div className="mt-1 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded border text-sm sm:text-base text-gray-900">
                {audit.activity}
              </div>
            </div>
          )}

          {audit.number_of_personnel !== null && audit.number_of_personnel !== undefined && (
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Number of Personnel: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{audit.number_of_personnel}</span>
            </div>
          )}

          {/* Companies */}
          {companies.length > 0 && (
            <div className="mt-2 sm:mt-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Companies: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {companies.map((company) => (
                  <span key={company.id} className="inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 rounded">
                    {company.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Auditor */}
          {audit.created_by_name && (
            <div className="mt-2 sm:mt-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Auditor: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{audit.created_by_name}</span>
            </div>
          )}
        </div>

        {/* Overall Score Section */}
        <div className="mb-3 sm:mb-6 pt-2 sm:pt-4 border-t border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 sm:mb-4 text-sm sm:text-base">📊 Overall Score</h4>
          <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Total Score</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {overallScore.total_score} / {overallScore.max_score}
                </div>
              </div>
              <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg ${getScoreColor(overallScore.percentage)}`}>
                <div className="text-xl sm:text-2xl font-bold">
                  {overallScore.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Results Section */}
        <div className="mb-3 sm:mb-6 pt-2 sm:pt-4 border-t border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 sm:mb-4 text-sm sm:text-base">📋 Category Results</h4>
          
          <div className="space-y-3">
            {categories.map((categoryId) => {
              const categoryInfo = categoryNames[categoryId];
              const score = categoryScores[categoryId];
              const results = audit.resultsByCategory?.[categoryId] || [];
              const photos = photosByCategory[categoryId] || [];

              return (
                <div key={categoryId} className="bg-white rounded-lg border p-3 sm:p-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm sm:text-base">
                        Category {categoryInfo?.code}: {categoryInfo?.name_th}
                      </h5>
                    </div>
                    {score && (
                      <div className={`px-2 py-1 rounded ${getScoreColor(score.percentage)}`}>
                        <span className="text-xs sm:text-sm font-bold">
                          {score.percentage.toFixed(0)}%
                        </span>
                        <span className="text-xs ml-1">
                          ({score.total_score}/{score.max_score})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Requirements with Scores */}
                  {results.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {results.map((result, index) => (
                        <div key={index} className="bg-gray-50 rounded p-2 text-xs sm:text-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="font-medium text-gray-700">Requirement {index + 1}</span>
                              {result.comment && (
                                <div className="text-gray-600 mt-1">{result.comment}</div>
                              )}
                            </div>
                            <div className="ml-2">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                result.score === 3 ? 'bg-green-600 text-white' :
                                result.score === 2 ? 'bg-blue-600 text-white' :
                                result.score === 1 ? 'bg-yellow-600 text-white' :
                                'bg-red-600 text-white'
                              }`}>
                                {result.score ?? 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category Photos */}
                  {photos.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        📸 Photos ({photos.length})
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {photos.map((photo, index) => (
                          <div key={photo.id} className="relative cursor-pointer hover:opacity-80 transition-opacity">
                            <img
                              src={photo.url}
                              alt={photo.caption || `Photo ${index + 1}`}
                              className="w-full h-16 sm:h-20 object-cover rounded border"
                              onClick={() => onPhotoClick && onPhotoClick(photo.url, index)}
                            />
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[8px] sm:text-[10px] p-0.5 text-center truncate">
                                {photo.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyAuditDetailView;
