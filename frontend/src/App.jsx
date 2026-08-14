import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { ToastProvider } from './context/ToastContext'
import Communities from './pages/Communities'
import CommunityDetail from './pages/CommunityDetail'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'
import Events from './pages/Events'
import Feed from './pages/Feed'
import Home from './pages/Home'
import Login from './pages/Login'
import Messages from './pages/Messages'
import MessageThread from './pages/MessageThread'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Register from './pages/Register'
import ResourceDetail from './pages/ResourceDetail'
import Resources from './pages/Resources'
import Search from './pages/Search'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="sp-container">
        <p className="sp-meta">Cargando sesión…</p>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function protect(element) {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="feed" element={protect(<Feed />)} />
        <Route path="communities" element={protect(<Communities />)} />
        <Route path="communities/:communityId" element={protect(<CommunityDetail />)} />
        <Route path="resources" element={protect(<Resources />)} />
        <Route path="resources/:resourceId" element={protect(<ResourceDetail />)} />
        <Route path="events" element={protect(<Events />)} />
        <Route path="events/:eventId" element={protect(<EventDetail />)} />
        <Route path="messages" element={protect(<Messages />)} />
        <Route path="messages/:conversationId" element={protect(<MessageThread />)} />
        <Route path="notifications" element={protect(<Notifications />)} />
        <Route path="dashboard" element={protect(<Dashboard />)} />
        <Route path="search" element={protect(<Search />)} />
        <Route path="users/:userId" element={protect(<Profile />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationsProvider>
          <ChatProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ChatProvider>
        </NotificationsProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
