
import { OGMetadata } from '@/components/seo/OGMetadata';
import { JSONLDSchema } from '@/components/seo/JSONLDSchema';

interface SEOHeadProps {
  title: string;
  description: string;
  image: string;
  path: string;
}

export const SEOHead = ({ title, description, image, path }: SEOHeadProps) => {
  return (
    <>
      <OGMetadata
        title={title}
        description={description}
        path={path}
        image={image}
        type="website"
      />
      
      <JSONLDSchema
        type="WebPage"
        title={title}
        description={description}
        path={path}
        image={image}
      />
    </>
  );
};
