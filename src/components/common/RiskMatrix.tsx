import React from 'react';
import { getRiskMatrixCell, type RiskLevel } from '../../types/safetyPatrol';

interface RiskMatrixProps {
  selectedLikelihood?: 1 | 2 | 3 | 4;
  selectedSeverity?: 1 | 2 | 3 | 4;
  onCellSelect?: (likelihood: 1 | 2 | 3 | 4, severity: 1 | 2 | 3 | 4) => void;
  readonly?: boolean;
  showLabels?: boolean;
  compact?: boolean;
}

const likelihoodLabels = [
  { value: 1, label: 'Rare', description: 'แทบจะไม่เกิดขึ้น' },
  { value: 2, label: 'Unlikely', description: 'ไม่น่าจะเกิดขึ้น' },
  { value: 3, label: 'Possible', description: 'อาจเกิดขึ้นได้' },
  { value: 4, label: 'Likely', description: 'น่าจะเกิดขึ้น' }
];

const severityLabels = [
  { value: 1, label: 'Negligible', description: 'ไม่รุนแรง' },
  { value: 2, label: 'Minor', description: 'เล็กน้อย' },
  { value: 3, label: 'Major', description: 'รุนแรง' },
  { value: 4, label: 'Catastrophic', description: 'รุนแรงมาก' }
];

