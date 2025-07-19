
import { useParams, useNavigate } from "react-router-dom";
import { useCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PublicPortfolioView from "@/components/portfolio/PublicPortfolioView";

const CompanyPortfolio = () => {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const { data: portfolio, isLoading } = useCompanyPortfolio(companySlug || "");

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

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio Not Found</h1>
          <Button onClick={() => navigate("/jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return <PublicPortfolioView portfolio={portfolio} />;
};

export default CompanyPortfolio;
