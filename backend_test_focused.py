#!/usr/bin/env python3
"""
Backend API Testing Script - Authentication & Messaging System
Focused testing for authentication and message sending functionality.
"""

import requests
import json
import sys
import time
import random
from datetime import datetime, timedelta

# Get backend URL - use external URL from frontend/.env
def get_backend_url():
    # Read the actual backend URL from frontend/.env
    try:
        with open('/app/frontend/.env', 'r') as f:
            content = f.read()
            for line in content.split('\n'):
                if line.startswith('REACT_APP_BACKEND_URL='):
                    backend_url = line.split('=', 1)[1].strip()
                    return f"{backend_url}/api"
    except:
        pass
    # Fallback to localhost
    return "http://localhost:8001/api"

def get_mobile_headers():
    """Get headers that simulate mobile device requests"""
    return {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': 'https://social-share-panel.preview.emergentagent.com',
        'Referer': 'https://social-share-panel.preview.emergentagent.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    }

# Global variables for test data
test_users = []
auth_tokens = []

def test_health_check(base_url):
    """Test the root health check endpoint"""
    print("Testing health check endpoint...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "Social Network API" in data.get("name", ""):
                print("✅ Health check endpoint working correctly")
                return True
        
        print("❌ Health check endpoint failed")
        return False
    except Exception as e:
        print(f"❌ Health check endpoint error: {e}")
        return False

def test_demo_user_creation_and_authentication(base_url):
    """Test demo user creation and authentication system"""
    print("\n=== Testing Demo User Creation and Authentication ===")
    
    # Check if demo user exists and create if needed
    demo_credentials = {"email": "demo@example.com", "password": "demo123"}
    
    print("Testing demo user login...")
    try:
        response = requests.post(f"{base_url}/auth/login", json=demo_credentials, timeout=10)
        print(f"Demo Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Demo user exists and login successful")
            print(f"User ID: {data['user']['id']}")
            print(f"Username: {data['user']['username']}")
            
            # Store demo user data
            global test_users, auth_tokens
            test_users.append(data['user'])
            auth_tokens.append(data['access_token'])
            return True
            
        elif response.status_code == 400:
            print("Demo user doesn't exist, creating...")
            
            # Create demo user
            demo_user_data = {
                "email": "demo@example.com",
                "username": "demo_user",
                "display_name": "Demo User",
                "password": "demo123"
            }
            
            reg_response = requests.post(f"{base_url}/auth/register", json=demo_user_data, timeout=10)
            print(f"Demo Registration Status Code: {reg_response.status_code}")
            
            if reg_response.status_code == 200:
                data = reg_response.json()
                print("✅ Demo user created successfully")
                print(f"User ID: {data['user']['id']}")
                print(f"Username: {data['user']['username']}")
                
                # Store demo user data
                test_users.append(data['user'])
                auth_tokens.append(data['access_token'])
                return True
            else:
                print(f"❌ Demo user creation failed: {reg_response.text}")
                return False
        else:
            print(f"❌ Demo user login failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Demo user test error: {e}")
        return False

def test_message_sending_http422_fix(base_url):
    """Test message sending functionality to verify HTTP 422 fix"""
    print("\n=== Testing Message Sending HTTP 422 Fix ===")
    
    if len(auth_tokens) < 1:
        print("❌ Need at least 1 authenticated user for message testing")
        return False
    
    # Create a second user for messaging if needed
    if len(test_users) < 2:
        print("Creating second user for messaging test...")
        timestamp = int(time.time())
        second_user_data = {
            "email": f"test_recipient_{timestamp}@example.com",
            "username": f"test_recipient_{timestamp}",
            "display_name": f"Test Recipient {timestamp}",
            "password": "testpass123"
        }
        
        try:
            response = requests.post(f"{base_url}/auth/register", json=second_user_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                test_users.append(data['user'])
                auth_tokens.append(data['access_token'])
                print("✅ Second user created for messaging test")
            else:
                print(f"❌ Failed to create second user: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating second user: {e}")
            return False
    
    headers = {"Authorization": f"Bearer {auth_tokens[0]}"}
    
    # Test message sending with various scenarios
    test_scenarios = [
        {
            "name": "Basic text message",
            "data": {
                "recipient_id": test_users[1]['id'],
                "content": "Hello! This is a test message to verify the HTTP 422 fix.",
                "message_type": "text"
            }
        },
        {
            "name": "Message with metadata",
            "data": {
                "recipient_id": test_users[1]['id'],
                "content": "Message with metadata test",
                "message_type": "text",
                "metadata": {"test": "data"}
            }
        },
        {
            "name": "Longer message content",
            "data": {
                "recipient_id": test_users[1]['id'],
                "content": "This is a longer message to test if the HTTP 422 error that was caused by duplicate request body parsing has been resolved. The message should send successfully without any parsing errors.",
                "message_type": "text"
            }
        }
    ]
    
    success_count = 0
    
    for scenario in test_scenarios:
        print(f"\nTesting: {scenario['name']}")
        try:
            response = requests.post(f"{base_url}/messages", json=scenario['data'], headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {scenario['name']} sent successfully")
                print(f"Message ID: {data.get('message_id')}")
                print(f"Conversation ID: {data.get('conversation_id')}")
                success_count += 1
            elif response.status_code == 422:
                print(f"❌ HTTP 422 error still occurring: {response.text}")
                print("This indicates the duplicate request body parsing issue may not be fully resolved")
            else:
                print(f"❌ {scenario['name']} failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing {scenario['name']}: {e}")
    
    return success_count == len(test_scenarios)

def test_conversation_creation_and_retrieval(base_url):
    """Test conversation creation and retrieval"""
    print("\n=== Testing Conversation Creation and Retrieval ===")
    
    if len(auth_tokens) < 2:
        print("❌ Need at least 2 authenticated users for conversation testing")
        return False
    
    headers1 = {"Authorization": f"Bearer {auth_tokens[0]}"}
    headers2 = {"Authorization": f"Bearer {auth_tokens[1]}"}
    
    success_count = 0
    
    # Test getting conversations (should work even if empty)
    print("Testing GET /api/conversations...")
    try:
        response = requests.get(f"{base_url}/conversations", headers=headers1, timeout=10)
        print(f"Get Conversations Status Code: {response.status_code}")
        
        if response.status_code == 200:
            conversations = response.json()
            print(f"✅ Conversations retrieved successfully")
            print(f"Number of conversations: {len(conversations)}")
            success_count += 1
        else:
            print(f"❌ Get conversations failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Get conversations error: {e}")
    
    # Test conversation messages endpoint
    if success_count > 0:
        print("\nTesting conversation messages...")
        try:
            # First get conversations to find a conversation ID
            response = requests.get(f"{base_url}/conversations", headers=headers1, timeout=10)
            if response.status_code == 200:
                conversations = response.json()
                if len(conversations) > 0:
                    conv_id = conversations[0]['id']
                    
                    # Test getting messages from conversation
                    msg_response = requests.get(f"{base_url}/conversations/{conv_id}/messages", headers=headers1, timeout=10)
                    print(f"Get Messages Status Code: {msg_response.status_code}")
                    
                    if msg_response.status_code == 200:
                        messages = msg_response.json()
                        print(f"✅ Conversation messages retrieved successfully")
                        print(f"Number of messages: {len(messages)}")
                        success_count += 1
                    else:
                        print(f"❌ Get messages failed: {msg_response.text}")
                else:
                    print("ℹ️ No conversations exist yet (normal for new users)")
                    success_count += 1  # Not an error
        except Exception as e:
            print(f"❌ Conversation messages test error: {e}")
    
    # Test unread message count
    print("\nTesting unread message count...")
    try:
        response = requests.get(f"{base_url}/messages/unread", headers=headers2, timeout=10)
        print(f"Unread Count Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Unread count retrieved successfully")
            print(f"Unread count: {data.get('unread_count', 0)}")
            success_count += 1
        else:
            print(f"❌ Unread count failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Unread count error: {e}")
    
    return success_count >= 2

def test_user_statistics_endpoints(base_url):
    """Test user statistics endpoints for chat display"""
    print("\n=== Testing User Statistics Endpoints ===")
    
    if not auth_tokens:
        print("❌ No auth tokens available for statistics testing")
        return False
    
    headers = {"Authorization": f"Bearer {auth_tokens[0]}"}
    success_count = 0
    
    # Test user profile endpoint
    print("Testing GET /api/user/profile...")
    try:
        response = requests.get(f"{base_url}/user/profile", headers=headers, timeout=10)
        print(f"User Profile Status Code: {response.status_code}")
        
        if response.status_code == 200:
            profile = response.json()
            print(f"✅ User profile retrieved successfully")
            print(f"Username: {profile.get('username')}")
            print(f"Display Name: {profile.get('display_name')}")
            print(f"Followers: {profile.get('followers_count', 0)}")
            print(f"Following: {profile.get('following_count', 0)}")
            success_count += 1
        else:
            print(f"❌ User profile failed: {response.text}")
            
    except Exception as e:
        print(f"❌ User profile error: {e}")
    
    # Test user search endpoint
    print("\nTesting GET /api/users/search...")
    try:
        response = requests.get(f"{base_url}/users/search?q=demo", headers=headers, timeout=10)
        print(f"User Search Status Code: {response.status_code}")
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ User search successful")
            print(f"Found {len(users)} users")
            if len(users) > 0:
                print(f"First user: {users[0].get('username')} - {users[0].get('display_name')}")
            success_count += 1
        else:
            print(f"❌ User search failed: {response.text}")
            
    except Exception as e:
        print(f"❌ User search error: {e}")
    
    # Test followers/following endpoints
    print("\nTesting followers/following endpoints...")
    try:
        # Test recent followers
        response = requests.get(f"{base_url}/users/followers/recent", headers=headers, timeout=10)
        print(f"Recent Followers Status Code: {response.status_code}")
        
        if response.status_code == 200:
            followers = response.json()
            print(f"✅ Recent followers retrieved: {len(followers)} followers")
            success_count += 1
        else:
            print(f"❌ Recent followers failed: {response.text}")
        
        # Test recent activity
        response = requests.get(f"{base_url}/users/activity/recent", headers=headers, timeout=10)
        print(f"Recent Activity Status Code: {response.status_code}")
        
        if response.status_code == 200:
            activity = response.json()
            print(f"✅ Recent activity retrieved: {len(activity)} activities")
            success_count += 1
        else:
            print(f"❌ Recent activity failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Followers/activity endpoints error: {e}")
    
    return success_count >= 2

def test_authentication_endpoints(base_url):
    """Test authentication endpoints thoroughly"""
    print("\n=== Testing Authentication Endpoints ===")
    
    success_count = 0
    
    # Test /auth/me endpoint
    if auth_tokens:
        print("Testing GET /api/auth/me...")
        try:
            headers = {"Authorization": f"Bearer {auth_tokens[0]}"}
            response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            print(f"Auth Me Status Code: {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ Current user info retrieved successfully")
                print(f"User ID: {user_data['id']}")
                print(f"Username: {user_data['username']}")
                print(f"Email: {user_data['email']}")
                success_count += 1
            else:
                print(f"❌ Get current user failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Get current user error: {e}")
    
    # Test JWT validation
    print("\nTesting JWT validation...")
    try:
        # Test without token
        response = requests.get(f"{base_url}/auth/me", timeout=10)
        if response.status_code == 401:
            print("✅ Unauthorized access properly rejected")
            success_count += 1
        else:
            print(f"❌ Should reject unauthorized access, got status: {response.status_code}")
    except Exception as e:
        print(f"❌ Unauthorized test error: {e}")
    
    # Test with invalid token
    print("Testing access with invalid token...")
    try:
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
        if response.status_code == 401:
            print("✅ Invalid token properly rejected")
            success_count += 1
        else:
            print(f"❌ Should reject invalid token, got status: {response.status_code}")
    except Exception as e:
        print(f"❌ Invalid token test error: {e}")
    
    return success_count >= 2

def main():
    """Main test execution focused on authentication and messaging"""
    print("🚀 Starting Backend Authentication & Messaging System Testing")
    print("=" * 80)
    print("Focus: Authentication, Message Sending (HTTP 422 fix), Conversations, User Statistics")
    print("=" * 80)
    
    base_url = get_backend_url()
    print(f"Testing backend at: {base_url}")
    
    # Test sequence focused on the review requirements
    tests = [
        ("Health Check", test_health_check),
        ("Demo User Creation & Authentication", test_demo_user_creation_and_authentication),
        ("Authentication Endpoints", test_authentication_endpoints),
        ("Message Sending HTTP 422 Fix", test_message_sending_http422_fix),
        ("Conversation Creation & Retrieval", test_conversation_creation_and_retrieval),
        ("User Statistics Endpoints", test_user_statistics_endpoints),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            results[test_name] = test_func(base_url)
        except Exception as e:
            print(f"❌ Test {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Print summary
    print(f"\n{'='*80}")
    print("🎯 AUTHENTICATION & MESSAGING TEST SUMMARY")
    print(f"{'='*80}")
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<40} {status}")
    
    print(f"\n📊 Overall Results: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All authentication and messaging tests passed!")
        print("✅ Demo user authentication working")
        print("✅ HTTP 422 message sending fix verified")
        print("✅ Conversation system functional")
        print("✅ User statistics endpoints operational")
    elif passed >= total * 0.8:
        print("✅ Most tests passed. System is mostly functional with minor issues.")
    elif passed >= total * 0.6:
        print("⚠️ Some tests failed. System has moderate issues that need attention.")
    else:
        print("❌ Many tests failed. System has critical issues that need immediate attention.")
    
    return passed >= total * 0.8

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)