const RiskMatrix: React.FC<RiskMatrixProps> = ({
  selectedLikelihood,
  selectedSeverity,
  onCellSelect,
  readonly = false,
  showLabels = true,
  compact = false
}) => {
  const handleCellClick = (likelihood: 1 | 2 | 3 | 4, severity: 1 | 2 | 3 | 4) => {
    if (!readonly && onCellSelect) {
      onCellSelect(likelihood, severity);
    }
  };

  const getCellClass = (likelihood: number, severity: number) => {
    const cell = getRiskMatrixCell(likelihood, severity);
    const isSelected = selectedLikelihood === likelihood && selectedSeverity === severity;
    
    let baseClass = `
      border border-gray-300 flex items-center justify-center text-white font-semibold text-xs
      ${compact ? 'h-6 w-12 md:h-8 md:w-16' : 'h-8 w-14 md:h-12 md:w-20'}
      ${!readonly ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}
      ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
    `;

    if (cell) {
      baseClass += ` bg-[${cell.color}]`;
    }

    return baseClass.trim();
  };

  const getRiskLevelText = (likelihood: number, severity: number): string => {
    const cell = getRiskMatrixCell(likelihood, severity);
    if (!cell) return '';
    
    const score = likelihood * severity;
    const riskTexts: Record<RiskLevel, string> = {
      'low': `L (${score})`,
      'medium': `M (${score})`,
      'high': `H (${score})`,
      'extremely_high': `EH (${score})`
    };
    
    return riskTexts[cell.riskLevel];
  };

  return (
    <div className="risk-matrix-container">
      {showLabels && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">4x4 Risk Assessment Matrix</h3>
          <p className="text-sm text-gray-600">Select likelihood and severity to assess risk level</p>
        </div>
      )}

      {/* Selected Risk Details - Moved to top */}
      {selectedLikelihood && selectedSeverity && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Selected Risk Level: </span>
              <span className="text-lg font-bold">
                {getRiskMatrixCell(selectedLikelihood, selectedSeverity)?.riskLevel.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Risk Score: {selectedLikelihood * selectedSeverity}</div>
              <div className="text-sm font-medium text-blue-600">
                Action: {getRiskMatrixCell(selectedLikelihood, selectedSeverity)?.action}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Container - Centered */}
      <div className="flex justify-center overflow-x-auto">
        <div className="flex flex-col">
          
          {/* Desktop Layout: Severity Labels + Matrix Side by Side */}
          <div className="hidden md:flex">
            {/* Desktop: Severity Labels (Vertical) - Left side */}
            {showLabels && (
              <div className="flex flex-col mr-2">
                {/* Severity labels from high to low */}
                {[4, 3, 2, 1].map((severity) => {
                  const label = severityLabels.find(l => l.value === severity);
                  return (
                    <div
                      key={severity}
                      className={`${compact ? 'h-8' : 'h-12'} flex items-center justify-start pr-2 min-w-[80px] md:min-w-[120px]`}
                    >
                      <div className="text-left">
                        <div className="text-xs font-medium text-gray-800">{label?.label}</div>
                        {!compact && (
                          <div className="text-xs text-gray-500">{label?.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop Matrix Grid */}
            <div className="flex flex-col min-w-0">
              {/* Matrix Cells */}
              {[4, 3, 2, 1].map((severity) => (
                <div key={severity} className="flex">
                  {[1, 2, 3, 4].map((likelihood) => {
                    const cell = getRiskMatrixCell(likelihood, severity);
                    return (
                      <div
                        key={`${likelihood}-${severity}`}
                        className={getCellClass(likelihood, severity)}
                        style={{ backgroundColor: cell?.color }}
                        onClick={() => handleCellClick(likelihood as 1|2|3|4, severity as 1|2|3|4)}
                        title={cell ? `${cell.action} - ${cell.riskLevel.replace('_', ' ').toUpperCase()}` : ''}
                      >
                        {getRiskLevelText(likelihood, severity)}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Likelihood Labels (Horizontal) */}
              {showLabels && (
                <div className="flex mt-2">
                  {[1, 2, 3, 4].map((likelihood) => {
                    const label = likelihoodLabels.find(l => l.value === likelihood);
                    return (
                      <div
                        key={likelihood}
                        className={`${compact ? 'w-16' : 'w-20'} text-center`}
                      >
                        <div className="text-xs font-medium text-gray-800">{label?.label}</div>
                        {!compact && (
                          <div className="text-xs text-gray-500">{label?.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout: Each row has severity label + matrix cells */}
          <div className="md:hidden flex flex-col min-w-0">
            {/* Matrix Rows with inline severity labels */}
            {[4, 3, 2, 1].map((severity) => {
              const severityLabel = severityLabels.find(l => l.value === severity);
              return (
                <div key={severity} className="flex items-center mb-1">
                  {/* Severity label for this row */}
                  {showLabels && (
                    <div className="w-20 text-right pr-2 flex-shrink-0">
                      <div className="text-xs font-medium text-gray-800">{severityLabel?.label}</div>
                      {!compact && (
                        <div className="text-xs text-gray-500">{severityLabel?.description}</div>
                      )}
                    </div>
                  )}
                  
                  {/* Matrix cells for this row */}
                  <div className="flex">
                    {[1, 2, 3, 4].map((likelihood) => {
                      const cell = getRiskMatrixCell(likelihood, severity);
                      return (
                        <div
                          key={`${likelihood}-${severity}`}
                          className={getCellClass(likelihood, severity)}
                          style={{ backgroundColor: cell?.color }}
                          onClick={() => handleCellClick(likelihood as 1|2|3|4, severity as 1|2|3|4)}
                          title={cell ? `${cell.action} - ${cell.riskLevel.replace('_', ' ').toUpperCase()}` : ''}
                        >
                          {getRiskLevelText(likelihood, severity)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Likelihood Labels (Horizontal) - Mobile */}
            {showLabels && (
              <div className="flex mt-2">
                {/* Empty space to align with matrix cells */}
                <div className="w-20 flex-shrink-0"></div>
                <div className="flex">
                  {[1, 2, 3, 4].map((likelihood) => {
                    const label = likelihoodLabels.find(l => l.value === likelihood);
                    return (
                      <div
                        key={likelihood}
                        className={`${compact ? 'w-12' : 'w-14'} text-center`}
                      >
                        <div className="text-xs font-medium text-gray-800">{label?.label}</div>
                        {!compact && (
                          <div className="text-xs text-gray-500">{label?.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Likelihood Title - Mobile */}
            {showLabels && (
              <div className="flex mt-1">
                <div className="w-20 flex-shrink-0"></div>
                <div className="flex justify-center flex-1">
                  <span className="text-xs font-medium text-gray-600">Likelihood</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Level Legend */}
      {showLabels && !compact && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { level: 'low', color: '#22C55E', action: 'Monitor', description: 'Accept risk with monitoring' },
            { level: 'medium', color: '#EAB308', action: 'Control', description: 'Implement controls to reduce risk' },
            { level: 'high', color: '#F97316', action: 'Mitigate', description: 'Take immediate action to reduce risk' },
            { level: 'extremely_high', color: '#EF4444', action: 'Stop Work', description: 'Stop work immediately' }
          ].map((item) => (
            <div key={item.level} className="flex items-center p-2 border rounded">
              <div
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <div className="text-xs font-medium">{item.action}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiskMatrix;
