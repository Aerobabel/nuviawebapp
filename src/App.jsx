import { useCallback, useEffect, useState } from 'react';
import './App.css';
import AnimatedBackground from './components/AnimatedBackground';
import { supabase } from './lib/supabase';
import { loadSessionsForUser } from './services/storage';
import ChatView from './views/ChatView';
import PaymentView from './views/PaymentView';
import PhoneAuthView from './views/PhoneAuthView';
import ProfileView from './views/ProfileView';
import TripDetailsView from './views/TripDetailsView';
import WelcomeView from './views/WelcomeView';

function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [user, setUser] = useState(null);

  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null); // For TripDetailsView

  // Check auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentView('chat');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setCurrentView('chat');
      else setCurrentView('welcome');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNewChat = () => {
    setCurrentSessionId(crypto.randomUUID());
    setCurrentView('chat');
  };

  const handleOpenTripDetails = (plan) => {
    setSelectedPlan(plan);
    setCurrentView('trip-details');
  };

  const handleOpenPayment = (plan) => {
    setSelectedPlan(plan);
    setCurrentView('payment');
  };

  const formatName = () => {
    if (!user) return 'Guest';
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
  };

  const refreshSessions = useCallback(async () => {
    const loaded = await loadSessionsForUser(user?.id || null);
    setSessions(loaded);
    setCurrentSessionId((prev) => prev || loaded[0]?.id || crypto.randomUUID());
  }, [user?.id]);

  // Reload sessions when entering chat or when auth identity changes
  useEffect(() => {
    if (currentView === 'chat') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshSessions().catch((err) => console.error('Failed to refresh sessions', err));
    }
  }, [currentView, refreshSessions]);

  const handleSelectAuth = async (type) => {
    if (type === 'guest') {
      if (!currentSessionId) setCurrentSessionId(crypto.randomUUID());
      setCurrentView('chat');
      return;
    }

    if (type === 'phone') {
      setCurrentView('phone');
      return;
    }

    if (type === 'google') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error) {
        console.error('Google sign-in failed:', error.message);
        alert(error.message);
      }
      return;
    }

    // Keep current fallback behavior for providers not wired yet (e.g. Apple)
    setCurrentView('phone');
  };

  // Views that don't need the Sidebar
  if (currentView === 'welcome') {
    return (
      <>
        <AnimatedBackground />
        <main className="app-container">
          <div className="ambient-light light-1"></div><div className="ambient-light light-2"></div>
          <WelcomeView onSelectAuth={handleSelectAuth} />
        </main>
      </>
    );
  }

  if (currentView === 'phone') {
    return (
      <>
        <AnimatedBackground />
        <main className="app-container">
          <div className="ambient-light light-1"></div><div className="ambient-light light-2"></div>
          <PhoneAuthView onBack={() => setCurrentView('welcome')} onComplete={() => setCurrentView('chat')} />
        </main>
      </>
    );
  }

  // App Shell (Sidebar + Content)
  return (
    <>
      <div className="app-layout">
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'} `}>
          <div className="sidebar-header">
            <div className="logo-small gradient-text">NÜVIA</div>
            <button className="icon-btn" onClick={() => setIsSidebarOpen(false)} style={{ width: 32, height: 32 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          </div>

          <button className="new-chat-btn" onClick={handleNewChat}>
            <svg style={{ marginRight: 8 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Chat
          </button>

          <div className="history-list scrollarea">
            {sessions.map(s => (
              <div
                key={s.id}
                className={`history-item ${currentSessionId === s.id && currentView === 'chat' ? 'active' : ''} `}
                onClick={() => {
                  setCurrentSessionId(s.id);
                  setCurrentView('chat');
                }}
              >
                <div className="history-title">{s.preview || 'New Chat'}</div>
                <div className="history-date">{new Date(s.timestamp).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          <div className="sidebar-profile" onClick={() => setCurrentView('profile')}>
            <div className="profile-avatar">
              {formatName().charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <div className="profile-name">{formatName()}</div>
              <div className="history-date">{user ? 'Free Plan' : 'Not Signed In'}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
        </aside>

        <main className="main-content">
          {currentView === 'chat' && (
            <ChatView
              sessionId={currentSessionId}
              onOpenTripDetails={handleOpenTripDetails}
              onOpenPayment={handleOpenPayment}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              userId={user?.id || null}
              onSessionUpdated={refreshSessions}
            />
          )}

          {currentView === 'profile' && (
            <ProfileView onBack={() => setCurrentView('chat')} user={user} />
          )}

          {currentView === 'trip-details' && (
            <TripDetailsView
              onBack={() => setCurrentView('chat')}
              plan={selectedPlan}
              onOpenPayment={() => handleOpenPayment(selectedPlan)}
            />
          )}

          {currentView === 'payment' && (
            <PaymentView
              onBack={() => setCurrentView('chat')}
              plan={selectedPlan}
            />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
