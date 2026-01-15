#!/usr/bin/env python3
"""
Backend Testing Suite for Momento Creation Flow
Testing the creation of "Momento" posts (single image with voting functionality).
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
BACKEND_URL = "https://http-status-fix.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "email": "test@example.com",
    "password": "test123"
}

class MomentoTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.test_user_id = None
        self.created_poll_id = None
        
    async def setup(self):
        """Initialize HTTP session and authenticate"""
        self.session = aiohttp.ClientSession()
        await self.authenticate()
        
    async def cleanup(self):
        """Clean up HTTP session"""
        if self.session:
            await self.session.close()
            
    async def authenticate(self):
        """Authenticate with test credentials or register new user"""
        print("🔐 Authenticating with test credentials...")
        
        # First try to login with existing credentials
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
                    self.test_user_id = user_data.get("id")
                    print(f"✅ Login successful - User: {user_data.get('username', 'Unknown')} (ID: {self.test_user_id})")
                    return True
                elif response.status == 401:
                    print("⚠️ Login failed, attempting to register new user...")
                    return await self.register_test_user()
                else:
                    error_text = await response.text()
                    print(f"❌ Login failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return await self.register_test_user()
    
    async def register_test_user(self):
        """Register a new test user"""
        print("📝 Registering new test user...")
        
        registration_data = {
            "email": TEST_CREDENTIALS["email"],
            "password": TEST_CREDENTIALS["password"],
            "username": f"testuser_{int(time.time())}",
            "display_name": "Test User for Momento"
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token")
                    user_data = data.get("user", {})
                    self.test_user_id = user_data.get("id")
                    print(f"✅ Registration successful - User: {user_data.get('username', 'Unknown')} (ID: {self.test_user_id})")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Registration failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        if not self.auth_token:
            return {}
        return {"Authorization": f"Bearer {self.auth_token}"}
    
    async def test_momento_creation(self):
        """Test creating a Momento poll with layout 'moment'"""
        print("\n📸 Testing Momento Creation...")
        
        # Prepare the momento data as specified in the review request
        momento_data = {
            "title": "Mi primer momento",
            "options": [
                {
                    "text": "Descripción del momento",
                    "media_type": "image",
                    "media_url": "/api/uploads/test.jpg"
                }
            ],
            "layout": "moment",
            "tags": [],
            "mentioned_users": []
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/polls",
                json=momento_data,
                headers={**self.get_auth_headers(), "Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                print(f"📊 Response Status: {response.status}")
                print(f"📄 Response Body: {response_text[:500]}...")
                
                if response.status == 200 or response.status == 201:
                    try:
                        data = json.loads(response_text)
                        
                        # Verify response structure
                        required_fields = ["id", "title", "layout", "options"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            poll_id = data.get("id")
                            layout = data.get("layout")
                            title = data.get("title")
                            options = data.get("options", [])
                            
                            print(f"✅ Momento created successfully")
                            print(f"   🆔 Poll ID: {poll_id}")
                            print(f"   📝 Title: {title}")
                            print(f"   🎨 Layout: {layout}")
                            print(f"   📷 Options count: {len(options)}")
                            
                            # Verify layout is 'moment'
                            if layout == "moment":
                                print(f"   ✅ Layout 'moment' accepted correctly")
                                
                                # Verify option structure
                                if options and len(options) == 1:
                                    option = options[0]
                                    if (option.get("text") == "Descripción del momento" and 
                                        option.get("media_type") == "image"):
                                        print(f"   ✅ Option structure correct")
                                        
                                        self.created_poll_id = poll_id
                                        self.test_results.append({
                                            "test": "momento_creation",
                                            "status": "PASS",
                                            "poll_id": poll_id,
                                            "layout": layout,
                                            "details": f"Successfully created Momento with layout 'moment'. Poll ID: {poll_id}"
                                        })
                                        return True
                                    else:
                                        print(f"   ❌ Option structure incorrect")
                                        self.test_results.append({
                                            "test": "momento_creation",
                                            "status": "FAIL",
                                            "error": "Option structure doesn't match expected format"
                                        })
                                else:
                                    print(f"   ❌ Expected 1 option, got {len(options)}")
                                    self.test_results.append({
                                        "test": "momento_creation",
                                        "status": "FAIL",
                                        "error": f"Expected 1 option, got {len(options)}"
                                    })
                            else:
                                print(f"   ❌ Layout '{layout}' != 'moment'")
                                self.test_results.append({
                                    "test": "momento_creation",
                                    "status": "FAIL",
                                    "error": f"Layout '{layout}' not accepted, expected 'moment'"
                                })
                        else:
                            print(f"❌ Response missing required fields: {missing_fields}")
                            self.test_results.append({
                                "test": "momento_creation",
                                "status": "FAIL",
                                "error": f"Missing fields: {missing_fields}"
                            })
                    except json.JSONDecodeError as e:
                        print(f"❌ Invalid JSON response: {str(e)}")
                        self.test_results.append({
                            "test": "momento_creation",
                            "status": "FAIL",
                            "error": f"Invalid JSON response: {str(e)}"
                        })
                else:
                    print(f"❌ Momento creation failed: {response.status}")
                    self.test_results.append({
                        "test": "momento_creation",
                        "status": "FAIL",
                        "error": f"HTTP {response.status}: {response_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Error creating momento: {str(e)}")
            self.test_results.append({
                "test": "momento_creation",
                "status": "ERROR",
                "error": str(e)
            })
        
        return False
    
    async def test_momento_retrieval(self):
        """Test retrieving the created Momento"""
        print("\n🔍 Testing Momento Retrieval...")
        
        if not self.created_poll_id:
            print("❌ No created poll ID available for testing")
            self.test_results.append({
                "test": "momento_retrieval",
                "status": "SKIP",
                "error": "No created poll ID"
            })
            return
        
        try:
            async with self.session.get(
                f"{BACKEND_URL}/polls/{self.created_poll_id}",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify the retrieved poll matches what we created
                    layout = data.get("layout")
                    title = data.get("title")
                    options = data.get("options", [])
                    
                    if layout == "moment" and title == "Mi primer momento":
                        print(f"✅ Momento retrieved successfully")
                        print(f"   🆔 Poll ID: {data.get('id')}")
                        print(f"   📝 Title: {title}")
                        print(f"   🎨 Layout: {layout}")
                        print(f"   📷 Options: {len(options)}")
                        
                        self.test_results.append({
                            "test": "momento_retrieval",
                            "status": "PASS",
                            "poll_id": self.created_poll_id,
                            "details": f"Successfully retrieved Momento. Layout: {layout}, Title: {title}"
                        })
                    else:
                        print(f"❌ Retrieved data doesn't match created data")
                        print(f"   Expected layout: 'moment', got: '{layout}'")
                        print(f"   Expected title: 'Mi primer momento', got: '{title}'")
                        self.test_results.append({
                            "test": "momento_retrieval",
                            "status": "FAIL",
                            "error": f"Data mismatch - Layout: {layout}, Title: {title}"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ Momento retrieval failed: {response.status} - {error_text}")
                    self.test_results.append({
                        "test": "momento_retrieval",
                        "status": "FAIL",
                        "error": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Error retrieving momento: {str(e)}")
            self.test_results.append({
                "test": "momento_retrieval",
                "status": "ERROR",
                "error": str(e)
            })
    
    async def test_momento_in_feed(self):
        """Test that the Momento appears in the feed"""
        print("\n📱 Testing Momento in Feed...")
        
        try:
            async with self.session.get(
                f"{BACKEND_URL}/polls",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    polls = data.get("polls", [])
                    
                    # Look for our created momento in the feed
                    momento_found = False
                    for poll in polls:
                        if poll.get("id") == self.created_poll_id:
                            momento_found = True
                            layout = poll.get("layout")
                            title = poll.get("title")
                            
                            print(f"✅ Momento found in feed")
                            print(f"   🆔 Poll ID: {poll.get('id')}")
                            print(f"   📝 Title: {title}")
                            print(f"   🎨 Layout: {layout}")
                            
                            if layout == "moment":
                                self.test_results.append({
                                    "test": "momento_in_feed",
                                    "status": "PASS",
                                    "poll_id": self.created_poll_id,
                                    "details": f"Momento appears correctly in feed with layout 'moment'"
                                })
                            else:
                                self.test_results.append({
                                    "test": "momento_in_feed",
                                    "status": "FAIL",
                                    "error": f"Momento in feed has wrong layout: {layout}"
                                })
                            break
                    
                    if not momento_found:
                        print(f"❌ Momento not found in feed")
                        print(f"   📊 Total polls in feed: {len(polls)}")
                        self.test_results.append({
                            "test": "momento_in_feed",
                            "status": "FAIL",
                            "error": f"Created Momento not found in feed (searched {len(polls)} polls)"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ Feed retrieval failed: {response.status} - {error_text}")
                    self.test_results.append({
                        "test": "momento_in_feed",
                        "status": "FAIL",
                        "error": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            print(f"❌ Error checking feed: {str(e)}")
            self.test_results.append({
                "test": "momento_in_feed",
                "status": "ERROR",
                "error": str(e)
            })
    
    async def test_momento_voting(self):
        """Test voting functionality on the Momento"""
        print("\n🗳️ Testing Momento Voting...")
        
        if not self.created_poll_id:
            print("❌ No created poll ID available for testing")
            self.test_results.append({
                "test": "momento_voting",
                "status": "SKIP",
                "error": "No created poll ID"
            })
            return
        
        try:
            # First get the poll to find the option ID
            async with self.session.get(
                f"{BACKEND_URL}/polls/{self.created_poll_id}",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    poll_data = await response.json()
                    options = poll_data.get("options", [])
                    
                    if options:
                        option_id = options[0].get("id")
                        
                        # Now try to vote on the option
                        vote_data = {
                            "option_id": option_id
                        }
                        
                        async with self.session.post(
                            f"{BACKEND_URL}/polls/{self.created_poll_id}/vote",
                            json=vote_data,
                            headers={**self.get_auth_headers(), "Content-Type": "application/json"}
                        ) as vote_response:
                            
                            if vote_response.status == 200:
                                vote_result = await vote_response.json()
                                
                                print(f"✅ Vote cast successfully")
                                print(f"   🗳️ Option ID: {option_id}")
                                print(f"   📊 Vote result: {vote_result}")
                                
                                self.test_results.append({
                                    "test": "momento_voting",
                                    "status": "PASS",
                                    "option_id": option_id,
                                    "details": f"Successfully voted on Momento option"
                                })
                            else:
                                error_text = await vote_response.text()
                                print(f"❌ Voting failed: {vote_response.status} - {error_text}")
                                self.test_results.append({
                                    "test": "momento_voting",
                                    "status": "FAIL",
                                    "error": f"Voting HTTP {vote_response.status}: {error_text}"
                                })
                    else:
                        print(f"❌ No options found in poll")
                        self.test_results.append({
                            "test": "momento_voting",
                            "status": "FAIL",
                            "error": "No options found in poll for voting"
                        })
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to get poll for voting: {response.status} - {error_text}")
                    self.test_results.append({
                        "test": "momento_voting",
                        "status": "FAIL",
                        "error": f"Failed to get poll: HTTP {response.status}"
                    })
                    
        except Exception as e:
            print(f"❌ Error testing voting: {str(e)}")
            self.test_results.append({
                "test": "momento_voting",
                "status": "ERROR",
                "error": str(e)
            })
    
    async def test_layout_validation(self):
        """Test that invalid layouts are rejected"""
        print("\n🚫 Testing Layout Validation...")
        
        # Test with invalid layout
        invalid_data = {
            "title": "Test invalid layout",
            "options": [
                {
                    "text": "Test option",
                    "media_type": "image",
                    "media_url": "/api/uploads/test.jpg"
                }
            ],
            "layout": "invalid_layout",
            "tags": [],
            "mentioned_users": []
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/polls",
                json=invalid_data,
                headers={**self.get_auth_headers(), "Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                
                if response.status == 400 or response.status == 422:
                    print(f"✅ Invalid layout correctly rejected")
                    print(f"   📊 Status: {response.status}")
                    print(f"   📄 Response: {response_text[:200]}...")
                    
                    self.test_results.append({
                        "test": "layout_validation",
                        "status": "PASS",
                        "response_code": response.status,
                        "details": f"Invalid layout 'invalid_layout' correctly rejected with {response.status}"
                    })
                elif response.status == 200 or response.status == 201:
                    print(f"❌ Invalid layout was accepted (should be rejected)")
                    self.test_results.append({
                        "test": "layout_validation",
                        "status": "FAIL",
                        "error": f"Invalid layout 'invalid_layout' was accepted (HTTP {response.status})"
                    })
                else:
                    print(f"⚠️ Unexpected response: {response.status}")
                    self.test_results.append({
                        "test": "layout_validation",
                        "status": "PARTIAL",
                        "response_code": response.status,
                        "details": f"Unexpected response code {response.status} for invalid layout"
                    })
                    
        except Exception as e:
            print(f"❌ Error testing layout validation: {str(e)}")
            self.test_results.append({
                "test": "layout_validation",
                "status": "ERROR",
                "error": str(e)
            })
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📸 MOMENTO CREATION FLOW - TEST SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["status"] == "PASS"])
        failed_tests = len([t for t in self.test_results if t["status"] == "FAIL"])
        error_tests = len([t for t in self.test_results if t["status"] == "ERROR"])
        partial_tests = len([t for t in self.test_results if t["status"] == "PARTIAL"])
        skipped_tests = len([t for t in self.test_results if t["status"] == "SKIP"])
        
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"⚠️  Partial: {partial_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"💥 Errors: {error_tests}")
        print(f"⏭️  Skipped: {skipped_tests}")
        
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
            print("🎉 OVERALL ASSESSMENT: EXCELLENT - Momento creation flow is working correctly!")
        elif success_rate >= 60:
            print("👍 OVERALL ASSESSMENT: GOOD - Momento creation flow is mostly working with minor issues")
        elif success_rate >= 40:
            print("⚠️  OVERALL ASSESSMENT: NEEDS IMPROVEMENT - Some issues with Momento creation flow")
        else:
            print("❌ OVERALL ASSESSMENT: CRITICAL ISSUES - Momento creation flow needs significant fixes")
        
        return success_rate >= 60  # Return True if tests are generally successful

async def main():
    """Main test execution"""
    print("🚀 Starting Backend Testing for Momento Creation Flow")
    print("="*80)
    
    tester = MomentoTester()
    
    try:
        # Setup
        await tester.setup()
        
        if not tester.auth_token:
            print("❌ Cannot proceed without authentication")
            return False
        
        # Run tests in sequence
        print(f"\n🎯 Testing Momento Creation Flow with user ID: {tester.test_user_id}")
        
        # Test 1: Create a Momento
        await tester.test_momento_creation()
        
        # Test 2: Retrieve the created Momento
        await tester.test_momento_retrieval()
        
        # Test 3: Check if Momento appears in feed
        await tester.test_momento_in_feed()
        
        # Test 4: Test voting on the Momento
        await tester.test_momento_voting()
        
        # Test 5: Test layout validation
        await tester.test_layout_validation()
        
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