
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Suspense, lazy, useState } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SEC from "./pages/SEC";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import BlogEditor from "./pages/BlogEditor";
import AdminBlog from "./pages/AdminBlog";
import CompanyPortfolio from "./pages/CompanyPortfolio";
import Agents from "./pages/Agents";
import AscertainToTheMoon from "./pages/AscertainToTheMoon";
import Vendors from "./pages/Vendors";
import VendorsIndex from "./pages/VendorsIndex";
import VendorDetail from "./pages/VendorDetail";
import PublicVendorView from "./components/vendors/PublicVendorView";
import Case1 from "./pages/cases/Case1";
import Case3 from "./pages/cases/Case3";
import Case4 from "./pages/cases/Case4";

import { AgentDetail } from "./pages/agents/AgentDetail";
import { AgentEdit } from "./pages/agents/AgentEdit";
import DataDictionary from "./pages/sec/DataDictionary";
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

// Lazy load API Usage component
const ApiUsage = lazy(() => import("./pages/admin/ApiUsage"));
const SeedManagement = lazy(() => import("./pages/admin/SeedManagement"));
import { JobsSkeletonLoader, CalendarSkeletonLoader } from "@/components/performance/SkeletonLoader";

// Lazy load optimized components
const OptimizedJobs = lazy(() => import("./pages/OptimizedJobs"));
const OptimizedCalendar = lazy(() => import("./pages/OptimizedCalendar"));


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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/sec" element={<SEC />} />
                <Route path="/sec/data-dictionary" element={<DataDictionary />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/blog-editor" element={<BlogEditor />} />
                <Route path="/blog-editor/:id" element={<BlogEditor />} />
                <Route path="/admin-blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
                <Route 
                  path="/calendar" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<CalendarSkeletonLoader />}>
                        <OptimizedCalendar />
                      </Suspense>
                    </ProtectedRoute>
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
                 <Route path="/agents" element={<AdminRoute><Agents /></AdminRoute>} />
                 <Route path="/agents/:id" element={<AdminRoute><AgentDetail /></AdminRoute>} />
                 <Route path="/agents/:id/edit" element={<AdminRoute><AgentEdit /></AdminRoute>} />
                 <Route path="/agents/new" element={<AdminRoute><AgentEdit /></AdminRoute>} />
                <Route path="/ascertain-to-the-moon" element={<AscertainToTheMoon />} />
                <Route path="/vendors" element={<ProtectedRoute><VendorsIndex /></ProtectedRoute>} />
                <Route path="/vendors/:slugname" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
                <Route path="/vendors/:slugname/:vendorSlug" element={<ProtectedRoute><VendorDetail /></ProtectedRoute>} />
                <Route path="/public/vendors/:category/:vendorSlug" element={<PublicVendorView />} />
                <Route path="/homehealth" element={<HomeHealth />} />
                
                <Route path="/comparisons" element={<ComparisonIndex />} />
                <Route path="/comparison/:comparisonType" element={<ComparisonDetail />} />
                <Route path="/admin/comparisons" element={<AdminRoute><AdminComparisons /></AdminRoute>} />
                <Route path="/admin/comparisons/new" element={<AdminRoute><ComparisonForm /></AdminRoute>} />
                <Route path="/admin/comparisons/:id/edit" element={<AdminRoute><ComparisonForm /></AdminRoute>} />
                <Route 
                  path="/admin/api-usage" 
                  element={
                    <AdminRoute>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <ApiUsage />
                      </Suspense>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/seeds" 
                  element={
                    <AdminRoute>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <SeedManagement />
                      </Suspense>
                    </AdminRoute>
                  } 
                />
                <Route path="/cases/case1" element={<Case1 />} />
                <Route path="/cases/case3" element={<Case3 />} />
                <Route path="/cases/case4" element={<Case4 />} />
                <Route path="/rcmcompanies" element={<RCMCompanies />} />
                <Route path="/rcmcompanies/:vendorSlug" element={<PublicVendorView />} />
                <Route path="/investors" element={<ProtectedRoute><Investors /></ProtectedRoute>} />
                <Route path="/chart-type-coverage--cost" element={<ChartTypeCoverageCost />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
