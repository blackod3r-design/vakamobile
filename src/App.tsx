import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- PROVIDERS ---
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// --- HOOKS ---
import useIsMobile from "@/hooks/use-mobile"; 

// --- COMPONENTES GLOBALES ---
import MainLayout from "./components/MainLayout";
import { AIAssistant } from "./components/AIAssistant";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import GlobalNavigation from "./components/GlobalNavigation"; 

// --- 1. PÁGINAS DE PC (Desktop) ---
import Dash30 from "./pages/Dash30";
import AccountsPC from "./pages/Accounts";
import CreditCardsPC from "./pages/CreditCards";
import GoalsPC from "./pages/Goals";
import MortgagePC from "./pages/Mortgage";
import LoansPC from "./pages/Loans";
import WalletsPC from "./pages/Wallets";
import TasksPC from "./pages/Tasks";
import MilesPointsPC from "./pages/MilesPoints";
import PropertiesPC from "./pages/Properties";
import SettingsPC from "./pages/Settings";
import BudgetsPC from "./pages/Budgets";
import Transfers from "./pages/Transfers";

// --- 2. PÁGINAS MÓVILES (Viejas y Nuevas) ---
import { MobileDashboard, MobilePageWrapper } from "./pages/mobile"; 

// IMPORTACIÓN DE LOS NUEVOS MÓDULOS MÓVILES (Full Screen)
import MobileAccountsList from "./pages/mobile/MobileAccountsList"; 
import MobileCards from "./pages/mobile/MobileCreditCards"; // Apunta al archivo correcto
import MobileGoals from "./pages/mobile/MobileGoals";
import MobileMilesPoints from "./pages/mobile/MobileMilesPoints";
import MobileTasks from "./pages/mobile/MobileTasks";       
import MobileWallets from "./pages/mobile/MobileWallets"; 
import MobileMortgage from "./pages/mobile/MobileMortgage"; // <--- AQUÍ ESTÁ LA HIPOTECA

const queryClient = new QueryClient();

// --- PROTECCIÓN DE SESIÓN ---
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Cargando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// --- CEREBRO CENTRAL ---
const AppContent = () => {
  const { sidebarSize, theme } = useTheme();
  const isMobile = useIsMobile(); 

  const getGlobalBackground = () => {
    if (theme === 'dark' || theme === 'dark-glass') return 'bg-[#0f0f0f] text-white';
    if (theme === 'glass') return 'bg-[#3a75c4] text-white';
    return 'bg-white text-gray-900';
  };

  const getSidebarWidth = (size: string) => {
    switch (size) {
      case "compact": return "14rem";
      case "expanded": return "20rem";
      default: return "16rem";
    }
  };

  // ==========================================
  // VISTA MÓVIL
  // ==========================================
  if (isMobile) {
    return (
      <div className="bg-[#FCFCFC] min-h-screen w-full font-sans text-gray-900 overflow-hidden relative">
        
        {/* Navegación Flotante */}
        <GlobalNavigation /> 

        <Routes>
          {/* Dashboard Principal */}
          <Route path="/" element={<MobileDashboard />} />

          {/* --- MÓDULOS FULL SCREEN --- */}
          <Route path="/accounts" element={<MobileAccountsList />} />
          <Route path="/cards" element={<MobileCards />} />
          <Route path="/goals" element={<MobileGoals />} />
          <Route path="/miles" element={<MobileMilesPoints />} />
          <Route path="/tasks" element={<MobileTasks />} />
          <Route path="/wallets" element={<MobileWallets />} />
          <Route path="/mortgage" element={<MobileMortgage />} /> {/* <--- RUTA ACTIVADA */}
          
          {/* --- RUTAS NO DEFINIDAS --- */}
          <Route path="*" element={
            <MobilePageWrapper>
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center text-sm gap-2">
                <span>🚧</span>
                <span>Sección disponible en escritorio.</span>
              </div>
            </MobilePageWrapper>
          } />
        </Routes>
      </div>
    );
  }

  // ==========================================
  // VISTA ESCRITORIO
  // ==========================================
  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${getGlobalBackground()}`}>
      <SidebarProvider style={{ ["--sidebar-width" as any]: getSidebarWidth(sidebarSize) }}>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dash30 />} />
            <Route path="/dash30" element={<Dash30 />} /> 
            
            <Route path="/accounts" element={<AccountsPC />} />
            <Route path="/cards" element={<CreditCardsPC />} />
            <Route path="/goals" element={<GoalsPC />} />
            <Route path="/mortgage" element={<MortgagePC />} />
            <Route path="/loans" element={<LoansPC />} />
            <Route path="/wallets" element={<WalletsPC />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/tasks" element={<TasksPC />} />
            <Route path="/miles" element={<MilesPointsPC />} />
            <Route path="/properties" element={<PropertiesPC />} />
            <Route path="/budgets" element={<BudgetsPC />} />
            <Route path="/settings" element={<SettingsPC />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </SidebarProvider>
      <AIAssistant />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <EditModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner position="top-right" />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/*" element={<PrivateRoute><AppContent /></PrivateRoute>} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </EditModeProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;