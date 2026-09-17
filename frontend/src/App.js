import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { I18nProvider } from "./i18n/I18nProvider";
import "./App.css";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Scenarios from "./pages/Scenarios";
import Learn from "./pages/Learn";
import SimulationWizard from "./pages/SimulationWizard";
import NegotiationRoom from "./pages/NegotiationRoom";
import Debrief from "./pages/Debrief";
import History from "./pages/History";
import Profile from "./pages/Profile";

function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster theme="dark" position="top-right" richColors />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/scenarios" element={<Protected><Scenarios /></Protected>} />
              <Route path="/learn" element={<Protected><Learn /></Protected>} />
              <Route path="/simulate" element={<Protected><SimulationWizard /></Protected>} />
              <Route path="/negotiation/:id" element={<Protected><NegotiationRoom /></Protected>} />
              <Route path="/debrief/:id" element={<Protected><Debrief /></Protected>} />
              <Route path="/history" element={<Protected><History /></Protected>} />
              <Route path="/history/:id" element={<Protected><Debrief /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </div>
  );
}

export default App;
