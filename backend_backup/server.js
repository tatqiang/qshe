const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load .env from backend directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
});

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection on startup
async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('⚠️ Supabase connection test:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

// Projects API endpoints
app.get('/api/projects', async (req, res) => {
  try {
    console.log('📋 Fetching all projects from Supabase...');
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Supabase error fetching projects:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch projects from database',
        details: error.message 
      });
    }

    console.log(`✅ Found ${projects?.length || 0} projects`);
    res.json(projects || []);
  } catch (error) {
    console.error('❌ Server error fetching projects:', error);
    res.status(503).json({ 
      error: 'Service unavailable - database connection failed',
      details: error.message 
    });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    console.log('➕ Creating new project in Supabase...');
    console.log('Project data:', req.body);
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert([req.body])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating project:', error);
      return res.status(500).json({ 
        error: 'Failed to create project in database',
        details: error.message 
      });
    }

    console.log('✅ Project created successfully:', project);
    res.status(201).json(project);
  } catch (error) {
    console.error('❌ Server error creating project:', error);
    res.status(503).json({ 
      error: 'Service unavailable - database connection failed',
      details: error.message 
    });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    console.log(`🔄 Updating project ${projectId} in Supabase...`);
    
    const { data: project, error } = await supabase
      .from('projects')
      .update(req.body)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating project:', error);
      return res.status(500).json({ 
        error: 'Failed to update project in database',
        details: error.message 
      });
    }

    console.log('✅ Project updated successfully:', project);
    res.json(project);
  } catch (error) {
    console.error('❌ Server error updating project:', error);
    res.status(503).json({ 
      error: 'Service unavailable - database connection failed',
      details: error.message 
    });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    console.log(`🗑️ Deleting project ${projectId} from Supabase...`);
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('❌ Supabase error deleting project:', error);
      return res.status(500).json({ 
        error: 'Failed to delete project from database',
        details: error.message 
      });
    }

    console.log('✅ Project deleted successfully');
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Server error deleting project:', error);
    res.status(503).json({ 
      error: 'Service unavailable - database connection failed',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'supabase'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`QSHE Backend API running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Projects API: http://localhost:${PORT}/api/projects`);
  
  // Test connection on startup
  await testSupabaseConnection();
});