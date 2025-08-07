import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ThemesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="p-4 space-y-3">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
        </Card>
      ))}
    </div>
  );
}