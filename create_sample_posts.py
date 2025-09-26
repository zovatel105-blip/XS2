#!/usr/bin/env python3
"""
Create sample posts with multimedia content for testing search
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

async def create_sample_posts():
    # Connect to database
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client['social_media_app']
    
    print("🎯 CREATING SAMPLE POSTS FOR SEARCH TESTING")
    print("=" * 50)
    
    # Get demo user
    demo_user = await db.users.find_one({"username": "demo_user"})
    if not demo_user:
        print("❌ Demo user not found!")
        return
    
    print(f"✅ Found demo user: {demo_user['id']}")
    
    # Sample posts data
    sample_posts = [
        {
            "title": "Increíble atardecer en la playa 🌅",
            "description": "Miren este hermoso atardecer que capturé hoy en la costa. #atardecer #playa #naturaleza #fotografía",
            "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
            "media_type": "image"
        },
        {
            "title": "Tutorial de cocina: Pasta italiana 🍝",
            "description": "Aprende a hacer la mejor pasta carbonara en casa #cocina #pasta #tutorial #comida #recetas",
            "image_url": "https://images.unsplash.com/photo-1551892374-ecf8ffb15cd9?w=400&h=600&fit=crop",
            "media_type": "image"
        },
        {
            "title": "Entrenamiento matutino 💪",
            "description": "Rutina de ejercicios para empezar el día con energía #fitness #ejercicio #vida #saludable #motivación",
            "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
            "media_type": "image"
        },
        {
            "title": "Arte urbano en el centro 🎨",
            "description": "Descubrí este increíble mural en el centro de la ciudad #arte #urbano #street #cultura #color",
            "image_url": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop",
            "media_type": "image"
        },
        {
            "title": "Mi mascota haciendo travesuras 🐕",
            "description": "No pueden creer lo que hizo mi perro hoy jajaja #mascotas #perros #divertido #animales #amor",
            "image_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop",
            "media_type": "image"
        },
        {
            "title": "Concierto en vivo 🎵",
            "description": "Increíble presentación de mi banda favorita anoche #música #concierto #rock #en #vivo",
            "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop",
            "media_type": "image"
        }
    ]
    
    created_count = 0
    
    for i, post_data in enumerate(sample_posts):
        try:
            poll_id = str(uuid.uuid4())
            option_id = str(uuid.uuid4())
            
            poll = {
                "id": poll_id,
                "title": post_data["title"],
                "description": post_data["description"],
                "author_id": demo_user["id"],
                "options": [
                    {
                        "id": option_id,
                        "user_id": demo_user["id"],
                        "text": "👍 Me gusta",
                        "votes": [],
                        "media_type": post_data["media_type"],
                        "media_url": post_data["image_url"],
                        "thumbnail_url": post_data["image_url"],
                        "media_transform": None,
                        "mentioned_users": [],
                        "created_at": datetime.utcnow().isoformat()
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "user_id": demo_user["id"], 
                        "text": "❤️ Me encanta",
                        "votes": [],
                        "media_type": None,
                        "media_url": None,
                        "thumbnail_url": None,
                        "media_transform": None,
                        "mentioned_users": [],
                        "created_at": datetime.utcnow().isoformat()
                    }
                ],
                "total_votes": 0,
                "likes": [],
                "shares": 0,
                "comments_count": 0,
                "music_id": None,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "tags": [],
                "category": None,
                "is_featured": False,
                "mentioned_users": [],
                "video_playback_settings": None,
                "layout": "carousel"
            }
            
            # Insert into database
            await db.polls.insert_one(poll)
            created_count += 1
            print(f"   ✅ Created: '{post_data['title'][:30]}...'")
            
        except Exception as e:
            print(f"   ❌ Error creating post {i+1}: {str(e)}")
    
    print(f"\n🎉 COMPLETED: Created {created_count} sample posts with multimedia content")
    print(f"📊 These posts include:")
    print(f"   - Real images from Unsplash")
    print(f"   - Hashtags for search testing") 
    print(f"   - Varied content (food, fitness, art, pets, etc.)")
    print(f"   - Proper media URLs and thumbnails")

if __name__ == "__main__":
    asyncio.run(create_sample_posts())