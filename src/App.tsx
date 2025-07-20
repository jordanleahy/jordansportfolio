
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SEC from "./pages/SEC";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import BlogEditor from "./pages/BlogEditor";
import AdminBlog from "./pages/AdminBlog";
import Calendar from "./pages/Calendar";
import Jobs from "./pages/Jobs";
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/sec" element={<SEC />} />
              <Route path="/sec/data-dictionary" element={<DataDictionary />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/blog-editor" element={<BlogEditor />} />
              <Route path="/admin-blog" element={<AdminBlog />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/portfolio/:company" element={<CompanyPortfolio />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/sepsis" element={<Sepsis />} />
              <Route path="/ascertain-to-the-moon" element={<AscertainToTheMoon />} />
              <Route path="/vendors" element={<VendorsIndex />} />
              <Route path="/vendors/:slugname" element={<Vendors />} />
              <Route path="/vendors/:slugname/:vendorSlug" element={<VendorDetail />} />
              <Route path="/cases/case1" element={<Case1 />} />
              <Route path="/cases/case3" element={<Case3 />} />
              <Route path="/cases/case4" element={<Case4 />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
