import React from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

interface LibraryInfo {
  name: string;
  status: 'Available' | 'Removed' | 'Deprecated';
  route?: string;
  description: string;
  qualityDetection: string;
  pros: string[];
  cons: string[];
  recommendation: string;
}

export const FaceRecognitionLibraryComparison: React.FC = () => {
  const navigate = useNavigate();

  const libraries: LibraryInfo[] = [
    {
      name: 'TensorFlow.js + MediaPipe Face Mesh',
      status: 'Available',
      route: '/face-detection-demo',
      description: 'Current production implementation using TensorFlow.js with MediaPipe Face Mesh for landmark detection.',
      qualityDetection: 'Basic quality assessment with simple lighting and angle checks',
      pros: [
        'Actively maintained and stable',
        'Good performance in browser',
        'Reliable face detection',
        'Good landmark detection (468 points)',
        'No security concerns'
      ],
      cons: [
        'Poor quality assessment for obstructed faces',
        'Limited accuracy metrics',
        'Cannot detect face clarity or obstruction well',
        'Basic lighting analysis only'
      ],
      recommendation: 'Recommended for basic face detection and landmarks'
    },
    {
      name: 'face-api.js',
      status: 'Available',
      route: '/face-api-demo',
      description: 'Advanced face recognition library with comprehensive quality assessment and 68-point facial landmarks.',
      qualityDetection: 'Advanced quality metrics including lighting, face angle, clarity, and obstruction detection',
      pros: [
        'Excellent quality assessment capabilities',
        'Comprehensive landmark detection (68 points)',
        'Real-time obstruction detection',
        'Detailed accuracy percentages',
        'Superior face analysis features'
      ],
      cons: [
        'Library is abandoned/deprecated',
        'Potential security vulnerabilities',
        'Larger bundle size',
        'May have compatibility issues long-term'
      ],
      recommendation: 'Use with caution - excellent features but security risks due to abandonment'
    },
    {
      name: 'MediaPipe Tasks (Face Detection)',
      status: 'Removed',
      description: 'Google\'s MediaPipe Tasks library attempted for advanced face detection with confidence scores.',
      qualityDetection: 'Would provide real confidence scores (0-100%) vs fake 1.0 scores',
      pros: [
        'Real confidence scores instead of fake 1.0',
        'Google-maintained library',
        'Advanced face detection capabilities',
        'Better accuracy metrics'
      ],
      cons: [
        'WASM compatibility issues in browser',
        'Module.arguments deprecation errors',
        'Complex setup and configuration',
        'Inconsistent browser support'
      ],
      recommendation: 'Removed due to WASM compatibility issues - not suitable for web deployment'
    }
  ];

  const getStatusColor = (status: LibraryInfo['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Deprecated':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Removed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Face Recognition Library Comparison
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Comparison of face recognition libraries for quality assessment and accuracy detection.
          Test each library to see differences in landmark detection and quality metrics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {libraries.map((library, index) => (
          <Card key={index} className="h-full flex flex-col">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{library.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(library.status)}`}>
                  {library.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4">{library.description}</p>

              {/* Quality Detection */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Quality Detection:</h4>
                <p className="text-sm text-gray-600">{library.qualityDetection}</p>
              </div>

              {/* Pros */}
              <div className="mb-4">
                <h4 className="font-semibold text-green-700 mb-2">✅ Pros:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {library.pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="mb-4">
                <h4 className="font-semibold text-red-700 mb-2">❌ Cons:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {library.cons.map((con, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="mb-4">
                <h4 className="font-semibold text-blue-700 mb-2">💡 Recommendation:</h4>
                <p className="text-sm text-gray-600">{library.recommendation}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto pt-4">
              {library.route ? (
                <Button
                  onClick={() => navigate(library.route!)}
                  className="w-full"
                  variant="primary"
                >
                  Test {library.name.split(' ')[0]}
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full opacity-50 cursor-not-allowed"
                  variant="secondary"
                >
                  Library Removed
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Testing Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">🔬 Testing Instructions</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>TensorFlow.js:</strong> Basic face detection with simple quality checks</p>
          <p>• <strong>face-api.js:</strong> Advanced quality assessment with landmark visualization and accuracy percentages</p>
          <p>• <strong>MediaPipe Tasks:</strong> Removed due to WASM compatibility issues</p>
          <p>• Compare the quality assessment capabilities between TensorFlow.js and face-api.js</p>
          <p>• Note that face-api.js provides superior quality metrics but has security concerns</p>
        </div>
      </Card>
    </div>
  );
};

