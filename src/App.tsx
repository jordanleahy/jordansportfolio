
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
// Lazy load heavy admin components
const SEC = lazy(() => import("./pages/SEC"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const Agents = lazy(() => import("./pages/Agents"));
const Vendors = lazy(() => import("./pages/Vendors"));
const VendorsIndex = lazy(() => import("./pages/VendorsIndex"));
const VendorDetail = lazy(() => import("./pages/VendorDetail"));
const DataDictionary = lazy(() => import("./pages/sec/DataDictionary"));
const WorkReportPage = lazy(() => import("./pages/WorkReportPage"));
const WorkReportDetailPage = lazy(() => import("./pages/WorkReportDetailPage"));

import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import BlogEditor from "./pages/BlogEditor";
import CompanyPortfolio from "./pages/CompanyPortfolio";
import AscertainToTheMoon from "./pages/AscertainToTheMoon";
import PublicVendorView from "./components/vendors/PublicVendorView";
import PublicSharedCollection from "./pages/PublicSharedCollection";
import ErrorBoundary from "./components/ErrorBoundary";
import Case1 from "./pages/cases/Case1";
import Case3 from "./pages/cases/Case3";
import Case4 from "./pages/cases/Case4";
import { CaseStudyRouteWrapper } from "./components/case-study/CaseStudyRouteWrapper";
import Library from "./pages/Library";

// Lazy load agent components
const AgentDetail = lazy(() => import("./pages/agents/AgentDetail").then(module => ({ default: module.AgentDetail })));
const AgentEdit = lazy(() => import("./pages/agents/AgentEdit").then(module => ({ default: module.AgentEdit })));

import HomeHealth from "./pages/HomeHealth";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import ChartTypeCoverageCost from "./pages/ChartTypeCoverageCost";

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
const PublicUseCase = lazy(() => import("./pages/cases/PublicUseCase"));

// Lazy load API Usage component
const ApiUsage = lazy(() => import("./pages/admin/ApiUsage"));
const SubscriptionAnalytics = lazy(() => import("./pages/admin/SubscriptionAnalytics"));
const Subscription = lazy(() => import("./pages/Subscription"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserDetail = lazy(() => import("./pages/admin/UserDetail"));
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import BillingPage from "./pages/BillingPage";
import AccountPage from "./pages/AccountPage";

const SeedAnalytics = lazy(() => import("./pages/admin/SeedAnalytics"));
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
        staleTime: 1 * 60 * 1000, // 1 minute for dynamic data
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
                <Route path="/about" element={<About />} />
                <Route path="/portfolio" element={<Navigate to="/about" replace />} />
                <Route 
                  path="/storyship" 
                  element={
                    <Suspense fallback={<CalendarSkeletonLoader />}>
                      <StoryShip />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/investor-deck" 
                  element={
                    <Suspense fallback={<CalendarSkeletonLoader />}>
                      <NewInvestorDeck />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/investor-deck/detail" 
                  element={
                    <Suspense fallback={<CalendarSkeletonLoader />}>
                      <DetailedInvestorDeck />
                    </Suspense>
                  } 
                />
                {/* ✅ GOOD: Direct themeId routing only */}
                
                  {/* ✅ GOOD: Only themeId routes supported */}
                  <Route 
                    path="/stories/id/:themeId" 
                    element={
                      <Suspense fallback={<div>Loading...</div>}>
                        <ThemeDetail />
                      </Suspense>
                    } 
                  />
                
                <Route 
                  path="/stories" 
                  element={
                    <Suspense fallback={<CalendarSkeletonLoader />}>
                      <StoriesDashboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/stories/post/:postId" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<CalendarSkeletonLoader />}>
                        <PostDetail />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                 />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                
                <Route 
                  path="/sec" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <ErrorBoundary>
                          <Suspense fallback={<div>Loading...</div>}>
                            <SEC />
                          </Suspense>
                        </ErrorBoundary>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/sec/data-dictionary" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <DataDictionary />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/blog-editor" element={<BlogEditor />} />
                <Route path="/blog-editor/:id" element={<BlogEditor />} />
                <Route 
                  path="/admin-blog" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <AdminBlog />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/jobs" 
                  element={
                    <AdminRoute>
                      <Suspense fallback={<JobsSkeletonLoader />}>
                        <OptimizedJobs />
                      </Suspense>
                    </AdminRoute>
                  } 
                />
                <Route path="/portfolio/:company" element={<CompanyPortfolio />} />
                <Route 
                  path="/agents" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Loading...</div>}>
                        <Agents />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/agents/:id" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AgentDetail />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/agents/:id/edit" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AgentEdit />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/agents/new" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AgentEdit />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route path="/ascertain-to-the-moon" element={<AscertainToTheMoon />} />
                
                {/* Redirect legacy vendor routes to admin */}
                <Route path="/vendors" element={<Navigate to="/admin/vendors" replace />} />
                <Route path="/vendors/:slugname" element={<Navigate to="/admin/vendors/:slugname" replace />} />
                <Route path="/vendors/:slugname/:vendorSlug" element={<Navigate to="/admin/vendors/:slugname/:vendorSlug" replace />} />
                <Route path="/public/vendors/:category/:vendorSlug" element={<PublicVendorView />} />
                <Route path="/public/collections/:handle/:id" element={<ErrorBoundary><PublicSharedCollection /></ErrorBoundary>} />
                <Route path="/homehealth" element={<HomeHealth />} />
                
                <Route path="/comparisons" element={<ComparisonIndex />} />
                <Route path="/comparison/:comparisonType" element={<ComparisonDetail />} />
                <Route path="/admin/comparisons" element={<AdminRoute><AdminLayout><AdminComparisons /></AdminLayout></AdminRoute>} />
                <Route path="/admin/comparisons/new" element={<AdminRoute><AdminLayout><ComparisonForm /></AdminLayout></AdminRoute>} />
                <Route path="/admin/comparisons/:id/edit" element={<AdminRoute><AdminLayout><ComparisonForm /></AdminLayout></AdminRoute>} />
                
                 {/* Use Cases Admin Routes */}
                <Route path="/admin/case-studies" element={<Navigate to="/admin/use-cases" replace />} />
                <Route 
                  path="/admin/use-cases" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <AdminUseCases />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/use-cases/new" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <UseCaseForm />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/use-cases/:id/edit" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <UseCaseForm />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/use-cases/:id/preview" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <UseCasePreview />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/api-usage" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                          <ApiUsage />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/seed-analytics" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                          <SeedAnalytics />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route path="/cases/case1" element={<CaseStudyRouteWrapper><Case1 /></CaseStudyRouteWrapper>} />
                <Route path="/cases/case3" element={<CaseStudyRouteWrapper><Case3 /></CaseStudyRouteWrapper>} />
                <Route path="/cases/case4" element={<CaseStudyRouteWrapper><Case4 /></CaseStudyRouteWrapper>} />
                <Route 
                  path="/cases/:slug" 
                  element={
                    <Suspense fallback={<div>Loading...</div>}>
                      <PublicUseCase />
                    </Suspense>
                  } 
                />
                <Route path="/companies" element={<RCMCompanies />} />
                <Route path="/companies/:vendorSlug" element={<PublicVendorView />} />
                <Route path="/investors" element={<ProtectedRoute><Investors /></ProtectedRoute>} />
                <Route 
                  path="/admin/subscription-analytics" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <SubscriptionAnalytics />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/subscription" 
                  element={
                    <Suspense fallback={<div>Loading...</div>}>
                      <Subscription />
                    </Suspense>
                  } 
                />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/subscription-status" element={<SubscriptionSuccess />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route 
                  path="/work-report" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <WorkReportPage />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/work-report/:date" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <WorkReportDetailPage />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route path="/chart-type-coverage--cost" element={<ChartTypeCoverageCost />} />

                {/* Public Library of shared collections */}
                <Route path="/library" element={<Library />} />

                {/* Admin Vendors */}
                <Route 
                  path="/admin/vendors" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <ErrorBoundary>
                          <Suspense fallback={<div>Loading...</div>}>
                            <VendorsIndex />
                          </Suspense>
                        </ErrorBoundary>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/vendors/:slugname" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <ErrorBoundary>
                          <Suspense fallback={<div>Loading...</div>}>
                            <Vendors />
                          </Suspense>
                        </ErrorBoundary>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/vendors/:slugname/:vendorSlug" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <ErrorBoundary>
                          <Suspense fallback={<div>Loading...</div>}>
                            <VendorDetail />
                          </Suspense>
                        </ErrorBoundary>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />

                {/* Admin Users */}
                <Route 
                  path="/admin/users" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <AdminUsers />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users/:id" 
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={<div>Loading...</div>}>
                          <AdminUserDetail />
                        </Suspense>
                      </AdminLayout>
                    </AdminRoute>
                  } 
                />
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
