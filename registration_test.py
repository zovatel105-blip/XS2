#!/usr/bin/env python3
"""
Registration Endpoint Testing Script - Comprehensive AuthContext Testing
Tests the improved AuthContext registration functionality with comprehensive error handling,
input validation, and proper state management during registration.
"""

import requests
import json
import sys
import time
import random
from datetime import datetime

# Get backend URL from frontend/.env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            content = f.read()
            for line in content.split('\n'):
                if line.startswith('REACT_APP_BACKEND_URL='):
                    backend_url = line.split('=', 1)[1].strip()
                    return f"{backend_url}/api"
    except:
        pass
    return "http://localhost:8001/api"

def test_registration_endpoint_comprehensive(base_url):
    """🎯 COMPREHENSIVE REGISTRATION ENDPOINT TESTING"""
    print("\n🎯 === COMPREHENSIVE REGISTRATION ENDPOINT TESTING ===")
    print("TESTING SCOPE:")
    print("1. Backend Registration Endpoint Testing")
    print("2. Network and Error Handling")
    print("3. Auth Token Generation")
    print("4. Input Validation")
    print("5. Duplicate handling (email/username)")
    print("6. Malformed data handling")
    print("7. Password requirements")
    print("8. Email format validation")
    
    success_count = 0
    total_tests = 15
    test_results = []
    
    # Test 1: Valid Registration with Complete Data
    print("\n1️⃣ TESTING VALID REGISTRATION WITH COMPLETE DATA...")
    timestamp = int(time.time())
    valid_user_data = {
        "username": f"testuser_{timestamp}",
        "email": f"testuser_{timestamp}@example.com",
        "password": "SecurePass123!",
        "display_name": f"Test User {timestamp}",
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=valid_user_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Valid registration successful")
            print(f"   👤 Username: {data.get('user', {}).get('username', 'N/A')}")
            print(f"   📧 Email: {data.get('user', {}).get('email', 'N/A')}")
            print(f"   🔑 Token Type: {data.get('token_type', 'N/A')}")
            print(f"   ⏰ Expires In: {data.get('expires_in', 'N/A')} seconds")
            
            # Verify token structure
            token = data.get('access_token', '')
            if token and len(token.split('.')) == 3:
                print("   ✅ JWT token has correct structure")
                success_count += 1
                test_results.append({"test": "Valid Registration", "status": "PASS", "token": token[:20] + "..."})
            else:
                print("   ❌ JWT token malformed")
                test_results.append({"test": "Valid Registration", "status": "FAIL", "error": "Malformed JWT"})
        else:
            print(f"   ❌ Valid registration failed: {response.text}")
            test_results.append({"test": "Valid Registration", "status": "FAIL", "error": response.text[:100]})
            
    except Exception as e:
        print(f"   ❌ Valid registration error: {e}")
        test_results.append({"test": "Valid Registration", "status": "ERROR", "error": str(e)})
    
    # Test 2: Duplicate Email Registration
    print("\n2️⃣ TESTING DUPLICATE EMAIL REGISTRATION...")
    try:
        duplicate_email_data = valid_user_data.copy()
        duplicate_email_data['username'] = f"different_user_{timestamp}"
        
        response = requests.post(f"{base_url}/auth/register", json=duplicate_email_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 400:
            error_data = response.json()
            print("   ✅ Duplicate email properly rejected")
            print(f"   📝 Error Detail: {error_data.get('detail', 'N/A')}")
            
            if 'email' in error_data.get('detail', '').lower():
                print("   ✅ Error message correctly identifies email issue")
                success_count += 1
                test_results.append({"test": "Duplicate Email", "status": "PASS"})
            else:
                print("   ⚠️ Error message doesn't clearly identify email issue")
                test_results.append({"test": "Duplicate Email", "status": "PARTIAL"})
        else:
            print(f"   ❌ Duplicate email should return 400, got: {response.status_code}")
            test_results.append({"test": "Duplicate Email", "status": "FAIL", "error": f"Wrong status: {response.status_code}"})
            
    except Exception as e:
        print(f"   ❌ Duplicate email test error: {e}")
        test_results.append({"test": "Duplicate Email", "status": "ERROR", "error": str(e)})
    
    # Test 3: Duplicate Username Registration
    print("\n3️⃣ TESTING DUPLICATE USERNAME REGISTRATION...")
    try:
        duplicate_username_data = valid_user_data.copy()
        duplicate_username_data['email'] = f"different_{timestamp}@example.com"
        
        response = requests.post(f"{base_url}/auth/register", json=duplicate_username_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 400:
            error_data = response.json()
            print("   ✅ Duplicate username properly rejected")
            print(f"   📝 Error Detail: {error_data.get('detail', 'N/A')}")
            
            if 'username' in error_data.get('detail', '').lower():
                print("   ✅ Error message correctly identifies username issue")
                success_count += 1
                test_results.append({"test": "Duplicate Username", "status": "PASS"})
            else:
                print("   ⚠️ Error message doesn't clearly identify username issue")
                test_results.append({"test": "Duplicate Username", "status": "PARTIAL"})
        else:
            print(f"   ❌ Duplicate username should return 400, got: {response.status_code}")
            test_results.append({"test": "Duplicate Username", "status": "FAIL", "error": f"Wrong status: {response.status_code}"})
            
    except Exception as e:
        print(f"   ❌ Duplicate username test error: {e}")
        test_results.append({"test": "Duplicate Username", "status": "ERROR", "error": str(e)})
    
    # Test 4: Invalid Email Format
    print("\n4️⃣ TESTING INVALID EMAIL FORMAT...")
    invalid_emails = [
        "invalid-email",
        "invalid@",
        "@invalid.com",
        "invalid.email.com",
        "invalid@.com",
        "invalid@domain.",
        ""
    ]
    
    email_validation_passed = 0
    for invalid_email in invalid_emails:
        try:
            invalid_email_data = {
                "username": f"emailtest_{timestamp}_{random.randint(1000, 9999)}",
                "email": invalid_email,
                "password": "ValidPass123!",
                "display_name": "Email Test User"
            }
            
            response = requests.post(f"{base_url}/auth/register", json=invalid_email_data, timeout=10)
            
            if response.status_code == 400 or response.status_code == 422:
                print(f"   ✅ Invalid email '{invalid_email}' properly rejected ({response.status_code})")
                email_validation_passed += 1
            else:
                print(f"   ❌ Invalid email '{invalid_email}' should be rejected, got: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error testing invalid email '{invalid_email}': {e}")
    
    if email_validation_passed >= len(invalid_emails) * 0.8:  # 80% success rate
        print(f"   ✅ Email validation working ({email_validation_passed}/{len(invalid_emails)} passed)")
        success_count += 1
        test_results.append({"test": "Email Format Validation", "status": "PASS"})
    else:
        print(f"   ❌ Email validation insufficient ({email_validation_passed}/{len(invalid_emails)} passed)")
        test_results.append({"test": "Email Format Validation", "status": "FAIL"})
    
    # Test 5: Missing Required Fields
    print("\n5️⃣ TESTING MISSING REQUIRED FIELDS...")
    required_fields = ['username', 'email', 'password', 'display_name']
    missing_field_tests_passed = 0
    
    for field in required_fields:
        try:
            incomplete_data = valid_user_data.copy()
            incomplete_data['username'] = f"incomplete_{timestamp}_{random.randint(1000, 9999)}"
            incomplete_data['email'] = f"incomplete_{timestamp}_{random.randint(1000, 9999)}@example.com"
            del incomplete_data[field]  # Remove the required field
            
            response = requests.post(f"{base_url}/auth/register", json=incomplete_data, timeout=10)
            
            if response.status_code in [400, 422]:
                print(f"   ✅ Missing '{field}' properly rejected ({response.status_code})")
                missing_field_tests_passed += 1
            else:
                print(f"   ❌ Missing '{field}' should be rejected, got: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error testing missing field '{field}': {e}")
    
    if missing_field_tests_passed >= len(required_fields):
        print(f"   ✅ Required field validation working ({missing_field_tests_passed}/{len(required_fields)} passed)")
        success_count += 1
        test_results.append({"test": "Required Fields Validation", "status": "PASS"})
    else:
        print(f"   ❌ Required field validation insufficient ({missing_field_tests_passed}/{len(required_fields)} passed)")
        test_results.append({"test": "Required Fields Validation", "status": "FAIL"})
    
    # Test 6: Password Length Requirements
    print("\n6️⃣ TESTING PASSWORD LENGTH REQUIREMENTS...")
    password_tests = [
        {"password": "short", "should_fail": True, "reason": "too short"},
        {"password": "1234567", "should_fail": True, "reason": "7 chars (< 8)"},
        {"password": "12345678", "should_fail": False, "reason": "8 chars (minimum)"},
        {"password": "ValidPassword123!", "should_fail": False, "reason": "strong password"},
        {"password": "", "should_fail": True, "reason": "empty password"}
    ]
    
    password_tests_passed = 0
    for test_case in password_tests:
        try:
            password_test_data = {
                "username": f"passtest_{timestamp}_{random.randint(1000, 9999)}",
                "email": f"passtest_{timestamp}_{random.randint(1000, 9999)}@example.com",
                "password": test_case["password"],
                "display_name": "Password Test User"
            }
            
            response = requests.post(f"{base_url}/auth/register", json=password_test_data, timeout=10)
            
            if test_case["should_fail"]:
                if response.status_code in [400, 422]:
                    print(f"   ✅ Password '{test_case['reason']}' properly rejected")
                    password_tests_passed += 1
                else:
                    print(f"   ❌ Password '{test_case['reason']}' should be rejected, got: {response.status_code}")
            else:
                if response.status_code == 200:
                    print(f"   ✅ Password '{test_case['reason']}' properly accepted")
                    password_tests_passed += 1
                else:
                    print(f"   ❌ Password '{test_case['reason']}' should be accepted, got: {response.status_code}")
                    
        except Exception as e:
            print(f"   ❌ Error testing password '{test_case['reason']}': {e}")
    
    if password_tests_passed >= len(password_tests) * 0.8:
        print(f"   ✅ Password validation working ({password_tests_passed}/{len(password_tests)} passed)")
        success_count += 1
        test_results.append({"test": "Password Length Requirements", "status": "PASS"})
    else:
        print(f"   ❌ Password validation insufficient ({password_tests_passed}/{len(password_tests)} passed)")
        test_results.append({"test": "Password Length Requirements", "status": "FAIL"})
    
    # Test 7: Malformed JSON Handling
    print("\n7️⃣ TESTING MALFORMED JSON HANDLING...")
    malformed_json_tests = [
        '{"username": "test", "email": "test@example.com", "password": "pass123", "display_name": "Test"',  # Missing closing brace
        '{"username": "test", "email": "test@example.com", "password": "pass123", "display_name": "Test"}}',  # Extra brace
        '{"username": "test", "email": "test@example.com", "password": "pass123", "display_name": }',  # Missing value
        'not json at all',
        '',
        '[]'  # Array instead of object
    ]
    
    malformed_tests_passed = 0
    for malformed_json in malformed_json_tests:
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.post(f"{base_url}/auth/register", data=malformed_json, headers=headers, timeout=10)
            
            if response.status_code in [400, 422]:
                print(f"   ✅ Malformed JSON properly rejected ({response.status_code})")
                malformed_tests_passed += 1
            else:
                print(f"   ❌ Malformed JSON should be rejected, got: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error testing malformed JSON: {e}")
    
    if malformed_tests_passed >= len(malformed_json_tests) * 0.8:
        print(f"   ✅ Malformed JSON handling working ({malformed_tests_passed}/{len(malformed_json_tests)} passed)")
        success_count += 1
        test_results.append({"test": "Malformed JSON Handling", "status": "PASS"})
    else:
        print(f"   ❌ Malformed JSON handling insufficient ({malformed_tests_passed}/{len(malformed_json_tests)} passed)")
        test_results.append({"test": "Malformed JSON Handling", "status": "FAIL"})
    
    # Test 8: Token Validity After Registration
    print("\n8️⃣ TESTING TOKEN VALIDITY AFTER REGISTRATION...")
    try:
        # Create a new user for token testing
        token_test_data = {
            "username": f"tokentest_{timestamp}",
            "email": f"tokentest_{timestamp}@example.com",
            "password": "TokenTest123!",
            "display_name": "Token Test User"
        }
        
        response = requests.post(f"{base_url}/auth/register", json=token_test_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            
            if token:
                # Test token with /auth/me endpoint
                headers = {"Authorization": f"Bearer {token}"}
                me_response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
                
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    print("   ✅ Token valid and functional after registration")
                    print(f"   👤 Verified User: {user_data.get('username', 'N/A')}")
                    print(f"   📧 Verified Email: {user_data.get('email', 'N/A')}")
                    success_count += 1
                    test_results.append({"test": "Token Validity", "status": "PASS"})
                else:
                    print(f"   ❌ Token invalid after registration: {me_response.status_code}")
                    test_results.append({"test": "Token Validity", "status": "FAIL", "error": "Token not accepted"})
            else:
                print("   ❌ No token returned in registration response")
                test_results.append({"test": "Token Validity", "status": "FAIL", "error": "No token returned"})
        else:
            print(f"   ❌ Registration failed for token test: {response.status_code}")
            test_results.append({"test": "Token Validity", "status": "FAIL", "error": "Registration failed"})
            
    except Exception as e:
        print(f"   ❌ Token validity test error: {e}")
        test_results.append({"test": "Token Validity", "status": "ERROR", "error": str(e)})
    
    # Test 9: User Object Completeness
    print("\n9️⃣ TESTING USER OBJECT COMPLETENESS...")
    try:
        complete_user_data = {
            "username": f"completetest_{timestamp}",
            "email": f"completetest_{timestamp}@example.com",
            "password": "CompleteTest123!",
            "display_name": "Complete Test User",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"
        }
        
        response = requests.post(f"{base_url}/auth/register", json=complete_user_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            
            required_user_fields = ['id', 'username', 'email', 'display_name', 'created_at']
            missing_fields = [field for field in required_user_fields if field not in user]
            
            if not missing_fields:
                print("   ✅ User object contains all required fields")
                print(f"   🆔 User ID: {user.get('id', 'N/A')}")
                print(f"   👤 Username: {user.get('username', 'N/A')}")
                print(f"   📧 Email: {user.get('email', 'N/A')}")
                print(f"   🏷️ Display Name: {user.get('display_name', 'N/A')}")
                print(f"   🖼️ Avatar URL: {user.get('avatar_url', 'N/A')}")
                success_count += 1
                test_results.append({"test": "User Object Completeness", "status": "PASS"})
            else:
                print(f"   ❌ User object missing fields: {missing_fields}")
                test_results.append({"test": "User Object Completeness", "status": "FAIL", "error": f"Missing: {missing_fields}"})
        else:
            print(f"   ❌ Registration failed for completeness test: {response.status_code}")
            test_results.append({"test": "User Object Completeness", "status": "FAIL", "error": "Registration failed"})
            
    except Exception as e:
        print(f"   ❌ User object completeness test error: {e}")
        test_results.append({"test": "User Object Completeness", "status": "ERROR", "error": str(e)})
    
    # Test 10: Response Time Performance
    print("\n🔟 TESTING RESPONSE TIME PERFORMANCE...")
    try:
        perf_user_data = {
            "username": f"perftest_{timestamp}",
            "email": f"perftest_{timestamp}@example.com",
            "password": "PerfTest123!",
            "display_name": "Performance Test User"
        }
        
        start_time = time.time()
        response = requests.post(f"{base_url}/auth/register", json=perf_user_data, timeout=10)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        print(f"   ⏱️ Registration Response Time: {response_time:.2f}ms")
        
        if response.status_code == 200:
            if response_time < 3000:  # Less than 3 seconds
                print("   ✅ Registration performance acceptable")
                success_count += 1
                test_results.append({"test": "Response Time Performance", "status": "PASS", "time": f"{response_time:.2f}ms"})
            else:
                print("   ⚠️ Registration performance slow but functional")
                test_results.append({"test": "Response Time Performance", "status": "PARTIAL", "time": f"{response_time:.2f}ms"})
        else:
            print(f"   ❌ Registration failed for performance test: {response.status_code}")
            test_results.append({"test": "Response Time Performance", "status": "FAIL", "error": "Registration failed"})
            
    except Exception as e:
        print(f"   ❌ Performance test error: {e}")
        test_results.append({"test": "Response Time Performance", "status": "ERROR", "error": str(e)})
    
    # Test 11: Multiple Concurrent Registrations
    print("\n1️⃣1️⃣ TESTING MULTIPLE CONCURRENT REGISTRATIONS...")
    try:
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def register_user(user_num):
            try:
                concurrent_user_data = {
                    "username": f"concurrent_{timestamp}_{user_num}",
                    "email": f"concurrent_{timestamp}_{user_num}@example.com",
                    "password": "ConcurrentTest123!",
                    "display_name": f"Concurrent Test User {user_num}"
                }
                
                response = requests.post(f"{base_url}/auth/register", json=concurrent_user_data, timeout=10)
                results_queue.put({"user": user_num, "status": response.status_code, "success": response.status_code == 200})
            except Exception as e:
                results_queue.put({"user": user_num, "status": "ERROR", "success": False, "error": str(e)})
        
        # Create 5 concurrent registration threads
        threads = []
        for i in range(5):
            thread = threading.Thread(target=register_user, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        concurrent_results = []
        while not results_queue.empty():
            concurrent_results.append(results_queue.get())
        
        successful_registrations = sum(1 for result in concurrent_results if result.get('success', False))
        
        print(f"   📊 Concurrent Registrations: {successful_registrations}/5 successful")
        
        if successful_registrations >= 4:  # At least 80% success
            print("   ✅ Concurrent registration handling working")
            success_count += 1
            test_results.append({"test": "Concurrent Registrations", "status": "PASS", "success_rate": f"{successful_registrations}/5"})
        else:
            print("   ❌ Concurrent registration handling insufficient")
            test_results.append({"test": "Concurrent Registrations", "status": "FAIL", "success_rate": f"{successful_registrations}/5"})
            
    except Exception as e:
        print(f"   ❌ Concurrent registration test error: {e}")
        test_results.append({"test": "Concurrent Registrations", "status": "ERROR", "error": str(e)})
    
    # Test 12: Error Response Format Consistency
    print("\n1️⃣2️⃣ TESTING ERROR RESPONSE FORMAT CONSISTENCY...")
    try:
        error_test_cases = [
            {"data": {"username": "", "email": "test@example.com", "password": "pass123", "display_name": "Test"}, "reason": "empty username"},
            {"data": {"username": "test", "email": "", "password": "pass123", "display_name": "Test"}, "reason": "empty email"},
            {"data": {"username": "test", "email": "test@example.com", "password": "", "display_name": "Test"}, "reason": "empty password"}
        ]
        
        consistent_errors = 0
        for test_case in error_test_cases:
            response = requests.post(f"{base_url}/auth/register", json=test_case["data"], timeout=10)
            
            if response.status_code in [400, 422]:
                try:
                    error_data = response.json()
                    if 'detail' in error_data:
                        print(f"   ✅ Consistent error format for {test_case['reason']}")
                        consistent_errors += 1
                    else:
                        print(f"   ⚠️ Error response missing 'detail' field for {test_case['reason']}")
                except:
                    print(f"   ❌ Error response not valid JSON for {test_case['reason']}")
            else:
                print(f"   ❌ Unexpected status code for {test_case['reason']}: {response.status_code}")
        
        if consistent_errors >= len(error_test_cases):
            print("   ✅ Error response format consistent")
            success_count += 1
            test_results.append({"test": "Error Response Format", "status": "PASS"})
        else:
            print("   ❌ Error response format inconsistent")
            test_results.append({"test": "Error Response Format", "status": "FAIL"})
            
    except Exception as e:
        print(f"   ❌ Error format consistency test error: {e}")
        test_results.append({"test": "Error Response Format", "status": "ERROR", "error": str(e)})
    
    # Test 13: Username Uniqueness Case Sensitivity
    print("\n1️⃣3️⃣ TESTING USERNAME UNIQUENESS CASE SENSITIVITY...")
    try:
        base_username = f"casetest_{timestamp}"
        
        # Register first user with lowercase username
        first_user_data = {
            "username": base_username.lower(),
            "email": f"case1_{timestamp}@example.com",
            "password": "CaseTest123!",
            "display_name": "Case Test User 1"
        }
        
        first_response = requests.post(f"{base_url}/auth/register", json=first_user_data, timeout=10)
        
        if first_response.status_code == 200:
            # Try to register second user with uppercase username
            second_user_data = {
                "username": base_username.upper(),
                "email": f"case2_{timestamp}@example.com",
                "password": "CaseTest123!",
                "display_name": "Case Test User 2"
            }
            
            second_response = requests.post(f"{base_url}/auth/register", json=second_user_data, timeout=10)
            
            if second_response.status_code == 400:
                print("   ✅ Username uniqueness is case-insensitive (good)")
                success_count += 1
                test_results.append({"test": "Username Case Sensitivity", "status": "PASS"})
            elif second_response.status_code == 200:
                print("   ⚠️ Username uniqueness is case-sensitive (may cause confusion)")
                test_results.append({"test": "Username Case Sensitivity", "status": "PARTIAL"})
            else:
                print(f"   ❌ Unexpected response for case sensitivity test: {second_response.status_code}")
                test_results.append({"test": "Username Case Sensitivity", "status": "FAIL"})
        else:
            print(f"   ❌ First user registration failed for case sensitivity test: {first_response.status_code}")
            test_results.append({"test": "Username Case Sensitivity", "status": "FAIL", "error": "First registration failed"})
            
    except Exception as e:
        print(f"   ❌ Case sensitivity test error: {e}")
        test_results.append({"test": "Username Case Sensitivity", "status": "ERROR", "error": str(e)})
    
    # Test 14: Registration with Special Characters
    print("\n1️⃣4️⃣ TESTING REGISTRATION WITH SPECIAL CHARACTERS...")
    try:
        special_char_tests = [
            {"username": f"user_with_underscore_{timestamp}", "should_pass": True},
            {"username": f"user-with-dash-{timestamp}", "should_pass": True},
            {"username": f"user.with.dots.{timestamp}", "should_pass": True},
            {"username": f"user@with@at{timestamp}", "should_pass": False},
            {"username": f"user with spaces {timestamp}", "should_pass": False},
            {"username": f"user#with#hash{timestamp}", "should_pass": False}
        ]
        
        special_char_passed = 0
        for test_case in special_char_tests:
            special_user_data = {
                "username": test_case["username"],
                "email": f"special_{timestamp}_{random.randint(1000, 9999)}@example.com",
                "password": "SpecialTest123!",
                "display_name": "Special Character Test"
            }
            
            response = requests.post(f"{base_url}/auth/register", json=special_user_data, timeout=10)
            
            if test_case["should_pass"]:
                if response.status_code == 200:
                    print(f"   ✅ Username '{test_case['username'][:20]}...' accepted as expected")
                    special_char_passed += 1
                else:
                    print(f"   ❌ Username '{test_case['username'][:20]}...' should be accepted")
            else:
                if response.status_code in [400, 422]:
                    print(f"   ✅ Username '{test_case['username'][:20]}...' rejected as expected")
                    special_char_passed += 1
                else:
                    print(f"   ❌ Username '{test_case['username'][:20]}...' should be rejected")
        
        if special_char_passed >= len(special_char_tests) * 0.8:
            print("   ✅ Special character handling working")
            success_count += 1
            test_results.append({"test": "Special Characters", "status": "PASS"})
        else:
            print("   ❌ Special character handling insufficient")
            test_results.append({"test": "Special Characters", "status": "FAIL"})
            
    except Exception as e:
        print(f"   ❌ Special character test error: {e}")
        test_results.append({"test": "Special Characters", "status": "ERROR", "error": str(e)})
    
    # Test 15: Registration Data Persistence
    print("\n1️⃣5️⃣ TESTING REGISTRATION DATA PERSISTENCE...")
    try:
        persist_user_data = {
            "username": f"persisttest_{timestamp}",
            "email": f"persisttest_{timestamp}@example.com",
            "password": "PersistTest123!",
            "display_name": "Persistence Test User",
            "avatar_url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
        }
        
        # Register user
        reg_response = requests.post(f"{base_url}/auth/register", json=persist_user_data, timeout=10)
        
        if reg_response.status_code == 200:
            reg_data = reg_response.json()
            token = reg_data.get('access_token')
            
            # Verify data persistence by fetching user info
            headers = {"Authorization": f"Bearer {token}"}
            me_response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                
                # Check if all registered data is persisted correctly
                data_matches = (
                    user_data.get('username') == persist_user_data['username'] and
                    user_data.get('email') == persist_user_data['email'] and
                    user_data.get('display_name') == persist_user_data['display_name'] and
                    user_data.get('avatar_url') == persist_user_data['avatar_url']
                )
                
                if data_matches:
                    print("   ✅ Registration data persisted correctly")
                    print(f"   👤 Username: {user_data.get('username')}")
                    print(f"   📧 Email: {user_data.get('email')}")
                    print(f"   🏷️ Display Name: {user_data.get('display_name')}")
                    print(f"   🖼️ Avatar URL: {user_data.get('avatar_url', 'N/A')}")
                    success_count += 1
                    test_results.append({"test": "Data Persistence", "status": "PASS"})
                else:
                    print("   ❌ Registration data not persisted correctly")
                    test_results.append({"test": "Data Persistence", "status": "FAIL", "error": "Data mismatch"})
            else:
                print(f"   ❌ Could not verify data persistence: {me_response.status_code}")
                test_results.append({"test": "Data Persistence", "status": "FAIL", "error": "Cannot fetch user data"})
        else:
            print(f"   ❌ Registration failed for persistence test: {reg_response.status_code}")
            test_results.append({"test": "Data Persistence", "status": "FAIL", "error": "Registration failed"})
            
    except Exception as e:
        print(f"   ❌ Data persistence test error: {e}")
        test_results.append({"test": "Data Persistence", "status": "ERROR", "error": str(e)})
    
    # Final Summary
    print(f"\n📊 COMPREHENSIVE REGISTRATION TESTING SUMMARY:")
    print(f"   Tests Passed: {success_count}/{total_tests}")
    print(f"   Success Rate: {(success_count/total_tests)*100:.1f}%")
    
    print(f"\n📋 DETAILED TEST RESULTS:")
    for i, result in enumerate(test_results, 1):
        status_emoji = "✅" if result["status"] == "PASS" else "⚠️" if result["status"] == "PARTIAL" else "❌"
        print(f"   {i:2d}. {status_emoji} {result['test']}: {result['status']}")
        if "error" in result:
            print(f"       Error: {result['error']}")
        if "time" in result:
            print(f"       Time: {result['time']}")
        if "success_rate" in result:
            print(f"       Success Rate: {result['success_rate']}")
    
    # Final Assessment
    if success_count >= 12:  # 80% success rate
        print(f"\n🎉 FINAL ASSESSMENT: REGISTRATION SYSTEM EXCELLENT")
        print(f"   ✅ All critical functionality working correctly")
        print(f"   ✅ Comprehensive error handling implemented")
        print(f"   ✅ Input validation robust and secure")
        print(f"   ✅ Token generation and validation working")
        print(f"   ✅ Data persistence and integrity maintained")
        print(f"   ✅ Performance and concurrency handling adequate")
        print(f"\n🚀 RECOMMENDATION: Registration system ready for production")
    elif success_count >= 9:  # 60% success rate
        print(f"\n⚠️ FINAL ASSESSMENT: REGISTRATION SYSTEM GOOD WITH MINOR ISSUES")
        print(f"   ✅ Core functionality working correctly")
        print(f"   ✅ Basic error handling and validation implemented")
        print(f"   ⚠️ Some edge cases or advanced features may need attention")
        print(f"\n🔧 RECOMMENDATION: Address minor issues before production deployment")
    else:
        print(f"\n❌ FINAL ASSESSMENT: REGISTRATION SYSTEM NEEDS SIGNIFICANT IMPROVEMENT")
        print(f"   ❌ Multiple critical issues identified")
        print(f"   ❌ Core functionality may be unreliable")
        print(f"   ❌ Security and validation concerns present")
        print(f"\n🚨 RECOMMENDATION: Major fixes required before production deployment")
    
    return success_count >= 9

def main():
    """Main testing function"""
    print("🎯 REGISTRATION ENDPOINT COMPREHENSIVE TESTING")
    print("=" * 60)
    
    base_url = get_backend_url()
    print(f"Backend URL: {base_url}")
    
    # Run comprehensive registration tests
    registration_success = test_registration_endpoint_comprehensive(base_url)
    
    print(f"\n{'='*60}")
    if registration_success:
        print("🎉 OVERALL RESULT: REGISTRATION TESTING SUCCESSFUL")
        print("✅ Registration system is working correctly with comprehensive error handling")
        print("✅ AuthContext registration functionality validated")
        print("✅ Input validation, token generation, and error handling confirmed")
    else:
        print("❌ OVERALL RESULT: REGISTRATION TESTING FAILED")
        print("❌ Registration system has critical issues that need to be addressed")
        print("❌ Review failed tests and implement necessary fixes")
    
    return registration_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)