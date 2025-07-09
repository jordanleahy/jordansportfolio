import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SmarterDxCase from "./pages/cases/SmarterDxCase";
import PrescriberPointCase from "./pages/cases/PrescriberPointCase";
import BCGXCase from "./pages/cases/BCGXCase";
import DefinitiveCase from "./pages/cases/DefinitiveCase";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cases/smarterdx" element={<SmarterDxCase />} />
          <Route path="/cases/prescriberpoint" element={<PrescriberPointCase />} />
          <Route path="/cases/bcgx" element={<BCGXCase />} />
          <Route path="/cases/definitive" element={<DefinitiveCase />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
