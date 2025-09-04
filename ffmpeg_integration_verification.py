#!/usr/bin/env python3
"""
Comprehensive FFmpeg Integration Verification for Music App
Verifies FFmpeg is properly installed and integrated with the application
"""

import os
import sys
import tempfile
import subprocess
import requests
import json
from pathlib import Path

# Add backend to path
sys.path.append('/app/backend')

def test_system_ffmpeg():
    """Test system FFmpeg installation"""
    print("=== Testing System FFmpeg Installation ===")
    
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✅ FFmpeg installed: {version_line}")
            return True
        else:
            print(f"❌ FFmpeg version check failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ FFmpeg version check timed out")
        return False
    except FileNotFoundError:
        print("❌ FFmpeg executable not found")
        return False
    except Exception as e:
        print(f"❌ FFmpeg version check error: {e}")
        return False

def test_ffprobe():
    """Test FFprobe availability"""
    print("\n=== Testing FFprobe Availability ===")
    
    try:
        result = subprocess.run(['ffprobe', '-version'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✅ FFprobe available: {version_line}")
            return True
        else:
            print(f"❌ FFprobe version check failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ FFprobe error: {e}")
        return False

def test_ffmpeg_python_library():
    """Test FFmpeg Python library"""
    print("\n=== Testing FFmpeg Python Library ===")
    
    try:
        import ffmpeg
        print("✅ ffmpeg-python library imported successfully")
        
        # Test basic functionality
        test_input = ffmpeg.input('sine=frequency=440:duration=1', f='lavfi')
        output_path = '/tmp/test_ffmpeg_python.mp3'
        test_output = ffmpeg.output(test_input, output_path)
        
        # Generate command to verify
        cmd = ffmpeg.compile(test_output)
        print(f"✅ Generated command: {' '.join(cmd)}")
        
        # Run the command
        ffmpeg.run(test_output, overwrite_output=True, quiet=True)
        
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"✅ Created test audio file: {file_size} bytes")
            os.remove(output_path)
            print("✅ Cleaned up test file")
            return True
        else:
            print("❌ Failed to create test audio file")
            return False
            
    except ImportError as e:
        print(f"❌ Cannot import ffmpeg-python: {e}")
        return False
    except Exception as e:
        print(f"❌ FFmpeg Python library error: {e}")
        return False

def test_audio_utils_integration():
    """Test audio_utils.py integration"""
    print("\n=== Testing Audio Utils Integration ===")
    
    try:
        from audio_utils import get_ffmpeg_path, test_audio_processing
        
        # Test FFmpeg path detection
        ffmpeg_path = get_ffmpeg_path()
        print(f"✅ FFmpeg path detected by audio_utils: {ffmpeg_path}")
        
        # Test audio processing utilities
        print("Testing audio processing utilities...")
        result = test_audio_processing()
        if result:
            print("✅ Audio processing utilities working correctly")
            return True
        else:
            print("❌ Audio processing utilities failed")
            return False
            
    except Exception as e:
        print(f"❌ Audio utils integration error: {e}")
        return False

def test_server_ffmpeg_fallback():
    """Test server FFmpeg fallback functionality"""
    print("\n=== Testing Server FFmpeg Fallback ===")
    
    try:
        from server import process_audio_with_ffmpeg
        from pydub import AudioSegment
        
        # Create test audio
        test_audio = AudioSegment.silent(duration=3000)  # 3 seconds
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            test_audio.export(tmp_file.name, format='mp3')
            
            # Test FFmpeg fallback processing
            result = process_audio_with_ffmpeg(tmp_file.name, max_duration=60)
            
            if result.get('success'):
                print("✅ Server FFmpeg fallback working correctly")
                print(f"   Processed duration: {result.get('duration')} seconds")
                print(f"   Sample rate: {result.get('sample_rate')} Hz")
                print(f"   Channels: {result.get('channels')}")
                
                # Clean up
                processed_path = result.get('processed_path')
                if processed_path and os.path.exists(processed_path):
                    os.remove(processed_path)
                os.remove(tmp_file.name)
                
                return True
            else:
                print(f"❌ Server FFmpeg fallback failed: {result.get('error')}")
                os.remove(tmp_file.name)
                return False
                
    except Exception as e:
        print(f"❌ Server FFmpeg fallback error: {e}")
        return False

def test_backend_service():
    """Test if backend service is running and accessible"""
    print("\n=== Testing Backend Service ===")
    
    try:
        # Test backend health
        response = requests.get('http://localhost:8001/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend service is running and accessible")
            return True
        else:
            print(f"❌ Backend service returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend service not accessible: {e}")
        return False

def test_audio_codecs():
    """Test available audio codecs in FFmpeg"""
    print("\n=== Testing Available Audio Codecs ===")
    
    try:
        result = subprocess.run(['ffmpeg', '-codecs'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            important_codecs = ['mp3', 'aac', 'flac', 'wav', 'ogg']
            available_codecs = []
            
            for codec in important_codecs:
                if codec in result.stdout.lower() or f'lib{codec}' in result.stdout.lower():
                    available_codecs.append(codec)
            
            print(f"✅ Available important audio codecs: {', '.join(available_codecs)}")
            
            # Check for specific encoders we use
            encoder_result = subprocess.run(['ffmpeg', '-encoders'], capture_output=True, text=True, timeout=10)
            if 'libmp3lame' in encoder_result.stdout:
                print("✅ MP3 encoder (libmp3lame) available")
            else:
                print("⚠️  MP3 encoder (libmp3lame) not found")
            
            return len(available_codecs) > 0
            
    except Exception as e:
        print(f"❌ Error checking audio codecs: {e}")
        return False

def main():
    """Run all FFmpeg integration tests"""
    print("🎵 FFmpeg Integration Verification for Music App 🎵\n")
    
    tests = [
        ("System FFmpeg", test_system_ffmpeg),
        ("FFprobe", test_ffprobe),
        ("FFmpeg Python Library", test_ffmpeg_python_library),
        ("Audio Utils Integration", test_audio_utils_integration),
        ("Server FFmpeg Fallback", test_server_ffmpeg_fallback),
        ("Backend Service", test_backend_service),
        ("Audio Codecs", test_audio_codecs)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("FFMPEG INTEGRATION TEST SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All FFmpeg integration tests passed! The music app is ready to process audio.")
        return True
    else:
        print("⚠️  Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)