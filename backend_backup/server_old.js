const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { DefaultAzureCredential } = require('@azure/identity');
require('dotenv').config();

// Global error handlers to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the server
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't crash the server for database connection issues
  if (!error.message.includes('ConnectionError')) {
    process.exit(1);
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

  // Choose authentication method
  const authType = process.env.AZURE_AUTH_TYPE || 'azure-ad';
  
  if (authType === 'sql' && process.env.AZURE_SQL_USER && process.env.AZURE_SQL_PASSWORD) {
    // SQL Authentication
    return {
      ...baseConfig,
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD
    };
  } else if (authType === 'azure-token' && process.env.AZURE_ACCESS_TOKEN) {
    // Azure AD Access Token Authentication
    return {
      ...baseConfig,
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: process.env.AZURE_ACCESS_TOKEN
        }
      }
    };
  } else if (authType === 'azure-identity') {
    // Azure Identity Library Authentication
    return {
      ...baseConfig,
      authentication: {
        type: 'azure-active-directory-default'
      }
    };
  } else {
    // Azure AD Authentication (default)
    const config = {
      ...baseConfig,
      authentication: {
        type: 'azure-active-directory-default'
      }
    };
    
    // Add tenant ID and user if specified
    if (process.env.AZURE_TENANT_ID || process.env.AZURE_AD_USER) {
      config.authentication.options = {};
      
      if (process.env.AZURE_TENANT_ID) {
        config.authentication.options.tenantId = process.env.AZURE_TENANT_ID;
      }
      
      if (process.env.AZURE_AD_USER) {
        config.authentication.options.userName = process.env.AZURE_AD_USER;
      }
    }
    
    return config;
  }
};

const config = getDbConfig();

