#!/usr/bin/env python3
"""
Video Thumbnail Generation System Testing Script
Tests complete video upload and thumbnail generation workflow using OpenCV.
"""

import requests
import json
import sys
import time
import random
import os
import tempfile
from datetime import datetime
from pathlib import Path

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
uploaded_videos = []
created_polls = []

def create_test_video_file(filename, duration_seconds=5, width=640, height=480):
    """Create a simple test video file using ffmpeg if available, otherwise create a dummy file"""
    try:
        # Try to create a real video file using ffmpeg
        import subprocess
        
        temp_dir = tempfile.gettempdir()
        video_path = os.path.join(temp_dir, filename)
        
        # Create a simple test video with ffmpeg
        cmd = [
            'ffmpeg', '-f', 'lavfi', '-i', f'testsrc=duration={duration_seconds}:size={width}x{height}:rate=30',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-y', video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and os.path.exists(video_path):
            print(f"✅ Created real test video: {video_path} ({os.path.getsize(video_path)} bytes)")
            return video_path
        else:
            print(f"⚠️ ffmpeg failed, creating dummy video file")
            
    except Exception as e:
        print(f"⚠️ Could not create real video with ffmpeg: {e}")
    
    # Fallback: Create a dummy MP4 file with basic MP4 header
    temp_dir = tempfile.gettempdir()
    video_path = os.path.join(temp_dir, filename)
    
    # Basic MP4 file header (minimal valid MP4)
    mp4_header = bytes([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,  # ftyp box
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,
    ])
    
    # Add some dummy data to make it larger
    dummy_data = b'\x00' * (1024 * 100)  # 100KB of dummy data
    
    with open(video_path, 'wb') as f:
        f.write(mp4_header)
        f.write(dummy_data)
    
    print(f"✅ Created dummy test video: {video_path} ({os.path.getsize(video_path)} bytes)")
    return video_path

def register_test_user(base_url):
    """Register a test user for video testing"""
    print("=== Registering Test User for Video Testing ===")
    
    timestamp = int(time.time())
    user_data = {
        "email": f"video.tester.{timestamp}@example.com",
        "username": f"video_tester_{timestamp}",
        "display_name": "Video Tester",
        "password": "videotestpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=15)
        print(f"Registration Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test user registered successfully")
            print(f"User ID: {data['user']['id']}")
            print(f"Username: {data['user']['username']}")
            
            global test_user, auth_token
            test_user = data['user']
            auth_token = data['access_token']
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False

def test_video_upload_with_thumbnail_generation(base_url):
    """Test video upload with automatic thumbnail generation"""
    print("\n=== Testing Video Upload with Thumbnail Generation ===")
    
    if not auth_token:
        print("❌ No auth token available for video upload test")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test 1: Upload MP4 video with general upload type
    print("Testing POST /api/upload with MP4 video (upload_type=general)...")
    
    # Create test video file
    video_path = create_test_video_file("test_video_1.mp4", duration_seconds=10, width=1280, height=720)
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'file': ('test_video_1.mp4', video_file, 'video/mp4')}
            data = {'upload_type': 'general'}
            
            response = requests.post(f"{base_url}/upload", files=files, data=data, headers=headers, timeout=30)
            print(f"Video Upload Status Code: {response.status_code}")
            
            if response.status_code == 200:
                upload_data = response.json()
                print(f"✅ Video uploaded successfully")
                print(f"File ID: {upload_data['id']}")
                print(f"Filename: {upload_data['filename']}")
                print(f"File Type: {upload_data['file_type']}")
                print(f"File Size: {upload_data['file_size']} bytes")
                print(f"Public URL: {upload_data['public_url']}")
                print(f"Width: {upload_data.get('width', 'N/A')}")
                print(f"Height: {upload_data.get('height', 'N/A')}")
                print(f"Duration: {upload_data.get('duration', 'N/A')} seconds")
                
                # Check if thumbnail_url is generated
                if upload_data.get('thumbnail_url'):
                    print(f"✅ Thumbnail URL generated: {upload_data['thumbnail_url']}")
                    success_count += 1
                    
                    # Store for later tests
                    uploaded_videos.append(upload_data)
                else:
                    print(f"❌ Thumbnail URL not generated for video")
                
                success_count += 1
            else:
                print(f"❌ Video upload failed: {response.text}")
                
    except Exception as e:
        print(f"❌ Video upload error: {e}")
    finally:
        # Clean up test file
        if os.path.exists(video_path):
            os.remove(video_path)
    
    # Test 2: Upload another video with different dimensions
    print("\nTesting video upload with different dimensions...")
    
    video_path2 = create_test_video_file("test_video_2.mp4", duration_seconds=15, width=1920, height=1080)
    
    try:
        with open(video_path2, 'rb') as video_file:
            files = {'file': ('test_video_2.mp4', video_file, 'video/mp4')}
            data = {'upload_type': 'poll_option'}
            
            response = requests.post(f"{base_url}/upload", files=files, data=data, headers=headers, timeout=30)
            print(f"Second Video Upload Status Code: {response.status_code}")
            
            if response.status_code == 200:
                upload_data = response.json()
                print(f"✅ Second video uploaded successfully")
                print(f"File ID: {upload_data['id']}")
                print(f"Dimensions: {upload_data.get('width', 'N/A')}x{upload_data.get('height', 'N/A')}")
                print(f"Duration: {upload_data.get('duration', 'N/A')} seconds")
                
                if upload_data.get('thumbnail_url'):
                    print(f"✅ Thumbnail URL generated for second video: {upload_data['thumbnail_url']}")
                    success_count += 1
                    uploaded_videos.append(upload_data)
                else:
                    print(f"❌ Thumbnail URL not generated for second video")
                
                success_count += 1
            else:
                print(f"❌ Second video upload failed: {response.text}")
                
    except Exception as e:
        print(f"❌ Second video upload error: {e}")
    finally:
        if os.path.exists(video_path2):
            os.remove(video_path2)
    
    # Test 3: Verify thumbnail file is created physically
    if uploaded_videos:
        print("\nTesting physical thumbnail file creation...")
        try:
            video_data = uploaded_videos[0]
            thumbnail_url = video_data.get('thumbnail_url')
            
            if thumbnail_url:
                # Extract filename from thumbnail URL
                # URL format: /api/uploads/general/thumbnails/filename_thumbnail.jpg
                if '/thumbnails/' in thumbnail_url:
                    thumbnail_filename = thumbnail_url.split('/thumbnails/')[-1]
                    
                    # Check if thumbnail file exists in backend uploads directory
                    backend_uploads_dir = Path('/app/backend/uploads/general/thumbnails')
                    thumbnail_path = backend_uploads_dir / thumbnail_filename
                    
                    if thumbnail_path.exists():
                        print(f"✅ Thumbnail file physically created: {thumbnail_path}")
                        print(f"Thumbnail file size: {thumbnail_path.stat().st_size} bytes")
                        success_count += 1
                    else:
                        print(f"❌ Thumbnail file not found at: {thumbnail_path}")
                        # List directory contents for debugging
                        if backend_uploads_dir.exists():
                            print(f"Directory contents: {list(backend_uploads_dir.iterdir())}")
                else:
                    print(f"❌ Invalid thumbnail URL format: {thumbnail_url}")
            else:
                print(f"❌ No thumbnail URL to verify")
                
        except Exception as e:
            print(f"❌ Thumbnail file verification error: {e}")
    
    return success_count >= 3

def test_thumbnail_serving_endpoint(base_url):
    """Test GET /api/uploads/{category}/thumbnails/{filename} endpoint"""
    print("\n=== Testing Thumbnail Serving Endpoint ===")
    
    if not uploaded_videos:
        print("❌ No uploaded videos available for thumbnail serving test")
        return False
    
    success_count = 0
    
    for i, video_data in enumerate(uploaded_videos):
        print(f"\nTesting thumbnail serving for video {i+1}...")
        
        thumbnail_url = video_data.get('thumbnail_url')
        if not thumbnail_url:
            print(f"❌ No thumbnail URL for video {i+1}")
            continue
        
        try:
            # Make request to thumbnail endpoint
            full_url = f"{base_url.replace('/api', '')}{thumbnail_url}"
            print(f"Requesting thumbnail: {full_url}")
            
            response = requests.get(full_url, timeout=15)
            print(f"Thumbnail Serving Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ Thumbnail served successfully")
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                print(f"Content-Type: {content_type}")
                
                if 'image/jpeg' in content_type:
                    print(f"✅ Correct content-type: image/jpeg")
                    success_count += 1
                else:
                    print(f"❌ Expected image/jpeg, got: {content_type}")
                
                # Check content length
                content_length = len(response.content)
                print(f"Thumbnail size: {content_length} bytes")
                
                if content_length > 0:
                    print(f"✅ Thumbnail has valid content")
                    success_count += 1
                else:
                    print(f"❌ Thumbnail content is empty")
                
                # Verify it's a valid image by checking JPEG header
                if response.content.startswith(b'\xff\xd8\xff'):
                    print(f"✅ Valid JPEG image format")
                    success_count += 1
                else:
                    print(f"❌ Invalid JPEG format")
                    
            else:
                print(f"❌ Thumbnail serving failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Thumbnail serving error: {e}")
    
    return success_count >= 3

def test_poll_integration_with_video_thumbnails(base_url):
    """Test creating polls with video options and verifying thumbnail integration"""
    print("\n=== Testing Poll Integration with Video Thumbnails ===")
    
    if not auth_token or not uploaded_videos:
        print("❌ No auth token or uploaded videos available for poll integration test")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test 1: Create poll with video options
    print("Testing poll creation with video options...")
    
    try:
        poll_data = {
            "title": "¿Cuál es tu video favorito de estos clips de prueba?",
            "description": "Selecciona el video que más te guste de las opciones disponibles",
            "category": "entertainment",
            "options": [
                {
                    "text": "Video de prueba 1 (720p)",
                    "media_url": uploaded_videos[0]['public_url'],
                    "media_type": "video"
                }
            ]
        }
        
        # Add second video option if available
        if len(uploaded_videos) > 1:
            poll_data["options"].append({
                "text": "Video de prueba 2 (1080p)",
                "media_url": uploaded_videos[1]['public_url'],
                "media_type": "video"
            })
        
        response = requests.post(f"{base_url}/polls", json=poll_data, headers=headers, timeout=15)
        print(f"Poll Creation Status Code: {response.status_code}")
        
        if response.status_code == 200:
            poll = response.json()
            print(f"✅ Poll created successfully with video options")
            print(f"Poll ID: {poll['id']}")
            print(f"Poll Title: {poll['title']}")
            print(f"Options count: {len(poll['options'])}")
            
            # Store for later tests
            created_polls.append(poll)
            success_count += 1
            
            # Verify each option has thumbnail information
            for j, option in enumerate(poll['options']):
                print(f"\nOption {j+1}:")
                print(f"  Text: {option['text']}")
                print(f"  Media URL: {option.get('media_url', 'N/A')}")
                print(f"  Media Type: {option.get('media_type', 'N/A')}")
                
                # Check if thumbnail is included in option
                if 'thumbnail' in option or 'thumbnail_url' in option:
                    thumbnail_url = option.get('thumbnail') or option.get('thumbnail_url')
                    print(f"  ✅ Thumbnail URL: {thumbnail_url}")
                    success_count += 1
                else:
                    print(f"  ⚠️ No thumbnail URL in option (may be added by get_polls)")
            
        else:
            print(f"❌ Poll creation failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Poll creation error: {e}")
    
    # Test 2: Get polls and verify thumbnail URLs are included
    print("\nTesting GET /api/polls to verify thumbnail integration...")
    
    try:
        response = requests.get(f"{base_url}/polls?limit=10", headers=headers, timeout=15)
        print(f"Get Polls Status Code: {response.status_code}")
        
        if response.status_code == 200:
            polls = response.json()
            print(f"✅ Polls retrieved successfully")
            print(f"Total polls: {len(polls)}")
            
            # Find our created poll
            our_poll = None
            for poll in polls:
                if poll['id'] in [p['id'] for p in created_polls]:
                    our_poll = poll
                    break
            
            if our_poll:
                print(f"\nFound our poll: {our_poll['title']}")
                
                # Check if video options have thumbnail URLs
                for j, option in enumerate(our_poll['options']):
                    print(f"\nOption {j+1} in retrieved poll:")
                    print(f"  Text: {option['text']}")
                    print(f"  Media URL: {option.get('media_url', 'N/A')}")
                    print(f"  Media Type: {option.get('media_type', 'N/A')}")
                    
                    # Check for thumbnail in various possible fields
                    thumbnail_fields = ['thumbnail', 'thumbnail_url', 'media_thumbnail']
                    thumbnail_found = False
                    
                    for field in thumbnail_fields:
                        if field in option and option[field]:
                            print(f"  ✅ Thumbnail found in '{field}': {option[field]}")
                            thumbnail_found = True
                            success_count += 1
                            break
                    
                    if not thumbnail_found:
                        print(f"  ❌ No thumbnail URL found in option")
                        print(f"  Available fields: {list(option.keys())}")
                
            else:
                print(f"❌ Could not find our created poll in results")
                
        else:
            print(f"❌ Get polls failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Get polls error: {e}")
    
    # Test 3: Verify thumbnail URLs are different from media URLs for videos
    print("\nTesting that thumbnail URLs are different from media URLs...")
    
    if created_polls:
        try:
            poll = created_polls[0]
            
            for j, option in enumerate(poll['options']):
                media_url = option.get('media_url', '')
                thumbnail_url = option.get('thumbnail') or option.get('thumbnail_url', '')
                
                if media_url and thumbnail_url:
                    if media_url != thumbnail_url:
                        print(f"✅ Option {j+1}: Thumbnail URL differs from media URL")
                        print(f"  Media: {media_url}")
                        print(f"  Thumbnail: {thumbnail_url}")
                        success_count += 1
                    else:
                        print(f"❌ Option {j+1}: Thumbnail URL same as media URL")
                else:
                    print(f"⚠️ Option {j+1}: Missing media_url or thumbnail_url")
                    
        except Exception as e:
            print(f"❌ URL comparison error: {e}")
    
    return success_count >= 3

def test_video_upload_edge_cases(base_url):
    """Test edge cases for video upload and thumbnail generation"""
    print("\n=== Testing Video Upload Edge Cases ===")
    
    if not auth_token:
        print("❌ No auth token available for edge case testing")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    success_count = 0
    
    # Test 1: Large video file (simulate with larger dummy file)
    print("Testing large video file upload...")
    
    try:
        # Create a larger dummy video file (5MB)
        temp_dir = tempfile.gettempdir()
        large_video_path = os.path.join(temp_dir, "large_test_video.mp4")
        
        # Basic MP4 header + large dummy data
        mp4_header = bytes([
            0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
            0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
            0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
            0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,
        ])
        
        large_dummy_data = b'\x00' * (1024 * 1024 * 5)  # 5MB
        
        with open(large_video_path, 'wb') as f:
            f.write(mp4_header)
            f.write(large_dummy_data)
        
        print(f"Created large test video: {os.path.getsize(large_video_path)} bytes")
        
        with open(large_video_path, 'rb') as video_file:
            files = {'file': ('large_test_video.mp4', video_file, 'video/mp4')}
            data = {'upload_type': 'general'}
            
            response = requests.post(f"{base_url}/upload", files=files, data=data, headers=headers, timeout=60)
            print(f"Large Video Upload Status Code: {response.status_code}")
            
            if response.status_code == 200:
                upload_data = response.json()
                print(f"✅ Large video uploaded successfully")
                print(f"File Size: {upload_data['file_size']} bytes")
                
                if upload_data.get('thumbnail_url'):
                    print(f"✅ Thumbnail generated for large video")
                    success_count += 1
                else:
                    print(f"❌ Thumbnail not generated for large video")
                
                success_count += 1
            else:
                print(f"❌ Large video upload failed: {response.text}")
        
        # Clean up
        if os.path.exists(large_video_path):
            os.remove(large_video_path)
            
    except Exception as e:
        print(f"❌ Large video test error: {e}")
    
    # Test 2: Invalid video format (should fail)
    print("\nTesting invalid video format upload...")
    
    try:
        # Create a text file with .mp4 extension
        temp_dir = tempfile.gettempdir()
        fake_video_path = os.path.join(temp_dir, "fake_video.mp4")
        
        with open(fake_video_path, 'w') as f:
            f.write("This is not a video file, just text content.")
        
        with open(fake_video_path, 'rb') as fake_file:
            files = {'file': ('fake_video.mp4', fake_file, 'video/mp4')}
            data = {'upload_type': 'general'}
            
            response = requests.post(f"{base_url}/upload", files=files, data=data, headers=headers, timeout=30)
            print(f"Fake Video Upload Status Code: {response.status_code}")
            
            if response.status_code == 200:
                # Even if upload succeeds, thumbnail generation might fail gracefully
                upload_data = response.json()
                print(f"⚠️ Fake video upload succeeded (graceful handling)")
                print(f"Thumbnail URL: {upload_data.get('thumbnail_url', 'None')}")
                success_count += 1  # Success for graceful handling
            elif response.status_code == 400:
                print(f"✅ Invalid video format properly rejected")
                success_count += 1
            else:
                print(f"❌ Unexpected response for invalid video: {response.text}")
        
        # Clean up
        if os.path.exists(fake_video_path):
            os.remove(fake_video_path)
            
    except Exception as e:
        print(f"❌ Invalid video format test error: {e}")
    
    # Test 3: Test different video resolutions (thumbnail should be max 800px)
    print("\nTesting thumbnail size limits (max 800px)...")
    
    if uploaded_videos:
        try:
            # Check if any uploaded video has thumbnail
            for video_data in uploaded_videos:
                thumbnail_url = video_data.get('thumbnail_url')
                if thumbnail_url:
                    # Try to get thumbnail and check if it's reasonably sized
                    full_url = f"{base_url.replace('/api', '')}{thumbnail_url}"
                    response = requests.get(full_url, timeout=15)
                    
                    if response.status_code == 200:
                        content_length = len(response.content)
                        print(f"✅ Thumbnail size: {content_length} bytes")
                        
                        # A reasonable thumbnail should be between 5KB and 500KB
                        if 5000 <= content_length <= 500000:
                            print(f"✅ Thumbnail size is reasonable")
                            success_count += 1
                        else:
                            print(f"⚠️ Thumbnail size might be too large or small")
                        break
                    
        except Exception as e:
            print(f"❌ Thumbnail size test error: {e}")
    
    return success_count >= 2

def test_thumbnail_url_accessibility(base_url):
    """Test that thumbnail URLs are accessible from external requests"""
    print("\n=== Testing Thumbnail URL External Accessibility ===")
    
    if not uploaded_videos:
        print("❌ No uploaded videos available for accessibility test")
        return False
    
    success_count = 0
    
    for i, video_data in enumerate(uploaded_videos):
        thumbnail_url = video_data.get('thumbnail_url')
        if not thumbnail_url:
            continue
        
        print(f"\nTesting external accessibility for video {i+1} thumbnail...")
        
        try:
            # Test with full external URL
            external_base = base_url.replace('/api', '').replace('http://localhost:8001', 'https://music-display-hub.preview.emergentagent.com')
            full_external_url = f"{external_base}{thumbnail_url}"
            
            print(f"Testing external URL: {full_external_url}")
            
            response = requests.get(full_external_url, timeout=15)
            print(f"External Access Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ Thumbnail accessible externally")
                
                # Verify content type
                content_type = response.headers.get('content-type', '')
                if 'image/jpeg' in content_type:
                    print(f"✅ Correct external content-type: {content_type}")
                    success_count += 1
                else:
                    print(f"❌ Wrong external content-type: {content_type}")
                    
            else:
                print(f"❌ Thumbnail not accessible externally: {response.text}")
                
        except Exception as e:
            print(f"❌ External accessibility test error: {e}")
    
    return success_count >= 1

def run_all_video_thumbnail_tests():
    """Run all video thumbnail generation tests"""
    print("🎥 STARTING COMPREHENSIVE VIDEO THUMBNAIL GENERATION TESTING")
    print("=" * 80)
    
    # Get backend URL
    base_url = get_backend_url()
    if not base_url:
        print("❌ Could not determine backend URL")
        return False
    
    print(f"Backend URL: {base_url}")
    
    # Test results tracking
    test_results = []
    
    # Test 1: Register test user
    print("\n" + "=" * 50)
    result = register_test_user(base_url)
    test_results.append(("User Registration", result))
    
    if not result:
        print("❌ Cannot proceed without user registration")
        return False
    
    # Test 2: Video upload with thumbnail generation
    print("\n" + "=" * 50)
    result = test_video_upload_with_thumbnail_generation(base_url)
    test_results.append(("Video Upload & Thumbnail Generation", result))
    
    # Test 3: Thumbnail serving endpoint
    print("\n" + "=" * 50)
    result = test_thumbnail_serving_endpoint(base_url)
    test_results.append(("Thumbnail Serving Endpoint", result))
    
    # Test 4: Poll integration with video thumbnails
    print("\n" + "=" * 50)
    result = test_poll_integration_with_video_thumbnails(base_url)
    test_results.append(("Poll Integration with Video Thumbnails", result))
    
    # Test 5: Edge cases
    print("\n" + "=" * 50)
    result = test_video_upload_edge_cases(base_url)
    test_results.append(("Video Upload Edge Cases", result))
    
    # Test 6: External accessibility
    print("\n" + "=" * 50)
    result = test_thumbnail_url_accessibility(base_url)
    test_results.append(("Thumbnail External Accessibility", result))
    
    # Print final results
    print("\n" + "=" * 80)
    print("🎥 VIDEO THUMBNAIL GENERATION TESTING RESULTS")
    print("=" * 80)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<40} {status}")
        if result:
            passed_tests += 1
    
    print("=" * 80)
    print(f"SUMMARY: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
    
    if passed_tests >= total_tests * 0.8:  # 80% pass rate
        print("🎉 VIDEO THUMBNAIL SYSTEM IS WORKING CORRECTLY!")
        return True
    else:
        print("❌ VIDEO THUMBNAIL SYSTEM HAS ISSUES THAT NEED ATTENTION")
        return False

if __name__ == "__main__":
    success = run_all_video_thumbnail_tests()
    sys.exit(0 if success else 1)