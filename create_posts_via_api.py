#!/usr/bin/env python3
"""
Script para crear publicaciones de prueba via API REST
"""

import requests
import json
import time

# Configuración
BACKEND_URL = "http://localhost:8001"
DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo123"

def login_user():
    """Hacer login con usuario demo y obtener token"""
    print("🔐 Haciendo login con usuario demo...")
    
    login_data = {
        "username": DEMO_EMAIL,
        "password": DEMO_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access_token")
            print(f"✅ Login exitoso")
            return token
        else:
            print(f"❌ Error en login: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error conectando al backend: {str(e)}")
        return None

def create_post(token, post_data):
    """Crear una publicación"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/polls",
            json=post_data,
            headers=headers
        )
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print(f"✅ Post creado: {post_data['title']}")
            return result
        else:
            print(f"❌ Error creando post: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def main():
    """Función principal"""
    print("🎯 Creando publicaciones de prueba para búsquedas...")
    
    # Login
    token = login_user()
    if not token:
        print("❌ No se pudo obtener token. Saliendo...")
        return
    
    # Lista de publicaciones de prueba
    test_posts = [
        {
            "title": "¿Cuál es tu comida favorita?",
            "content": "¡Vamos a descubrir qué comida prefiere la comunidad! #comida #favoritos #poll",
            "options": [
                {
                    "text": "Pizza 🍕",
                    "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop"
                },
                {
                    "text": "Hamburguesa 🍔",
                    "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop"
                },
                {
                    "text": "Tacos 🌮",
                    "image_url": "https://images.unsplash.com/photo-1565299585323-38174c13a4d4?w=300&h=300&fit=crop"
                },
                {
                    "text": "Sushi 🍣",
                    "image_url": "https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&h=300&fit=crop"
                }
            ],
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop",
                    "alt": "Comida deliciosa",
                    "caption": "¿Qué prefieres comer?"
                }
            ],
            "layout": "grid_2x2"
        },
        {
            "title": "Mejor destino de vacaciones",
            "content": "Planificando las próximas vacaciones ✈️ ¿Dónde irías? #viajes #vacaciones #destinos",
            "options": [
                {
                    "text": "Playa tropical 🏖️",
                    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop"
                },
                {
                    "text": "Ciudad europea 🏛️",
                    "image_url": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=300&h=300&fit=crop"
                },
                {
                    "text": "Montañas nevadas 🏔️",
                    "image_url": "https://images.unsplash.com/photo-1464822759844-d150872b1da5?w=300&h=300&fit=crop"
                },
                {
                    "text": "Safari africano 🦁",
                    "image_url": "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=300&h=300&fit=crop"
                }
            ],
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=600&fit=crop",
                    "alt": "Destinos de viaje",
                    "caption": "Elige tu próximo destino"
                }
            ],
            "layout": "grid_2x2"
        },
        {
            "title": "Mejor género musical",
            "content": "¿Qué música te acompaña en tu día a día? 🎵 #musica #generos #favoritos",
            "options": [
                {
                    "text": "Pop 🎤",
                    "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
                },
                {
                    "text": "Rock 🎸",
                    "image_url": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop"
                },
                {
                    "text": "Hip Hop 🎤",
                    "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop"
                },
                {
                    "text": "Electrónica 🎧",
                    "image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"
                }
            ],
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop",
                    "alt": "Música y géneros",
                    "caption": "¿Cuál es tu género favorito?"
                }
            ],
            "layout": "single"
        },
        {
            "title": "Mejor ejercicio para mantenerse en forma",
            "content": "Vida saludable 💪 ¿Cuál es tu ejercicio preferido? #fitness #ejercicio #salud",
            "options": [
                {
                    "text": "Correr 🏃‍♂️",
                    "image_url": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop"
                },
                {
                    "text": "Yoga 🧘‍♀️",
                    "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop"
                },
                {
                    "text": "Natación 🏊‍♂️",
                    "image_url": "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=300&fit=crop"
                },
                {
                    "text": "Gimnasio 💪",
                    "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop"
                }
            ],
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
                    "alt": "Ejercicio y fitness",
                    "caption": "Mantente en forma"
                }
            ],
            "layout": "triptych"
        },
        {
            "title": "Mejor película de superhéroes",
            "content": "¡Batalla épica de superhéroes! 🦸‍♂️ ¿Cuál es la mejor? #peliculas #superheroes #entretenimiento",
            "options": [
                {
                    "text": "Spider-Man 🕷️",
                    "image_url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=300&fit=crop"
                },
                {
                    "text": "Batman 🦇",
                    "image_url": "https://images.unsplash.com/photo-1608889476518-738c9b1de2f8?w=300&h=300&fit=crop"
                },
                {
                    "text": "Iron Man ⚡",
                    "image_url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=300&fit=crop"
                },
                {
                    "text": "Wonder Woman 👸",
                    "image_url": "https://images.unsplash.com/photo-1608889826731-b3f9c74ac959?w=300&h=300&fit=crop"
                }
            ],
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=600&fit=crop",
                    "alt": "Superhéroes",
                    "caption": "Los mejores superhéroes del cine"
                }
            ],
            "layout": "grid_3x2"
        }
    ]
    
    # Crear publicaciones
    created_count = 0
    for post_data in test_posts:
        result = create_post(token, post_data)
        if result:
            created_count += 1
        time.sleep(1)  # Pequeña pausa entre requests
    
    print(f"\n🎉 {created_count} de {len(test_posts)} publicaciones creadas exitosamente!")
    
    if created_count > 0:
        print("\n💡 Ahora puedes buscar términos como:")
        print("  • 'comida' - encontrará el post de comida favorita")
        print("  • 'viajes' - encontrará el post de destinos")
        print("  • 'musica' - encontrará el post de géneros musicales")
        print("  • 'ejercicio' - encontrará el post de fitness")
        print("  • 'peliculas' - encontrará el post de superhéroes")
        print("\n🔍 Usa las acciones rápidas → botón de búsqueda para probar!")

if __name__ == "__main__":
    main()