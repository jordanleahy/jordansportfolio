import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  image: string;
  path: string;
}

export const SEOHead = ({ title, description, image, path }: SEOHeadProps) => {
  const fullImageUrl = `https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com${image}`;
  const fullUrl = `https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com${path}`;

  return (
    <Helmet>
      <title>{title} | Jordan's Portfolio</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
    </Helmet>
  );
};