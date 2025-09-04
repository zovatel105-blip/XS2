#!/usr/bin/env python3
"""
Test script to verify FFmpeg integration is working properly
"""

import ffmpeg
import os

def test_ffmpeg_integration():
    """Test various FFmpeg functionalities"""
    
    print("=== FFmpeg Integration Test ===\n")
    
    # Test 1: Create a test audio file
    print("1. Creating test audio file...")
    try:
        input_audio = ffmpeg.input('lavfi', f='lavfi', i='sine=frequency=880:duration=1')
        output = ffmpeg.output(input_audio, '/app/test_audio_output.mp3')
        ffmpeg.run(output, overwrite_output=True, quiet=True)
        
        if os.path.exists('/app/test_audio_output.mp3'):
            print("   ✅ Successfully created test audio file")
        else:
            print("   ❌ Failed to create test audio file")
            return False
            
    except Exception as e:
        print(f"   ❌ Error creating test audio: {e}")
        return False
    
    # Test 2: Probe audio file metadata
    print("\n2. Probing audio file metadata...")
    try:
        probe = ffmpeg.probe('/app/test_audio_output.mp3')
        duration = float(probe['format']['duration'])
        print(f"   ✅ Duration: {duration:.2f} seconds")
        print(f"   ✅ Format: {probe['format']['format_name']}")
        print(f"   ✅ Bitrate: {probe['format']['bit_rate']} bps")
        
    except Exception as e:
        print(f"   ❌ Error probing audio: {e}")
        return False
    
    # Test 3: Convert audio format
    print("\n3. Converting audio format (MP3 to WAV)...")
    try:
        input_audio = ffmpeg.input('/app/test_audio_output.mp3')
        output = ffmpeg.output(input_audio, '/app/test_audio_converted.wav')
        ffmpeg.run(output, overwrite_output=True, quiet=True)
        
        if os.path.exists('/app/test_audio_converted.wav'):
            print("   ✅ Successfully converted MP3 to WAV")
        else:
            print("   ❌ Failed to convert audio format")
            return False
            
    except Exception as e:
        print(f"   ❌ Error converting audio: {e}")
        return False
    
    # Test 4: Extract audio info
    print("\n4. Extracting detailed audio information...")
    try:
        probe = ffmpeg.probe('/app/test_audio_converted.wav')
        audio_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'audio'), None)
        
        if audio_stream:
            print(f"   ✅ Codec: {audio_stream['codec_name']}")
            print(f"   ✅ Sample Rate: {audio_stream['sample_rate']} Hz")
            print(f"   ✅ Channels: {audio_stream['channels']}")
        else:
            print("   ❌ No audio stream found")
            return False
            
    except Exception as e:
        print(f"   ❌ Error extracting audio info: {e}")
        return False
    
    # Test 5: Audio processing (trim and normalize)
    print("\n5. Testing audio processing (trim first 0.5 seconds)...")
    try:
        input_audio = ffmpeg.input('/app/test_audio_converted.wav')
        trimmed = ffmpeg.filter(input_audio, 'atrim', start=0, duration=0.5)
        output = ffmpeg.output(trimmed, '/app/test_audio_trimmed.wav')
        ffmpeg.run(output, overwrite_output=True, quiet=True)
        
        if os.path.exists('/app/test_audio_trimmed.wav'):
            probe = ffmpeg.probe('/app/test_audio_trimmed.wav')
            duration = float(probe['format']['duration'])
            print(f"   ✅ Successfully trimmed audio to {duration:.2f} seconds")
        else:
            print("   ❌ Failed to trim audio")
            return False
            
    except Exception as e:
        print(f"   ❌ Error processing audio: {e}")
        return False
    
    # Cleanup test files
    print("\n6. Cleaning up test files...")
    test_files = [
        '/app/test_audio_output.mp3',
        '/app/test_audio_converted.wav', 
        '/app/test_audio_trimmed.wav',
        '/app/test_ffmpeg_output.mp3'
    ]
    
    for file_path in test_files:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"   ✅ Removed {file_path}")
        except Exception as e:
            print(f"   ⚠️  Warning: Could not remove {file_path}: {e}")
    
    print("\n=== FFmpeg Integration Test Complete ===")
    print("✅ All tests passed! FFmpeg is fully functional.")
    return True

if __name__ == "__main__":
    success = test_ffmpeg_integration()
    exit(0 if success else 1)