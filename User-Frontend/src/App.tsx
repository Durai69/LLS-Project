import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom"; 
import { SurveyProvider } from "@/contexts/SurveyContext";
import ProtectedRoute from "@/contexts/ProtectedRoute"; // Import the new ProtectedRoute
import { AuthProvider } from './contexts/AuthContext';

import Dashboard from "./pages/Dashboard";
import DepartmentSelection from "./pages/DepartmentSelection";
import SurveyForm from "./pages/SurveyForm";
import SubmissionSuccess from "./pages/SubmissionSuccess";
import ExcelExport from "./pages/ExcelExport";
import Account from "./pages/Account";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import RemarksResponse from "./pages/RemarksResponse";
import Login from "../../shared/Login"; // Make sure this path is correct

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <SurveyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes (accessible to everyone) */}
              <Route path="/" element={<Login />} />
              <Route path="/submission-success" element={<SubmissionSuccess />} />
              <Route path="*" element={<NotFound />} /> {/* Catch-all for undefined routes */}

              {/* Protected routes (only accessible if authenticated) */}
              <Route element={<ProtectedRoute />}> {/* This route protects its children */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/departments" element={<DepartmentSelection />} />
                <Route path="/survey/:departmentId" element={<SurveyForm />} />
                <Route path="/excel" element={<ExcelExport />} />
                <Route path="/remarks-response" element={<RemarksResponse />} />
                <Route path="/account" element={<Account />} />
                <Route path="/help" element={<Help />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SurveyProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
