import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Globe, Calendar, BarChart3, ExternalLink } from "lucide-react";

interface SitemapStructure {
  products?: { pages: string[]; count: number };
  about?: { pages: string[]; count: number };
  pricing?: { pages: string[]; count: number };
  contact?: { pages: string[]; count: number };
  blog?: { pages: string[]; count: number };
  support?: { pages: string[]; count: number };
  other?: { pages: string[]; count: number };
}

interface NavigationItem {
  title: string;
  url: string;
  children?: NavigationItem[];
}

interface SitemapTree {
  discoveryMethod: "sitemap" | "navigation" | "crawl" | "analysis_failed";
  totalPages: number;
  lastAnalyzed: string;
  structure: SitemapStructure;
  keyInsights: string[];
  navigationStructure: NavigationItem[];
}

interface VendorSitemapTreeProps {
  sitemapTree: SitemapTree;
  websiteUrl?: string;
}

const CategoryIcon = ({ category }: { category: string }) => {
  const icons = {
    products: "🛍️",
    about: "ℹ️",
    pricing: "💰",
    contact: "📞",
    blog: "📝",
    support: "🛠️",
    other: "📄"
  };
  return <span className="mr-2">{icons[category as keyof typeof icons] || "📄"}</span>;
};

const TreeNode = ({ item, level = 0 }: { item: NavigationItem; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className={`${level > 0 ? 'ml-4 border-l border-border pl-4' : ''}`}>
      <div className="flex items-center gap-2 py-1">
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}
        <span className="text-sm">{item.title}</span>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.children!.map((child, index) => (
            <TreeNode key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export function VendorSitemapTree({ sitemapTree, websiteUrl }: VendorSitemapTreeProps) {
  const getMethodBadge = (method: string) => {
    const variants = {
      sitemap: "default",
      navigation: "secondary",
      crawl: "outline",
      analysis_failed: "destructive"
    } as const;
    
    const labels = {
      sitemap: "Sitemap",
      navigation: "Navigation",
      crawl: "Crawled",
      analysis_failed: "Failed"
    };

    return (
      <Badge variant={variants[method as keyof typeof variants] || "outline"}>
        {labels[method as keyof typeof labels] || method}
      </Badge>
    );
  };

  const categoryColors = {
    products: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    about: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pricing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    contact: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    blog: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    support: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Structure Analysis
          </CardTitle>
          {getMethodBadge(sitemapTree.discoveryMethod)}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            {sitemapTree.totalPages} pages
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(sitemapTree.lastAnalyzed).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Insights */}
        {sitemapTree.keyInsights && sitemapTree.keyInsights.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Key Insights</h4>
            <ul className="space-y-1">
              {sitemapTree.keyInsights.map((insight, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Page Categories */}
        <div>
          <h4 className="font-medium mb-3">Page Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(sitemapTree.structure).map(([category, data]) => (
              <div
                key={category}
                className={`p-3 rounded-lg border ${categoryColors[category as keyof typeof categoryColors] || categoryColors.other}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CategoryIcon category={category} />
                  <span className="font-medium capitalize">{category}</span>
                </div>
                <div className="text-lg font-bold">{data.count}</div>
                <div className="text-xs opacity-75">
                  {data.count === 1 ? 'page' : 'pages'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Structure */}
        {sitemapTree.navigationStructure && sitemapTree.navigationStructure.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Navigation Structure</h4>
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {sitemapTree.navigationStructure.map((item, index) => (
                <TreeNode key={index} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Website Link */}
        {websiteUrl && (
          <div className="pt-4 border-t">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}