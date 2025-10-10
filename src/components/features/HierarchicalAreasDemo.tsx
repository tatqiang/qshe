import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { getMainAreas, createMainArea, getSubAreas1, createSubArea1, getSubAreas2, createSubArea2 } from '../../lib/api/hierarchicalAreasApi_clean';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { MainArea, SubArea1, SubArea2 } from '../../types';

const HierarchicalAreasDemo: React.FC = () => {
  const { project, projectId } = useAppContext();
  
  // State for areas
  const [mainAreas, setMainAreas] = useState<MainArea[]>([]);
  const [subAreas1, setSubAreas1] = useState<SubArea1[]>([]);
  const [subAreas2, setSubAreas2] = useState<SubArea2[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form states
  const [newMainArea, setNewMainArea] = useState({ name: '', code: '', description: '' });
  const [newSubArea1, setNewSubArea1] = useState({ name: '', code: '', description: '', mainAreaId: '' });
  const [newSubArea2, setNewSubArea2] = useState({ name: '', code: '', description: '', subArea1Id: '' });
  
  // Selected areas for cascading
  const [selectedMainArea, setSelectedMainArea] = useState<string>('');
  const [selectedSubArea1, setSelectedSubArea1] = useState<string>('');

  // Load data on component mount and project change
  useEffect(() => {
    if (project && projectId) {
      loadAllAreas();
    }
  }, [project, projectId]);

  const loadAllAreas = async () => {
    if (!projectId) {
      console.warn('Cannot load areas: no project ID available');
      return;
    }
    
    setLoading(true);
    try {
      const [mainAreasData, subAreas1Data, subAreas2Data] = await Promise.all([
        getMainAreas(projectId),
        getSubAreas1(projectId),
        getSubAreas2(projectId)
      ]);
      
      setMainAreas(mainAreasData);
      setSubAreas1(subAreas1Data);
      setSubAreas2(subAreas2Data);
      
      console.log('📊 Loaded hierarchical areas:', {
        mainAreas: mainAreasData.length,
        subAreas1: subAreas1Data.length,
        subAreas2: subAreas2Data.length
      });
    } catch (error) {
      console.error('❌ Failed to load areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMainArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainArea.name.trim() || !projectId) return;
    
    setCreating(true);
    try {
      const created = await createMainArea({
        project_id: projectId,
        name: newMainArea.name,
        code: newMainArea.code,
        description: newMainArea.description
      });
      
      if (created) {
        setNewMainArea({ name: '', code: '', description: '' });
        await loadAllAreas();
        console.log('✅ Created main area:', created);
      }
    } catch (error) {
      console.error('❌ Failed to create main area:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSubArea1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubArea1.name.trim() || !newSubArea1.mainAreaId || !projectId) return;
    
    setCreating(true);
    try {
      const created = await createSubArea1({
        project_id: projectId,
        main_area_id: newSubArea1.mainAreaId,
        name: newSubArea1.name,
        code: newSubArea1.code,
        description: newSubArea1.description
      });
      
      if (created) {
        setNewSubArea1({ name: '', code: '', description: '', mainAreaId: '' });
        await loadAllAreas();
        console.log('✅ Created sub area 1:', created);
      }
    } catch (error) {
      console.error('❌ Failed to create sub area 1:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSubArea2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubArea2.name.trim() || !newSubArea2.subArea1Id || !projectId) return;
    
    setCreating(true);
    try {
      const created = await createSubArea2({
        project_id: projectId,
        sub_area1_id: newSubArea2.subArea1Id,
        name: newSubArea2.name,
        code: newSubArea2.code,
        description: newSubArea2.description
      });
      
      if (created) {
        setNewSubArea2({ name: '', code: '', description: '', subArea1Id: '' });
        await loadAllAreas();
        console.log('✅ Created sub area 2:', created);
      }
    } catch (error) {
      console.error('❌ Failed to create sub area 2:', error);
    } finally {
      setCreating(false);
    }
  };

  const filteredSubAreas1 = selectedMainArea 
    ? subAreas1.filter(area => area.main_area_id === selectedMainArea)
    : subAreas1;

  const filteredSubAreas2 = selectedSubArea1
    ? subAreas2.filter(area => area.sub_area1_id === selectedSubArea1)
    : subAreas2;

  if (!project) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">No Project Selected</h2>
        <p className="text-gray-600">Please select a project to manage hierarchical areas.</p>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hierarchical Areas Demo</h1>
        <p className="text-gray-600">
          Project: {project.name} ({project.project_code})
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Test and manage main areas, sub areas level 1, and sub areas level 2 for the current project.
        </p>
      </div>

      {loading && (
        <Card className="p-6 mb-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hierarchical areas...</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Areas Column */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Main Areas ({mainAreas.length})</h2>
          
          {/* Create Main Area Form */}
          <form onSubmit={handleCreateMainArea} className="mb-6 space-y-3">
            <input
              type="text"
              placeholder="Main Area Name *"
              value={newMainArea.name}
              onChange={(e) => setNewMainArea(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
            <input
              type="text"
              placeholder="Area Code (optional)"
              value={newMainArea.code}
              onChange={(e) => setNewMainArea(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <textarea
              placeholder="Description (optional)"
              value={newMainArea.description}
              onChange={(e) => setNewMainArea(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
            />
            <Button 
              type="submit" 
              disabled={!newMainArea.name.trim() || creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Main Area'}
            </Button>
          </form>

          {/* Main Areas List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mainAreas.map((area) => (
              <div
                key={area.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedMainArea === area.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => {
                  setSelectedMainArea(area.id === selectedMainArea ? '' : area.id);
                  setSelectedSubArea1('');
                }}
              >
                <div className="font-medium text-sm">{area.name}</div>
                {area.code && (
                  <div className="text-xs text-gray-500">Code: {area.code}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">ID: {area.id.slice(0, 8)}...</div>
              </div>
            ))}
            {mainAreas.length === 0 && !loading && (
              <p className="text-gray-500 text-sm text-center py-4">No main areas found</p>
            )}
          </div>
        </Card>

        {/* Sub Areas 1 Column */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sub Areas 1 ({filteredSubAreas1.length})</h2>
          
          {/* Create Sub Area 1 Form */}
          <form onSubmit={handleCreateSubArea1} className="mb-6 space-y-3">
            <select
              value={newSubArea1.mainAreaId}
              onChange={(e) => setNewSubArea1(prev => ({ ...prev, mainAreaId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            >
              <option value="">Select Main Area *</option>
              {mainAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} {area.code && `(${area.code})`}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Sub Area 1 Name *"
              value={newSubArea1.name}
              onChange={(e) => setNewSubArea1(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
            <input
              type="text"
              placeholder="Area Code (optional)"
              value={newSubArea1.code}
              onChange={(e) => setNewSubArea1(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <Button 
              type="submit" 
              disabled={!newSubArea1.name.trim() || !newSubArea1.mainAreaId || creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Sub Area 1'}
            </Button>
          </form>

          {/* Sub Areas 1 List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSubAreas1.map((area) => {
              const parentArea = mainAreas.find(m => m.id === area.main_area_id);
              return (
                <div
                  key={area.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedSubArea1 === area.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    setSelectedSubArea1(area.id === selectedSubArea1 ? '' : area.id);
                  }}
                >
                  <div className="font-medium text-sm">{area.name}</div>
                  {area.code && (
                    <div className="text-xs text-gray-500">Code: {area.code}</div>
                  )}
                  <div className="text-xs text-gray-400">Parent: {parentArea?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-400 mt-1">ID: {area.id.slice(0, 8)}...</div>
                </div>
              );
            })}
            {filteredSubAreas1.length === 0 && !loading && (
              <p className="text-gray-500 text-sm text-center py-4">
                {selectedMainArea ? 'No sub areas for selected main area' : 'No sub areas 1 found'}
              </p>
            )}
          </div>
        </Card>

        {/* Sub Areas 2 Column */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sub Areas 2 ({filteredSubAreas2.length})</h2>
          
          {/* Create Sub Area 2 Form */}
          <form onSubmit={handleCreateSubArea2} className="mb-6 space-y-3">
            <select
              value={newSubArea2.subArea1Id}
              onChange={(e) => setNewSubArea2(prev => ({ ...prev, subArea1Id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            >
              <option value="">Select Sub Area 1 *</option>
              {subAreas1.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} {area.code && `(${area.code})`}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Sub Area 2 Name *"
              value={newSubArea2.name}
              onChange={(e) => setNewSubArea2(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
            <input
              type="text"
              placeholder="Area Code (optional)"
              value={newSubArea2.code}
              onChange={(e) => setNewSubArea2(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <Button 
              type="submit" 
              disabled={!newSubArea2.name.trim() || !newSubArea2.subArea1Id || creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Sub Area 2'}
            </Button>
          </form>

          {/* Sub Areas 2 List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSubAreas2.map((area) => {
              const parentArea = subAreas1.find(s => s.id === area.sub_area1_id);
              return (
                <div
                  key={area.id}
                  className="p-3 border border-gray-300 rounded-md hover:border-gray-400 transition-colors"
                >
                  <div className="font-medium text-sm">{area.name}</div>
                  {area.code && (
                    <div className="text-xs text-gray-500">Code: {area.code}</div>
                  )}
                  <div className="text-xs text-gray-400">Parent: {parentArea?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-400 mt-1">ID: {area.id.slice(0, 8)}...</div>
                </div>
              );
            })}
            {filteredSubAreas2.length === 0 && !loading && (
              <p className="text-gray-500 text-sm text-center py-4">
                {selectedSubArea1 ? 'No sub areas for selected sub area 1' : 'No sub areas 2 found'}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <Button 
          onClick={loadAllAreas} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Refreshing...' : 'Refresh All Areas'}
        </Button>
        
        <Button 
          onClick={() => {
            setSelectedMainArea('');
            setSelectedSubArea1('');
          }}
          variant="outline"
        >
          Clear Selections
        </Button>
      </div>

      {/* Debug Info */}
      <Card className="mt-8 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Debug Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700">Project Info</h4>
            <p>ID: {projectId}</p>
            <p>Code: {project.project_code}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Selection State</h4>
            <p>Main Area: {selectedMainArea ? selectedMainArea.slice(0, 8) + '...' : 'None'}</p>
            <p>Sub Area 1: {selectedSubArea1 ? selectedSubArea1.slice(0, 8) + '...' : 'None'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Data Counts</h4>
            <p>Main Areas: {mainAreas.length}</p>
            <p>Sub Areas 1: {subAreas1.length}</p>
            <p>Sub Areas 2: {subAreas2.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HierarchicalAreasDemo;
