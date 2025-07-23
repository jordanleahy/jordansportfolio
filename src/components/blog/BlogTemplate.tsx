
import { useState, useEffect } from "react";
import { BlogPost } from "@/types/blog";
import { BlogHero } from "./BlogHero";
import { BlogIntro } from "./BlogIntro";
import { BlogVisualSection } from "./BlogVisualSection";
import { BlogTLDR } from "./BlogTLDR";
import { BlogDeepDive } from "./BlogDeepDive";
import { BlogCTAShare } from "./BlogCTAShare";
import { BlogNextPost } from "./BlogNextPost";
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

  // Basic SEO for SPA (crawlers get static HTML from edge function)
  const pageTitle = post.meta_title || post.hero_headline || 'Blog Post';
  const pageDescription = post.meta_description || post.intro_content || '';
  const canonicalUrl = `https://jordanleahy.com/blog/${post.slug}`;

  return (
    <div className={`min-h-screen bg-background overflow-x-hidden ${className}`}>
      {/* Basic SEO for SPA users (crawlers get static HTML from edge function) */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={(post.meta_keywords as unknown as string[])?.join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>


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
            url={canonicalUrl} 
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
