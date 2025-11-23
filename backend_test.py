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
BACKEND_URL = "https://disable-comments.preview.emergentagent.com/api"
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
    
    async def test_nonexistent_poll_view(self):
        """FASE 1.4: Test view registration for nonexistent poll"""
        print("\n🚫 Testing View Registration for Nonexistent Poll...")
        
        fake_poll_id = "fake-poll-id-999"
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/polls/{fake_poll_id}/view",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 404:
                    data = await response.json()
                    detail = data.get("detail", "")
                    
                    if "Poll not found" in detail:
                        print(f"✅ Correctly returned 404 for nonexistent poll")
                        print(f"   📝 Message: {detail}")
                        
                        self.test_results.append({
                            "test": "nonexistent_poll_view",
                            "status": "PASS",
                            "response_code": 404,
                            "details": f"Correctly returned 404 with message: {detail}"
                        })
                    else:
                        print(f"❌ Wrong error message: {detail}")
                        self.test_results.append({
                            "test": "nonexistent_poll_view",
                            "status": "FAIL",
                            "response_code": 404,
                            "error": f"Wrong error message: {detail}"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ Expected 404, got {response.status}: {error_text}")
                    self.test_results.append({
                        "test": "nonexistent_poll_view",
                        "status": "FAIL",
                        "response_code": response.status,
                        "error": f"Expected 404, got {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Error testing nonexistent poll: {str(e)}")
            self.test_results.append({
                "test": "nonexistent_poll_view",
                "status": "ERROR",
                "error": str(e)
            })
    
    async def test_voters_endpoint_view_count(self):
        """FASE 2.1: Test that voters endpoint returns correct view count"""
        print("\n📊 Testing Voters Endpoint View Count...")
        
        if not self.test_poll_id:
            print("❌ No valid poll ID available for testing")
            self.test_results.append({
                "test": "voters_endpoint_view_count",
                "status": "SKIP",
                "error": "No valid poll ID"
            })
            return
        
        try:
            # First, register some views to ensure we have data
            print("🔄 Registering 5 views for testing...")
            for i in range(5):
                await self.session.post(
                    f"{BACKEND_URL}/polls/{self.test_poll_id}/view",
                    headers=self.get_auth_headers()
                )
                await asyncio.sleep(0.1)
            
            # Now test the voters endpoint
            async with self.session.get(
                f"{BACKEND_URL}/polls/{self.test_poll_id}/voters",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Check required fields
                    required_fields = ["poll_id", "voters", "total_votes", "views"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        views_count = data.get("views")
                        total_votes = data.get("total_votes")
                        voters = data.get("voters", [])
                        
                        print(f"✅ Voters endpoint returned valid data")
                        print(f"   📊 Views: {views_count}")
                        print(f"   🗳️  Total votes: {total_votes}")
                        print(f"   👥 Voters: {len(voters)}")
                        
                        # Verify that views count is from poll_views collection (should be >= 5)
                        if views_count >= 5:
                            print(f"✅ Views count reflects poll_views collection data")
                            
                            self.test_results.append({
                                "test": "voters_endpoint_view_count",
                                "status": "PASS",
                                "views_count": views_count,
                                "total_votes": total_votes,
                                "voters_count": len(voters),
                                "details": f"Voters endpoint correctly returns views from poll_views collection. Views: {views_count}, Votes: {total_votes}"
                            })
                        else:
                            print(f"❌ Views count ({views_count}) doesn't reflect registered views")
                            
                            self.test_results.append({
                                "test": "voters_endpoint_view_count",
                                "status": "FAIL",
                                "views_count": views_count,
                                "error": f"Views count ({views_count}) less than expected (5+)"
                            })
                    else:
                        print(f"❌ Response missing required fields: {missing_fields}")
                        self.test_results.append({
                            "test": "voters_endpoint_view_count",
                            "status": "FAIL",
                            "error": f"Missing fields: {missing_fields}"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ Voters endpoint failed: {response.status} - {error_text}")
                    self.test_results.append({
                        "test": "voters_endpoint_view_count",
                        "status": "FAIL",
                        "error": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Error testing voters endpoint: {str(e)}")
            self.test_results.append({
                "test": "voters_endpoint_view_count",
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