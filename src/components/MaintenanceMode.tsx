import { AlertTriangle } from "lucide-react";
import { Helmet } from "react-helmet-async";

const MaintenanceMode = () => {
  return (
    <>
      <Helmet>
        <title>Site Unavailable - 404</title>
        <meta name="description" content="This site is temporarily unavailable" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4 max-w-md">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Site Unavailable</h2>
          <p className="text-muted-foreground mb-6">
            This website is currently unavailable. Please try again later.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Error Code: 404 - Not Found</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MaintenanceMode;