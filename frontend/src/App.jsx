import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import ScrollToTop from './components/common/ScrollToTop';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => { loadUser(); }, []);
  return (
    <div className="grain-overlay">
      <ScrollToTop />
      <CartDrawer />
      <Toaster position="top-right" toastOptions={{
        style: { background:'#161616', color:'#F2EDE4', border:'1px solid #202020', fontFamily:'DM Sans,sans-serif', fontSize:'14px' },
        success: { iconTheme: { primary:'#E8351A', secondary:'#fff' } },
      }} />
      <Routes>
        {/* Public */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/"              element={<><Navbar/><Home/><Footer/></>} />
        <Route path="/shop"          element={<><Navbar/><Shop/><Footer/></>} />
        <Route path="/collections"   element={<><Navbar/><Shop collectionType="featured"/><Footer/></>} />
        <Route path="/new-arrivals"  element={<><Navbar/><Shop collectionType="new"/><Footer/></>} />
        <Route path="/best-sellers"  element={<><Navbar/><Shop collectionType="bestsellers"/><Footer/></>} />
        <Route path="/product/:id"   element={<><Navbar/><ProductDetail/><Footer/></>} />
        <Route path="/login"     element={<Login/>} />
        <Route path="/register"  element={<Register/>} />
        {/* Protected */}
        <Route path="/checkout"  element={<ProtectedRoute><Navbar/><Checkout/></ProtectedRoute>} />
        <Route path="/order-success/:orderId" element={<ProtectedRoute><Navbar/><OrderSuccess/><Footer/></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Navbar/><Profile/><Footer/></ProtectedRoute>} />
        <Route path="/orders"    element={<ProtectedRoute><Navbar/><OrderHistory/><Footer/></ProtectedRoute>} />
        <Route path="/wishlist"  element={<ProtectedRoute><Navbar/><Wishlist/><Footer/></ProtectedRoute>} />
        {/* 404 */}
        <Route path="*" element={<><Navbar/><NotFound/><Footer/></>} />
      </Routes>
    </div>
  );
}
