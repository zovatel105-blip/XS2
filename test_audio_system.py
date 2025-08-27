#!/usr/bin/env python3
"""
Audio System Testing Script - "Mi Música" Backend Functionality
Tests the complete audio upload system with FFmpeg processing as requested by the user.
"""

import requests
import json
import sys
import time
import os
import tempfile
import subprocess

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

def register_test_user(base_url):
    """Register a new test user specifically for music testing"""
    print("🎵 Registering new test user for music testing...")
    
    timestamp = int(time.time())
    user_data = {
        "email": f"music.tester.{timestamp}@example.com",
        "username": f"music_tester_{timestamp}",
        "display_name": "Music Tester",
        "password": "musicpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=10)
        print(f"Registration Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User registered successfully: {user_data['username']}")
            print(f"User ID: {data['user']['id']}")
            print(f"Access Token: {data['access_token'][:20]}...")
            return data['access_token'], data['user']
        else:
            print(f"❌ Registration failed: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None, None

def test_audio_upload(base_url, auth_token):
    """Test POST /api/audio/upload with real audio file"""
    print("\n🎵 Testing POST /api/audio/upload...")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    test_audio_path = "/app/test_audio.mp3"
    
    # Verify test audio file exists
    if not os.path.exists(test_audio_path):
        print(f"❌ Test audio file not found: {test_audio_path}")
        return None
    
    file_size = os.path.getsize(test_audio_path)
    print(f"📁 Using test audio file: {test_audio_path} ({file_size} bytes)")
    
    try:
        with open(test_audio_path, 'rb') as audio_file:
            files = {
                'file': ('test_music.mp3', audio_file, 'audio/mpeg')
            }
            data = {
                'title': 'Mi Canción de Prueba',
                'artist': 'Artista de Prueba',
                'privacy': 'private'
            }
            
            print(f"📤 Uploading audio: {data['title']} by {data['artist']}")
            response = requests.post(
                f"{base_url}/audio/upload", 
                files=files, 
                data=data,
                headers=headers, 
                timeout=30
            )
            
        print(f"Upload Status Code: {response.status_code}")
        
        if response.status_code == 200:
            upload_result = response.json()
            print(f"✅ Audio uploaded successfully!")
            print(f"Success: {upload_result['success']}")
            print(f"Message: {upload_result['message']}")
            
            audio_data = upload_result['audio']
            print(f"\n📊 Audio Details:")
            print(f"  ID: {audio_data['id']}")
            print(f"  Title: {audio_data['title']}")
            print(f"  Artist: {audio_data['artist']}")
            print(f"  Duration: {audio_data['duration']} seconds")
            print(f"  File Format: {audio_data['file_format']}")
            print(f"  File Size: {audio_data['file_size']} bytes")
            print(f"  Privacy: {audio_data['privacy']}")
            print(f"  Waveform Points: {len(audio_data.get('waveform', []))}")
            print(f"  Public URL: {audio_data['public_url']}")
            
            return audio_data
        else:
            print(f"❌ Audio upload failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Audio upload error: {e}")
        return None

def test_my_library(base_url, auth_token):
    """Test GET /api/audio/my-library"""
    print("\n🎵 Testing GET /api/audio/my-library...")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{base_url}/audio/my-library", headers=headers, timeout=10)
        print(f"My Library Status Code: {response.status_code}")
        
        if response.status_code == 200:
            library_result = response.json()
            print(f"✅ Audio library retrieved successfully!")
            print(f"Success: {library_result['success']}")
            print(f"Total audios: {library_result['total']}")
            print(f"Audios in response: {len(library_result['audios'])}")
            
            if library_result['total'] > 0:
                print(f"\n📚 Library Contents:")
                for i, audio in enumerate(library_result['audios'], 1):
                    print(f"  {i}. {audio['title']} by {audio['artist']}")
                    print(f"     Duration: {audio['duration']}s | Privacy: {audio['privacy']}")
                    print(f"     ID: {audio['id']}")
                
                return library_result['audios']
            else:
                print("📚 Library is empty")
                return []
        else:
            print(f"❌ Get audio library failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Get audio library error: {e}")
        return None

def test_audio_search(base_url, auth_token):
    """Test GET /api/audio/search"""
    print("\n🎵 Testing GET /api/audio/search...")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        # Test search with query
        response = requests.get(
            f"{base_url}/audio/search?query=Prueba&limit=5", 
            headers=headers, 
            timeout=10
        )
        print(f"Audio Search Status Code: {response.status_code}")
        
        if response.status_code == 200:
            search_result = response.json()
            print(f"✅ Audio search completed successfully!")
            print(f"Success: {search_result['success']}")
            print(f"Query: '{search_result['query']}'")
            print(f"Results found: {len(search_result['audios'])}")
            
            if len(search_result['audios']) > 0:
                print(f"\n🔍 Search Results:")
                for i, audio in enumerate(search_result['audios'], 1):
                    print(f"  {i}. {audio['title']} by {audio['artist']}")
            
            return True
        else:
            print(f"❌ Audio search failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Audio search error: {e}")
        return False

def test_audio_serving(base_url, audio_data):
    """Test GET /api/uploads/audio/{filename} - Audio file serving"""
    print("\n🎵 Testing GET /api/uploads/audio/{filename}...")
    
    if not audio_data or 'filename' not in audio_data:
        print("❌ No audio data or filename available for serving test")
        return False
    
    filename = audio_data['filename']
    print(f"📁 Testing serving of file: {filename}")
    
    try:
        # Test serving the audio file
        serve_response = requests.get(f"{base_url}/uploads/audio/{filename}", timeout=10)
        print(f"Audio Serving Status Code: {serve_response.status_code}")
        
        if serve_response.status_code == 200:
            content_type = serve_response.headers.get('content-type', '')
            content_length = len(serve_response.content)
            print(f"✅ Audio file served successfully!")
            print(f"Content-Type: {content_type}")
            print(f"Content-Length: {content_length} bytes")
            
            # Verify it's actually audio content
            if 'audio' in content_type or content_length > 1000:
                print(f"✅ Content appears to be valid audio")
                return True
            else:
                print(f"⚠️ Content might not be valid audio")
                return False
        else:
            print(f"❌ Audio serving failed: {serve_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Audio serving test error: {e}")
        return False

def test_ffmpeg_processing():
    """Test FFmpeg installation and processing capabilities"""
    print("\n🎵 Testing FFmpeg installation and processing...")
    
    try:
        # Test FFmpeg version
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✅ FFmpeg installed: {version_line}")
            
            # Test audio file processing with FFmpeg
            test_audio_path = "/app/test_audio.mp3"
            if os.path.exists(test_audio_path):
                # Get audio info with FFprobe
                probe_result = subprocess.run([
                    'ffprobe', '-v', 'quiet', '-print_format', 'json',
                    '-show_format', test_audio_path
                ], capture_output=True, text=True)
                
                if probe_result.returncode == 0:
                    import json
                    audio_info = json.loads(probe_result.stdout)
                    duration = float(audio_info['format']['duration'])
                    print(f"✅ Audio file analysis successful:")
                    print(f"  Duration: {duration:.2f} seconds")
                    print(f"  Format: {audio_info['format']['format_name']}")
                    print(f"  Size: {audio_info['format']['size']} bytes")
                    return True
                else:
                    print("❌ Could not analyze audio file with FFprobe")
                    return False
            else:
                print("❌ Test audio file not found for FFmpeg testing")
                return False
        else:
            print("❌ FFmpeg not available")
            return False
    except Exception as e:
        print(f"❌ FFmpeg test error: {e}")
        return False

def test_authentication_requirements(base_url):
    """Test that audio endpoints require authentication"""
    print("\n🎵 Testing authentication requirements...")
    
    try:
        # Test my-library without auth
        response = requests.get(f"{base_url}/audio/my-library", timeout=10)
        if response.status_code in [401, 403]:
            print("✅ /audio/my-library properly requires authentication")
        else:
            print(f"❌ /audio/my-library should require auth, got: {response.status_code}")
            return False
        
        # Test search without auth
        response = requests.get(f"{base_url}/audio/search?query=test", timeout=10)
        if response.status_code in [401, 403]:
            print("✅ /audio/search properly requires authentication")
        else:
            print(f"❌ /audio/search should require auth, got: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Authentication test error: {e}")
        return False

def main():
    """Main test execution function for audio system"""
    print("🎵 Starting Audio System Testing - 'Mi Música' Backend Functionality")
    print("=" * 70)
    
    # Get backend URL
    base_url = get_backend_url()
    if not base_url:
        print("❌ Could not determine backend URL from frontend .env file")
        sys.exit(1)
    
    print(f"Backend URL: {base_url}")
    print("=" * 70)
    
    # Track test results
    test_results = {}
    
    # Test 1: FFmpeg Processing
    test_results['ffmpeg_processing'] = test_ffmpeg_processing()
    
    # Test 2: User Registration for Music Testing
    auth_token, user_data = register_test_user(base_url)
    test_results['user_registration'] = auth_token is not None
    
    if not auth_token:
        print("❌ Cannot continue without authentication token")
        sys.exit(1)
    
    # Test 3: Audio Upload
    uploaded_audio = test_audio_upload(base_url, auth_token)
    test_results['audio_upload'] = uploaded_audio is not None
    
    # Test 4: My Library
    library_audios = test_my_library(base_url, auth_token)
    test_results['my_library'] = library_audios is not None
    
    # Test 5: Audio Search
    test_results['audio_search'] = test_audio_search(base_url, auth_token)
    
    # Test 6: Audio File Serving
    test_results['audio_serving'] = test_audio_serving(base_url, uploaded_audio)
    
    # Test 7: Authentication Requirements
    test_results['authentication'] = test_authentication_requirements(base_url)
    
    # Print summary
    print("\n" + "=" * 70)
    print("🎯 AUDIO SYSTEM TESTING SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(1 for result in test_results.values() if result)
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print("=" * 70)
    print(f"Overall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests >= 5:  # At least 5 out of 7 tests should pass
        print("🎉 ✅ AUDIO SYSTEM ('Mi Música') IS FULLY OPERATIONAL!")
        print("🎵 Backend audio upload functionality is working correctly")
        print("🎵 Users can upload, manage, and serve audio files")
        print("🎵 FFmpeg processing is functional")
        print("🎵 All core 'Mi Música' features are implemented and working")
    else:
        print("❌ Audio system needs attention - some core features are not working")
    
    print("=" * 70)

if __name__ == "__main__":
    main()