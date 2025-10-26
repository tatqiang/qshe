// Backend API for Auto-Registration
// This would be a Node.js/Express API or ASP.NET Core API

// POST /api/auth/register-or-update
// Called automatically after Azure AD login

const sql = require('mssql');

const config = {
  server: 'qshe.database.windows.net',
  database: 'jectqshe',
  authentication: {
    type: 'azure-active-directory-default'
  },
  options: {
    encrypt: true
  }
};

async function registerOrUpdateUser(req, res) {
  try {
    const {
      azure_ad_id,
      email,
      first_name,
      last_name,
      display_name,
      job_title,
      department
    } = req.body;

    // Connect to Azure SQL Database
    await sql.connect(config);

    // Check if user exists
    const existingUser = await sql.query`
      SELECT id, role FROM users WHERE azure_ad_id = ${azure_ad_id} OR email = ${email}
    `;

    if (existingUser.recordset.length > 0) {
      // Update existing user
      await sql.query`
        UPDATE users SET 
          display_name = ${display_name},
          job_title = ${job_title},
          department = ${department},
          last_login = GETDATE(),
          updated_at = GETDATE()
        WHERE azure_ad_id = ${azure_ad_id}
      `;
      
      return res.json({
        success: true,
        user: existingUser.recordset[0],
        action: 'updated'
      });
    }

    // Determine role automatically
    const role = determineUserRole(email, job_title, department);

    // Create new user
    const result = await sql.query`
      INSERT INTO users (
        azure_ad_id, email, first_name, last_name, display_name, 
        role, job_title, department, is_active, created_at, updated_at, last_login
      )
      OUTPUT INSERTED.*
      VALUES (
        ${azure_ad_id}, ${email}, ${first_name}, ${last_name}, ${display_name},
        ${role}, ${job_title}, ${department}, 1, GETDATE(), GETDATE(), GETDATE()
      )
    `;

    return res.json({
      success: true,
      user: result.recordset[0],
      action: 'created'
    });

  } catch (error) {
    console.error('Auto-registration failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function determineUserRole(email, jobTitle, department) {
  // Special case for system admin
  if (email === 'nithat.su@th.jec.com') {
    return 'system_admin';
  }

  // Admin roles based on job title/department
  const title = (jobTitle || '').toLowerCase();
  const dept = (department || '').toLowerCase();

  if (title.includes('manager') || title.includes('director') || title.includes('head') ||
      dept.includes('qshe') || dept.includes('safety') || dept.includes('quality')) {
    return 'admin';
  }

  // Default role for new users
  return 'registrant';
}

module.exports = { registerOrUpdateUser };