
import { useParams, useNavigate } from "react-router-dom";
import { useCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import PublicPortfolioView from "@/components/portfolio/PublicPortfolioView";

import { PageLayout } from "@/components/layout/PageLayout";

const CompanyPortfolio = () => {
  const { company: companySlug } = useParams();
  const navigate = useNavigate();
  const { data: portfolio, isLoading, error, refetch } = useCompanyPortfolio(companySlug || "");

  console.log('📄 CompanyPortfolio component state:', {
    companySlug,
    isLoading,
    hasPortfolio: !!portfolio,
    error: error?.message,
    portfolioId: portfolio?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('📄 Portfolio fetch error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Portfolio</h1>
          <p className="text-muted-foreground mb-6">
            {error.message || "There was an error loading the portfolio. Please try again."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button onClick={() => navigate("/jobs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    console.warn('📄 No portfolio found for slug:', companySlug);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Portfolio Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The portfolio for "{companySlug}" could not be found. It may have been moved or deleted.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button onClick={() => navigate("/jobs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <PublicPortfolioView portfolio={portfolio} />
    </PageLayout>
  );
};

export default CompanyPortfolio;
