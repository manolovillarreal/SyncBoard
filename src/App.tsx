import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './features/auth/AuthContext';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ReceivedInvitationsModal } from './features/invitations/ReceivedInvitationsModal';
import { Wifi, WifiOff } from 'lucide-react';

export const OFFLINE_BANNER_TEXT = 'Sin conexión a internet. Los cambios no se sincronizarán.';
export const RECONNECTED_TOAST_TEXT = 'Conexión restablecida.';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState<number>(0);
  const [invitationsModalOpen, setInvitationsModalOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showReconnectToast, setShowReconnectToast] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchPendingInvitationsCount = useCallback(async () => {
    if (!user?.email) {
      setPendingInvitationsCount(0);
      return;
    }

    try {
      const normalizedEmail = user.email.toLowerCase();
      const { count, error } = await supabase
        .from('project_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (!error && typeof count === 'number') {
        setPendingInvitationsCount(count);
      }
    } catch (err) {
      console.error('Error obteniendo conteo de invitaciones:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPendingInvitationsCount();
    }
  }, [user, fetchPendingInvitationsCount]);

  useEffect(() => {
    let toastTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnectToast(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnectToast(true);
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        setShowReconnectToast(false);
      }, 4000);

      // Disparar reconsulta de proyectos y tareas
      setRefreshKey((prev) => prev + 1);
      if (user) {
        fetchPendingInvitationsCount();
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (toastTimeout) clearTimeout(toastTimeout);
    };
  }, [user, fetchPendingInvitationsCount]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Franja superior amarilla ante pérdida de conexión */}
        {isOffline && (
          <div
            role="alert"
            className="bg-yellow-400 text-yellow-950 px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-sm border-b border-yellow-500 z-50 sticky top-0"
          >
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>{OFFLINE_BANNER_TEXT}</span>
          </div>
        )}

        <Navbar
          onGoHome={() => setSelectedProjectId(null)}
          pendingInvitationsCount={pendingInvitationsCount}
          onOpenInvitations={() => setInvitationsModalOpen(true)}
        />

        <main className="flex-1">
          {selectedProjectId ? (
            <ProjectDetailPage
              key={`project-${selectedProjectId}-${refreshKey}`}
              projectId={selectedProjectId}
              onBack={() => setSelectedProjectId(null)}
            />
          ) : (
            <DashboardPage
              key={`dashboard-${refreshKey}`}
              onSelectProject={(id) => setSelectedProjectId(id)}
              pendingInvitationsCount={pendingInvitationsCount}
              onOpenInvitations={() => setInvitationsModalOpen(true)}
            />
          )}
        </main>

        {/* Toast temporal de reconexión */}
        {showReconnectToast && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all"
          >
            <Wifi className="w-4 h-4 flex-shrink-0" />
            <span>{RECONNECTED_TOAST_TEXT}</span>
          </div>
        )}

        <ReceivedInvitationsModal
          isOpen={invitationsModalOpen}
          onClose={() => setInvitationsModalOpen(false)}
          onInvitationAccepted={() => {
            fetchPendingInvitationsCount();
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

export default App;
