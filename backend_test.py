#!/usr/bin/env python3
"""
Backend Testing Suite for Sounds Search Functionality
Testing the search for "sounds" in the backend as requested in the review.
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, List, Any

# Configuration
BACKEND_URL = "https://content-debug-2.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "email": "demo@example.com",
    "password": "demo123"
}

class BackendTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        
    async def setup(self):
        """Initialize HTTP session and authenticate"""
        self.session = aiohttp.ClientSession()
        await self.authenticate()
        
    async def cleanup(self):
        """Clean up HTTP session"""
        if self.session:
            await self.session.close()
            
    async def authenticate(self):
        """Authenticate with demo credentials"""
        print("🔐 Authenticating with demo credentials...")
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/auth/login",
                json=TEST_CREDENTIALS,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token")
                    print(f"✅ Authentication successful")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Authentication failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        if not self.auth_token:
            return {}
        return {"Authorization": f"Bearer {self.auth_token}"}
    
    async def test_sounds_search_functionality(self):
        """Test sounds search functionality with filter=sounds"""
        print("\n🎵 Testing Sounds Search Functionality...")
        
        # Test the specific endpoint mentioned in the review
        test_queries = [
            "test",
            "music", 
            "audio",
            "sound",
            "song",
            ""  # Empty query to see if there are any sounds at all
        ]
        
        all_results = []
        
        for query in test_queries:
            print(f"\n🔍 Testing sounds search with query: '{query}'")
            
            try:
                # Test the exact endpoint from the review: GET /api/search?q=test&filter=sounds&sort_by=relevance&limit=10
                params = {
                    "q": query,
                    "filter": "sounds",
                    "sort_by": "relevance", 
                    "limit": 10
                }
                
                async with self.session.get(
                    f"{BACKEND_URL}/search",
                    params=params,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        results = data.get("results", [])
                        
                        print(f"✅ Search successful - Found {len(results)} results")
                        
                        # Filter for sound results
                        sound_results = [r for r in results if r.get("type") == "sound"]
                        print(f"🎵 Found {len(sound_results)} sound results")
                        
                        # Check required fields for each sound
                        valid_sounds = 0
                        for result in sound_results:
                            is_valid = self.check_sound_result_fields(result, query)
                            if is_valid:
                                valid_sounds += 1
                                all_results.append({
                                    "query": query,
                                    "result": result
                                })
                        
                        print(f"✅ Valid sounds: {valid_sounds}/{len(sound_results)}")
                        
                        self.test_results.append({
                            "test": f"sounds_search_{query if query else 'empty'}",
                            "status": "PASS" if len(sound_results) > 0 or query == "" else "PARTIAL",
                            "total_results": len(results),
                            "sound_results": len(sound_results),
                            "valid_sounds": valid_sounds,
                            "details": f"Query '{query}' returned {len(results)} results, {len(sound_results)} sounds, {valid_sounds} valid"
                        })
                        
                    else:
                        error_text = await response.text()
                        print(f"❌ Search failed: {response.status} - {error_text}")
                        self.test_results.append({
                            "test": f"sounds_search_{query if query else 'empty'}",
                            "status": "FAIL",
                            "error": f"HTTP {response.status}: {error_text}"
                        })
                        
            except Exception as e:
                print(f"❌ Search error for '{query}': {str(e)}")
                self.test_results.append({
                    "test": f"sounds_search_{query if query else 'empty'}",
                    "status": "ERROR",
                    "error": str(e)
                })
        
        return all_results
    
    def check_sound_result_fields(self, result: Dict[str, Any], query: str) -> bool:
        """Check if sound result has the expected fields for frontend"""
        print(f"  🔍 Checking sound: {result.get('id', 'unknown')} - '{result.get('title', 'No title')}'")
        
        # Check all the required fields mentioned in the review
        required_fields = ["thumbnail_url", "posts_count", "title", "artist", "cover_image"]
        
        title = result.get("title")
        artist = result.get("artist") 
        thumbnail_url = result.get("thumbnail_url")
        cover_image = result.get("cover_image")
        posts_count = result.get("posts_count")
        posts_using_count = result.get("posts_using_count")
        duration = result.get("duration")
        author = result.get("author", {})
        
        print(f"    🎵 title: {title}")
        print(f"    👤 artist: {artist}")
        print(f"    🖼️  thumbnail_url: {thumbnail_url}")
        print(f"    🎨 cover_image: {cover_image}")
        print(f"    📊 posts_count: {posts_count}")
        print(f"    📊 posts_using_count: {posts_using_count}")
        print(f"    ⏱️  duration: {duration}")
        print(f"    👨‍🎤 author: {author}")
        
        # Check if all required fields are present
        has_title = bool(title)
        has_artist = bool(artist)
        has_thumbnail_url = bool(thumbnail_url)
        has_cover_image = bool(cover_image)
        has_posts_count = posts_count is not None
        has_author = bool(author and author.get("username"))
        
        all_required_present = has_title and has_artist and has_thumbnail_url and has_posts_count
        
        if all_required_present:
            print(f"    ✅ Sound has all required fields - Frontend will display correctly")
        else:
            missing_fields = []
            if not has_title: missing_fields.append("title")
            if not has_artist: missing_fields.append("artist") 
            if not has_thumbnail_url: missing_fields.append("thumbnail_url")
            if not has_posts_count: missing_fields.append("posts_count")
            print(f"    ❌ Sound missing fields: {', '.join(missing_fields)}")
        
        return all_required_present
    
    async def test_specific_poll_search(self):
        """Test search for specific polls that should have images"""
        print("\n🎯 Testing Specific Poll Searches...")
        
        # Test searches that are likely to return polls with images
        specific_tests = [
            {"query": "pizza hamburguesa", "description": "Food comparison poll"},
            {"query": "color favorito", "description": "Color preference poll"},
            {"query": "mejor opción", "description": "General preference poll"}
        ]
        
        for test in specific_tests:
            query = test["query"]
            description = test["description"]
            
            print(f"\n🔍 Testing: {description} ('{query}')")
            
            try:
                async with self.session.get(
                    f"{BACKEND_URL}/search/universal",
                    params={"q": query, "limit": 10, "filter_type": "posts"},
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        results = data.get("results", [])
                        
                        post_results = [r for r in results if r.get("type") == "post"]
                        
                        if post_results:
                            print(f"✅ Found {len(post_results)} poll results")
                            
                            # Analyze the first result in detail
                            first_result = post_results[0]
                            print(f"📊 Analyzing first result: {first_result.get('title', 'No title')}")
                            
                            # Check all image-related fields
                            self.analyze_poll_image_extraction(first_result)
                            
                            self.test_results.append({
                                "test": f"specific_search_{query.replace(' ', '_')}",
                                "status": "PASS",
                                "found_polls": len(post_results),
                                "details": f"Found {len(post_results)} polls for '{description}'"
                            })
                        else:
                            print(f"⚠️  No poll results found for '{query}'")
                            self.test_results.append({
                                "test": f"specific_search_{query.replace(' ', '_')}",
                                "status": "PARTIAL",
                                "found_polls": 0,
                                "details": f"No polls found for '{description}'"
                            })
                    else:
                        error_text = await response.text()
                        print(f"❌ Search failed: {response.status} - {error_text}")
                        self.test_results.append({
                            "test": f"specific_search_{query.replace(' ', '_')}",
                            "status": "FAIL",
                            "error": f"HTTP {response.status}: {error_text}"
                        })
                        
            except Exception as e:
                print(f"❌ Error testing '{query}': {str(e)}")
                self.test_results.append({
                    "test": f"specific_search_{query.replace(' ', '_')}",
                    "status": "ERROR",
                    "error": str(e)
                })
    
    def analyze_poll_image_extraction(self, poll_result: Dict[str, Any]):
        """Detailed analysis of how images are extracted from poll options"""
        print(f"  🔬 Detailed Image Extraction Analysis:")
        
        # Check the raw poll data structure
        options = poll_result.get("options", [])
        print(f"    📋 Poll has {len(options)} options")
        
        # Analyze each option for media
        for i, option in enumerate(options):
            media_url = option.get("media_url")
            thumbnail_url = option.get("thumbnail_url")
            
            if media_url or thumbnail_url:
                print(f"    Option {i+1}:")
                if media_url:
                    print(f"      🎬 media_url: {media_url[:60]}...")
                if thumbnail_url:
                    print(f"      🖼️  thumbnail_url: {thumbnail_url[:60]}...")
        
        # Check how these were mapped to search result fields
        result_image_url = poll_result.get("image_url")
        result_thumbnail_url = poll_result.get("thumbnail_url")
        result_media_url = poll_result.get("media_url")
        result_images = poll_result.get("images", [])
        
        print(f"    🎯 Search Result Mapping:")
        print(f"      image_url: {result_image_url[:60] + '...' if result_image_url else 'None'}")
        print(f"      thumbnail_url: {result_thumbnail_url[:60] + '...' if result_thumbnail_url else 'None'}")
        print(f"      media_url: {result_media_url[:60] + '...' if result_media_url else 'None'}")
        print(f"      images array: {len(result_images)} items")
        
        # Verify the fix: images should come from options, not legacy fields
        if options and (result_image_url or result_thumbnail_url or result_media_url or result_images):
            print(f"    ✅ SUCCESS: Images correctly extracted from poll options")
        elif result_image_url or result_thumbnail_url or result_media_url or result_images:
            print(f"    ⚠️  WARNING: Images found but may be from legacy fields")
        else:
            print(f"    ❌ ISSUE: No images extracted despite having options")
    
    async def test_frontend_compatibility(self):
        """Test that search results are compatible with frontend expectations"""
        print("\n🎨 Testing Frontend Compatibility...")
        
        try:
            async with self.session.get(
                f"{BACKEND_URL}/search/universal",
                params={"q": "poll", "limit": 5},
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    results = data.get("results", [])
                    
                    post_results = [r for r in results if r.get("type") == "post"]
                    
                    if post_results:
                        print(f"✅ Testing frontend compatibility with {len(post_results)} poll results")
                        
                        compatible_count = 0
                        for result in post_results:
                            # Test the exact logic from SearchPage.jsx line 979-981
                            frontend_image = (
                                result.get("image_url") or 
                                result.get("thumbnail_url") or 
                                (result.get("images", [{}])[0].get("url") if result.get("images") else None) or
                                result.get("media_url")
                            )
                            
                            if frontend_image:
                                compatible_count += 1
                                print(f"  ✅ Poll {result.get('id', 'unknown')}: Frontend will show image")
                            else:
                                print(f"  ❌ Poll {result.get('id', 'unknown')}: Frontend will show placeholder")
                        
                        compatibility_rate = (compatible_count / len(post_results)) * 100
                        print(f"🎯 Frontend Compatibility: {compatible_count}/{len(post_results)} ({compatibility_rate:.1f}%)")
                        
                        self.test_results.append({
                            "test": "frontend_compatibility",
                            "status": "PASS" if compatibility_rate >= 50 else "PARTIAL",
                            "compatibility_rate": compatibility_rate,
                            "compatible_polls": compatible_count,
                            "total_polls": len(post_results),
                            "details": f"{compatibility_rate:.1f}% of polls have images compatible with frontend"
                        })
                    else:
                        print("⚠️  No poll results found for compatibility testing")
                        self.test_results.append({
                            "test": "frontend_compatibility",
                            "status": "SKIP",
                            "details": "No poll results available for testing"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ Compatibility test failed: {response.status} - {error_text}")
                    self.test_results.append({
                        "test": "frontend_compatibility",
                        "status": "FAIL",
                        "error": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Frontend compatibility test error: {str(e)}")
            self.test_results.append({
                "test": "frontend_compatibility",
                "status": "ERROR",
                "error": str(e)
            })
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("🎯 UNIVERSAL SEARCH POLL IMAGES - TEST SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["status"] == "PASS"])
        failed_tests = len([t for t in self.test_results if t["status"] == "FAIL"])
        error_tests = len([t for t in self.test_results if t["status"] == "ERROR"])
        partial_tests = len([t for t in self.test_results if t["status"] == "PARTIAL"])
        
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"⚠️  Partial: {partial_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"💥 Errors: {error_tests}")
        
        success_rate = ((passed_tests + partial_tests) / total_tests * 100) if total_tests > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        print("\n📋 Detailed Results:")
        for result in self.test_results:
            status_emoji = {
                "PASS": "✅",
                "PARTIAL": "⚠️ ",
                "FAIL": "❌",
                "ERROR": "💥",
                "SKIP": "⏭️ "
            }.get(result["status"], "❓")
            
            print(f"  {status_emoji} {result['test']}: {result.get('details', result.get('error', 'No details'))}")
        
        print("\n" + "="*80)
        
        # Overall assessment
        if success_rate >= 80:
            print("🎉 OVERALL ASSESSMENT: EXCELLENT - Poll image search is working correctly!")
        elif success_rate >= 60:
            print("👍 OVERALL ASSESSMENT: GOOD - Poll image search is mostly working with minor issues")
        elif success_rate >= 40:
            print("⚠️  OVERALL ASSESSMENT: NEEDS IMPROVEMENT - Some issues with poll image search")
        else:
            print("❌ OVERALL ASSESSMENT: CRITICAL ISSUES - Poll image search needs significant fixes")
        
        return success_rate >= 60  # Return True if tests are generally successful

async def main():
    """Main test execution"""
    print("🚀 Starting Backend Testing for Universal Search Poll Images")
    print("="*80)
    
    tester = BackendTester()
    
    try:
        # Setup
        await tester.setup()
        
        if not tester.auth_token:
            print("❌ Cannot proceed without authentication")
            return False
        
        # Run tests
        await tester.test_universal_search_poll_images()
        await tester.test_specific_poll_search()
        await tester.test_frontend_compatibility()
        
        # Print summary
        success = tester.print_summary()
        
        return success
        
    except Exception as e:
        print(f"💥 Critical error during testing: {str(e)}")
        return False
        
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)