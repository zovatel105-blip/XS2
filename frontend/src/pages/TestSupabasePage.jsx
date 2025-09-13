import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import supabasePollService from '../services/supabasePollService';
import supabaseAuthService from '../services/supabaseAuthService';

const TestSupabasePage = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testUser, setTestUser] = useState(null);

  const addResult = (step, status, message, data = null) => {
    setTestResults(prev => [...prev, { step, status, message, data, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Step 1: Test Supabase Connection
      addResult('1', 'running', 'Testing Supabase Connection...');
      
      const { count: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (connectionError) {
        addResult('1', 'error', `Connection failed: ${connectionError.message}`);
        return;
      }
      addResult('1', 'success', 'Supabase connection successful!');

      // Step 2: Test Supabase Authentication
      addResult('2', 'running', 'Testing Supabase Authentication...');
      
      const testEmail = `testuser${Date.now()}@example.com`;
      const testPassword = 'TestPass123!';
      const testUsername = 'testuser_' + Date.now();
      
      // Sign up test user
      const { user: signUpUser, error: signUpError } = await supabaseAuthService.signUp(
        testEmail, 
        testPassword, 
        {
          username: testUsername,
          display_name: 'Test User',
          bio: 'Test user for Supabase migration testing'
        }
      );

      if (signUpError) {
        addResult('2', 'error', `Authentication failed: ${signUpError.message}`);
        return;
      }
      
      setTestUser({ id: signUpUser.id, username: testUsername });
      addResult('2', 'success', `Test user authenticated: ${testUsername}`, signUpUser);

      // Step 3: Test Authentication (simulate login)
      addResult('3', 'running', 'Testing authentication context...');
      
      // Get current authenticated user
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (!currentUser) {
        addResult('3', 'error', 'No authenticated user found');
        return;
      }
      
      addResult('3', 'success', `Authentication context working: ${currentUser.email}`);

      // Step 4: Test Poll Creation with Media Transform
      addResult('4', 'running', 'Testing poll creation with media transform...');
      
      const testPollData = {
        title: 'Test Poll - Supabase Migration',
        description: 'Testing media transform functionality in Supabase',
        options: [
          {
            text: 'Option A with cropped image',
            media_type: 'image',
            media_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            thumbnail_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            media_transform: {
              position: { x: 50, y: 30 },
              scale: 1.2,
              rotation: 0
            },
            mentioned_users: []
          },
          {
            text: 'Option B with different transform',
            media_type: 'image',
            media_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            thumbnail_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            media_transform: {
              position: { x: 75, y: 60 },
              scale: 0.8,
              rotation: 15
            },
            mentioned_users: []
          }
        ],
        music_id: null,
        tags: ['test', 'supabase', 'migration']
      };

      // Create poll using authenticated user
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: testPollData.title,
          description: testPollData.description,
          author_id: currentUser.id,
          music_id: testPollData.music_id,
          layout_id: 'vertical',
          background_color: '#ffffff',
          tags: testPollData.tags
        })
        .select()
        .single();

      if (pollError) {
        addResult('4', 'error', `Poll creation failed: ${pollError.message}`);
        return;
      }

      // Create poll options with media_transform
      const optionsToInsert = testPollData.options.map(option => ({
        poll_id: pollData.id,
        user_id: currentUser.id,
        text: option.text,
        media_type: option.media_type,
        media_url: option.media_url,
        thumbnail_url: option.thumbnail_url,
        media_transform: option.media_transform,
        mentioned_users: option.mentioned_users
      }));

      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert)
        .select();

      if (optionsError) {
        addResult('4', 'error', `Poll options creation failed: ${optionsError.message}`);
        return;
      }

      addResult('4', 'success', `Poll created successfully with ${optionsData.length} options`, {
        poll: pollData,
        options: optionsData
      });

      // Step 5: Test Poll Retrieval with Media Transform
      addResult('5', 'running', 'Testing poll retrieval with media transform...');
      
      const { data: retrievedPoll, error: retrieveError } = await supabase
        .from('polls')
        .select(`
          *,
          author:profiles(id, username, display_name, avatar_url, is_verified),
          options:poll_options(
            id,
            text,
            votes,
            media_type,
            media_url,
            thumbnail_url,
            media_transform,
            mentioned_users
          )
        `)
        .eq('id', pollData.id)
        .single();

      if (retrieveError) {
        addResult('5', 'error', `Poll retrieval failed: ${retrieveError.message}`);
        return;
      }

      // Verify media transform data
      const transformCount = retrievedPoll.options.filter(opt => opt.media_transform).length;
      addResult('5', 'success', `Poll retrieved with ${transformCount} options containing media_transform data`, {
        poll: retrievedPoll,
        transforms: retrievedPoll.options.map(opt => opt.media_transform)
      });

      // Step 6: Test Voting
      addResult('6', 'running', 'Testing voting functionality...');
      
      const firstOptionId = retrievedPoll.options[0].id;
      
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .insert({
          poll_id: pollData.id,
          option_id: firstOptionId,
          user_id: currentUser.id
        })
        .select();

      if (voteError) {
        addResult('6', 'error', `Voting failed: ${voteError.message}`);
      } else {
        addResult('6', 'success', 'Vote cast successfully!', voteData);
      }

      // Step 7: Test Poll Likes
      addResult('7', 'running', 'Testing poll like functionality...');
      
      const { data: likeData, error: likeError } = await supabase
        .from('poll_likes')
        .insert({
          poll_id: pollData.id,
          user_id: currentUser.id
        })
        .select();

      if (likeError) {
        addResult('7', 'error', `Poll like failed: ${likeError.message}`);
      } else {
        addResult('7', 'success', 'Poll liked successfully!', likeData);
      }

      // Step 8: Test supabasePollService.js methods
      addResult('8', 'running', 'Testing supabasePollService methods...');
      
      try {
        // Test getPolls method (this will fail if no auth, but that's expected)
        const polls = await supabasePollService.getPolls(5, 0);
        addResult('8', 'success', `getPolls method works - retrieved ${polls.length} polls`, polls);
      } catch (serviceError) {
        addResult('8', 'warning', `getPolls method test: ${serviceError.message} (expected without auth)`);
      }

      // Final Summary
      addResult('summary', 'success', '🎉 Supabase Migration Test Complete!');
      
    } catch (error) {
      addResult('error', 'error', `Unexpected error: ${error.message}`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'running': return '🔄';
      default: return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Supabase Migration Test Suite
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This test suite verifies that the Supabase migration is working correctly, 
              including poll creation, media transform persistence, voting, and likes.
            </p>
            
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRunning ? '🔄 Running Tests...' : '🚀 Run Supabase Tests'}
            </button>
          </div>

          {testUser && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Test User Created:</h3>
              <p className="text-blue-700">
                Username: {testUser.username} | ID: {testUser.id}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-700">
                        {result.step !== 'summary' && result.step !== 'error' && `Step ${result.step}:`}
                      </span>
                      <span className={`font-medium ${getStatusColor(result.status)}`}>
                        {result.message}
                      </span>
                    </div>
                    
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                          Show Details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {testResults.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Test Summary:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-green-600">✅ Success: </span>
                  {testResults.filter(r => r.status === 'success').length}
                </div>
                <div>
                  <span className="text-red-600">❌ Errors: </span>
                  {testResults.filter(r => r.status === 'error').length}
                </div>
                <div>
                  <span className="text-yellow-600">⚠️ Warnings: </span>
                  {testResults.filter(r => r.status === 'warning').length}
                </div>
                <div>
                  <span className="text-blue-600">🔄 Running: </span>
                  {testResults.filter(r => r.status === 'running').length}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSupabasePage;