
import { useState, useEffect } from "react";
import { BlogPost } from "@/types/blog";
import { BlogHero } from "./BlogHero";
import { BlogIntro } from "./BlogIntro";
import { BlogVisualSection } from "./BlogVisualSection";
import { BlogTLDR } from "./BlogTLDR";
import { BlogDeepDive } from "./BlogDeepDive";
import { BlogCTAShare } from "./BlogCTAShare";
import { BlogNextPost } from "./BlogNextPost";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, BookmarkPlus, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BlogService } from "@/services/blogService";

interface BlogTemplateProps {
  post: BlogPost;
  className?: string;
}

export const BlogTemplate = ({
  post,
  className = ""
}: BlogTemplateProps) => {
  const [nextPost, setNextPost] = useState<BlogPost | null>(null);

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

  // Use the correct domain
  const siteUrl = 'https://jordanleahy.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const ogImage = post.og_image_url || post.hero_image_url || `${siteUrl}/og-default.png`;

  return (
    <div className={`min-h-screen bg-background overflow-x-hidden ${className}`}>
      {/* SEO Head */}
      <Helmet>
        <title>{post.meta_title}</title>
        <meta name="description" content={post.meta_description} />
        <meta name="keywords" content={(post.meta_keywords as unknown as string[])?.join(', ')} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.meta_title} />
        <meta property="og:description" content={post.meta_description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={postUrl} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title} />
        <meta name="twitter:description" content={post.meta_description} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Article metadata */}
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:author" content="Jordan Leigh" />
        <meta property="article:section" content={post.category} />
        {(post.tags as unknown as string[])?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
      </Helmet>

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
            url={postUrl} 
          />
        </section>

        {/* 7. Next Blog Post Preview */}
        <section>
          <BlogNextPost nextPost={nextPost} />
        </section>
      </article>

      {/* Article Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.meta_title,
          "description": post.meta_description,
          "image": post.hero_image_url,
          "author": {
            "@type": "Person",
            "name": "Jordan Leigh"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Jordan Leigh Portfolio"
          },
          "datePublished": post.published_at,
          "dateModified": post.updated_at,
          "wordCount": post.word_count,
          "timeRequired": `PT${post.read_time}M`,
          "articleSection": post.category,
          "keywords": (post.meta_keywords as unknown as string[])?.join(', ')
        })
      }} />
    </div>
  );
};
