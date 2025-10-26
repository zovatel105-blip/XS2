#!/usr/bin/env python3
"""
Debug script to check stories in database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def debug_stories():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.votatokdb
    
    print("🔍 DEBUGGING STORIES SYSTEM\n")
    print("=" * 60)
    
    # Check total stories
    total_stories = await db.stories.count_documents({})
    print(f"\n📊 Total stories in database: {total_stories}")
    
    # Check active stories
    active_stories = await db.stories.count_documents({"is_active": True})
    print(f"✅ Active stories: {active_stories}")
    
    # Check non-expired stories
    current_time = datetime.utcnow()
    non_expired = await db.stories.count_documents({
        "is_active": True,
        "expires_at": {"$gt": current_time}
    })
    print(f"⏰ Non-expired active stories: {non_expired}")
    
    # Get sample stories
    print(f"\n📖 Sample stories:")
    stories_cursor = db.stories.find({}).limit(5)
    stories = await stories_cursor.to_list(length=5)
    
    for story in stories:
        print(f"\n  Story ID: {story.get('id')}")
        print(f"  User ID: {story.get('user_id')}")
        print(f"  Active: {story.get('is_active')}")
        print(f"  Created: {story.get('created_at')}")
        print(f"  Expires: {story.get('expires_at')}")
        print(f"  Expired? {story.get('expires_at') < current_time if story.get('expires_at') else 'No expiry'}")
    
    # Check user relationships
    print(f"\n👥 USER RELATIONSHIPS:")
    print("=" * 60)
    
    relationships = await db.user_relationships.find({}).to_list(length=10)
    for rel in relationships:
        user_id = rel.get('user_id')
        following = rel.get('following', [])
        followers = rel.get('followers', [])
        print(f"\n  User: {user_id}")
        print(f"  Following: {len(following)} users - {following[:3]}{'...' if len(following) > 3 else ''}")
        print(f"  Followers: {len(followers)} users")
    
    # Check if followed users have stories
    print(f"\n🔗 CHECKING FOLLOWED USERS WITH STORIES:")
    print("=" * 60)
    
    for rel in relationships[:3]:  # Check first 3 users
        user_id = rel.get('user_id')
        following = rel.get('following', [])
        
        if not following:
            print(f"\n  User {user_id}: not following anyone")
            continue
            
        print(f"\n  User {user_id} is following {len(following)} users")
        
        # Check if any followed user has stories
        stories_from_following = await db.stories.count_documents({
            "user_id": {"$in": following},
            "is_active": True,
            "expires_at": {"$gt": current_time}
        })
        
        print(f"  ✅ Stories from followed users: {stories_from_following}")
        
        if stories_from_following > 0:
            # Get details
            stories_cursor = db.stories.find({
                "user_id": {"$in": following},
                "is_active": True,
                "expires_at": {"$gt": current_time}
            })
            stories_list = await stories_cursor.to_list(length=10)
            
            print(f"  Story details:")
            for s in stories_list:
                print(f"    - User {s.get('user_id')}: created {s.get('created_at')}, expires {s.get('expires_at')}")
    
    # Check users collection
    print(f"\n👤 USERS WITH STORIES:")
    print("=" * 60)
    
    stories_with_users = await db.stories.find({
        "is_active": True,
        "expires_at": {"$gt": current_time}
    }).to_list(length=100)
    
    unique_user_ids = list(set(s['user_id'] for s in stories_with_users))
    print(f"\n  Users with active stories: {len(unique_user_ids)}")
    
    for user_id in unique_user_ids[:5]:
        user = await db.users.find_one({"id": user_id})
        if user:
            print(f"  - {user.get('username', 'Unknown')} ({user_id})")
        else:
            print(f"  - [User not found] ({user_id})")
    
    client.close()
    print("\n" + "=" * 60)
    print("✅ Debug complete\n")

if __name__ == "__main__":
    asyncio.run(debug_stories())
