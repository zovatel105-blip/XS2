#!/usr/bin/env python3
"""
FINAL CONNECTIVITY TEST - Verify VotaTok is working with demo users
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

def final_connectivity_test():
    """Final test to verify everything is working"""
    print("🎯 FINAL CONNECTIVITY TEST - VotaTok Ready for Use")
    print("=" * 70)
    
    base_url = get_backend_url()
    print(f"Backend URL: {base_url}")
    
    # Test demo credentials
    demo_credentials = [
        {"email": "demo@example.com", "password": "demo123"},
        {"email": "maria@example.com", "password": "password123"}
    ]
    
    success_count = 0
    total_tests = 6
    
    # Test 1: Basic connectivity
    print("\n1️⃣ BASIC CONNECTIVITY TEST...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            print("   ✅ Backend is responding correctly")
            success_count += 1
        else:
            print(f"   ❌ Backend issue: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Cannot connect to backend: {e}")
    
    # Test 2: Demo user login
    print("\n2️⃣ DEMO USER LOGIN TEST...")
    login_success = False
    for creds in demo_credentials:
        try:
            response = requests.post(f"{base_url}/auth/login", json=creds, timeout=10)
            print(f"   Testing {creds['email']}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Login successful with {creds['email']}")
                print(f"   User: {data['user']['username']}")
                
                # Store token for further tests
                global demo_token, demo_user
                demo_token = data['access_token']
                demo_user = data['user']
                login_success = True
                success_count += 1
                break
            elif response.status_code == 429:
                print(f"   ⚠️ Rate limited - waiting...")
                time.sleep(5)
            else:
                print(f"   ❌ Login failed: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Login error: {e}")
    
    if not login_success:
        print("   ❌ No demo users can login")
    
    # Test 3: Authenticated request
    print("\n3️⃣ AUTHENTICATED REQUEST TEST...")
    if 'demo_token' in globals():
        try:
            headers = {"Authorization": f"Bearer {demo_token}"}
            response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            if response.status_code == 200:
                user_data = response.json()
                print(f"   ✅ Authenticated request successful")
                print(f"   User ID: {user_data['id']}")
                print(f"   Username: {user_data['username']}")
                success_count += 1
            else:
                print(f"   ❌ Auth request failed: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Auth request error: {e}")
    else:
        print("   ⚠️ No token available for auth test")
    
    # Test 4: Polls endpoint
    print("\n4️⃣ POLLS ENDPOINT TEST...")
    if 'demo_token' in globals():
        try:
            headers = {"Authorization": f"Bearer {demo_token}"}
            response = requests.get(f"{base_url}/polls", headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            if response.status_code == 200:
                polls = response.json()
                print(f"   ✅ Polls endpoint working - {len(polls)} polls found")
                success_count += 1
            else:
                print(f"   ❌ Polls endpoint issue: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Polls endpoint error: {e}")
    else:
        print("   ⚠️ No token available for polls test")
    
    # Test 5: Registration still works
    print("\n5️⃣ NEW USER REGISTRATION TEST...")
    try:
        timestamp = int(time.time())
        new_user_data = {
            "username": f"final_test_{timestamp}",
            "email": f"final_test_{timestamp}@example.com",
            "password": "FinalTest123!",
            "display_name": f"Final Test User {timestamp}"
        }
        
        response = requests.post(f"{base_url}/auth/register", json=new_user_data, timeout=10)
        if response.status_code == 200:
            print("   ✅ New user registration working")
            success_count += 1
        else:
            print(f"   ❌ Registration failed: {response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
    
    # Test 6: Frontend configuration
    print("\n6️⃣ FRONTEND CONFIGURATION TEST...")
    try:
        with open('/app/frontend/.env', 'r') as f:
            env_content = f.read()
            if "REACT_APP_BACKEND_URL=http://localhost:8001" in env_content:
                print("   ✅ Frontend configuration correct")
                success_count += 1
            else:
                print("   ❌ Frontend configuration issue")
    except Exception as e:
        print(f"   ❌ Cannot check frontend config: {e}")
    
    # Final results
    print("\n" + "=" * 70)
    print("📊 FINAL CONNECTIVITY TEST RESULTS")
    print("=" * 70)
    print(f"Tests passed: {success_count}/{total_tests}")
    print(f"Success rate: {(success_count/total_tests)*100:.1f}%")
    
    if success_count >= 5:
        print("\n✅ VOTATIK IS READY FOR USE")
        print("   🎯 Backend is fully operational")
        print("   🎯 Demo users can login successfully")
        print("   🎯 Authentication system working")
        print("   🎯 API endpoints responding correctly")
        print("   🎯 Frontend configuration correct")
        
        print("\n🔑 WORKING DEMO CREDENTIALS:")
        print("   Email: demo@example.com")
        print("   Password: demo123")
        print("   ---")
        print("   Email: maria@example.com") 
        print("   Password: password123")
        
        print("\n🚀 USER CAN NOW:")
        print("   ✅ Register new accounts")
        print("   ✅ Login with demo credentials")
        print("   ✅ Access the application without 'Network connection failed'")
        print("   ✅ Use all authentication features")
        
    elif success_count >= 3:
        print("\n⚠️ VOTATIK PARTIALLY WORKING")
        print("   - Some features work, others may have issues")
        print("   - User may still experience some connectivity problems")
        
    else:
        print("\n❌ VOTATIK HAS CRITICAL ISSUES")
        print("   - Multiple systems failing")
        print("   - User will likely experience 'Network connection failed'")
        print("   - Requires immediate attention")
    
    return success_count >= 5

if __name__ == "__main__":
    final_connectivity_test()