import { useState } from 'react';
import './PaymentView.css';

const EMBED_HOST_ALLOWLIST = ['gettransfer.com'];

const hostFromUrl = (url) => {
    try {
        return new URL(url).hostname.toLowerCase();
    } catch {
        return '';
    }
};

const hostMatches = (hostname, domain) => hostname === domain || hostname.endsWith(`.${domain}`);

const canEmbedUrl = (url) => {
    const hostname = hostFromUrl(url);
    if (!hostname) return false;
    return EMBED_HOST_ALLOWLIST.some((domain) => hostMatches(hostname, domain));
};

const resolveProviderUrl = (item, plan) => {
    const itemType = (item.item || '').toLowerCase();
    const provider = (item.provider || '').toLowerCase();

    if (item.booking_url) return item.booking_url;

    // Provider-specific targets first
    if (provider.includes('wizz')) return 'https://wizzair.com/';
    if (provider.includes('turkish')) return 'https://www.turkishairlines.com/';
    if (provider.includes('radisson')) return 'https://www.radissonhotels.com/';
    if (provider.includes('get transfer') || provider.includes('gettransfer')) return 'https://gettransfer.com/';
    if (provider.includes('get guide') || provider.includes('getyourguide')) return 'https://www.getyourguide.com/';
    if (provider.includes('axa')) return 'https://www.axa.com/';
    if (provider.includes('allianz')) return 'https://www.allianztravelinsurance.com/';

    // Type-based fallbacks (avoid Google because it blocks iframe embedding)
    if (itemType.includes('transfer')) return 'https://gettransfer.com/';
    if (itemType.includes('flight') || itemType.includes('fly')) return 'https://www.skyscanner.com/';
    if (itemType.includes('hotel') || itemType.includes('stay')) return 'https://www.booking.com/';
    if (itemType.includes('excursion') || itemType.includes('tour') || itemType.includes('activity')) return 'https://www.getyourguide.com/';
    if (itemType.includes('insurance')) return 'https://www.allianztravelinsurance.com/';

    // Generic fallback
    if (plan?.location) {
        return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(plan.location)}`;
    }
    return 'https://www.expedia.com/';
};

export default function PaymentView({ onBack, plan }) {
    const [activeWebUrl, setActiveWebUrl] = useState(null);

    // Dynamic data or fallback exactly matching mobile native app logic if breakdown missing
    const items = plan?.costBreakdown || [
        { item: 'Fly Tickets', provider: 'Wizz Air/Turkish Airlines', price: 250.00 },
        { item: 'Hotel', provider: 'Radisson (Family suit)', price: 570.00 },
        { item: 'Transfers', provider: 'Get transfer', price: 160.00 },
        { item: 'Excursions', provider: 'Get Guide', price: 250.00 },
        { item: 'Insurance', provider: 'Axa Schengen', price: 40.00 },
    ];

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price || 0);
    };

    const openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handlePayNow = (item) => {
        const url = resolveProviderUrl(item, plan);

        // Most major providers block iframe embedding; open them externally.
        if (!canEmbedUrl(url)) {
            openInNewTab(url);
            return;
        }
        setActiveWebUrl(url);
    };

    if (activeWebUrl) {
        return (
            <div className="payment-view-container fade-in">
                <div className="webview-header">
                    <button className="btn-icon header-icon-btn" onClick={() => setActiveWebUrl(null)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div className="webview-domain glass-panel">{hostFromUrl(activeWebUrl) || 'checkout'}</div>
                    <button className="btn-icon header-icon-btn" onClick={() => openInNewTab(activeWebUrl)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    </button>
                </div>

                <div className="webview-content">
                    <iframe
                        src={activeWebUrl}
                        title="Secure Payment View"
                        style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                        sandbox="allow-same-origin allow-scripts allow-forms"
                    />
                </div>

                <div className="webview-footer">
                    <div className="footer-nav">
                        <button className="btn-icon footer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                        <button className="btn-icon footer-icon" style={{ opacity: 0.3 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                    </div>
                    <div className="footer-actions">
                        <button className="btn-icon footer-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></button>
                        <button className="btn-icon footer-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></button>
                        <button className="btn-icon footer-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-view-container fade-in scrollarea">
            <div className="payment-header">
                <button className="btn-icon header-icon-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div className="payment-title-pill glass-panel">Trip Payment</div>
                <div style={{ width: 44 }}></div>
            </div>

            <div className="payment-list">
                {items.map((item, index) => (
                    <div key={index} className="payment-list-item glass-panel">
                        <div className="payment-item-info">
                            <div className="payment-item-type">{item.item}</div>
                            <div className="payment-item-detail">
                                {(item.raw && item.raw.airline)
                                    ? item.raw.airline.split(/[/?,(]/)[0].trim()
                                    : (item.provider ? item.provider.split(/[/?,(]/)[0].trim() : '')
                                }
                            </div>
                        </div>
                        <div className="payment-item-action">
                            <div className="payment-item-price">{formatPrice(item.price)}</div>
                            <button className="btn btn-primary pay-now-btn" onClick={() => handlePayNow(item)}>Pay Now</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="payment-footer">
                <button className="payment-close-btn glass-panel" onClick={onBack}>Close</button>
            </div>
        </div>
    );
}
