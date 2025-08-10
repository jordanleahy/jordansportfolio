import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { SharedCollection } from "@/hooks/useLibraryCollections";

interface CollectionCardProps {
  collection: SharedCollection;
}

export const CollectionCard = ({ collection }: CollectionCardProps) => {
  const href = `/public/collections/${collection.handle}/${collection.id}`;
  const title = collection.title ?? collection.handle;
  const desc = collection.description ?? "A curated set of visuals and insights.";
  const published = collection.published_at ? new Date(collection.published_at).toLocaleDateString() : null;

  return (
    <Link to={href} aria-label={`Open collection ${title}`}>
      <Card className="flex flex-col hover:shadow-lg transition-all duration-300 group h-full">
        {/* Cover placeholder - replace with real cover when available */}
        <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
          <img
            src="/placeholder.svg"
            alt={`${title} collection cover image`}
            loading="lazy"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
            {collection.featured && (
              <Badge variant="secondary" className="shrink-0">Featured</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{desc}</p>
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>{collection.item_count} items</span>
            {published && <time dateTime={collection.published_at || undefined}>Published {published}</time>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
