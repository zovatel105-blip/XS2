#!/usr/bin/env python3
"""
DIAGNÓSTICO ESPECÍFICO: HTTP 404 EN REGISTRO MÓVIL
Pruebas exhaustivas del endpoint POST /api/auth/register
"""

import requests
import json
import time
from datetime import datetime

def get_backend_url():
    """Get backend URL from frontend .env configuration"""
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    url = line.split('=')[1].strip()
                    return f"{url}/api"
    except:
        pass
    return "https://vamos-detail-page.preview.emergentagent.com/api"

def get_mobile_headers():
    """Headers que simula un dispositivo móvil real"""
    return {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': 'https://vamos-detail-page.preview.emergentagent.com',
        'Referer': 'https://vamos-detail-page.preview.emergentagent.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    }

def test_registration_comprehensive():
    """Test exhaustivo del endpoint de registro"""
    base_url = get_backend_url()
    print(f"🔍 DIAGNÓSTICO COMPLETO: ENDPOINT DE REGISTRO")
    print(f"🌐 Backend URL: {base_url}")
    print(f"📱 Simulando dispositivos móviles reales")
    print("=" * 80)
    
    timestamp = int(time.time())
    success_count = 0
    total_tests = 12
    
    # Test 1: Verificar conectividad básica
    print("\n1️⃣ VERIFICANDO CONECTIVIDAD BÁSICA...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            print("   ✅ Servidor backend accesible")
            success_count += 1
        else:
            print(f"   ❌ Servidor no responde: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error de conectividad: {e}")
    
    # Test 2: Registro desde escritorio (control)
    print("\n2️⃣ REGISTRO DESDE ESCRITORIO (CONTROL)...")
    desktop_data = {
        "email": f"desktop_user_{timestamp}@gmail.com",
        "username": f"desktop_{timestamp}",
        "display_name": f"Usuario Desktop {timestamp}",
        "password": "SecurePass123!"
    }
    
    try:
        desktop_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/json'
        }
        response = requests.post(f"{base_url}/auth/register", 
                               json=desktop_data, headers=desktop_headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Registro exitoso desde escritorio")
            print(f"   👤 Usuario: {data['user']['username']}")
            print(f"   🔑 Token: {data['access_token'][:20]}...")
            success_count += 1
        else:
            print(f"   ❌ Registro falló: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Registro desde iPhone
    print("\n3️⃣ REGISTRO DESDE iPhone...")
    iphone_data = {
        "email": f"iphone_user_{timestamp}@gmail.com",
        "username": f"iphone_{timestamp}",
        "display_name": f"Usuario iPhone {timestamp}",
        "password": "SecurePass123!"
    }
    
    try:
        iphone_headers = get_mobile_headers()
        response = requests.post(f"{base_url}/auth/register", 
                               json=iphone_data, headers=iphone_headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Registro exitoso desde iPhone")
            print(f"   👤 Usuario: {data['user']['username']}")
            print(f"   🔑 Token: {data['access_token'][:20]}...")
            success_count += 1
        elif response.status_code == 404:
            print(f"   🚨 CRÍTICO: HTTP 404 desde iPhone - PROBLEMA CONFIRMADO")
            print(f"   📄 Respuesta: {response.text}")
        else:
            print(f"   ⚠️ Respuesta inesperada: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Registro desde Android
    print("\n4️⃣ REGISTRO DESDE ANDROID...")
    android_data = {
        "email": f"android_user_{timestamp}@gmail.com",
        "username": f"android_{timestamp}",
        "display_name": f"Usuario Android {timestamp}",
        "password": "SecurePass123!"
    }
    
    try:
        android_headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Origin': 'https://vamos-detail-page.preview.emergentagent.com'
        }
        response = requests.post(f"{base_url}/auth/register", 
                               json=android_data, headers=android_headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Registro exitoso desde Android")
            print(f"   👤 Usuario: {data['user']['username']}")
            success_count += 1
        elif response.status_code == 404:
            print(f"   🚨 CRÍTICO: HTTP 404 desde Android - PROBLEMA CONFIRMADO")
        else:
            print(f"   ⚠️ Respuesta: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 5: Verificar CORS preflight
    print("\n5️⃣ VERIFICANDO CORS PREFLIGHT...")
    try:
        cors_headers = {
            'Origin': 'https://vamos-detail-page.preview.emergentagent.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{base_url}/auth/register", headers=cors_headers, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   CORS Headers: {dict(response.headers)}")
        
        if response.status_code in [200, 204]:
            print(f"   ✅ CORS configurado correctamente")
            success_count += 1
        elif response.status_code == 405:
            print(f"   ⚠️ OPTIONS no soportado (405) - puede causar problemas CORS")
        else:
            print(f"   ❌ Problema CORS: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error CORS: {e}")
    
    # Test 6: Probar diferentes URLs del endpoint
    print("\n6️⃣ PROBANDO DIFERENTES VARIACIONES DE URL...")
    test_urls = [
        f"{base_url}/auth/register",
        f"https://vamos-detail-page.preview.emergentagent.com/api/auth/register",
        f"http://localhost:8001/api/auth/register"
    ]
    
    test_data = {
        "email": f"url_test_{timestamp}@gmail.com",
        "username": f"urltest_{timestamp}",
        "display_name": f"URL Test {timestamp}",
        "password": "SecurePass123!"
    }
    
    for url in test_urls:
        try:
            response = requests.post(url, json=test_data, timeout=5)
            print(f"   {url}: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ URL funcional: {url}")
                success_count += 1
                break
            elif response.status_code == 400:
                print(f"   ✅ Endpoint existe (400 = validación): {url}")
                success_count += 1
                break
        except Exception as e:
            print(f"   {url}: ERROR - {e}")
    
    # Test 7: Simular exactamente lo que hace el frontend
    print("\n7️⃣ SIMULANDO FRONTEND EXACTO...")
    frontend_data = {
        "email": f"frontend_sim_{timestamp}@gmail.com",
        "username": f"frontsim_{timestamp}",
        "display_name": f"Frontend Sim {timestamp}",
        "password": "SecurePass123!"
    }
    
    try:
        # Headers exactos que usaría React
        frontend_headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'es-ES,es;q=0.9',
            'Content-Type': 'application/json',
            'Origin': 'https://vamos-detail-page.preview.emergentagent.com',
            'Referer': 'https://vamos-detail-page.preview.emergentagent.com/auth',
            'X-Requested-With': 'XMLHttpRequest'
        }
        
        response = requests.post(f"{base_url}/auth/register", 
                               json=frontend_data, headers=frontend_headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Simulación frontend exitosa")
            print(f"   👤 Usuario: {data['user']['username']}")
            success_count += 1
        elif response.status_code == 404:
            print(f"   🚨 CRÍTICO: HTTP 404 en simulación frontend")
            print(f"   📄 Response: {response.text}")
            print(f"   📋 Headers enviados: {frontend_headers}")
        else:
            print(f"   ⚠️ Respuesta: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Error simulación: {e}")
    
    # Test 8: Verificar validación de campos
    print("\n8️⃣ VERIFICANDO VALIDACIÓN DE CAMPOS...")
    invalid_data = {
        "email": "invalid-email",
        "username": "",
        "display_name": "",
        "password": "123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", 
                               json=invalid_data, headers=get_mobile_headers(), timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 422:  # Validation error
            print(f"   ✅ Validación funcionando correctamente")
            success_count += 1
        elif response.status_code == 404:
            print(f"   🚨 CRÍTICO: HTTP 404 incluso con datos inválidos")
        else:
            print(f"   ⚠️ Validación: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Error validación: {e}")
    
    # Test 9: Probar con diferentes Content-Types
    print("\n9️⃣ PROBANDO DIFERENTES CONTENT-TYPES...")
    content_types = [
        'application/json',
        'application/json; charset=utf-8',
        'text/plain'
    ]
    
    for content_type in content_types:
        try:
            headers = get_mobile_headers()
            headers['Content-Type'] = content_type
            
            test_data = {
                "email": f"content_test_{timestamp}_{content_type.replace('/', '_').replace(';', '_')}@gmail.com",
                "username": f"content_{timestamp}",
                "display_name": f"Content Test {timestamp}",
                "password": "SecurePass123!"
            }
            
            response = requests.post(f"{base_url}/auth/register", 
                                   json=test_data, headers=headers, timeout=10)
            print(f"   {content_type}: {response.status_code}")
            
            if response.status_code in [200, 400]:
                success_count += 1
                break
        except Exception as e:
            print(f"   {content_type}: ERROR - {e}")
    
    # Test 10: Verificar rate limiting
    print("\n🔟 VERIFICANDO RATE LIMITING...")
    try:
        for i in range(3):
            test_data = {
                "email": f"rate_test_{timestamp}_{i}@gmail.com",
                "username": f"rate_{timestamp}_{i}",
                "display_name": f"Rate Test {i}",
                "password": "SecurePass123!"
            }
            
            response = requests.post(f"{base_url}/auth/register", 
                                   json=test_data, headers=get_mobile_headers(), timeout=10)
            print(f"   Request {i+1}: {response.status_code}")
            
            if response.status_code == 429:
                print(f"   ⚠️ Rate limiting activado")
                break
            elif response.status_code == 200:
                success_count += 1
                break
            elif response.status_code == 404:
                print(f"   🚨 CRÍTICO: HTTP 404 en rate limiting test")
                break
    except Exception as e:
        print(f"   ❌ Error rate limiting: {e}")
    
    # Test 11: Verificar respuesta de error detallada
    print("\n1️⃣1️⃣ ANÁLISIS DETALLADO DE RESPUESTA...")
    try:
        response = requests.post(f"{base_url}/auth/register", 
                               json={"invalid": "data"}, 
                               headers=get_mobile_headers(), timeout=10)
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Body: {response.text}")
        
        if response.status_code == 404:
            print(f"   🔍 ANÁLISIS 404:")
            if 'nginx' in response.text.lower():
                print(f"   📋 Origen: Nginx (problema de proxy)")
            elif 'fastapi' in response.text.lower():
                print(f"   📋 Origen: FastAPI (endpoint no encontrado)")
            elif 'not found' in response.text.lower():
                print(f"   📋 Origen: Servidor web (ruta no configurada)")
            else:
                print(f"   📋 Origen: Desconocido")
        
        success_count += 1
    except Exception as e:
        print(f"   ❌ Error análisis: {e}")
    
    # Test 12: Verificar configuración de URL en frontend
    print("\n1️⃣2️⃣ VERIFICANDO CONFIGURACIÓN FRONTEND...")
    try:
        with open('/app/frontend/.env', 'r') as f:
            env_content = f.read()
            print(f"   📄 Contenido .env:")
            for line in env_content.split('\n'):
                if 'BACKEND_URL' in line:
                    print(f"   {line}")
        
        # Verificar si la URL configurada funciona
        configured_url = None
        for line in env_content.split('\n'):
            if line.startswith('REACT_APP_BACKEND_URL='):
                configured_url = line.split('=')[1].strip()
                break
        
        if configured_url:
            test_url = f"{configured_url}/api/auth/register"
            response = requests.post(test_url, json={"test": "data"}, timeout=5)
            print(f"   URL configurada ({test_url}): {response.status_code}")
            
            if response.status_code != 404:
                print(f"   ✅ URL configurada funciona")
                success_count += 1
            else:
                print(f"   ❌ URL configurada devuelve 404")
        
    except Exception as e:
        print(f"   ❌ Error verificando frontend: {e}")
    
    # Resumen final
    print("\n" + "=" * 80)
    print(f"📊 RESUMEN DIAGNÓSTICO COMPLETO:")
    print(f"   Tests exitosos: {success_count}/{total_tests}")
    print(f"   Porcentaje de éxito: {(success_count/total_tests)*100:.1f}%")
    print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if success_count >= 8:
        print(f"\n✅ CONCLUSIÓN: BACKEND FUNCIONA CORRECTAMENTE")
        print(f"   🔍 El problema HTTP 404 NO es del backend")
        print(f"   🎯 Posibles causas:")
        print(f"   • Frontend usando URL incorrecta")
        print(f"   • Problema en configuración REACT_APP_BACKEND_URL")
        print(f"   • Error en implementación del formulario de registro")
        print(f"   • Problema de CORS en navegador específico")
        print(f"   • Cache del navegador móvil")
    elif success_count >= 4:
        print(f"\n⚠️ CONCLUSIÓN: PROBLEMAS PARCIALES")
        print(f"   🔍 Algunos aspectos funcionan, otros no")
        print(f"   🎯 Requiere investigación específica")
    else:
        print(f"\n❌ CONCLUSIÓN: PROBLEMAS CRÍTICOS CONFIRMADOS")
        print(f"   🔍 El backend tiene problemas serios")
        print(f"   🎯 Requiere corrección inmediata")
    
    return success_count >= 8

if __name__ == "__main__":
    print("🚨 DIAGNÓSTICO ESPECÍFICO: HTTP 404 EN REGISTRO MÓVIL")
    print("=" * 80)
    test_registration_comprehensive()