// Demo projects data that matches our 7-field schema exactly
const DEMO_PROJECTS = [
  {
    id: 1,
    project_code: "PRJ-001",
    project_name: "Safety Training Initiative",
    project_description: "Comprehensive safety training program for all employees",
    project_start: "2024-01-15",
    project_end: "2024-06-30",
    project_status: "completed"
  },
  {
    id: 2,
    project_code: "PRJ-002", 
    project_name: "Equipment Maintenance Upgrade",
    project_description: "Upgrade and standardization of maintenance procedures",
    project_start: "2024-03-01",
    project_end: "2024-12-31",
    project_status: "active"
  },
  {
    id: 3,
    project_code: "PRJ-003",
    project_name: "Environmental Compliance Audit", 
    project_description: "Annual environmental compliance review and improvements",
    project_start: "2024-04-01",
    project_end: "2024-10-31",
    project_status: "active"
  },
  {
    id: 4,
    project_code: "PRJ-004",
    project_name: "Emergency Response Protocol",
    project_description: "Development of new emergency response procedures", 
    project_start: "2024-05-15",
    project_end: "2024-08-15",
    project_status: "extended"
  },
  {
    id: 5,
    project_code: "PRJ-005",
    project_name: "Risk Assessment Database",
    project_description: "Implementation of digital risk assessment tracking system",
    project_start: "2024-06-01", 
    project_end: "2025-02-28",
    project_status: "active"
  },
  {
    id: 6,
    project_code: "PRJ-006",
    project_name: "Quality Management System",
    project_description: "ISO 9001 compliance and quality management improvements",
    project_start: "2024-02-01",
    project_end: "2024-11-30", 
    project_status: "on_hold"
  },
  {
    id: 7,
    project_code: "PRJ-007",
    project_name: "Digital Transformation Project",
    project_description: null,
    project_start: "2024-08-01",
    project_end: "2025-06-30",
    project_status: "active"
  }
];

// Since this is a Node.js environment, we'll use a simple file-based storage simulation
const fs = require('fs');
const path = require('path');

// Create a JSON file to simulate localStorage
const dataFile = path.join(__dirname, 'demo_projects_data.json');

function initializeDemoProjects() {
  try {
    // Write demo projects to JSON file (simulates localStorage for testing)
    fs.writeFileSync(dataFile, JSON.stringify(DEMO_PROJECTS, null, 2));
    console.log('✅ Demo projects data initialized successfully!');
    console.log(`📁 Data saved to: ${dataFile}`);
    console.log(`📊 Total projects: ${DEMO_PROJECTS.length}`);
    
    // Show the projects with exact field names
    console.log('\n📋 Demo Projects Created (7-field schema):');
    DEMO_PROJECTS.forEach(project => {
      console.log(`  ${project.project_code}: ${project.project_name}`);
      console.log(`    Status: ${project.project_status}`);
      console.log(`    Period: ${project.project_start} to ${project.project_end}`);
      console.log(`    Description: ${project.project_description || 'No description'}`);
      console.log('');
    });
    
    // Show status breakdown
    const statusCount = {};
    DEMO_PROJECTS.forEach(project => {
      statusCount[project.project_status] = (statusCount[project.project_status] || 0) + 1;
    });
    
    console.log('📊 Status Breakdown:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} project(s)`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing demo projects:', error);
  }
}

// Run the initialization
initializeDemoProjects();