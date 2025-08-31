#!/usr/bin/env python3
"""
Script para crear datos de seguimiento de prueba
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime

async def create_follow_test_data():
    print("🚀 Creando datos de seguimiento de prueba...")
    
    # Conectar a MongoDB
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.social_media_db
    
    try:
        # Obtener usuarios existentes
        users = await db.users.find({}).to_list(10)
        
        if len(users) < 2:
            print("❌ Necesitamos al menos 2 usuarios para crear datos de seguimiento")
            return
        
        print(f"👥 Usuarios encontrados: {len(users)}")
        for user in users:
            print(f"  - {user['username']} (ID: {user['id']})")
        
        # Limpiar datos de seguimiento existentes
        await db.follows.delete_many({})
        print("🧹 Datos de seguimiento anteriores eliminados")
        
        # Crear relaciones de seguimiento
        follow_relationships = []
        
        # Usuario 1 sigue a Usuario 2
        if len(users) >= 2:
            follow_relationships.append({
                "id": str(uuid.uuid4()),
                "follower_id": users[0]['id'],
                "following_id": users[1]['id'],
                "created_at": datetime.utcnow()
            })
        
        # Usuario 2 sigue a Usuario 1 (seguimiento mutuo)
        if len(users) >= 2:
            follow_relationships.append({
                "id": str(uuid.uuid4()),
                "follower_id": users[1]['id'],
                "following_id": users[0]['id'],
                "created_at": datetime.utcnow()
            })
        
        # Si hay un tercer usuario, crear más relaciones
        if len(users) >= 3:
            # Usuario 3 sigue a Usuario 1
            follow_relationships.append({
                "id": str(uuid.uuid4()),
                "follower_id": users[2]['id'],
                "following_id": users[0]['id'],
                "created_at": datetime.utcnow()
            })
            
            # Usuario 1 sigue a Usuario 3
            follow_relationships.append({
                "id": str(uuid.uuid4()),
                "follower_id": users[0]['id'],
                "following_id": users[2]['id'],
                "created_at": datetime.utcnow()
            })
        
        # Insertar las relaciones
        if follow_relationships:
            await db.follows.insert_many(follow_relationships)
            print(f"✅ {len(follow_relationships)} relaciones de seguimiento creadas:")
            
            for rel in follow_relationships:
                follower_user = next(u for u in users if u['id'] == rel['follower_id'])
                following_user = next(u for u in users if u['id'] == rel['following_id'])
                print(f"  📱 {follower_user['username']} → {following_user['username']}")
        
        # Verificar datos creados
        follows_count = await db.follows.count_documents({})
        print(f"\n📊 Total de relaciones de seguimiento en DB: {follows_count}")
        
        # Mostrar estadísticas por usuario
        for user in users:
            followers_count = await db.follows.count_documents({"following_id": user['id']})
            following_count = await db.follows.count_documents({"follower_id": user['id']})
            print(f"  👤 {user['username']}: {followers_count} seguidores, {following_count} siguiendo")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_follow_test_data())