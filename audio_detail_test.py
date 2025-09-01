#!/usr/bin/env python3
"""
AudioDetailPage Backend Testing Script
Tests the backend endpoints required for the AudioDetailPage redesign.
"""

import requests
import json
import sys
import time
import random
from datetime import datetime, timedelta

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    base_url = line.split('=', 1)[1].strip()
                    return f"{base_url}/api"
        return None
    except Exception as e:
        print(f"Error reading frontend .env file: {e}")
        return None

# Global variables for test data
test_user = None
auth_token = None

def create_test_user(base_url):
    """Create a test user for audio testing"""
    print("Creating test user for audio testing...")
    
    timestamp = int(time.time())
    user_data = {
        "email": f"audio.tester.{timestamp}@example.com",
        "username": f"audio_tester_{timestamp}",
        "display_name": "Audio Tester",
        "password": "audiotest123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=10)
        print(f"User Registration Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test user created successfully: {user_data['username']}")
            global test_user, auth_token
            test_user = data['user']
            auth_token = data['access_token']
            return True
        else:
            print(f"❌ User registration failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return False

def test_audio_data_availability(base_url):
    """Test that backend has audio data available (music_trending_1, music_trending_2, etc.)"""
    print("\n=== Testing Audio Data Availability ===")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test 1: GET /api/music/library-with-previews
    print("Testing GET /api/music/library-with-previews...")
    try:
        response = requests.get(f"{base_url}/music/library-with-previews", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            music_list = data.get('music', [])
            print(f"✅ Music library endpoint working")
            print(f"📊 Total music tracks: {len(music_list)}")
            print(f"🎵 Has real previews: {data.get('has_real_previews', False)}")
            print(f"🔗 Source: {data.get('source', 'Unknown')}")
            
            # Check for specific trending music
            trending_found = []
            for music in music_list:
                music_id = music.get('id', '')
                title = music.get('title', '')
                artist = music.get('artist', '')
                preview_url = music.get('preview_url', '')
                
                if 'trending' in music_id.lower() or 'bad bunny' in artist.lower() or 'karol g' in artist.lower():
                    trending_found.append({
                        'id': music_id,
                        'title': title,
                        'artist': artist,
                        'has_preview': bool(preview_url)
                    })
            
            print(f"🎯 Trending music found: {len(trending_found)}")
            for music in trending_found[:5]:  # Show first 5
                print(f"   - {music['id']}: {music['title']} by {music['artist']} (Preview: {'✅' if music['has_preview'] else '❌'})")
            
            success_count += 1
        else:
            print(f"❌ Music library failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Music library error: {e}")
    
    # Test 2: Check specific music IDs
    print("\nTesting specific music IDs...")
    test_music_ids = ['music_trending_1', 'music_trending_2', 'music_trending_3', 'music_reggaeton_1']
    
    for music_id in test_music_ids:
        try:
            # We'll test this through the audio detail endpoint later
            print(f"📋 Will test {music_id} in audio detail endpoints")
        except Exception as e:
            print(f"❌ Error checking {music_id}: {e}")
    
    return success_count > 0

def test_audio_detail_endpoints(base_url):
    """Test the core AudioDetailPage endpoints"""
    print("\n=== Testing Audio Detail Endpoints ===")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test audio IDs to check
    test_audio_ids = [
        'music_trending_1',
        'music_trending_2', 
        'music_trending_3',
        'music_reggaeton_1',
        'itunes_1452601916'  # Example iTunes ID
    ]
    
    for audio_id in test_audio_ids:
        print(f"\n🎵 Testing audio ID: {audio_id}")
        
        # Test 1: GET /api/audio/{audio_id}
        print(f"Testing GET /api/audio/{audio_id}...")
        try:
            response = requests.get(f"{base_url}/audio/{audio_id}", headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Audio details retrieved successfully")
                print(f"   📋 Audio ID: {data.get('id', 'N/A')}")
                print(f"   🎵 Title: {data.get('title', 'N/A')}")
                print(f"   👤 Artist: {data.get('artist', 'N/A')}")
                print(f"   ⏱️ Duration: {data.get('duration', 'N/A')} seconds")
                print(f"   🔗 Preview URL: {'✅' if data.get('preview_url') else '❌'}")
                print(f"   🖼️ Cover: {'✅' if data.get('cover') else '❌'}")
                success_count += 1
            elif response.status_code == 404:
                print(f"   ⚠️ Audio not found (expected for some IDs)")
            else:
                print(f"   ❌ Audio details failed: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Audio details error: {e}")
        
        # Test 2: GET /api/audio/{audio_id}/posts
        print(f"Testing GET /api/audio/{audio_id}/posts...")
        try:
            response = requests.get(f"{base_url}/audio/{audio_id}/posts", headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Audio posts retrieved successfully")
                print(f"   📊 Total posts: {data.get('total', 0)}")
                print(f"   📋 Posts in response: {len(data.get('posts', []))}")
                print(f"   🔄 Has more: {data.get('has_more', False)}")
                print(f"   📄 Limit: {data.get('limit', 'N/A')}")
                print(f"   📍 Offset: {data.get('offset', 'N/A')}")
                
                # Check post structure if posts exist
                posts = data.get('posts', [])
                if posts:
                    sample_post = posts[0]
                    print(f"   📋 Sample post structure:")
                    print(f"      - ID: {sample_post.get('id', 'N/A')}")
                    print(f"      - Title: {sample_post.get('title', 'N/A')}")
                    print(f"      - Author: {sample_post.get('author', {}).get('username', 'N/A')}")
                    print(f"      - Created: {sample_post.get('created_at', 'N/A')}")
                    print(f"      - Votes: {sample_post.get('total_votes', 'N/A')}")
                
                success_count += 1
            elif response.status_code == 404:
                print(f"   ⚠️ Audio not found for posts (expected for some IDs)")
            else:
                print(f"   ❌ Audio posts failed: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Audio posts error: {e}")
    
    return success_count > 0

def test_audio_posts_pagination(base_url):
    """Test pagination for audio posts"""
    print("\n=== Testing Audio Posts Pagination ===")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test with a known audio ID
    audio_id = 'music_trending_1'
    
    # Test different pagination parameters
    pagination_tests = [
        {'limit': 5, 'offset': 0},
        {'limit': 3, 'offset': 2},
        {'limit': 10, 'offset': 0}
    ]
    
    for params in pagination_tests:
        print(f"\nTesting pagination with limit={params['limit']}, offset={params['offset']}")
        try:
            response = requests.get(
                f"{base_url}/audio/{audio_id}/posts",
                params=params,
                headers=headers,
                timeout=10
            )
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Pagination working")
                print(f"📊 Requested limit: {params['limit']}, Got: {len(data.get('posts', []))}")
                print(f"📍 Requested offset: {params['offset']}, Confirmed: {data.get('offset', 'N/A')}")
                print(f"🔄 Has more: {data.get('has_more', False)}")
                success_count += 1
            else:
                print(f"❌ Pagination failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Pagination error: {e}")
    
    return success_count > 0

def test_audio_favorites_system(base_url):
    """Test the audio favorites system"""
    print("\n=== Testing Audio Favorites System ===")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    test_audio_id = 'music_trending_1'
    
    # Test 1: GET /api/audio/favorites - Get user's favorites
    print("Testing GET /api/audio/favorites...")
    try:
        response = requests.get(f"{base_url}/audio/favorites", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Favorites retrieved successfully")
            print(f"📊 Total favorites: {len(data.get('favorites', []))}")
            success_count += 1
        else:
            print(f"❌ Get favorites failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Get favorites error: {e}")
    
    # Test 2: POST /api/audio/favorites - Add to favorites
    print(f"\nTesting POST /api/audio/favorites - Add {test_audio_id}...")
    try:
        favorite_data = {
            "audio_id": test_audio_id
        }
        response = requests.post(f"{base_url}/audio/favorites", json=favorite_data, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Audio added to favorites")
            print(f"📋 Favorite ID: {data.get('id', 'N/A')}")
            print(f"🎵 Audio ID: {data.get('audio_id', 'N/A')}")
            success_count += 1
        elif response.status_code == 400 and "already in favorites" in response.text.lower():
            print(f"✅ Audio already in favorites (expected)")
            success_count += 1
        else:
            print(f"❌ Add to favorites failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Add to favorites error: {e}")
    
    # Test 3: GET /api/audio/{audio_id}/favorite-status - Check if favorited
    print(f"\nTesting GET /api/audio/{test_audio_id}/favorite-status...")
    try:
        response = requests.get(f"{base_url}/audio/{test_audio_id}/favorite-status", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Favorite status retrieved")
            print(f"❤️ Is favorited: {data.get('is_favorited', False)}")
            success_count += 1
        else:
            print(f"❌ Favorite status failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Favorite status error: {e}")
    
    # Test 4: DELETE /api/audio/favorites/{audio_id} - Remove from favorites
    print(f"\nTesting DELETE /api/audio/favorites/{test_audio_id}...")
    try:
        response = requests.delete(f"{base_url}/audio/favorites/{test_audio_id}", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Audio removed from favorites")
            print(f"📋 Message: {data.get('message', 'N/A')}")
            success_count += 1
        elif response.status_code == 404:
            print(f"⚠️ Audio not in favorites (expected if not added)")
        else:
            print(f"❌ Remove from favorites failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Remove from favorites error: {e}")
    
    return success_count > 0

def test_music_search_endpoints(base_url):
    """Test music search functionality"""
    print("\n=== Testing Music Search Endpoints ===")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test 1: GET /api/music/search-realtime
    print("Testing GET /api/music/search-realtime...")
    search_queries = ['Bad Bunny', 'Karol G', 'reggaeton', 'Morad']
    
    for query in search_queries:
        print(f"\n🔍 Searching for: {query}")
        try:
            params = {'query': query, 'limit': 5}
            response = requests.get(f"{base_url}/music/search-realtime", params=params, headers=headers, timeout=15)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Search successful")
                print(f"   📊 Results found: {len(data.get('results', []))}")
                print(f"   🎯 Success: {data.get('success', False)}")
                
                results = data.get('results', [])
                if results:
                    sample = results[0]
                    print(f"   🎵 Sample result:")
                    print(f"      - Title: {sample.get('title', 'N/A')}")
                    print(f"      - Artist: {sample.get('artist', 'N/A')}")
                    print(f"      - Preview: {'✅' if sample.get('preview_url') else '❌'}")
                
                success_count += 1
            else:
                print(f"   ❌ Search failed: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Search error: {e}")
    
    # Test 2: GET /api/music/search (iTunes API)
    print(f"\nTesting GET /api/music/search (iTunes API)...")
    try:
        params = {'artist': 'Bad Bunny', 'track': 'Me Porto Bonito'}
        response = requests.get(f"{base_url}/music/search", params=params, headers=headers, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ iTunes search successful")
            print(f"🎯 Success: {data.get('success', False)}")
            
            if data.get('music'):
                music = data['music']
                print(f"🎵 Found track:")
                print(f"   - Title: {music.get('title', 'N/A')}")
                print(f"   - Artist: {music.get('artist', 'N/A')}")
                print(f"   - Preview: {'✅' if music.get('preview_url') else '❌'}")
            
            success_count += 1
        else:
            print(f"❌ iTunes search failed: {response.text}")
            
    except Exception as e:
        print(f"❌ iTunes search error: {e}")
    
    return success_count > 0

def test_authentication_requirements(base_url):
    """Test that endpoints properly require authentication"""
    print("\n=== Testing Authentication Requirements ===")
    
    success_count = 0
    
    # Endpoints that should require authentication
    protected_endpoints = [
        ("GET", "/music/library-with-previews"),
        ("GET", "/audio/music_trending_1"),
        ("GET", "/audio/music_trending_1/posts"),
        ("GET", "/audio/favorites"),
        ("POST", "/audio/favorites"),
        ("GET", "/music/search-realtime?query=test")
    ]
    
    print("Testing endpoints without authentication...")
    for method, endpoint in protected_endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{base_url}{endpoint}", timeout=10)
            elif method == "POST":
                response = requests.post(f"{base_url}{endpoint}", json={"test": "data"}, timeout=10)
            
            if response.status_code in [401, 403]:
                print(f"✅ {method} {endpoint}: Properly protected (Status: {response.status_code})")
                success_count += 1
            else:
                print(f"❌ {method} {endpoint}: Should be protected, got status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing {method} {endpoint}: {e}")
    
    return success_count >= len(protected_endpoints) * 0.8  # 80% should be protected

def test_error_handling(base_url):
    """Test error handling for various scenarios"""
    print("\n=== Testing Error Handling ===")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test 1: Non-existent audio ID
    print("Testing non-existent audio ID...")
    try:
        response = requests.get(f"{base_url}/audio/non_existent_audio_12345", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ Non-existent audio properly returns 404")
            success_count += 1
        else:
            print(f"❌ Should return 404 for non-existent audio, got: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing non-existent audio: {e}")
    
    # Test 2: Invalid search query
    print("\nTesting empty search query...")
    try:
        response = requests.get(f"{base_url}/music/search-realtime?query=", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if not data.get('success', True):
                print("✅ Empty query properly handled")
                success_count += 1
            else:
                print("❌ Empty query should return success: false")
        else:
            print(f"❌ Unexpected status for empty query: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing empty query: {e}")
    
    # Test 3: Invalid favorite data
    print("\nTesting invalid favorite data...")
    try:
        invalid_data = {"invalid_field": "test"}
        response = requests.post(f"{base_url}/audio/favorites", json=invalid_data, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [400, 422]:
            print("✅ Invalid favorite data properly rejected")
            success_count += 1
        else:
            print(f"❌ Should reject invalid data, got: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing invalid favorite data: {e}")
    
    return success_count > 0

def run_all_tests():
    """Run all AudioDetailPage backend tests"""
    print("🎵 AudioDetailPage Backend Testing Suite")
    print("=" * 50)
    
    # Get backend URL
    base_url = get_backend_url()
    if not base_url:
        print("❌ Could not determine backend URL from frontend/.env")
        return False
    
    print(f"🔗 Backend URL: {base_url}")
    
    # Create test user
    if not create_test_user(base_url):
        print("❌ Failed to create test user")
        return False
    
    # Run all tests
    test_results = []
    
    tests = [
        ("Audio Data Availability", test_audio_data_availability),
        ("Audio Detail Endpoints", test_audio_detail_endpoints),
        ("Audio Posts Pagination", test_audio_posts_pagination),
        ("Audio Favorites System", test_audio_favorites_system),
        ("Music Search Endpoints", test_music_search_endpoints),
        ("Authentication Requirements", test_authentication_requirements),
        ("Error Handling", test_error_handling)
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func(base_url)
            test_results.append((test_name, result))
            print(f"{'✅' if result else '❌'} {test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            test_results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*50}")
    print("🎯 TEST SUMMARY")
    print(f"{'='*50}")
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} - {test_name}")
    
    print(f"\n📊 Overall Results: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed >= total * 0.8:  # 80% pass rate
        print("🎉 AudioDetailPage backend is ready for the redesign!")
        return True
    else:
        print("⚠️ Some issues found that may affect AudioDetailPage functionality")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)