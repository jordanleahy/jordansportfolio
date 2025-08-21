import { useParams, Link } from "react-router-dom";
import { useUseCase } from "@/hooks/useUseCases";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UseCasePreview() {
  const { id } = useParams<{ id: string }>();
  const { data: useCase, isLoading, error } = useUseCase(id!);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !useCase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Use Case Not Found</h2>
          <p className="text-muted-foreground mb-6">The use case you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/admin/use-cases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Use Cases
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/use-cases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Use Cases
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{useCase.title}</h1>
            <p className="text-muted-foreground mt-1">{useCase.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link to={`/admin/use-cases/${useCase.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {useCase.slug && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/cases/${useCase.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {useCase.hero_image && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={useCase.hero_image} 
                alt={useCase.hero_image_alt || useCase.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-1">Role</h3>
              <p className="text-sm text-muted-foreground">{useCase.role}</p>
              {useCase.role_details && (
                <p className="text-xs text-muted-foreground mt-1">{useCase.role_details}</p>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-1">Timeline</h3>
              <p className="text-sm text-muted-foreground">{useCase.timeline_value}</p>
              {useCase.timeline_details && (
                <p className="text-xs text-muted-foreground mt-1">{useCase.timeline_details}</p>
              )}
            </div>
          </div>
          {useCase.tags && useCase.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {useCase.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{useCase.category || 'Not specified'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{useCase.industry || 'Not specified'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complexity</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              useCase.complexity === 'simple' ? 'default' : 
              useCase.complexity === 'medium' ? 'secondary' : 
              'destructive'
            }>
              {useCase.complexity}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Problem Section */}
      {useCase.problem_title && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{useCase.problem_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{useCase.problem_description}</p>
            {useCase.challenges && useCase.challenges.length > 0 && (
              <div className="space-y-4">
                {useCase.challenges.map((challenge, index) => (
                  <div key={index}>
                    <h4 className="font-medium mb-2">{challenge.title}</h4>
                    <ul className="list-disc pl-6 space-y-1">
                      {challenge.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Solution Section */}
      {useCase.solution_title && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{useCase.solution_title}</CardTitle>
          </CardHeader>
          <CardContent>
            {useCase.features && useCase.features.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {useCase.features.map((feature, index) => (
                  <div key={index} className="flex gap-3 p-4 border rounded-lg">
                    <div className="text-2xl">{feature.icon}</div>
                    <div>
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Links */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Links & Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {useCase.prototype_url && (
            <div>
              <h4 className="font-medium mb-1">Prototype</h4>
              <a 
                href={useCase.prototype_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {useCase.prototype_url}
              </a>
            </div>
          )}
          {useCase.figma_presentation_url && (
            <div>
              <h4 className="font-medium mb-1">Figma Presentation</h4>
              <a 
                href={useCase.figma_presentation_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {useCase.figma_presentation_title || useCase.figma_presentation_url}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-1">Status</h4>
              <Badge variant={useCase.status === 'published' ? 'default' : 'secondary'}>
                {useCase.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-1">Featured</h4>
              <Badge variant={useCase.featured ? 'default' : 'outline'}>
                {useCase.featured ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-1">Sort Order</h4>
              <p className="text-sm text-muted-foreground">{useCase.sort_order}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}