// Alternative config if Azure AD doesn't work
const sqlAuthConfig = {
  server: 'qshe.database.windows.net',
  database: 'jectqshe',
  user: 'qshe_admin', // We'll need to create this user
  password: 'your_password_here', // You'll need to set this
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

// Get Azure access token using Azure Identity
async function getAzureToken() {
  try {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://database.windows.net/');
    return tokenResponse.token;
  } catch (error) {
    console.error('Failed to get Azure token:', error.message);
    return null;
  }
}

// Test database connection on startup
async function testConnection() {
  try {
    console.log('🔌 Testing Azure SQL Database connection...');
    
    // Try to get a fresh token if using token authentication
    if (process.env.AZURE_AUTH_TYPE === 'azure-token') {
      const freshToken = await getAzureToken();
      if (freshToken) {
        console.log('🔑 Got fresh Azure access token');
        // Update the config with fresh token
        config.authentication.options.token = freshToken;
      }
    }
    
    await sql.connect(config);
    console.log('✅ Database connection successful!');
    await sql.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error details:', error);
    console.log('💡 You may need to:');
    console.log('   1. Enable SQL Authentication on Azure SQL Database');
    console.log('   2. Create a SQL user account');
    console.log('   3. Configure firewall rules');
    console.log('   4. Check your Azure credentials');
  }
}

// Auto-register user after Azure AD login
app.post('/api/auth/register-or-update', async (req, res) => {
  try {
    const { azure_ad_id, email, first_name, last_name, display_name, job_title, department } = req.body;

    console.log(`📝 Registration request for: ${email}`);
    
    const pool = await sql.connect(config);

    // Check existing user
    const existing = await sql.query`SELECT id, role FROM users WHERE azure_ad_id = ${azure_ad_id} OR email = ${email}`;

    if (existing.recordset.length > 0) {
      // Update existing
      await sql.query`
        UPDATE users SET 
          display_name = ${display_name},
          job_title = ${job_title},
          department = ${department},
          last_login = GETDATE(),
          updated_at = GETDATE()
        WHERE azure_ad_id = ${azure_ad_id}
      `;
      res.json({ success: true, user: existing.recordset[0], action: 'updated' });
    } else {
      // Create new user
      const role = determineRole(email, job_title, department);
      
      const result = await sql.query`
        INSERT INTO users (azure_ad_id, email, first_name, last_name, display_name, role, job_title, department, is_active, created_at, updated_at, last_login)
        OUTPUT INSERTED.*
        VALUES (${azure_ad_id}, ${email}, ${first_name}, ${last_name}, ${display_name}, ${role}, ${job_title}, ${department}, 1, GETDATE(), GETDATE(), GETDATE())
      `;
      
      res.json({ success: true, user: result.recordset[0], action: 'created' });
    }
    
    await sql.close();
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// PROJECT MANAGEMENT ENDPOINTS
// ==========================================

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    console.log('📋 Fetching all projects...');
    
    // Try to connect to database
    const pool = await sql.connect(config);
    const result = await sql.query`
      SELECT 
        id,
        project_code,
        project_name,
        project_description,
        start_date,
        end_date,
        project_status
      FROM projects 
      ORDER BY project_code
    `;
    
    await sql.close();
    res.json({ success: true, projects: result.recordset });
  } catch (error) {
    console.error('❌ Database unavailable for projects fetch:', error.message);
    
    // Return a proper error response that indicates database is unavailable
    // This will allow the frontend to fall back to localStorage
    res.status(503).json({ 
      success: false, 
      error: 'Database service unavailable',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Unable to connect to database. Using local storage fallback.'
    });
  }
});

// Get project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching project: ${id}`);
    
    const pool = await sql.connect(config);
    const result = await sql.query`
      SELECT 
        id,
        project_code,
        project_name,
        project_description,
        start_date,
        end_date,
        project_status
      FROM projects 
      WHERE id = ${id}
    `;
    
    await sql.close();
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({ success: true, project: result.recordset[0] });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(503).json({ 
      success: false, 
      error: 'Database service unavailable',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Unable to connect to database. Using local storage fallback.'
    });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const { 
      project_code, 
      project_name, 
      project_description, 
      project_status = 'active',
      start_date,
      end_date
    } = req.body;

    console.log(`📝 Creating project: ${project_name}`);
    
    const pool = await sql.connect(config);
    
    // Check if project code already exists
    const existing = await sql.query`SELECT id FROM projects WHERE project_code = ${project_code}`;
    if (existing.recordset.length > 0) {
      await sql.close();
      return res.status(400).json({ success: false, error: 'Project code already exists' });
    }
    
    const result = await sql.query`
      INSERT INTO projects (
        project_code, 
        project_name, 
        project_description, 
        project_status,
        start_date,
        end_date
      )
      OUTPUT INSERTED.*
      VALUES (
        ${project_code}, 
        ${project_name}, 
        ${project_description}, 
        ${project_status},
        ${start_date},
        ${end_date}
      )
    `;
    
    await sql.close();
    
    const createdProject = result.recordset[0];
    
    res.json({ success: true, project: createdProject, action: 'created' });
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(503).json({ 
      success: false, 
      error: 'Database service unavailable',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Unable to connect to database. Using local storage fallback.'
    });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      project_code, 
      project_name, 
      project_description, 
      project_status,
      start_date,
      end_date
    } = req.body;

    console.log(`📝 Updating project: ${id}`);
    
    const pool = await sql.connect(config);
    
    // Check if project exists
    const existing = await sql.query`SELECT id FROM projects WHERE id = ${id}`;
    if (existing.recordset.length === 0) {
      await sql.close();
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Check if project code is being changed and already exists
    if (project_code) {
      const codeCheck = await sql.query`SELECT id FROM projects WHERE project_code = ${project_code} AND id != ${id}`;
      if (codeCheck.recordset.length > 0) {
        await sql.close();
        return res.status(400).json({ success: false, error: 'Project code already exists' });
      }
    }
    
    const result = await sql.query`
      UPDATE projects SET 
        project_code = COALESCE(${project_code}, project_code),
        project_name = COALESCE(${project_name}, project_name),
        project_description = COALESCE(${project_description}, project_description),
        project_status = COALESCE(${project_status}, project_status),
        start_date = ${start_date},
        end_date = ${end_date}
      OUTPUT INSERTED.*
      WHERE id = ${id}
    `;
    
    await sql.close();
    
    const updatedProject = result.recordset[0];
    
    res.json({ success: true, project: updatedProject, action: 'updated' });
  } catch (error) {
    console.error('Failed to update project:', error);
    res.status(503).json({ 
      success: false, 
      error: 'Database service unavailable',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Unable to connect to database. Using local storage fallback.'
    });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting project: ${id}`);
    
    const pool = await sql.connect(config);
    
    // Check if project exists
    const existing = await sql.query`SELECT project_name FROM projects WHERE id = ${id}`;
    if (existing.recordset.length === 0) {
      await sql.close();
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const projectName = existing.recordset[0].project_name;
    
    // Delete the project
    await sql.query`DELETE FROM projects WHERE id = ${id}`;
    
    await sql.close();
    res.json({ success: true, message: `Project "${projectName}" deleted successfully` });
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(503).json({ 
      success: false, 
      error: 'Database service unavailable',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Unable to connect to database. Using local storage fallback.'
    });
  }
});

function determineRole(email, jobTitle, department) {
  if (email === 'nithat.su@th.jec.com') return 'member'; // Testing as member
  
  const title = (jobTitle || '').toLowerCase();
  const dept = (department || '').toLowerCase();
  
  if (title.includes('manager') || title.includes('director') || dept.includes('qshe') || dept.includes('safety')) {
    return 'admin';
  }
  
  return 'registrant';
}

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`QSHE Backend API running on port ${PORT}`);
  try {
    await testConnection();
  } catch (error) {
    console.error('Server startup database test failed:', error.message);
    console.log('🚀 Server will continue running with database unavailable');
  }
});