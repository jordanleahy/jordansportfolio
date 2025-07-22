import { useState, useEffect } from "react";
import { BlogPost } from "@/types/blog";
import { BlogHero } from "./BlogHero";
import { BlogIntro } from "./BlogIntro";
import { BlogVisualSection } from "./BlogVisualSection";
import { BlogTLDR } from "./BlogTLDR";
import { BlogDeepDive } from "./BlogDeepDive";
import { BlogCTAShare } from "./BlogCTAShare";
import { BlogNextPost } from "./BlogNextPost";
import { OGMetadata } from "@/components/seo/OGMetadata";
import { JSONLDSchema } from "@/components/seo/JSONLDSchema";
import { BlogService } from "@/services/blogService";
import { SEO_CONFIG, getCleanUrl } from "@/config/seo";

interface BlogTemplateProps {
  post: BlogPost;
  className?: string;
}

export const BlogTemplate = ({
  post,
  className = ""
}: BlogTemplateProps) => {
  const [nextPost, setNextPost] = useState<BlogPost | null>(null);

  const postPath = `/blog/${post.slug}`;
  const postUrl = `${SEO_CONFIG.baseUrl}${postPath}`;
  const cleanUrl = getCleanUrl(postUrl);

  // Debug URL generation
  console.log('Blog post URL generation:', {
    slug: post.slug,
    postPath,
    postUrl,
    cleanUrl,
    publishedAt: post.published_at
  });

  // Fetch next blog post
  useEffect(() => {
    const fetchNextPost = async () => {
      try {
        const next = await BlogService.getNextBlogPost(post.slug);
        setNextPost(next);
      } catch (error) {
        console.error('Failed to fetch next post:', error);
      }
    };
    fetchNextPost();
  }, [post.slug]);

  const handleHeroClick = () => {
    const introElement = document.getElementById('blog-intro');
    if (introElement) {
      introElement.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`min-h-screen bg-background overflow-x-hidden ${className}`}>
      {/* SEO Metadata */}
      <OGMetadata
        title={post.meta_title}
        description={post.meta_description}
        path={postPath}
        image={post.og_image_url}
        heroImage16_9={post.hero_image_16_9_url}
        heroImage={post.hero_image_url}
        type="article"
        publishedTime={post.published_at}
        modifiedTime={post.updated_at}
        keywords={post.meta_keywords as unknown as string[]}
      />

      {/* JSON-LD Schema */}
      <JSONLDSchema
        type="Article"
        title={post.meta_title}
        description={post.meta_description}
        path={postPath}
        image={post.og_image_url}
        heroImage16_9={post.hero_image_16_9_url}
        heroImage={post.hero_image_url}
        publishedTime={post.published_at}
        modifiedTime={post.updated_at}
        wordCount={post.word_count}
        readTime={post.read_time}
        keywords={post.meta_keywords as unknown as string[]}
      />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
        
      </header>

      {/* Blog Content - Enforced Structure with Consistent Spacing */}
      <article className="relative space-y-16">
        {/* 1. Hero Section (Above-the-Fold) */}
        <section>
          <BlogHero 
            headline={post.hero_headline} 
            subhead={post.hero_subhead} 
            imageUrl={post.hero_image_url} 
            image16_9_url={post.hero_image_16_9_url} 
            videoUrl={post.hero_video_url} 
            badge={post.hero_badge} 
            readTime={post.read_time} 
            onCTAClick={handleHeroClick} 
          />
        </section>

        {/* 2. Intro Paragraph (50–75 words) */}
        <section id="blog-intro">
          <BlogIntro content={post.intro_content} />
        </section>

        {/* 3. Visual-First Sections - With spacing between each */}
        <section className="space-y-12">
          {(post.visual_sections as unknown as import("@/types/blog").VisualSection[]).map((section, index) => (
            <BlogVisualSection 
              key={index} 
              headline={section.headline} 
              content={section.content} 
              imageUrl={section.image_url} 
              ctaText={section.cta_text} 
              ctaUrl={section.cta_url} 
              index={index} 
            />
          ))}
        </section>

        {/* 4. Quick Summary (TL;DR Style) */}
        <section>
          <BlogTLDR title={post.tldr_title} bullets={post.tldr_bullets as unknown as string[]} />
        </section>

        {/* 5. Optional Deep Dive (Max 250 words) */}
        {post.deep_dive_content && (
          <section>
            <BlogDeepDive title={post.deep_dive_title} content={post.deep_dive_content} />
          </section>
        )}

        {/* 6. CTA & Share Section */}
        <section>
          <BlogCTAShare 
            ctaText={post.cta_text} 
            ctaUrl={post.cta_url} 
            shareEnabled={post.share_enabled} 
            title={post.meta_title} 
            url={cleanUrl} 
          />
        </section>

        {/* 7. Next Blog Post Preview */}
        <section>
          <BlogNextPost nextPost={nextPost} />
        </section>
      </article>
    </div>
  );
};
