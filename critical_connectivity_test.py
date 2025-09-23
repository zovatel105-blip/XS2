#!/usr/bin/env python3
"""
CRITICAL CONNECTIVITY TEST - VotaTok Network Connection Failed Diagnosis
Testing the specific "Network connection failed" issue reported by user
"""

import requests
import json
import sys
import time
from datetime import datetime

def get_backend_url():
    """Get backend URL from frontend/.env"""
    try:
        with open('/app/frontend/.env', 'r') as f:
            content = f.read()
            for line in content.split('\n'):
                if line.startswith('REACT_APP_BACKEND_URL='):
                    backend_url = line.split('=', 1)[1].strip()
                    return f"{backend_url}/api"
    except:
        pass
    return "http://localhost:8001/api"

def test_critical_connectivity():
    """Test critical connectivity issues reported by user"""
    print("🚨 CRITICAL CONNECTIVITY TEST - VotaTok Network Connection Failed")
    print("=" * 80)
    print("PROBLEMA REPORTADO: 'Network connection failed' en login Y registro")
    print("OBJETIVO: Identificar causa raíz del problema de conectividad")
    print("=" * 80)
    
    base_url = get_backend_url()
    print(f"Testing against: {base_url}")
    
    success_count = 0
    total_tests = 10
    
    # Test 1: Basic connectivity
    print("\n1️⃣ TESTING BASIC CONNECTIVITY...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Backend is responding: {data.get('name', 'N/A')}")
            success_count += 1
        else:
            print(f"   ❌ Backend not responding correctly")
    except Exception as e:
        print(f"   ❌ CRITICAL: Cannot connect to backend: {e}")
    
    # Test 2: Test GET /api/polls (should work without auth or return 401)
    print("\n2️⃣ TESTING GET /api/polls...")
    try:
        response = requests.get(f"{base_url}/polls", timeout=10)
        print(f"   Status Code: {response.status_code}")
        if response.status_code in [200, 401, 403]:
            print(f"   ✅ Polls endpoint accessible (auth required)")
            success_count += 1
        else:
            print(f"   ❌ Polls endpoint issue: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ CRITICAL: Cannot access polls endpoint: {e}")
    
    # Test 3: Test POST /api/auth/register with valid data
    print("\n3️⃣ TESTING POST /api/auth/register...")
    timestamp = int(time.time())
    register_data = {
        "username": f"test_user_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "password": "TestPass123!",
        "display_name": f"Test User {timestamp}"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=register_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Registration successful")
            print(f"   User: {data.get('user', {}).get('username', 'N/A')}")
            print(f"   Token: {data.get('access_token', 'N/A')[:20]}...")
            success_count += 1
            
            # Store for login test
            global test_token, test_user
            test_token = data.get('access_token')
            test_user = data.get('user')
            
        else:
            print(f"   ❌ Registration failed: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ CRITICAL: Registration request failed: {e}")
    
    # Test 4: Test POST /api/auth/login with demo credentials
    print("\n4️⃣ TESTING POST /api/auth/login WITH DEMO CREDENTIALS...")
    demo_credentials = [
        {"email": "demo@example.com", "password": "demo123"},
        {"email": "maria@example.com", "password": "password123"}
    ]
    
    login_success = False
    for creds in demo_credentials:
        try:
            response = requests.post(f"{base_url}/auth/login", json=creds, timeout=10)
            print(f"   Login {creds['email']}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Login successful with {creds['email']}")
                print(f"   User: {data.get('user', {}).get('username', 'N/A')}")
                print(f"   Token: {data.get('access_token', 'N/A')[:20]}...")
                success_count += 1
                login_success = True
                break
            elif response.status_code == 400:
                print(f"   ⚠️ Invalid credentials for {creds['email']} (endpoint works)")
            else:
                print(f"   ❌ Unexpected response: {response.text[:200]}")
        except Exception as e:
            print(f"   ❌ CRITICAL: Login request failed for {creds['email']}: {e}")
    
    if not login_success:
        print("   ❌ No demo credentials work")
    
    # Test 5: Test with newly registered user
    print("\n5️⃣ TESTING LOGIN WITH NEWLY REGISTERED USER...")
    if 'test_token' in globals():
        try:
            login_data = {
                "email": register_data["email"],
                "password": register_data["password"]
            }
            response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
            print(f"   Status Code: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ Login successful with newly registered user")
                success_count += 1
            else:
                print(f"   ❌ Login failed: {response.text[:200]}")
        except Exception as e:
            print(f"   ❌ Login with new user failed: {e}")
    else:
        print("   ⚠️ No registered user available for login test")
    
    # Test 6: Test MongoDB connectivity
    print("\n6️⃣ TESTING MONGODB CONNECTIVITY...")
    try:
        # Test with authenticated request to see if DB is working
        if 'test_token' in globals():
            headers = {"Authorization": f"Bearer {test_token}"}
            response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ MongoDB connectivity working (user data retrieved)")
                success_count += 1
            else:
                print(f"   ❌ MongoDB issue: {response.text[:200]}")
        else:
            print("   ⚠️ No token available for MongoDB test")
    except Exception as e:
        print(f"   ❌ MongoDB connectivity test failed: {e}")
    
    # Test 7: Test CORS configuration
    print("\n7️⃣ TESTING CORS CONFIGURATION...")
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{base_url}/auth/login", headers=headers, timeout=10)
        print(f"   OPTIONS Status Code: {response.status_code}")
        if response.status_code in [200, 204]:
            print(f"   ✅ CORS properly configured")
            success_count += 1
        else:
            print(f"   ❌ CORS issue: {response.status_code}")
    except Exception as e:
        print(f"   ❌ CORS test failed: {e}")
    
    # Test 8: Test with different user agents (mobile vs desktop)
    print("\n8️⃣ TESTING WITH DIFFERENT USER AGENTS...")
    user_agents = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    ]
    
    ua_success = 0
    for ua in user_agents:
        try:
            headers = {"User-Agent": ua}
            response = requests.get(f"{base_url}/", headers=headers, timeout=10)
            if response.status_code == 200:
                ua_success += 1
        except:
            pass
    
    if ua_success == len(user_agents):
        print(f"   ✅ All user agents work ({ua_success}/{len(user_agents)})")
        success_count += 1
    else:
        print(f"   ❌ User agent issues ({ua_success}/{len(user_agents)})")
    
    # Test 9: Test network timeouts and reliability
    print("\n9️⃣ TESTING NETWORK RELIABILITY...")
    try:
        response_times = []
        for i in range(3):
            start_time = time.time()
            response = requests.get(f"{base_url}/", timeout=10)
            end_time = time.time()
            response_times.append((end_time - start_time) * 1000)
        
        avg_time = sum(response_times) / len(response_times)
        print(f"   Average response time: {avg_time:.2f}ms")
        
        if avg_time < 5000:  # Less than 5 seconds
            print(f"   ✅ Network reliability good")
            success_count += 1
        else:
            print(f"   ❌ Network too slow")
    except Exception as e:
        print(f"   ❌ Network reliability test failed: {e}")
    
    # Test 10: Test specific freex@gmail.com registration
    print("\n🔟 TESTING SPECIFIC USER REGISTRATION (freex@gmail.com)...")
    try:
        freex_data = {
            "username": f"freex_{timestamp}",
            "email": "freex@gmail.com",
            "password": "FreexPass123!",
            "display_name": "Freex User"
        }
        
        response = requests.post(f"{base_url}/auth/register", json=freex_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ freex@gmail.com registration successful")
            success_count += 1
        elif response.status_code == 400:
            print(f"   ⚠️ freex@gmail.com already exists or validation error")
            success_count += 1  # Not a connectivity issue
        else:
            print(f"   ❌ freex@gmail.com registration failed: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ freex@gmail.com registration failed: {e}")
    
    # Final diagnosis
    print("\n" + "=" * 80)
    print("📊 CRITICAL CONNECTIVITY DIAGNOSIS RESULTS")
    print("=" * 80)
    print(f"Tests passed: {success_count}/{total_tests}")
    print(f"Success rate: {(success_count/total_tests)*100:.1f}%")
    
    if success_count >= 8:
        print("\n✅ DIAGNOSIS: CONNECTIVITY IS WORKING")
        print("   - Backend is accessible and responding")
        print("   - Registration and login endpoints functional")
        print("   - MongoDB connectivity working")
        print("   - CORS properly configured")
        print("   - Network reliability good")
        print("\n🔍 POSSIBLE CAUSES OF USER'S 'Network connection failed':")
        print("   1. Frontend configuration issue")
        print("   2. Browser cache or cookies")
        print("   3. Temporary network issue")
        print("   4. Frontend JavaScript error")
        print("   5. Specific browser or device issue")
        
    elif success_count >= 5:
        print("\n⚠️ DIAGNOSIS: PARTIAL CONNECTIVITY ISSUES")
        print("   - Some endpoints work, others don't")
        print("   - May be configuration or implementation issues")
        print("   - Requires further investigation")
        
    else:
        print("\n❌ DIAGNOSIS: CRITICAL CONNECTIVITY PROBLEMS")
        print("   - Multiple endpoints failing")
        print("   - Backend may be down or misconfigured")
        print("   - Database connectivity issues")
        print("   - Requires immediate attention")
    
    print("\n🎯 RECOMMENDATIONS:")
    if success_count >= 8:
        print("   1. Check frontend console for JavaScript errors")
        print("   2. Verify REACT_APP_BACKEND_URL in frontend")
        print("   3. Clear browser cache and cookies")
        print("   4. Test with different browsers")
        print("   5. Check network connectivity on user's device")
    else:
        print("   1. Check backend logs for errors")
        print("   2. Verify MongoDB is running")
        print("   3. Check environment variables")
        print("   4. Restart backend service")
        print("   5. Verify network configuration")
    
    return success_count >= 7

if __name__ == "__main__":
    test_critical_connectivity()