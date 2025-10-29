
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
import Case5 from "./pages/cases/Case5";
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
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogDetail />} />
                  <Route path="/company-portfolio" element={<CompanyPortfolio />} />
                  <Route path="/ascertain-to-the-moon" element={<AscertainToTheMoon />} />
                  <Route path="/home-health" element={<HomeHealth />} />
                  <Route path="/ai-city-planner" element={<AICityPlanner />} />
                  <Route path="/chart-type-coverage-cost" element={<ChartTypeCoverageCost />} />
                  <Route path="/pixar-converter" element={<PixarConverter />} />
                  
                  <Route path="/cases/case1" element={<CaseStudyRouteWrapper><Case1 /></CaseStudyRouteWrapper>} />
                  <Route path="/cases/case2" element={<CaseStudyRouteWrapper><Case2 /></CaseStudyRouteWrapper>} />
                  <Route path="/cases/case3" element={<CaseStudyRouteWrapper><Case3 /></CaseStudyRouteWrapper>} />
                  <Route path="/cases/case4" element={<CaseStudyRouteWrapper><Case4 /></CaseStudyRouteWrapper>} />
                  <Route path="/cases/case5" element={<CaseStudyRouteWrapper><Case5 /></CaseStudyRouteWrapper>} />
                  
                  <Route path="/library" element={<Library />} />
                  <Route path="/comparisons" element={<ComparisonIndex />} />
                  <Route path="/comparison/:comparisonType" element={<ComparisonDetail />} />
                  <Route path="/rcm-companies" element={<RCMCompanies />} />
                  <Route path="/investors" element={<Investors />} />
                  
                  <Route path="/cofactor-proposal" element={<CofactorRouteWrapper><CofactorProposal /></CofactorRouteWrapper>} />
                  
                  <Route path="/subscription" element={<Suspense fallback={<div>Loading...</div>}><Subscription /></Suspense>} />
                  <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                  
                  <Route path="/vendors" element={<VendorsIndex />} />
                  <Route path="/vendors/:slugname" element={<Vendors />} />
                  <Route path="/vendors/:slugname/:vendorSlug" element={<PublicVendorView />} />
                  <Route path="/public-vendor/:id" element={<PublicVendorView />} />
                  <Route path="/shared-collection/:shareId" element={<PublicSharedCollection />} />
                  
                  <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                  
                  <Route path="/jobs" element={<Suspense fallback={<JobsSkeletonLoader />}><OptimizedJobs /></Suspense>} />
                  <Route path="/stories" element={<Suspense fallback={<div>Loading...</div>}><StoriesDashboard /></Suspense>} />
                  <Route path="/stories/:themeId" element={<Suspense fallback={<div>Loading...</div>}><ThemeDetail /></Suspense>} />
                  <Route path="/stories/:themeId/posts/:postId" element={<Suspense fallback={<div>Loading...</div>}><PostDetail /></Suspense>} />
                  <Route path="/story-ship" element={<Suspense fallback={<div>Loading...</div>}><StoryShip /></Suspense>} />
                  <Route path="/new-investor-deck" element={<Suspense fallback={<div>Loading...</div>}><NewInvestorDeck /></Suspense>} />
                  <Route path="/detailed-investor-deck" element={<Suspense fallback={<div>Loading...</div>}><DetailedInvestorDeck /></Suspense>} />
                  
                  <Route element={<AdminLayout />}> 
                    <Route path="/admin/blog" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminBlog /></Suspense></AdminRoute>} />
                    <Route path="/admin/blog/new" element={<AdminRoute><BlogEditor /></AdminRoute>} />
                    <Route path="/admin/blog/edit/:id" element={<AdminRoute><BlogEditor /></AdminRoute>} />
                    <Route path="/admin/comparisons" element={<AdminRoute><AdminComparisons /></AdminRoute>} />
                    <Route path="/admin/comparisons/new" element={<AdminRoute><ComparisonForm /></AdminRoute>} />
                    <Route path="/admin/comparisons/edit/:id" element={<AdminRoute><ComparisonForm /></AdminRoute>} />

                    {/* Admin Vendors routes */}
                    <Route path="/admin/vendors" element={<AdminRoute><VendorsIndex /></AdminRoute>} />
                    <Route path="/admin/vendors/:slugname" element={<AdminRoute><Vendors /></AdminRoute>} />
                    <Route path="/admin/vendors/:vendorSlug" element={<AdminRoute><VendorDetail /></AdminRoute>} />
                    <Route path="/admin/vendors/:slugname/:vendorSlug" element={<AdminRoute><VendorDetail /></AdminRoute>} />

                    <Route path="/admin/use-cases" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminUseCases /></Suspense></AdminRoute>} />
                    <Route path="/admin/use-cases/new" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><UseCaseForm /></Suspense></AdminRoute>} />
                    <Route path="/admin/use-cases/edit/:id" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><UseCaseForm /></Suspense></AdminRoute>} />
                    <Route path="/admin/use-cases/preview/:id" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><UseCasePreview /></Suspense></AdminRoute>} />
                    <Route path="/admin/api-usage" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><ApiUsage /></Suspense></AdminRoute>} />
                    <Route path="/admin/subscription-analytics" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><SubscriptionAnalytics /></Suspense></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminUsers /></Suspense></AdminRoute>} />
                    <Route path="/admin/users/:userId" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminUserDetail /></Suspense></AdminRoute>} />
                    <Route path="/admin/seed-analytics" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><SeedAnalytics /></Suspense></AdminRoute>} />
                    <Route path="/admin/prompts" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminPrompts /></Suspense></AdminRoute>} />
                    <Route path="/admin/work-reports" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><WorkReportPage /></Suspense></AdminRoute>} />
                    <Route path="/admin/work-reports/:id" element={<AdminRoute><Suspense fallback={<div>Loading...</div>}><WorkReportDetailPage /></Suspense></AdminRoute>} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
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
