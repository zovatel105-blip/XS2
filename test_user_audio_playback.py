#!/usr/bin/env python3
"""
Test script to verify user uploaded audio playback functionality
"""

import requests
import json
import os
import subprocess

def test_user_audio_playback():
    """Test the complete user audio upload and playback flow"""
    
    print("🎵 Testing User Audio Playback Flow 🎵\n")
    
    base_url = "http://localhost:8001"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MzIyYjY0Mi04MzQ2LTRkNmEtYWViOS0wZmFhMGU3NjRhZGQiLCJleHAiOjE3NTcxMDMxMTR9.iumih_EJr0sGnfwdg2abOszdQ9kJykp0NH2QHpv2_Ek"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=== Step 1: Getting User's Audio Library ===")
    try:
        response = requests.get(f"{base_url}/api/audio/my-library", headers=headers)
        if response.status_code == 200:
            library_data = response.json()
            audios = library_data.get('audios', [])
            print(f"✅ Found {len(audios)} audio files in user library")
            
            if audios:
                test_audio = audios[0]
                print(f"Testing audio: '{test_audio['title']}' by {test_audio['artist']}")
                preview_url = test_audio['preview_url']
                print(f"Preview URL: {preview_url}")
                
                # Test if the URL is accessible
                print("\n=== Step 2: Testing Audio URL Accessibility ===")
                audio_response = requests.get(f"{base_url}{preview_url}")
                if audio_response.status_code == 200:
                    print(f"✅ Audio URL accessible - Status: {audio_response.status_code}")
                    print(f"✅ Content-Type: {audio_response.headers.get('content-type', 'Unknown')}")
                    print(f"✅ Content-Length: {len(audio_response.content)} bytes")
                    
                    # Save to temp file and verify it's valid audio
                    temp_path = '/tmp/test_user_audio.mp3'
                    with open(temp_path, 'wb') as f:
                        f.write(audio_response.content)
                    
                    print("\n=== Step 3: Verifying Audio File Integrity ===")
                    try:
                        # Use FFprobe to verify audio
                        result = subprocess.run([
                            'ffprobe', '-v', 'quiet', '-print_format', 'json',
                            '-show_format', '-show_streams', temp_path
                        ], capture_output=True, text=True, timeout=10)
                        
                        if result.returncode == 0:
                            probe_data = json.loads(result.stdout)
                            format_info = probe_data.get('format', {})
                            streams = probe_data.get('streams', [])
                            
                            print(f"✅ Valid audio file detected")
                            print(f"   Format: {format_info.get('format_name', 'Unknown')}")
                            print(f"   Duration: {float(format_info.get('duration', 0)):.2f} seconds")
                            
                            if streams:
                                audio_stream = streams[0]
                                print(f"   Codec: {audio_stream.get('codec_name', 'Unknown')}")
                                print(f"   Sample Rate: {audio_stream.get('sample_rate', 'Unknown')} Hz")
                                print(f"   Channels: {audio_stream.get('channels', 'Unknown')}")
                            
                            return True
                        else:
                            print(f"❌ FFprobe failed: {result.stderr}")
                            return False
                            
                    except Exception as e:
                        print(f"❌ Error verifying audio: {e}")
                        return False
                    finally:
                        if os.path.exists(temp_path):
                            os.remove(temp_path)
                
                else:
                    print(f"❌ Audio URL not accessible - Status: {audio_response.status_code}")
                    return False
            else:
                print("❌ No audio files found in user library")
                return False
        else:
            print(f"❌ Failed to get audio library - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False

def test_audio_in_feed():
    """Test if user audio appears correctly in feed"""
    print("\n=== Step 4: Testing Audio in Feed ===")
    
    base_url = "http://localhost:8001"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MzIyYjY0Mi04MzQ2LTRkNmEtYWViOS0wZmFhMGU3NjRhZGQiLCJleHAiOjE3NTcxMDMxMTR9.iumih_EJr0sGnfwdg2abOszdQ9kJykp0NH2QHpv2_Ek"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{base_url}/api/polls", headers=headers)
        if response.status_code == 200:
            polls_data = response.json()
            polls = polls_data if isinstance(polls_data, list) else polls_data.get('polls', [])
            
            print(f"✅ Found {len(polls)} polls in feed")
            
            user_audio_polls = []
            for poll in polls:
                music = poll.get('music')
                if music and music.get('id', '').startswith('user_audio_'):
                    user_audio_polls.append(poll)
            
            print(f"✅ Found {len(user_audio_polls)} polls with user audio")
            
            for poll in user_audio_polls:
                music = poll['music']
                print(f"   Poll: {poll.get('question', poll.get('title', 'Unknown'))}")
                print(f"   Music: {music['title']} by {music['artist']}")
                print(f"   Preview URL: {music['preview_url']}")
                
                # Test the preview URL
                audio_url = f"{base_url}{music['preview_url']}"
                audio_response = requests.head(audio_url)
                if audio_response.status_code == 200:
                    print(f"   ✅ Audio accessible in feed")
                else:
                    print(f"   ❌ Audio not accessible: {audio_response.status_code}")
            
            return len(user_audio_polls) > 0
            
        else:
            print(f"❌ Failed to get feed - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing feed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 COMPREHENSIVE USER AUDIO TEST 🧪\n")
    
    success1 = test_user_audio_playback()
    success2 = test_audio_in_feed()
    
    print(f"\n{'='*50}")
    print("FINAL RESULTS:")
    print(f"Audio Library Test: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"Feed Audio Test: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 and success2:
        print("\n🎉 ALL TESTS PASSED! User audio upload and playback is working correctly!")
    elif success1:
        print("\n⚠️  Audio upload/playback works, but might not appear in feed properly")
    else:
        print("\n❌ CRITICAL ISSUE: User audio upload/playback is not working")