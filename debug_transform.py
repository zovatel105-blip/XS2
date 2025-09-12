#!/usr/bin/env python3

import os
import sys
sys.path.append('/app/backend')
from pymongo import MongoClient
import json

def debug_transform_flow():
    print('🔍 DEBUG COMPLETO DEL FLUJO DE TRANSFORM')
    print('=' * 60)
    
    # Conectar a MongoDB
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/emergent_app')
    client = MongoClient(MONGO_URL)
    db = client.get_default_database()
    
    # 1. Verificar polls con transform en DB
    polls_with_transform = list(db.polls.find({'options.media_transform': {'$exists': True, '$ne': None}}))
    
    print(f'📊 Polls con media_transform en DB: {len(polls_with_transform)}')
    
    if polls_with_transform:
        for poll in polls_with_transform:
            print(f'\n📋 Poll: {poll.get("title", "Sin título")}')
            
            for i, option in enumerate(poll.get('options', [])):
                print(f'  Opción {i+1}:')
                print(f'    media_type: {option.get("media_type")}')
                print(f'    media_url exists: {bool(option.get("media_url"))}')
                
                transform = option.get('media_transform')
                if transform:
                    print(f'    ✅ media_transform: {json.dumps(transform, indent=6)}')
                    
                    # Simular exactamente lo que hace el endpoint GET
                    endpoint_response = {
                        'type': option.get('media_type'),
                        'url': option.get('media_url'),
                        'thumbnail': option.get('thumbnail_url') or option.get('media_url'),
                        'transform': option.get('media_transform')  # CRÍTICO
                    }
                    
                    print(f'    🔄 Como lo devolvería el endpoint:')
                    print(f'       media.transform: {endpoint_response["transform"]}')
                    
                    # Simular lo que pollService.js debería hacer
                    pollservice_result = {
                        'type': endpoint_response['type'],
                        'url': endpoint_response['url'],
                        'thumbnail': endpoint_response['thumbnail'],
                        'transform': endpoint_response['transform']  # DEBE mantenerse
                    }
                    
                    print(f'    🔄 Después de pollService.js:')
                    print(f'       media.transform: {pollservice_result["transform"]}')
                    
                    # Verificar si PollCard puede usar estos datos
                    if pollservice_result['transform']:
                        pos = pollservice_result['transform']['position']
                        scale = pollservice_result['transform']['scale']
                        css_styles = {
                            'objectPosition': f'{pos["x"]}% {pos["y"]}%',
                            'transform': f'scale({scale})',
                            'transformOrigin': 'center center'
                        }
                        print(f'    ✅ CSS que aplicaría PollCard:')
                        print(f'       objectPosition: {css_styles["objectPosition"]}')
                        print(f'       transform: {css_styles["transform"]}')
                    else:
                        print(f'    ❌ No se pueden generar estilos CSS')
                else:
                    print(f'    ❌ Sin media_transform')
    else:
        print('❌ No hay polls con media_transform en la base de datos')
        
        # Mostrar estructura de polls existentes
        all_polls = list(db.polls.find({}).limit(3))
        print(f'\n📊 Polls existentes (primeros 3): {len(all_polls)}')
        
        for poll in all_polls:
            print(f'\n📋 Poll: {poll.get("title", "Sin título")}')
            for i, option in enumerate(poll.get('options', [])):
                print(f'  Opción {i+1} keys: {list(option.keys())}')
                if 'media_transform' in option:
                    print(f'    media_transform: {option["media_transform"]}')

if __name__ == '__main__':
    debug_transform_flow()