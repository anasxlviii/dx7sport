import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

try:
    # This might fail if the env vars are not set in this shell
    # But let's try to see if we can just connect
    from lib.db.db import db
    from lib.db.schema import articles
    from drizzle_orm import eq

    slug = 'zlzal-krwy-fy-mayw-2026-thlyl-shaml-llkhbr-alaajl-althy-hz-alawsat-alryadhyh-qbl-almwndyal-9267'
    # Use standard drizzle query
    article = db.select().from(articles).where(eq(articles.slug, slug)).limit(1)
    # Actually, drizzle might need an await if it's async, but here it's likely postgres-js sync-like
    # Wait, the app uses 'await db.select()', so I need an async runner or check if it's possible.
    
    # I'll just check if it's base64 in the article.featuredImage by printing it.
except Exception as e:
    print(f"Error: {e}")
