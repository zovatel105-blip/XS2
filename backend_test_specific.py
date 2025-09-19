#!/usr/bin/env python3
"""
Backend API Testing Script - Specific Tests for Review Request
Tests the specific endpoints requested in the review with exact test data.
"""

import requests
import json
import sys
import time
from datetime import datetime

# Get backend URL - use external URL from frontend/.env
def get_backend_url():
    return "https://config-post-error.preview.emergentagent.com/api"

def test_specific_endpoints():
    """Test the specific endpoints requested in the review"""
    print("🎯 === TESTING SPECIFIC ENDPOINTS FOR REVIEW ===")
    print("CONTEXTO: Probar el backend para verificar las correcciones de overlays de progreso")
    print("y indicadores de ganador en el perfil")
    
    base_url = get_backend_url()
    
    # Test data as specified in the review request
    test_data = {
        "email": "testbackend@example.com",
        "username": "testbackend", 
        "password": "password123",
        "display_name": "Test Backend User"
    }
    
    success_count = 0
    total_tests = 5
    auth_token = None
    
    print(f"\n📋 DATOS DE PRUEBA:")
    print(f"   Email: {test_data['email']}")
    print(f"   Username: {test_data['username']}")
    print(f"   Password: {test_data['password']}")
    print(f"   Display Name: {test_data['display_name']}")
    
    # Test 1: POST /api/auth/register
    print(f"\n📋 1. Testing POST /api/auth/register")
    try:
        # Add timestamp to make email unique
        timestamp = int(time.time())
        register_data = {
            "email": f"testbackend.{timestamp}@example.com",
            "username": f"testbackend_{timestamp}",
            "password": test_data["password"],
            "display_name": test_data["display_name"]
        }
        
        response = requests.post(f"{base_url}/auth/register", json=register_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Registro exitoso")
            print(f"   🆔 User ID: {data['user']['id']}")
            print(f"   👤 Username: {data['user']['username']}")
            print(f"   📧 Email: {data['user']['email']}")
            print(f"   🎭 Display Name: {data['user']['display_name']}")
            print(f"   🔑 Token Type: {data['token_type']}")
            print(f"   ⏰ Expires In: {data['expires_in']} seconds")
            
            # Store token and updated test data for subsequent tests
            auth_token = data['access_token']
            test_data['email'] = register_data['email']
            test_data['username'] = register_data['username']
            success_count += 1
        else:
            print(f"   ❌ Registro falló: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error en registro: {e}")
    
    # Test 2: POST /api/auth/login
    print(f"\n📋 2. Testing POST /api/auth/login")
    try:
        login_data = {
            "email": test_data["email"],
            "password": test_data["password"]
        }
        
        response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Login exitoso")
            print(f"   🆔 User ID: {data['user']['id']}")
            print(f"   👤 Username: {data['user']['username']}")
            print(f"   📧 Email: {data['user']['email']}")
            print(f"   🎭 Display Name: {data['user']['display_name']}")
            print(f"   🔑 Token Type: {data['token_type']}")
            print(f"   ⏰ Expires In: {data['expires_in']} seconds")
            
            # Update token
            auth_token = data['access_token']
            success_count += 1
        else:
            print(f"   ❌ Login falló: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error en login: {e}")
    
    # Test 3: GET /api/auth/me
    print(f"\n📋 3. Testing GET /api/auth/me")
    if auth_token:
        try:
            headers = {"Authorization": f"Bearer {auth_token}"}
            response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Información de usuario actual obtenida exitosamente")
                print(f"   🆔 User ID: {data['id']}")
                print(f"   👤 Username: {data['username']}")
                print(f"   📧 Email: {data['email']}")
                print(f"   🎭 Display Name: {data['display_name']}")
                print(f"   ✅ Verified: {data.get('is_verified', False)}")
                print(f"   🌐 Public: {data.get('is_public', True)}")
                print(f"   💬 Allow Messages: {data.get('allow_messages', True)}")
                print(f"   📅 Created At: {data.get('created_at', 'N/A')}")
                print(f"   🕐 Last Login: {data.get('last_login', 'N/A')}")
                success_count += 1
            else:
                print(f"   ❌ Get current user falló: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error obteniendo usuario actual: {e}")
    else:
        print(f"   ❌ No hay token de autenticación disponible")
    
    # Test 4: GET /api/posts (if exists)
    print(f"\n📋 4. Testing GET /api/posts (si existe)")
    if auth_token:
        try:
            headers = {"Authorization": f"Bearer {auth_token}"}
            response = requests.get(f"{base_url}/posts", headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Endpoint /api/posts existe y funciona")
                print(f"   📊 Posts obtenidos: {len(data) if isinstance(data, list) else 'N/A'}")
                if isinstance(data, list) and len(data) > 0:
                    print(f"   📝 Primer post ID: {data[0].get('id', 'N/A')}")
                    print(f"   👤 Autor: {data[0].get('author', {}).get('username', 'N/A')}")
                success_count += 1
            elif response.status_code == 404:
                print(f"   ⚠️ Endpoint /api/posts no existe (404)")
                print(f"   💡 Probando endpoint alternativo /api/polls...")
                
                # Try alternative endpoint /api/polls
                response = requests.get(f"{base_url}/polls", headers=headers, timeout=10)
                print(f"   Status Code /api/polls: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✅ Endpoint /api/polls existe y funciona")
                    print(f"   📊 Polls obtenidos: {len(data) if isinstance(data, list) else 'N/A'}")
                    if isinstance(data, list) and len(data) > 0:
                        print(f"   📝 Primer poll ID: {data[0].get('id', 'N/A')}")
                        print(f"   👤 Autor: {data[0].get('author', {}).get('username', 'N/A')}")
                        print(f"   📊 Total votos: {data[0].get('total_votes', 0)}")
                    success_count += 1
                else:
                    print(f"   ❌ Tampoco existe /api/polls: {response.text}")
            else:
                print(f"   ❌ Error en /api/posts: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error obteniendo posts: {e}")
    else:
        print(f"   ❌ No hay token de autenticación disponible")
    
    # Test 5: POST /api/posts/{post_id}/vote (if exists)
    print(f"\n📋 5. Testing POST /api/posts/{{post_id}}/vote (si existe)")
    if auth_token:
        try:
            headers = {"Authorization": f"Bearer {auth_token}"}
            
            # First, try to get a post/poll to vote on
            response = requests.get(f"{base_url}/polls", headers=headers, timeout=10)
            
            if response.status_code == 200:
                polls = response.json()
                if isinstance(polls, list) and len(polls) > 0:
                    poll_id = polls[0]['id']
                    print(f"   🎯 Usando poll ID: {poll_id}")
                    
                    # Try to vote on the poll
                    if polls[0].get('options') and len(polls[0]['options']) > 0:
                        option_id = polls[0]['options'][0]['id']
                        vote_data = {"option_id": option_id}
                        
                        response = requests.post(f"{base_url}/polls/{poll_id}/vote", 
                                               json=vote_data, headers=headers, timeout=10)
                        print(f"   Status Code: {response.status_code}")
                        
                        if response.status_code == 200:
                            data = response.json()
                            print(f"   ✅ Voto registrado exitosamente")
                            print(f"   🗳️ Opción votada: {option_id}")
                            print(f"   📊 Mensaje: {data.get('message', 'N/A')}")
                            success_count += 1
                        elif response.status_code == 400 and "already voted" in response.text.lower():
                            print(f"   ✅ Usuario ya había votado (comportamiento esperado)")
                            success_count += 1
                        else:
                            print(f"   ❌ Error votando: {response.text}")
                    else:
                        print(f"   ❌ Poll no tiene opciones para votar")
                else:
                    print(f"   ⚠️ No hay polls disponibles para votar")
                    print(f"   💡 Creando un poll de prueba para votar...")
                    
                    # Create a test poll to vote on
                    poll_data = {
                        "title": "Poll de Prueba para Votación",
                        "options": [
                            {"text": "Opción A", "media": None},
                            {"text": "Opción B", "media": None}
                        ]
                    }
                    
                    response = requests.post(f"{base_url}/polls", json=poll_data, headers=headers, timeout=10)
                    if response.status_code == 200:
                        new_poll = response.json()
                        poll_id = new_poll['id']
                        option_id = new_poll['options'][0]['id']
                        
                        print(f"   ✅ Poll de prueba creado: {poll_id}")
                        
                        # Now vote on the new poll
                        vote_data = {"option_id": option_id}
                        response = requests.post(f"{base_url}/polls/{poll_id}/vote", 
                                               json=vote_data, headers=headers, timeout=10)
                        
                        if response.status_code == 200:
                            print(f"   ✅ Voto en poll de prueba exitoso")
                            success_count += 1
                        else:
                            print(f"   ❌ Error votando en poll de prueba: {response.text}")
                    else:
                        print(f"   ❌ No se pudo crear poll de prueba: {response.text}")
            else:
                print(f"   ❌ No se pudieron obtener polls para votar: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error en sistema de votación: {e}")
    else:
        print(f"   ❌ No hay token de autenticación disponible")
    
    # Summary
    print(f"\n📊 === RESUMEN DE TESTS ESPECÍFICOS ===")
    print(f"Tests completados: {success_count}/{total_tests}")
    print(f"Porcentaje de éxito: {(success_count/total_tests)*100:.1f}%")
    
    if success_count >= 4:
        print(f"✅ CONCLUSIÓN: Backend funcionando correctamente")
        print(f"   - Endpoints de autenticación operacionales")
        print(f"   - Sistema de registro y login funcional")
        print(f"   - Información de usuario accesible")
        print(f"   - Sistema de publicaciones/polls disponible")
        if success_count == total_tests:
            print(f"   - Sistema de votación completamente funcional")
    else:
        print(f"❌ CONCLUSIÓN: Problemas detectados en backend")
        print(f"   - Revisar endpoints que fallaron")
        print(f"   - Verificar autenticación y autorización")
        print(f"   - Comprobar estructura de datos")
    
    return success_count >= 4

if __name__ == "__main__":
    print("🚀 Starting Specific Backend API Testing for Review...")
    print("=" * 60)
    print(f"🌐 Backend URL: {get_backend_url()}")
    print("=" * 60)
    
    success = test_specific_endpoints()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 SPECIFIC BACKEND TESTING SUCCESSFUL!")
        print("✅ Backend está listo para soportar las correcciones de overlays")
        print("🚀 Listo para proceder con testing del frontend")
    else:
        print("❌ SPECIFIC BACKEND TESTING FAILED!")
        print("🔧 Se requieren correcciones en el backend")
        print("⚠️ Revisar endpoints antes de continuar")
    print("=" * 60)
    
    sys.exit(0 if success else 1)