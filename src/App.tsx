
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";
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
import Case1 from "./pages/cases/Case1";
import Case3 from "./pages/cases/Case3";
import Case4 from "./pages/cases/Case4";
import Sepsis from "./pages/agents/Sepsis";
import DataDictionary from "./pages/sec/DataDictionary";
import NotFound from "./pages/NotFound";
import { JobsSkeletonLoader, CalendarSkeletonLoader } from "@/components/performance/SkeletonLoader";

// Lazy load optimized components
const OptimizedJobs = lazy(() => import("./pages/OptimizedJobs"));
const OptimizedCalendar = lazy(() => import("./pages/OptimizedCalendar"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
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
});

function App() {
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
                <Route path="/sec" element={<SEC />} />
                <Route path="/sec/data-dictionary" element={<DataDictionary />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/blog-editor" element={<BlogEditor />} />
                <Route path="/blog-editor/:id" element={<BlogEditor />} />
                <Route path="/admin-blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />
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
                    <ProtectedRoute>
                      <Suspense fallback={<JobsSkeletonLoader />}>
                        <OptimizedJobs />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route path="/portfolio/:company" element={<CompanyPortfolio />} />
                <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
                <Route path="/agents/sepsis" element={<ProtectedRoute><Sepsis /></ProtectedRoute>} />
                <Route path="/ascertain-to-the-moon" element={<AscertainToTheMoon />} />
                <Route path="/vendors" element={<ProtectedRoute><VendorsIndex /></ProtectedRoute>} />
                <Route path="/vendors/:slugname" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
                <Route path="/vendors/:slugname/:vendorSlug" element={<ProtectedRoute><VendorDetail /></ProtectedRoute>} />
                <Route path="/cases/case1" element={<Case1 />} />
                <Route path="/cases/case3" element={<Case3 />} />
                <Route path="/cases/case4" element={<Case4 />} />
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
