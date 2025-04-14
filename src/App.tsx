import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './features/auth/application/authStore'
import { useEventsStore } from './features/events/application/eventsStore'
import { useOrganizerSync } from './features/auth/application/useOrganizerSync'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './features/events/presentation/HomePage'
import EventDetailPage from './features/events/presentation/EventDetailPage'
import EventsPage from './features/events/presentation/EventsPage'
import MapView from './features/events/presentation/MapView'
import LoginPage from './features/auth/presentation/LoginPage'
import RegisterPage from './features/auth/presentation/RegisterPage'
import OrganizerDashboard from './features/organizers/presentation/OrganizerDashboard'
import EventAnalytics from './features/organizers/presentation/EventAnalytics'
import NotFoundPage from './components/common/NotFoundPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import CreateEventPage from './features/events/presentation/CreateEventPage'
import DebugPage from './features/debug/DebugPage'

function App() {
  const { initializeAuth, isLoading: authLoading } = useAuthStore()
  const { fetchMetadata, isLoading: metadataLoading, metadata } = useEventsStore()

  // Use the organizer sync hook
  useOrganizerSync()

  // Initialize auth
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])
  
  // Fetch metadata (categories, tags, etc.) at app startup, but only if we don't have it
  useEffect(() => {
    // Only try to fetch metadata if we don't already have it and we're not currently loading
    if (!metadata && !metadataLoading) {
      console.log('App: Initializing metadata');
      fetchMetadata();
    }
  }, [metadata, metadataLoading, fetchMetadata]);

  // Only show loading spinner during auth loading, not metadata
  // This ensures the page renders faster
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cm-blue dark:border-cm-yellow"></div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#121212] text-[#121212] dark:text-white">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:instanceId" element={<EventDetailPage />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/organizer/*" 
                element={
                  <ProtectedRoute>
                    <Routes>
                      <Route path="dashboard" element={<OrganizerDashboard />} />
                      <Route path="events/create" element={<CreateEventPage />} />
                      <Route path="events/edit/:eventId" element={<CreateEventPage />} />
                      <Route path="events/:eventId/analytics" element={<EventAnalytics />} />
                    </Routes>
                  </ProtectedRoute>
                } 
              />
              
              {/* Debug Route */}
              <Route
                path="/debug"
                element={
                  <ProtectedRoute>
                    <DebugPage />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App 