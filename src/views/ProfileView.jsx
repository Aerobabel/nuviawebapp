import './ProfileView.css';

const PROFILE_OPTIONS = [
    { icon: 'person', label: 'Personal information' },
    { icon: 'options', label: 'Personalization' },
    { icon: 'server', label: 'Data Storage' },
    { icon: 'information-circle', label: 'About' },
];

export default function ProfileView({ onBack, user }) {
    const formatName = () => {
        if (!user) return 'Guest';
        return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
    };

    const handleAction = (label) => {
        alert(`${label} is under construction on the web version.`);
    };

    return (
        <div className="profile-container scrollarea">
            <div className="profile-header">
                <button className="btn-icon glass-panel" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div className="tab-pill glass-panel">Profile</div>
                <div style={{ width: 44 }}></div>
            </div>

            <div className="profile-card glass-panel fade-in">
                <div className="profile-avatar-large">
                    {formatName().charAt(0).toUpperCase()}
                </div>
                <div className="profile-text">
                    <h2 className="profile-name-large">{formatName()}</h2>
                    <p className="profile-email">{user?.email || 'Not Signed In'}</p>
                    <p className="profile-phone">{user?.user_metadata?.phone || ''}</p>
                </div>
            </div>

            <div className="options-list fade-in">
                {PROFILE_OPTIONS.map((item, idx) => (
                    <button key={idx} className="option-btn glass-panel" onClick={() => handleAction(item.label)}>
                        <div className="option-left">
                            <span className="option-icon">❖</span>
                            <span className="option-label">{item.label}</span>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                ))}
            </div>

            <button className="signout-btn glass-panel fade-in" onClick={() => alert('Sign out clicked')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span>Sign Out</span>
            </button>
        </div>
    );
}
