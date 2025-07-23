
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { navItems } from "./nav-items";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import BlogEditor from "./pages/BlogEditor";
import BlogPost from "./pages/BlogPost";
import BlogList from "./pages/BlogList";
import OptimizedCalendar from "./pages/OptimizedCalendar";
import CaseStudyEditor from "./pages/CaseStudyEditor";
import CaseStudyView from "./pages/CaseStudyView";
import CaseStudyList from "./pages/CaseStudyList";
import JobApplications from "./pages/JobApplications";
import CompanyPortfolio from "./pages/CompanyPortfolio";
import VendorDirectory from "./pages/VendorDirectory";
import VendorProfile from "./pages/VendorProfile";
import EventsCalendar from "./pages/EventsCalendar";
import AgentDashboard from "./pages/AgentDashboard";
import PromptLibrary from "./pages/PromptLibrary";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/blog-editor" element={<BlogEditor />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/calendar" element={<OptimizedCalendar />} />
            <Route path="/case-study-editor" element={<CaseStudyEditor />} />
            <Route path="/case-study/:slug" element={<CaseStudyView />} />
            <Route path="/case-studies" element={<CaseStudyList />} />
            <Route path="/job-applications" element={<JobApplications />} />
            <Route path="/company-portfolio/:slug" element={<CompanyPortfolio />} />
            <Route path="/vendor-directory" element={<VendorDirectory />} />
            <Route path="/vendor/:slug" element={<VendorProfile />} />
            <Route path="/events" element={<EventsCalendar />} />
            <Route path="/agents" element={<AgentDashboard />} />
            <Route path="/prompt-library" element={<PromptLibrary />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
