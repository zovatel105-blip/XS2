"""
Script para extraer audio de publicaciones carrusel existentes que no tienen audio
"""
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path
import uuid

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from audio_utils import extract_audio_from_video, check_video_has_audio

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.social_media_app

UPLOAD_DIR = Path(__file__).parent / "uploads"
AUDIO_UPLOAD_DIR = UPLOAD_DIR / "audio"
AUDIO_UPLOAD_DIR.mkdir(exist_ok=True)

async def fix_carousel_posts():
    """
    Encuentra posts carrusel sin música y extrae el audio de sus videos
    """
    print("🔍 Buscando publicaciones carrusel sin audio...")
    
    # Buscar posts con layout='off' y sin music_id
    posts = await db.polls.find({
        "layout": "off",
        "$or": [
            {"music_id": {"$exists": False}},
            {"music_id": None},
            {"music_id": ""}
        ]
    }).to_list(100)
    
    print(f"📊 Encontrados {len(posts)} posts carrusel sin audio")
    
    fixed_count = 0
    
    for post in posts:
        try:
            print(f"\n🎠 Procesando post: {post['id']}")
            print(f"   Título: {post.get('title', 'Sin título')}")
            
            # Buscar video con audio en las opciones
            video_with_audio = None
            for i, option in enumerate(post.get('options', [])):
                media_url = option.get('media_url')
                media_type = option.get('media_type')
                
                if media_type == 'video' and media_url:
                    # Convertir URL a path
                    if '/api/uploads/' in media_url:
                        video_filename = media_url.split('/api/uploads/')[-1]
                        video_path = UPLOAD_DIR / video_filename
                        
                        if video_path.exists():
                            print(f"   🔍 Verificando video {i}: {video_path.name}")
                            if check_video_has_audio(str(video_path)):
                                video_with_audio = (i, str(video_path), option)
                                print(f"   ✅ Video {i} tiene audio")
                                break
                            else:
                                print(f"   ⏭️ Video {i} no tiene audio")
            
            if not video_with_audio:
                print(f"   ⚠️ No se encontró video con audio en este post")
                continue
            
            video_index, video_path, video_option = video_with_audio
            
            print(f"   🎵 Extrayendo audio del video...")
            
            # Generar nombre único
            author_id = post.get('author_id', 'unknown')
            unique_filename = f"carousel_audio_{author_id}_{int(datetime.utcnow().timestamp())}"
            
            # Extraer audio
            extraction_result = extract_audio_from_video(
                video_path=video_path,
                output_dir=str(AUDIO_UPLOAD_DIR),
                target_filename=unique_filename,
                max_duration=60
            )
            
            # Crear entrada en user_audio
            audio_title = post.get('title', 'Audio de video')[:100]
            audio_public_url = f"/api/uploads/audio/{extraction_result['filename']}"
            
            # Buscar info del usuario
            user = await db.users.find_one({"id": author_id})
            artist_name = "Usuario"
            if user:
                artist_name = user.get('display_name') or user.get('username', 'Usuario')
            
            user_audio_data = {
                "id": str(uuid.uuid4()),
                "title": audio_title,
                "artist": artist_name,
                "original_filename": extraction_result['filename'],
                "filename": extraction_result['filename'],
                "file_format": "mp3",
                "file_size": extraction_result['file_size'],
                "duration": int(extraction_result['duration']),
                "uploader_id": author_id,
                "file_path": extraction_result['processed_path'],
                "public_url": audio_public_url,
                "waveform": extraction_result.get('waveform', []),
                "cover_url": video_option.get('thumbnail_url'),
                "privacy": "public",
                "uses_count": 1,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insertar en base de datos
            await db.user_audio.insert_one(user_audio_data)
            
            extracted_audio_id = f"user_audio_{user_audio_data['id']}"
            
            # Actualizar el post con el music_id
            await db.polls.update_one(
                {"id": post['id']},
                {"$set": {"music_id": extracted_audio_id}}
            )
            
            print(f"   ✅ Audio extraído y guardado")
            print(f"      ID: {extracted_audio_id}")
            print(f"      Título: {audio_title}")
            print(f"      Duración: {extraction_result['duration']:.1f}s")
            print(f"      Archivo: {extraction_result['filename']}")
            
            fixed_count += 1
            
        except Exception as e:
            print(f"   ❌ Error procesando post {post['id']}: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    print(f"\n✅ Proceso completado: {fixed_count}/{len(posts)} posts corregidos")

if __name__ == "__main__":
    asyncio.run(fix_carousel_posts())
