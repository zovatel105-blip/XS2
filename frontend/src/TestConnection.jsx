import React, { useState } from 'react';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      console.log('Testing connection to:', backendUrl);
      
      // First, test if we can reach the backend at all
      setResult(`Testing connection to: ${backendUrl}\nStep 1: Testing basic connectivity...`);
      
      const healthResponse = await fetch(`${backendUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setResult(`Step 1 Result: ${healthResponse.status} ${healthResponse.statusText}\nStep 2: Testing OPTIONS preflight...`);
      
      // Test OPTIONS preflight
      const optionsResponse = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      setResult(`Step 2 Result: OPTIONS ${optionsResponse.status}\nStep 3: Testing actual login POST...`);
      
      // Test actual login
      const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test123456' })
      });
      
      if (loginResponse.ok) {
        const data = await loginResponse.json();
        setResult(`SUCCESS!\nStep 1: Health check - ${healthResponse.status}\nStep 2: OPTIONS - ${optionsResponse.status}\nStep 3: POST login - ${loginResponse.status}\n\nLogin response: ${JSON.stringify(data.user, null, 2)}`);
      } else {
        const errorData = await loginResponse.text();
        setResult(`PARTIAL SUCCESS\nStep 1: Health - ${healthResponse.status}\nStep 2: OPTIONS - ${optionsResponse.status}\nStep 3: POST login - ${loginResponse.status}\n\nError: ${errorData}`);
      }
      
    } catch (error) {
      console.error('Fetch error:', error);
      setResult(`NETWORK ERROR: ${error.name} - ${error.message}\n\nDetails:\n- Error stack: ${error.stack}\n- URL being tested: ${process.env.REACT_APP_BACKEND_URL}\n- Browser: ${navigator.userAgent}`);
    }
    
    setLoading(false);
  };

  const testSimpleEndpoint = async () => {
    setLoading(true);
    setResult('Testing simple endpoint...');
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/`);
      const data = await response.text();
      setResult(`Simple endpoint response: ${data}`);
    } catch (error) {
      setResult(`Simple endpoint error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>REACT_APP_BACKEND_URL:</strong> {process.env.REACT_APP_BACKEND_URL || 'UNDEFINED'}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        <p><strong>Location:</strong> {window.location.href}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#333', 
            color: '#fff', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Testing...' : 'Test Login API'}
        </button>
        
        <button 
          onClick={testSimpleEndpoint}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#333', 
            color: '#fff', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          Test Root Endpoint
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#111', 
        padding: '20px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {result || 'Click a button to test connection...'}
      </div>
    </div>
  );
};

export default TestConnection;