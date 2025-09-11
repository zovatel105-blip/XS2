#!/usr/bin/env python3
"""
Script to create clear layout test posts with intuitive naming
"""
import requests
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import json

# Backend URL
BASE_URL = "http://localhost:8001"

def create_labeled_image(color, text, label):
    """Create a test image with color, text and clear label"""
    img = Image.new('RGB', (400, 600), color=color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw main text
    bbox = draw.textbbox((0, 0), text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (400 - text_width) // 2
    y = (600 - text_height) // 2
    draw.text((x, y), text, fill='white', font=font_large)
    
    # Draw label
    draw.text((10, 10), label, fill='white', font=font_small)
    
    return img

def image_to_base64(img):
    """Convert PIL image to base64 string"""
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def create_clear_layout_posts():
    # Login with existing user
    login_data = {
        "email": "layouttest@example.com",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        user_data = response.json()
        token = user_data['access_token']
        print(f"✅ User logged in: {user_data['user']['username']}")
    else:
        print(f"❌ Failed to login: {response.text}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # Define layouts with CLEAR descriptions
    clear_layouts = [
        {
            "layout": "horizontal",
            "title": "ARRIBA Y ABAJO - 2 Elementos Verticalmente",
            "colors": ["#FF6B6B", "#4ECDC4"],
            "texts": ["ARRIBA", "ABAJO"],
            "labels": ["Elemento 1", "Elemento 2"]
        },
        {
            "layout": "vertical", 
            "title": "LADO A LADO - 2 Elementos Horizontalmente",
            "colors": ["#FF6B6B", "#4ECDC4"],
            "texts": ["IZQUIERDA", "DERECHA"],
            "labels": ["Elemento 1", "Elemento 2"]
        },
        {
            "layout": "triptych-horizontal",
            "title": "TRIPTYCH ARRIBA Y ABAJO - 3 Elementos Verticalmente",
            "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
            "texts": ["ARRIBA", "MEDIO", "ABAJO"],
            "labels": ["Elemento 1", "Elemento 2", "Elemento 3"]
        },
        {
            "layout": "triptych-vertical",
            "title": "TRIPTYCH LADO A LADO - 3 Elementos Horizontalmente",
            "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
            "texts": ["IZQUIERDA", "CENTRO", "DERECHA"],
            "labels": ["Elemento 1", "Elemento 2", "Elemento 3"]
        }
    ]
    
    for layout_config in clear_layouts:
        print(f"\n🎨 Creating CLEAR post with layout: {layout_config['layout']}")
        
        # Create images for each option
        options = []
        for i, (color, text, label) in enumerate(zip(layout_config['colors'], layout_config['texts'], layout_config['labels'])):
            img = create_labeled_image(color, text, label)
            img_base64 = image_to_base64(img)
            
            options.append({
                "text": f"{text} - {label}",
                "media_type": "image", 
                "media_url": img_base64,
                "thumbnail_url": img_base64,
                "mentioned_users": []
            })
        
        # Create poll data
        poll_data = {
            "title": layout_config['title'],
            "description": None,
            "options": options,
            "music_id": None,
            "tags": [],
            "category": "general",
            "mentioned_users": [],
            "video_playback_settings": None,
            "layout": layout_config['layout']
        }
        
        # Create the poll
        response = requests.post(f"{BASE_URL}/api/polls", json=poll_data, headers=headers)
        if response.status_code == 200:
            poll = response.json()
            print(f"✅ CLEAR Poll created with ID: {poll.get('id', 'unknown')}")
        else:
            print(f"❌ Failed to create poll: {response.status_code} - {response.text}")

if __name__ == "__main__":
    print("🚀 Creating CLEAR layout test posts...")
    create_clear_layout_posts()
    print("\n✅ Done! Check the feed to see the layouts with clear labeling.")