import { PageLayout } from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Welcome Home
          </h1>
          <div className="bg-card rounded-lg border p-6">
            <p className="text-lg text-muted-foreground mb-4">
              Hello {user?.email}! You're successfully signed in.
            </p>
            <p className="text-muted-foreground">
              This is your personal dashboard. Navigate using the menu above to explore available features.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Home;