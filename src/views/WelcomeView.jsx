import './WelcomeView.css';

// Using inline SVG icons for now
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const AppleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.49.07 2.65.65 3.35 1.77-2.89 1.6-2.31 5.38.35 6.55-1.29 3.39-2.06 4.47-2.28 4.65zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
);

export default function WelcomeView({ onSelectAuth }) {
    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <div className="auth-buttons window-glass panel-fade-in">
                    <button className="auth-btn" onClick={() => onSelectAuth('google')}>
                        <GoogleIcon />
                        <span>Sign up with Google</span>
                    </button>

                    <button className="auth-btn" onClick={() => onSelectAuth('apple')}>
                        <AppleIcon />
                        <span>Sign up with Apple</span>
                    </button>

                    <button className="auth-btn" onClick={() => onSelectAuth('phone')}>
                        <span>Sign up with Phone</span>
                    </button>

                    <button className="auth-btn" style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }} onClick={() => onSelectAuth('guest')}>
                        <span style={{ color: '#9ca3af' }}>Continue as Guest</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
