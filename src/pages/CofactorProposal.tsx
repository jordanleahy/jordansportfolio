import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CofactorProposal() {
  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Cofactor Proposal</h1>
              <p className="text-lg text-muted-foreground">
                Strategic partnership proposal and collaboration framework
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Proposal Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This page will contain the Cofactor proposal details and collaboration framework.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}