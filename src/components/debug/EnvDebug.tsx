// Temporary debug component to check environment variables
import React from 'react';

export const EnvDebug: React.FC = () => {
  const allEnvVars = import.meta.env;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h4>Environment Variables Debug</h4>
      <div><strong>TENANT_ID:</strong> {import.meta.env.VITE_AZURE_TENANT_ID || 'NOT SET'}</div>
      <div><strong>CLIENT_ID:</strong> {import.meta.env.VITE_AZURE_COMPANY_CLIENT_ID || 'NOT SET'}</div>
      <div><strong>All VITE vars:</strong></div>
      <pre>{JSON.stringify(
        Object.keys(allEnvVars)
          .filter(key => key.startsWith('VITE_'))
          .reduce((obj, key) => ({...obj, [key]: allEnvVars[key]}), {}), 
        null, 2
      )}</pre>
    </div>
  );
};