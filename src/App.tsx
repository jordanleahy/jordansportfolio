
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProcessingStatesProvider } from "@/contexts/ProcessingStatesContext";
import { ImageGenerationTimerProvider } from "@/contexts/ImageGenerationTimerContext";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Suspense, lazy, useState } from "react";
import Index from "./pages/Index";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import BlogEditor from "./pages/BlogEditor";

// Lazy load admin components for better performance
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
import CompanyPortfolio from "./pages/CompanyPortfolio";
import AscertainToTheMoon from "./pages/AscertainToTheMoon";
import Vendors from "./pages/Vendors";
import VendorsIndex from "./pages/VendorsIndex";
import VendorDetail from "./pages/VendorDetail";
import PublicVendorView from "./components/vendors/PublicVendorView";
import PublicSharedCollection from "./pages/PublicSharedCollection";
import ErrorBoundary from "./components/ErrorBoundary";
import Case1 from "./pages/cases/Case1";
import Case2 from "./pages/cases/Case2";
import Case3 from "./pages/cases/Case3";
import Case4 from "./pages/cases/Case4";
import { CaseStudyRouteWrapper } from "./components/case-study/CaseStudyRouteWrapper";
import { CofactorRouteWrapper } from "./components/cofactor/CofactorRouteWrapper";
import Library from "./pages/Library";

import HomeHealth from "./pages/HomeHealth";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import AICityPlanner from "./pages/AICityPlanner";
import MaintenanceMode from "./components/MaintenanceMode";

import ChartTypeCoverageCost from "./pages/ChartTypeCoverageCost";
const WorkReportPage = lazy(() => import("./pages/WorkReportPage"));
const WorkReportDetailPage = lazy(() => import("./pages/WorkReportDetailPage"));

import ComparisonDetail from "./pages/ComparisonDetail";
import ComparisonIndex from "./pages/ComparisonIndex";
import RCMCompanies from "./pages/RCMCompanies";
import Investors from "./pages/Investors";
import { AdminComparisons } from "./pages/admin/AdminComparisons";
import { ComparisonForm } from "./pages/admin/ComparisonForm";
import { AdminLayout } from "./components/layouts/AdminLayout";

// Lazy load use case components
const AdminUseCases = lazy(() => import("./pages/admin/AdminUseCases"));
const UseCaseForm = lazy(() => import("./pages/admin/UseCaseForm"));
const UseCasePreview = lazy(() => import("./pages/admin/UseCasePreview"));

// Lazy load API Usage component
const ApiUsage = lazy(() => import("./pages/admin/ApiUsage"));
const SubscriptionAnalytics = lazy(() => import("./pages/admin/SubscriptionAnalytics"));
const Subscription = lazy(() => import("./pages/Subscription"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserDetail = lazy(() => import("./pages/admin/UserDetail"));
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import BillingPage from "./pages/BillingPage";
import AccountPage from "./pages/AccountPage";
import CofactorProposal from "./pages/CofactorProposal";
import { PixarConverter } from "./components/PixarConverter";

const SeedAnalytics = lazy(() => import("./pages/admin/SeedAnalytics"));
const AdminPrompts = lazy(() => import("./pages/admin/AdminPrompts"));
import { JobsSkeletonLoader, CalendarSkeletonLoader } from "@/components/performance/SkeletonLoader";

// Lazy load optimized components
const OptimizedJobs = lazy(() => import("./pages/OptimizedJobs"));
const StoriesDashboard = lazy(() => import("./pages/StoriesDashboard"));

const ThemeDetail = lazy(() => import("./pages/ThemeDetail"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const StoryShip = lazy(() => import("./pages/StoryShip"));
const NewInvestorDeck = lazy(() => import("./pages/NewInvestorDeck"));
const DetailedInvestorDeck = lazy(() => import("./pages/DetailedInvestorDeck"));
// ✅ GOOD: ThemeNameRedirect removed - using themeId routes only


function App() {
  // Initialize QueryClient inside component to avoid React reconciliation issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: 1,
      },
    },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ProcessingStatesProvider>
                <ImageGenerationTimerProvider>
                <Routes>
                  <Route path="*" element={<MaintenanceMode />} />
                </Routes>
                </ImageGenerationTimerProvider>
              </ProcessingStatesProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
