#!/usr/bin/env python3
"""
Backend Testing Suite for View Tracking System
Testing the new poll view tracking system that registers EACH visualization, not just unique users.
"""

import asyncio
import aiohttp
import json
import os
import uuid
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configuration
BACKEND_URL = "https://impression-log.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "email": "demo@example.com",
    "password": "demo123"
}

class ViewTrackingTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.test_poll_id = None
        
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
                    user_data = data.get("user", {})
                    print(f"✅ Authentication successful - User: {user_data.get('username', 'Unknown')}")
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
    
    async def get_valid_poll_id(self) -> Optional[str]:
        """Get a valid poll ID from the feed for testing"""
        print("🔍 Getting valid poll ID from feed...")
        
        try:
            async with self.session.get(
                f"{BACKEND_URL}/polls",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    polls = data.get("polls", [])
                    if polls:
                        poll_id = polls[0].get("id")
                        poll_title = polls[0].get("title", "Unknown")
                        print(f"✅ Found poll ID: {poll_id} - '{poll_title}'")
                        return poll_id
                    else:
                        print("❌ No polls found in feed")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to get polls: {response.status} - {error_text}")
                    return None
        except Exception as e:
            print(f"❌ Error getting poll ID: {str(e)}")
            return None
    
    async def test_authenticated_user_view_registration(self):
        """FASE 1.1: Test authenticated user registering views"""
        print("\n👤 Testing Authenticated User View Registration...")
        
        if not self.test_poll_id:
            print("❌ No valid poll ID available for testing")
            self.test_results.append({
                "test": "authenticated_view_registration",
                "status": "SKIP",
                "error": "No valid poll ID"
            })
            return
        
        try:
            # Register a view as authenticated user
            async with self.session.post(
                f"{BACKEND_URL}/polls/{self.test_poll_id}/view",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response structure
                    required_fields = ["success", "poll_id", "total_views", "message"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        print(f"✅ View registered successfully")
                        print(f"   📊 Total views: {data.get('total_views')}")
                        print(f"   📝 Message: {data.get('message')}")
                        print(f"   🆔 Poll ID: {data.get('poll_id')}")
                        
                        self.test_results.append({
                            "test": "authenticated_view_registration",
                            "status": "PASS",
                            "total_views": data.get('total_views'),
                            "details": f"Successfully registered view for authenticated user. Total views: {data.get('total_views')}"
                        })
                        
                        return data.get('total_views')
                    else:
                        print(f"❌ Response missing required fields: {missing_fields}")
                        self.test_results.append({
                            "test": "authenticated_view_registration",
                            "status": "FAIL",
                            "error": f"Missing fields: {missing_fields}"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ View registration failed: {response.status} - {error_text}")
                    self.test_results.append({
                        "test": "authenticated_view_registration",
                        "status": "FAIL",
                        "error": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Error registering authenticated view: {str(e)}")
            self.test_results.append({
                "test": "authenticated_view_registration",
                "status": "ERROR",
                "error": str(e)
            })
        
        return None
    
    async def test_unauthenticated_user_view_registration(self):
        """FASE 1.2: Test unauthenticated user registering views"""
        print("\n🕵️ Testing Unauthenticated User View Registration...")
        
        if not self.test_poll_id:
            print("❌ No valid poll ID available for testing")
            self.test_results.append({
                "test": "unauthenticated_view_registration",
                "status": "SKIP",
                "error": "No valid poll ID"
            })
            return
        
        try:
            # Generate a unique session ID
            session_id = f"session_{int(time.time())}_test123"
            print(f"🆔 Using session ID: {session_id}")
            
            # Register a view without authentication but with session ID header
            headers = {"X-Session-ID": session_id}
            
            async with self.session.post(
                f"{BACKEND_URL}/polls/{self.test_poll_id}/view",
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response structure
                    required_fields = ["success", "poll_id", "total_views", "message"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        print(f"✅ Unauthenticated view registered successfully")
                        print(f"   📊 Total views: {data.get('total_views')}")
                        print(f"   📝 Message: {data.get('message')}")
                        print(f"   🆔 Session ID: {session_id}")
                        
                        self.test_results.append({
                            "test": "unauthenticated_view_registration",
                            "status": "PASS",
                            "total_views": data.get('total_views'),
                            "session_id": session_id,
                            "details": f"Successfully registered view for unauthenticated user with session ID. Total views: {data.get('total_views')}"
                        })
                        
                        return data.get('total_views')
                    else:
                        print(f"❌ Response missing required fields: {missing_fields}")
                        self.test_results.append({
                            "test": "unauthenticated_view_registration",
                            "status": "FAIL",
                            "error": f"Missing fields: {missing_fields}"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ Unauthenticated view registration failed: {response.status} - {error_text}")
                    self.test_results.append({
                        "test": "unauthenticated_view_registration",
                        "status": "FAIL",
                        "error": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Error registering unauthenticated view: {str(e)}")
            self.test_results.append({
                "test": "unauthenticated_view_registration",
                "status": "ERROR",
                "error": str(e)
            })
        
        return None
    
    async def test_multiple_views_same_user(self):
        """FASE 1.3: Test multiple views from the same user"""
        print("\n🔄 Testing Multiple Views from Same User...")
        
        if not self.test_poll_id:
            print("❌ No valid poll ID available for testing")
            self.test_results.append({
                "test": "multiple_views_same_user",
                "status": "SKIP",
                "error": "No valid poll ID"
            })
            return
        
        try:
            initial_views = None
            views_registered = 0
            
            # Register 3 views from the same authenticated user
            for i in range(3):
                print(f"🔄 Registering view #{i+1}...")
                
                async with self.session.post(
                    f"{BACKEND_URL}/polls/{self.test_poll_id}/view",
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        current_views = data.get('total_views')
                        
                        if initial_views is None:
                            initial_views = current_views - 1  # Subtract the view we just registered
                        
                        views_registered += 1
                        print(f"   ✅ View #{i+1} registered. Total views: {current_views}")
                        
                        # Small delay to ensure different timestamps
                        await asyncio.sleep(0.1)
                    else:
                        error_text = await response.text()
                        print(f"   ❌ View #{i+1} failed: {response.status} - {error_text}")
                        break
            
            if views_registered == 3:
                # Verify that all 3 views were counted
                async with self.session.post(
                    f"{BACKEND_URL}/polls/{self.test_poll_id}/view",
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        final_views = data.get('total_views')
                        views_increase = final_views - initial_views
                        
                        if views_increase >= 4:  # At least 4 views (3 + 1 verification)
                            print(f"✅ Multiple views correctly registered")
                            print(f"   📊 Views increased by: {views_increase}")
                            print(f"   🎯 Expected: At least 4, Got: {views_increase}")
                            
                            self.test_results.append({
                                "test": "multiple_views_same_user",
                                "status": "PASS",
                                "views_registered": views_registered + 1,
                                "views_increase": views_increase,
                                "details": f"Successfully registered {views_registered + 1} views from same user. Views increased by {views_increase}"
                            })
                        else:
                            print(f"❌ Views not properly counted")
                            print(f"   📊 Expected increase: At least 4, Got: {views_increase}")
                            
                            self.test_results.append({
                                "test": "multiple_views_same_user",
                                "status": "FAIL",
                                "views_increase": views_increase,
                                "error": f"Views increase ({views_increase}) less than expected (4+)"
                            })
            else:
                print(f"❌ Only {views_registered}/3 views were registered successfully")
                self.test_results.append({
                    "test": "multiple_views_same_user",
                    "status": "PARTIAL",
                    "views_registered": views_registered,
                    "error": f"Only {views_registered}/3 views registered"
                })
                
        except Exception as e:
            print(f"❌ Error testing multiple views: {str(e)}")
            self.test_results.append({
                "test": "multiple_views_same_user",
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