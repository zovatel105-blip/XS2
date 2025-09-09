import React from 'react';

const TestEnv = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Environment Variables Test</h2>
      <p><strong>REACT_APP_BACKEND_URL:</strong> {process.env.REACT_APP_BACKEND_URL || 'UNDEFINED'}</p>
      <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
      
      <h3>Test Backend Connection</h3>
      <button onClick={async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test123456' })
          });
          const data = await response.json();
          alert(JSON.stringify(data, null, 2));
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }}>
        Test Login
      </button>
    </div>
  );
};

export default TestEnv;