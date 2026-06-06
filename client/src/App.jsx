import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Vendors from './pages/Vendors/Vendors';
import RFQ from './pages/RFQ/RFQ';
import Quotations from './pages/Quotations/Quotations';
import QuotationCompare from './pages/Quotations/QuotationCompare';
import Approvals from './pages/Approvals/Approvals';
import PurchaseOrders from './pages/PurchaseOrders/PurchaseOrders';
import Invoices from './pages/Invoices/Invoices';
import ActivityLog from './pages/Activity/Activity';
import Reports from './pages/Reports/Reports';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ width:48, height:48, border:'3px solid var(--primary-light)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
          <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading VendorBridge AI...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vendors" element={
          <ProtectedRoute roles={['admin','procurement_officer','manager']}>
            <Vendors />
          </ProtectedRoute>
        } />
        <Route path="rfqs" element={<RFQ />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="quotations/compare/:rfqId" element={<QuotationCompare />} />
        <Route path="quotations/compare" element={<QuotationCompare />} />
        <Route path="approvals" element={
          <ProtectedRoute roles={['admin','manager','procurement_officer']}>
            <Approvals />
          </ProtectedRoute>
        } />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="activity" element={
          <ProtectedRoute roles={['admin','procurement_officer','manager']}>
            <ActivityLog />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute roles={['admin','procurement_officer','manager']}>
            <Reports />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
