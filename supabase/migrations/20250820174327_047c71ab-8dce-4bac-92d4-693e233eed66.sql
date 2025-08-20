-- Update the blog post to have a proper 16:9 hero image
UPDATE blog_posts 
SET hero_image_16_9_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1920&h=1080&q=80',
    image_generation_status = 'completed'
WHERE slug = 'map-your-current-rcm-landscape-to-reduce-rework-and-denials-today';