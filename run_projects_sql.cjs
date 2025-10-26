// Run SQL script to setup clean projects table
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Database configuration (same as backend)
const config = {
  server: 'qshe.database.windows.net',
  database: 'jectqshe',
  authentication: {
    type: 'azure-active-directory-default'
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    port: 1433,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function runCleanProjectsSQL() {
  try {
    console.log('🔧 Connecting to Azure SQL Database...');
    
    // Connect to database
    await sql.connect(config);
    console.log('✅ Connected to database successfully');
    
    // Read the clean table creation script (NO DEMO DATA)
    const sqlFilePath = path.join(__dirname, 'database', 'create_clean_projects_table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📜 Running create_clean_projects_table.sql script (no demo data)...');
    
    // Split by GO statements and execute each batch
    const batches = sqlScript.split(/\r?\nGO\r?\n/);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        console.log(`⚡ Executing batch ${i + 1}/${batches.length}...`);
        const result = await sql.query(batch);
        if (result.recordset) {
          console.log('📊 Results:', result.recordset);
        }
      }
    }
    
    console.log('🎉 Clean projects table created successfully! (No demo data added)');
    
    // Verify the empty table exists
    const verifyResult = await sql.query`SELECT COUNT(*) as ProjectCount FROM projects`;
    console.log(`📈 Total projects in table: ${verifyResult.recordset[0].ProjectCount} (should be 0)`);
    
  } catch (error) {
    console.error('❌ Error running SQL script:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  } finally {
    // Close the connection
    await sql.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
console.log('🚀 Starting clean projects table setup...');
runCleanProjectsSQL();