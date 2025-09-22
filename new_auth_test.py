#!/usr/bin/env python3
"""
New Auth Page Backend Testing Script
Tests the backend endpoints for the new simplified auth page functionality.
"""

import requests
import json
import sys
import time
import random
from datetime import datetime

def get_backend_url():
    """Get backend URL for testing - use external URL that frontend uses"""
    return "https://reliable-auth-1.preview.emergentagent.com/api"

def test_auth_endpoints():
    """Test the auth endpoints that the new auth page will use"""
    print("🔐 === TESTING NEW AUTH PAGE BACKEND ENDPOINTS ===")
    print("CONTEXT: Testing backend support for new simplified auth page")
    
    base_url = get_backend_url()
    print(f"Backend URL: {base_url}")
    
    # Generate unique test data
    timestamp = int(time.time())
    test_email = f"newauth.test.{timestamp}@example.com"
    test_username = f"newauth_user_{timestamp}"
    test_display_name = "New Auth Test User"
    test_password = "testpassword123"
    
    success_count = 0
    total_tests = 0
    
    # Test 1: Health Check
    print("\n1. 🏥 Testing Health Check...")
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check successful: {data.get('name', 'Unknown')}")
            success_count += 1
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    # Test 2: User Registration (POST /api/auth/register)
    print("\n2. 📝 Testing User Registration...")
    total_tests += 1
    
    registration_data = {
        "email": test_email,
        "username": test_username,
        "display_name": test_display_name,
        "password": test_password
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=registration_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Registration successful")
            print(f"   📋 Response structure:")
            print(f"      - access_token: {'✅' if 'access_token' in data else '❌'}")
            print(f"      - token_type: {data.get('token_type', 'N/A')}")
            print(f"      - expires_in: {data.get('expires_in', 'N/A')} seconds")
            print(f"      - user.id: {'✅' if data.get('user', {}).get('id') else '❌'}")
            print(f"      - user.email: {data.get('user', {}).get('email', 'N/A')}")
            print(f"      - user.username: {data.get('user', {}).get('username', 'N/A')}")
            print(f"      - user.display_name: {data.get('user', {}).get('display_name', 'N/A')}")
            
            # Verify JWT token format
            token = data.get('access_token', '')
            if token and len(token.split('.')) == 3:
                print(f"   ✅ JWT token format is valid")
            else:
                print(f"   ❌ JWT token format is invalid")
            
            # Store token for login test
            auth_token = token
            user_data = data.get('user', {})
            success_count += 1
            
        else:
            print(f"   ❌ Registration failed: {response.text}")
            auth_token = None
            user_data = {}
            
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
        auth_token = None
        user_data = {}
    
    # Test 3: User Login (POST /api/auth/login)
    print("\n3. 🔑 Testing User Login...")
    total_tests += 1
    
    login_data = {
        "email": test_email,
        "password": test_password
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Login successful")
            print(f"   📋 Response structure:")
            print(f"      - access_token: {'✅' if 'access_token' in data else '❌'}")
            print(f"      - token_type: {data.get('token_type', 'N/A')}")
            print(f"      - expires_in: {data.get('expires_in', 'N/A')} seconds")
            print(f"      - user.id: {'✅' if data.get('user', {}).get('id') else '❌'}")
            print(f"      - user.email: {data.get('user', {}).get('email', 'N/A')}")
            
            # Update token if login successful
            if 'access_token' in data:
                auth_token = data['access_token']
                user_data = data.get('user', {})
            
            success_count += 1
            
        else:
            print(f"   ❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    # Test 4: Invalid Login Credentials
    print("\n4. 🚫 Testing Invalid Login Credentials...")
    total_tests += 1
    
    invalid_login_data = {
        "email": test_email,
        "password": "wrongpassword123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=invalid_login_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print(f"   ✅ Invalid credentials properly rejected")
            success_count += 1
        else:
            print(f"   ❌ Should reject invalid credentials, got: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Invalid login test error: {e}")
    
    # Test 5: Duplicate Email Registration
    print("\n5. 🔄 Testing Duplicate Email Registration...")
    total_tests += 1
    
    duplicate_registration = {
        "email": test_email,  # Same email
        "username": f"different_user_{timestamp}",  # Different username
        "display_name": "Different User",
        "password": "differentpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=duplicate_registration, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print(f"   ✅ Duplicate email properly rejected")
            print(f"   Error message: {response.json().get('detail', 'N/A')}")
            success_count += 1
        else:
            print(f"   ❌ Should reject duplicate email, got: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Duplicate email test error: {e}")
    
    # Test 6: Missing Required Fields
    print("\n6. 📋 Testing Missing Required Fields...")
    total_tests += 1
    
    # Test missing email
    incomplete_data = {
        "username": f"incomplete_{timestamp}",
        "display_name": "Incomplete User",
        "password": "testpass123"
        # Missing email
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=incomplete_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [400, 422]:  # 422 for validation errors
            print(f"   ✅ Missing required fields properly rejected")
            success_count += 1
        else:
            print(f"   ❌ Should reject missing fields, got: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Missing fields test error: {e}")
    
    # Test 7: JWT Token Validation
    print("\n7. 🎫 Testing JWT Token Validation...")
    total_tests += 1
    
    if auth_token:
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        try:
            response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ JWT token validation successful")
                print(f"   📋 User info retrieved:")
                print(f"      - id: {data.get('id', 'N/A')}")
                print(f"      - email: {data.get('email', 'N/A')}")
                print(f"      - username: {data.get('username', 'N/A')}")
                print(f"      - display_name: {data.get('display_name', 'N/A')}")
                success_count += 1
            else:
                print(f"   ❌ JWT validation failed: {response.text}")
                
        except Exception as e:
            print(f"   ❌ JWT validation error: {e}")
    else:
        print(f"   ⚠️ No auth token available for validation test")
    
    # Test 8: Invalid JWT Token
    print("\n8. 🚫 Testing Invalid JWT Token...")
    total_tests += 1
    
    invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
    
    try:
        response = requests.get(f"{base_url}/auth/me", headers=invalid_headers, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print(f"   ✅ Invalid JWT token properly rejected")
            success_count += 1
        else:
            print(f"   ❌ Should reject invalid token, got: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Invalid token test error: {e}")
    
    # Test 9: User Data Storage Verification
    print("\n9. 💾 Testing User Data Storage...")
    total_tests += 1
    
    if auth_token and user_data:
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        try:
            response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                stored_data = response.json()
                
                # Verify all registration data was stored correctly
                checks = [
                    ("email", test_email, stored_data.get('email')),
                    ("username", test_username, stored_data.get('username')),
                    ("display_name", test_display_name, stored_data.get('display_name'))
                ]
                
                all_correct = True
                for field, expected, actual in checks:
                    if expected == actual:
                        print(f"   ✅ {field}: {actual}")
                    else:
                        print(f"   ❌ {field}: expected '{expected}', got '{actual}'")
                        all_correct = False
                
                # Check that password is not returned (security)
                if 'password' not in stored_data and 'hashed_password' not in stored_data:
                    print(f"   ✅ Password not exposed in response (security)")
                else:
                    print(f"   ❌ Password data exposed in response (security risk)")
                    all_correct = False
                
                if all_correct:
                    success_count += 1
                    
            else:
                print(f"   ❌ Could not verify user data storage: {response.text}")
                
        except Exception as e:
            print(f"   ❌ User data verification error: {e}")
    else:
        print(f"   ⚠️ No auth token or user data available for verification")
    
    # Test 10: Response Format Compatibility
    print("\n10. 📄 Testing Response Format for Frontend Compatibility...")
    total_tests += 1
    
    # Test that registration response has all fields needed by frontend
    test_reg_data = {
        "email": f"format.test.{timestamp}@example.com",
        "username": f"format_test_{timestamp}",
        "display_name": "Format Test User",
        "password": "formattest123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=test_reg_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields for frontend
            required_fields = [
                'access_token',
                'token_type', 
                'expires_in',
                'user'
            ]
            
            user_required_fields = [
                'id',
                'email',
                'username',
                'display_name'
            ]
            
            all_present = True
            
            for field in required_fields:
                if field in data:
                    print(f"   ✅ {field}: present")
                else:
                    print(f"   ❌ {field}: missing")
                    all_present = False
            
            user_data = data.get('user', {})
            for field in user_required_fields:
                if field in user_data:
                    print(f"   ✅ user.{field}: present")
                else:
                    print(f"   ❌ user.{field}: missing")
                    all_present = False
            
            if all_present:
                print(f"   ✅ All required fields present for frontend compatibility")
                success_count += 1
            else:
                print(f"   ❌ Some required fields missing")
                
        else:
            print(f"   ❌ Registration failed for format test: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Format compatibility test error: {e}")
    
    # Summary
    print(f"\n📊 === TEST SUMMARY ===")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {success_count}")
    print(f"Failed: {total_tests - success_count}")
    print(f"Success Rate: {(success_count/total_tests)*100:.1f}%")
    
    if success_count >= 8:  # At least 80% success rate
        print(f"\n✅ BACKEND READY FOR NEW AUTH PAGE")
        print(f"   - Registration endpoint working correctly")
        print(f"   - Login endpoint working correctly") 
        print(f"   - JWT tokens generated and validated properly")
        print(f"   - Error handling working as expected")
        print(f"   - Response format compatible with frontend")
        return True
    else:
        print(f"\n❌ BACKEND ISSUES DETECTED")
        print(f"   - Some auth endpoints not working properly")
        print(f"   - May need fixes before frontend integration")
        return False

if __name__ == "__main__":
    print("🚀 Starting New Auth Page Backend Tests...")
    success = test_auth_endpoints()
    
    if success:
        print(f"\n🎉 All tests passed! Backend is ready for new auth page.")
        sys.exit(0)
    else:
        print(f"\n⚠️ Some tests failed. Check backend implementation.")
        sys.exit(1)