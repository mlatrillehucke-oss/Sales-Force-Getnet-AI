import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import CommerceSearch from './pages/CommerceSearch';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientReport from './pages/ClientReport';
import AIAssistant from './pages/AIAssistant';
import Alerts from './pages/Alerts';
import Privacy from './pages/Privacy';
import SalesAgentAI from './pages/SalesAgentAI';
import ZoneReport from './pages/ZoneReport';
import Settings from './pages/Settings';
import Chat from './pages/Chat';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/search" element={<CommerceSearch />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/client-form" element={<ClientForm />} />
        <Route path="/client-report" element={<ClientReport />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/sales-agent" element={<SalesAgentAI />} />
        <Route path="/zone-report" element={<ZoneReport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App