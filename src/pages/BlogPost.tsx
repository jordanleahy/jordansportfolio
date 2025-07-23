import { PageLayout } from '@/components/layout/PageLayout';

const BlogPost = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold">Blog Post</h1>
        <p className="text-muted-foreground mt-2">Blog post content coming soon.</p>
      </div>
    </PageLayout>
  );
};

export default BlogPost;