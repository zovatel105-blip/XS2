#!/usr/bin/env python3
"""
Test script for Feed Menu endpoints
"""
import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001/api"
HEADERS = {"Content-Type": "application/json"}

def test_auth_and_get_token():
    """Test authentication and get a valid token"""
    print("🔐 Testing authentication...")
    
    # Try login with demo credentials
    login_data = {
        "email": "demo@example.com",
        "password": "demo123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user", {})
            print(f"✅ Login successful - User ID: {user.get('id', 'N/A')}")
            return token, user.get('id')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None, None

def test_feed_menu_endpoints(token, user_id):
    """Test all feed menu endpoints"""
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    print("\n🧪 Testing Feed Menu Endpoints...")
    
    # Test data
    test_poll_id = "test-poll-123"
    test_author_id = "test-author-456"
    
    # 1. Test marking poll as not interested
    print("\n1️⃣ Testing POST /api/feed/not-interested")
    try:
        response = requests.post(
            f"{BASE_URL}/feed/not-interested",
            params={"poll_id": test_poll_id},
            headers=auth_headers
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        if response.status_code in [200, 404]:  # 404 is ok for non-existent poll
            print("   ✅ Endpoint working")
        else:
            print("   ❌ Endpoint failed")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 2. Test hiding user content
    print("\n2️⃣ Testing POST /api/feed/hide-user")
    try:
        response = requests.post(
            f"{BASE_URL}/feed/hide-user",
            params={"author_id": test_author_id},
            headers=auth_headers
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        if response.status_code in [200, 404]:  # 404 is ok for non-existent user
            print("   ✅ Endpoint working")
        else:
            print("   ❌ Endpoint failed")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 3. Test toggling notifications
    print("\n3️⃣ Testing POST /api/feed/toggle-notifications")
    try:
        response = requests.post(
            f"{BASE_URL}/feed/toggle-notifications",
            params={"author_id": test_author_id},
            headers=auth_headers
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        if response.status_code in [200, 404]:  # 404 is ok for non-existent user
            print("   ✅ Endpoint working")
        else:
            print("   ❌ Endpoint failed")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 4. Test reporting content
    print("\n4️⃣ Testing POST /api/feed/report")
    try:
        report_data = {
            "poll_id": test_poll_id,
            "category": "spam",
            "comment": "This is a test report"
        }
        response = requests.post(
            f"{BASE_URL}/feed/report",
            json=report_data,
            headers=auth_headers
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        if response.status_code in [200, 404]:  # 404 is ok for non-existent poll
            print("   ✅ Endpoint working")
        else:
            print("   ❌ Endpoint failed")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 5. Test getting user preferences
    print("\n5️⃣ Testing GET /api/feed/user-preferences")
    try:
        response = requests.get(
            f"{BASE_URL}/feed/user-preferences",
            headers=auth_headers
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        if response.status_code == 200:
            print("   ✅ Endpoint working")
        else:
            print("   ❌ Endpoint failed")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

def test_backend_status():
    """Test if backend is running"""
    print("🔍 Checking backend status...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print(f"❌ Backend returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {str(e)}")
        return False

def main():
    print("🚀 Feed Menu Endpoints Test Suite")
    print("=" * 50)
    
    # Test backend status
    if not test_backend_status():
        print("\n❌ Cannot continue without backend connection")
        sys.exit(1)
    
    # Get authentication token
    token, user_id = test_auth_and_get_token()
    if not token:
        print("\n❌ Cannot continue without authentication")
        sys.exit(1)
    
    # Test feed menu endpoints
    test_feed_menu_endpoints(token, user_id)
    
    print("\n" + "=" * 50)
    print("🏁 Feed Menu Test Suite Complete")

if __name__ == "__main__":
    main()