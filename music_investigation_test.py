#!/usr/bin/env python3
"""
URGENT MUSIC INVESTIGATION - Feed Music Not Playing
Specific test to investigate why music is not playing in the feed
"""

import requests
import json
import sys
import time

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

def register_and_login(base_url):
    """Register a test user and get auth token"""
    timestamp = int(time.time())
    
    user_data = {
        "email": f"music.test.{timestamp}@example.com",
        "username": f"music_test_{timestamp}",
        "display_name": "Music Test User",
        "password": "musictest123"
    }
    
    # Register
    response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=10)
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.text}")
        return None
    
    data = response.json()
    return data['access_token']

def test_music_investigation():
    """URGENT INVESTIGATION: Test music system in feed - why music is not playing"""
    print("🎵 URGENT MUSIC INVESTIGATION - FEED MUSIC NOT PLAYING")
    print("=" * 80)
    
    base_url = get_backend_url()
    if not base_url:
        print("❌ Could not determine backend URL")
        return False
    
    print(f"🌐 Testing backend at: {base_url}")
    
    # Get auth token
    auth_token = register_and_login(base_url)
    if not auth_token:
        print("❌ Could not authenticate")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    total_tests = 0
    
    print("\n🔍 INVESTIGATING: User reports music not playing in feed")
    print("📋 TESTING PLAN:")
    print("1. ✅ Check polls in database and their music_id")
    print("2. ✅ Test GET /api/polls for music structure")
    print("3. ✅ Verify if polls have preview_url in music field")
    print("4. ✅ Test /api/music/library-with-previews for real URLs")
    print("5. ✅ Test /api/music/search iTunes API functionality")
    print("-" * 80)
    
    # Test 1: Check what polls exist and their music structure
    print("\n🔍 TEST 1: Checking polls in database and music_id...")
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/polls", headers=headers, timeout=15)
        print(f"GET /api/polls Status Code: {response.status_code}")
        
        if response.status_code == 200:
            polls_data = response.json()
            polls = polls_data.get('polls', []) if isinstance(polls_data, dict) else polls_data
            print(f"✅ Found {len(polls)} polls in database")
            
            # Analyze music data in polls
            polls_with_music = 0
            polls_with_preview_url = 0
            
            for i, poll in enumerate(polls[:5]):  # Check first 5 polls
                print(f"\n📊 Poll {i+1}: '{poll.get('title', 'No title')[:50]}...'")
                print(f"   Author: {poll.get('author', {}).get('username', 'Unknown')}")
                
                music = poll.get('music')
                if music:
                    polls_with_music += 1
                    print(f"   🎵 Music ID: {music.get('id', 'No ID')}")
                    print(f"   🎵 Title: {music.get('title', 'No title')}")
                    print(f"   🎵 Artist: {music.get('artist', 'No artist')}")
                    
                    preview_url = music.get('preview_url')
                    if preview_url:
                        polls_with_preview_url += 1
                        print(f"   ✅ Preview URL: {preview_url[:80]}...")
                    else:
                        print(f"   ❌ Preview URL: None")
                else:
                    print(f"   ❌ No music data")
            
            print(f"\n📈 MUSIC ANALYSIS RESULTS:")
            print(f"   Total polls: {len(polls)}")
            print(f"   Polls with music: {polls_with_music}")
            print(f"   Polls with preview_url: {polls_with_preview_url}")
            
            if polls_with_preview_url == 0:
                print(f"   🚨 CRITICAL ISSUE: NO POLLS HAVE PREVIEW_URL!")
            
            success_count += 1
        else:
            print(f"❌ Failed to get polls: {response.text}")
            
    except Exception as e:
        print(f"❌ Error checking polls: {e}")
    
    # Test 2: Test music library with previews endpoint
    print(f"\n🔍 TEST 2: Testing /api/music/library-with-previews...")
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/music/library-with-previews?limit=10", 
                              headers=headers, timeout=20)
        print(f"GET /api/music/library-with-previews Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            music_list = data.get('music', [])
            print(f"✅ Retrieved {len(music_list)} tracks with previews")
            print(f"   Has real previews: {data.get('has_real_previews', False)}")
            print(f"   Source: {data.get('source', 'Unknown')}")
            
            real_previews_count = 0
            for i, track in enumerate(music_list[:3]):  # Check first 3 tracks
                print(f"\n🎵 Track {i+1}: {track.get('title', 'No title')} - {track.get('artist', 'No artist')}")
                preview_url = track.get('preview_url')
                if preview_url and preview_url.startswith('https://'):
                    real_previews_count += 1
                    print(f"   ✅ Real Preview URL: {preview_url[:80]}...")
                    print(f"   🎵 Source: {track.get('source', 'Unknown')}")
                else:
                    print(f"   ❌ No valid preview URL")
            
            print(f"\n📈 LIBRARY ANALYSIS:")
            print(f"   Tracks with real preview URLs: {real_previews_count}/{len(music_list)}")
            
            if real_previews_count > 0:
                print(f"   ✅ iTunes API is working and providing real previews!")
                success_count += 1
            else:
                print(f"   🚨 ISSUE: No real preview URLs found in library")
                
        else:
            print(f"❌ Failed to get music library: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing music library: {e}")
    
    # Test 3: Test iTunes search API directly
    print(f"\n🔍 TEST 3: Testing iTunes Search API directly...")
    total_tests += 1
    try:
        # Test with Bad Bunny - Me Porto Bonito (known to have preview)
        response = requests.get(f"{base_url}/music/search?artist=Bad Bunny&track=Me Porto Bonito", 
                              headers=headers, timeout=20)
        print(f"GET /api/music/search Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ iTunes search successful: {data.get('success', False)}")
            
            if data.get('success') and data.get('music'):
                music = data['music']
                print(f"   🎵 Found: {music.get('title')} - {music.get('artist')}")
                print(f"   🎵 Preview URL: {music.get('preview_url', 'None')[:80]}...")
                print(f"   🎵 Source: {music.get('source', 'Unknown')}")
                
                if music.get('preview_url'):
                    print(f"   ✅ iTunes API is providing real preview URLs!")
                    success_count += 1
                else:
                    print(f"   ❌ No preview URL in iTunes response")
            else:
                print(f"   ❌ iTunes search failed or no results")
                print(f"   Message: {data.get('message', 'No message')}")
                
        else:
            print(f"❌ iTunes search failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing iTunes search: {e}")
    
    # Test 4: Create a poll with music and verify structure
    print(f"\n🔍 TEST 4: Creating poll with music to test integration...")
    total_tests += 1
    try:
        poll_data = {
            "title": "¿Cuál es tu canción favorita para el feed?",
            "options": [
                {"text": "Bad Bunny - Me Porto Bonito", "media_url": "", "media_type": "none"},
                {"text": "Karol G - TQG", "media_url": "", "media_type": "none"},
                {"text": "Morad - LA BOTELLA", "media_url": "", "media_type": "none"}
            ],
            "music_id": "music_reggaeton_1",  # Bad Bunny - Me Porto Bonito
            "category": "music",
            "expires_at": None
        }
        
        response = requests.post(f"{base_url}/polls", json=poll_data, headers=headers, timeout=15)
        print(f"POST /api/polls Status Code: {response.status_code}")
        
        if response.status_code == 200:
            created_poll = response.json()
            print(f"✅ Poll created successfully with music")
            print(f"   Poll ID: {created_poll.get('id')}")
            
            # Check if music data is included
            music = created_poll.get('music')
            if music:
                print(f"   🎵 Music included: {music.get('title')} - {music.get('artist')}")
                print(f"   🎵 Preview URL: {music.get('preview_url', 'None')}")
                
                if music.get('preview_url'):
                    print(f"   ✅ Poll has preview URL - should play in feed!")
                    success_count += 1
                else:
                    print(f"   🚨 CRITICAL: Poll created but NO preview_url!")
            else:
                print(f"   🚨 CRITICAL: Poll created but NO music data!")
                
        else:
            print(f"❌ Failed to create poll with music: {response.text}")
            
    except Exception as e:
        print(f"❌ Error creating poll with music: {e}")
    
    # Test 5: Check static music library data
    print(f"\n🔍 TEST 5: Checking static music library data...")
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/music/library", headers=headers, timeout=15)
        print(f"GET /api/music/library Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            music_list = data.get('music', [])
            print(f"✅ Retrieved {len(music_list)} tracks from static library")
            
            static_previews_count = 0
            for i, track in enumerate(music_list[:5]):  # Check first 5 tracks
                print(f"\n🎵 Static Track {i+1}: {track.get('title', 'No title')} - {track.get('artist', 'No artist')}")
                preview_url = track.get('preview_url')
                if preview_url and preview_url.startswith('https://'):
                    static_previews_count += 1
                    print(f"   ✅ Has Preview URL: {preview_url[:80]}...")
                else:
                    print(f"   ❌ No preview URL in static library")
            
            print(f"\n📈 STATIC LIBRARY ANALYSIS:")
            print(f"   Tracks with preview URLs: {static_previews_count}/{len(music_list)}")
            
            if static_previews_count > 0:
                print(f"   ✅ Some static tracks have preview URLs!")
                success_count += 1
            else:
                print(f"   🚨 ISSUE: Static library has NO preview URLs!")
                
        else:
            print(f"❌ Failed to get static music library: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing static music library: {e}")
    
    # FINAL ANALYSIS AND RECOMMENDATIONS
    print(f"\n" + "="*80)
    print(f"🎵 MUSIC INVESTIGATION RESULTS")
    print(f"="*80)
    print(f"Tests passed: {success_count}/{total_tests}")
    
    if success_count >= 3:
        print(f"✅ MUSIC SYSTEM STATUS: PARTIALLY WORKING")
        print(f"\n🔍 FINDINGS:")
        print(f"   • iTunes API endpoints are functional")
        print(f"   • Real preview URLs can be obtained")
        print(f"   • Issue likely in poll creation or frontend integration")
        
        print(f"\n💡 RECOMMENDATIONS:")
        print(f"   1. Check if polls are being created with music_id")
        print(f"   2. Verify get_music_info() returns preview_url for static library")
        print(f"   3. Ensure frontend is checking poll.music.preview_url correctly")
        print(f"   4. Consider updating static music library with real preview URLs")
        
    else:
        print(f"❌ MUSIC SYSTEM STATUS: MAJOR ISSUES DETECTED")
        print(f"\n🚨 CRITICAL ISSUES:")
        print(f"   • iTunes API may not be working properly")
        print(f"   • Static music library lacks preview URLs")
        print(f"   • Poll creation not including music data")
        
        print(f"\n🔧 URGENT FIXES NEEDED:")
        print(f"   1. Fix iTunes API integration")
        print(f"   2. Update static music library with preview URLs")
        print(f"   3. Ensure poll creation includes music data")
    
    return success_count >= 3

if __name__ == "__main__":
    success = test_music_investigation()
    sys.exit(0 if success else 1)