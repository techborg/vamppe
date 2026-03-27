import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileRedirect from './pages/ProfileRedirect';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Explore from './pages/Explore';
import Bookmarks from './pages/Bookmarks';
import Hashtag from './pages/Hashtag';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import Overview from './admin/Overview';
import AdminUsers from './admin/Users';
import AdminPosts from './admin/Posts';
import VerificationRequests from './admin/VerificationRequests';
import Analytics from './admin/Analytics';
import Settings from './pages/Settings';

// Handles /username routes — catches /:usernameSlug and renders Profile
function UsernameRoute() {
  const { usernameSlug } = useParams();
  return <Profile username={usernameSlug} />;
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/home" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" />;
  if (!user.isAdmin) return <Navigate to="/admin/login" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/:usernameSlug" element={<UsernameRoute />} />
            <Route path="/profile/:id" element={<ProfileRedirect />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/hashtag/:tag" element={<Hashtag />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:username" element={<Chat />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Overview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="verification-requests" element={<VerificationRequests />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
