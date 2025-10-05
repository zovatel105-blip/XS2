#!/usr/bin/env python3
"""
Script para crear publicaciones de prueba con imágenes para testing de búsquedas
"""

import asyncio
import json
import uuid
from datetime import datetime
import sys
import os

# Agregar el directorio backend al path
sys.path.append('/app/backend')

# Importar las dependencias del backend
from database_optimizer import db
from models import Poll, PollOption, Music

async def create_test_posts():
    """Crear publicaciones de prueba con imágenes para testing de búsquedas"""
    
    print("🎯 Creando publicaciones de prueba para búsquedas...")
    
    # Obtener usuario demo para usar como autor
    demo_user = await db.users.find_one({"email": "demo@example.com"})
    if not demo_user:
        print("❌ Usuario demo no encontrado. Creando usuario demo...")
        # Crear usuario demo si no existe
        demo_user_data = {
            "id": str(uuid.uuid4()),
            "username": "demo_user",
            "email": "demo@example.com",
            "display_name": "Demo User",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
            "bio": "Usuario de demostración para pruebas",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        await db.users.insert_one(demo_user_data)
        demo_user = demo_user_data
        print(f"✅ Usuario demo creado: {demo_user['username']}")
    
    user_id = demo_user["id"]
    
    # Lista de publicaciones de prueba con imágenes
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
    
    created_posts = []
    
    for i, post_data in enumerate(test_posts):
        try:
            # Crear ID único para el post
            poll_id = str(uuid.uuid4())
            
            # Crear opciones del poll
            poll_options = []
            for j, option in enumerate(post_data["options"]):
                option_data = PollOption(
                    id=str(uuid.uuid4()),
                    text=option["text"],
                    image_url=option.get("image_url"),
                    votes=0
                )
                poll_options.append(option_data)
            
            # Crear el poll
            poll = Poll(
                id=poll_id,
                title=post_data["title"],
                content=post_data["content"],
                author_id=user_id,
                options=poll_options,
                images=post_data.get("images", []),
                layout=post_data.get("layout", "single"),
                is_active=True,
                created_at=datetime.utcnow().isoformat(),
                votes_count=0,
                comments_count=0,
                likes=0,
                shares=0,
                views=0
            )
            
            # Insertar en la base de datos
            result = await db.polls.insert_one(poll.model_dump())
            
            if result.inserted_id:
                created_posts.append({
                    "id": poll_id,
                    "title": post_data["title"],
                    "content": post_data["content"]
                })
                print(f"✅ Post creado: {post_data['title']}")
            else:
                print(f"❌ Error creando post: {post_data['title']}")
                
        except Exception as e:
            print(f"❌ Error creando post {i+1}: {str(e)}")
    
    print(f"\n🎉 {len(created_posts)} publicaciones creadas exitosamente!")
    
    # Mostrar resumen
    print("\n📋 Publicaciones creadas:")
    for post in created_posts:
        print(f"  • {post['title']}")
    
    print("\n💡 Ahora puedes buscar términos como:")
    print("  • 'comida' - encontrará el post de comida favorita")
    print("  • 'viajes' - encontrará el post de destinos")
    print("  • 'musica' - encontrará el post de géneros musicales")  
    print("  • 'ejercicio' - encontrará el post de fitness")
    print("  • 'peliculas' - encontrará el post de superhéroes")
    
    return created_posts

async def main():
    """Función principal"""
    try:
        await create_test_posts()
    except Exception as e:
        print(f"❌ Error en el script principal: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())