
import { OGMetadata } from './OGMetadata';
import { JSONLDSchema } from './JSONLDSchema';

interface DefaultMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
}

export const DefaultMetadata = ({
  title = "Jordan Leahy - Healthcare Product Designer",
  description = "Healthcare Product Designer specializing in user-centered design solutions that improve patient experiences and clinical workflows. View my portfolio of healthcare innovation projects.",
  image = "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/images//screencapture-jordanleahy-2025-07-16-10_54_07-edit.png",
  path = "/"
}: DefaultMetadataProps) => {
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
