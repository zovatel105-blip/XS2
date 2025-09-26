#!/usr/bin/env python3
"""
Script para crear posts adicionales y probar la funcionalidad de pre-carga
"""
import asyncio
import sys
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def create_test_polls():
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("❌ MONGO_URL not found in environment")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client.votatokapp

    # Get existing users
    users = await db.user_profiles.find().to_list(length=None)
    if not users:
        print("❌ No users found in database")
        return

    print(f"✅ Found {len(users)} users")

    # Create 50 more test polls for preload testing
    topics = [
        "¿Cuál es tu red social favorita?|Instagram|TikTok|Twitter|YouTube",
        "¿Qué prefieres para cenar?|Comida italiana|Comida japonesa|Comida mexicana|Pizza",
        "¿Cuál es tu género musical favorito?|Pop|Rock|Reggaeton|Jazz|Electrónica",
        "¿Dónde te gustaría viajar?|París|Tokio|Nueva York|Barcelona|Londres",
        "¿Qué dispositivo prefieres?|iPhone|Samsung|Google Pixel|OnePlus",
        "¿Cuál es tu bebida favorita?|Café|Té|Agua|Jugo|Refresco",
        "¿Qué actividad prefieres?|Leer|Ver series|Hacer ejercicio|Cocinar|Viajar",
        "¿Cuál es tu estación favorita?|Primavera|Verano|Otoño|Invierno",
        "¿Qué tipo de música escuchas?|Rock|Pop|Hip-Hop|Clásica|Electrónica",
        "¿Dónde prefieres trabajar?|Casa|Oficina|Café|Coworking|Biblioteca",
        "¿Qué mascota prefieres?|Perro|Gato|Pájaro|Pez|Hamster",
        "¿Cuál es tu color favorito?|Azul|Rojo|Verde|Amarillo|Morado",
        "¿Qué deporte te gusta más?|Fútbol|Básquetbol|Tenis|Natación|Ciclismo",
        "¿Qué app usas más?|WhatsApp|Instagram|TikTok|YouTube|Netflix",
        "¿Cuál es tu comida rápida favorita?|McDonald's|Burger King|KFC|Subway|Domino's",
        "¿Qué prefieres para el fin de semana?|Salir con amigos|Quedarse en casa|Ir al cine|Hacer deporte|Viajar",
        "¿Cuál es tu tipo de película favorito?|Acción|Comedia|Drama|Terror|Ciencia ficción",
        "¿Qué transporte prefieres?|Auto|Bicicleta|Transporte público|Caminar|Scooter",
        "¿Cuál es tu hora favorita del día?|Mañana|Tarde|Noche|Madrugada",
        "¿Qué prefieres para estudiar?|Música|Silencio|Ruido blanco|Café|Biblioteca",
        "¿Cuál es tu tipo de ejercicio favorito?|Gym|Correr|Yoga|Natación|Ciclismo",
        "¿Qué prefieres para relajarte?|Leer|Ver TV|Meditar|Bañarse|Música",
        "¿Cuál es tu snack favorito?|Papas fritas|Chocolate|Frutas|Galletas|Palomitas",
        "¿Qué clima prefieres?|Soleado|Lluvioso|Nublado|Ventoso|Frío",
        "¿Cuál es tu momento favorito?|Amanecer|Mediodía|Atardecer|Anochecer|Media noche"
    ]

    polls_created = 0
    
    for i in range(50):  # Create 50 polls
        topic_data = topics[i % len(topics)]
        topic_parts = topic_data.split("|")
        title = topic_parts[0]
        options = topic_parts[1:]
        
        # Select random user as author
        import random
        author_user = random.choice(users)
        
        # Create poll options
        poll_options = []
        for j, option_text in enumerate(options[:2]):  # Take first 2 options
            option_id = str(uuid.uuid4())
            poll_options.append({
                "id": option_id,
                "text": option_text,
                "image_url": None,
                "video_url": None,
                "description": f"Opción {j+1} para {title.lower()}",
                "votes": random.randint(0, 50),  # Random votes for variety
                "mentioned_users": []
            })
        
        # Create the poll
        poll_id = str(uuid.uuid4())
        poll_data = {
            "id": poll_id,
            "title": f"{title} - Test #{i+1}",
            "description": f"Poll de prueba para pre-carga #{i+1}",
            "author_id": author_user["id"],
            "options": poll_options,
            "total_votes": sum(opt["votes"] for opt in poll_options),
            "likes": random.randint(0, 20),  # Random likes as integer (not array)
            "shares": random.randint(0, 10),  # Random shares as integer
            "comments_count": random.randint(0, 15),
            "is_featured": random.choice([True, False]),
            "tags": ["test", "preload", f"batch_{i//10}"],
            "category": "test",
            "mentioned_users": [],
            "layout": random.choice(["default", "grid", "carousel"]),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        try:
            result = await db.polls.insert_one(poll_data)
            polls_created += 1
            if polls_created % 10 == 0:
                print(f"✅ Created {polls_created} polls...")
        except Exception as e:
            print(f"❌ Error creating poll {i+1}: {e}")
    
    print(f"🎉 Successfully created {polls_created} additional test polls!")
    print(f"📊 Total polls in database should now be: {27 + polls_created}")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    print("🔄 Creating additional test polls for preload testing...")
    asyncio.run(create_test_polls())