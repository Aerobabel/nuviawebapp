import React, { useEffect, useRef, useState } from 'react';
import DatePicker from '../components/DatePicker';
import GuestPicker from '../components/GuestPicker';
import { callTravelBot, historyForServer } from '../services/api';
import { loadSessionMessagesFromStorage, saveSessionToStorage } from '../services/storage';
import './ChatView.css';

const WELCOME_MESSAGE = {
    role: 'ai',
    text: "Hi! I'm your travel assistant - where would you like to go?",
};

// shallow equality to avoid identical consecutive plan cards
const isSamePlan = (a, b) =>
    !!a &&
    !!b &&
    a.location === b.location &&
    a.dates === b.dates &&
    a.description === b.description &&
    a.image === b.image &&
    a.price === b.price;

export default function ChatView({ sessionId, onOpenTripDetails, onOpenPayment, isSidebarOpen, onToggleSidebar, onSessionUpdated, userId }) {
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modals
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGuestPicker, setShowGuestPicker] = useState(false);

    const bottomRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, showDatePicker]);

    // Load from storage on session change
    useEffect(() => {
        if (!sessionId) {
            setMessages([WELCOME_MESSAGE]);
            return;
        }
        const storedMessages = loadSessionMessagesFromStorage(sessionId);
        if (storedMessages) {
            setMessages(storedMessages);
            return;
        }
        setMessages([WELCOME_MESSAGE]);
    }, [sessionId]);

    // Save state whenever messages change
    useEffect(() => {
        let isMounted = true;
        const persist = async () => {
            if (messages.length <= 1 || !sessionId) return;
            await saveSessionToStorage(messages, sessionId, userId);
            if (isMounted) {
                await onSessionUpdated?.();
            }
        };
        persist().catch((err) => console.error('Failed to persist chat session', err));
        return () => {
            isMounted = false;
        };
    }, [messages, sessionId, userId, onSessionUpdated]);

    /** main dispatcher for server “signals” */
    const handleSignal = (signal, aiText) => {
        if (aiText) {
            setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
        }

        if (signal?.type === 'dateNeeded') {
            setShowDatePicker(true);
            return;
        }
        if (signal?.type === 'guestsNeeded') {
            setShowGuestPicker(true);
            return;
        }

        if (signal?.type === 'planReady') {
            setMessages((prev) => {
                const lastPlan = [...prev].reverse().find((m) => m.role === 'plan')?.payload;
                if (isSamePlan(lastPlan, signal.payload)) return prev;

                // append plan and a hidden user marker so server only considers *new* info for future plans
                return [
                    ...prev,
                    { role: 'plan', payload: signal.payload },
                    { role: 'user', text: '[PLAN_SNAPSHOT]', hidden: true },
                ];
            });
        }
    };

    /** send normal user text */
    const sendUser = async (text) => {
        const trimmed = (text || '').trim();
        if (!trimmed || isLoading) return;

        setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
        setInput('');
        setIsLoading(true);

        try {
            const history = historyForServer(messages, { role: 'user', text: trimmed });
            const { aiText, signal } = await callTravelBot(history);

            if (signal) handleSignal(signal, aiText);
            else if (aiText) setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
        } catch {
            setMessages((prev) => [...prev, { role: 'ai', text: 'I couldn’t reach the server. Make sure the backend is running!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendUser(input);
    };

    /** date picker callback */
    const onDatesSelected = async ({ startDate, endDate }) => {
        setShowDatePicker(false);
        const fact = `📅 I'd like to go from ${startDate} to ${endDate}`;
        setMessages((prev) => [...prev, { role: 'user', text: fact }]);
        setIsLoading(true);

        try {
            const history = historyForServer(messages, { role: 'user', text: fact });
            const { aiText, signal } = await callTravelBot(history);
            if (signal) handleSignal(signal, aiText);
            else if (aiText) setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
        } catch {
            setMessages((prev) => [...prev, { role: 'ai', text: "Couldn't save your dates — try again?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    /** guest picker callback */
    const onGuestSelected = async ({ adults, children }) => {
        setShowGuestPicker(false);
        const fact = `👤 We're ${adults} adult(s) and ${children} child(ren).`;
        setMessages((prev) => [...prev, { role: 'user', text: fact }]);
        setIsLoading(true);

        try {
            const history = historyForServer(messages, { role: 'user', text: fact });
            const { aiText, signal } = await callTravelBot(history);
            if (signal) handleSignal(signal, aiText);
            else if (aiText) setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
        } catch {
            setMessages((prev) => [...prev, { role: 'ai', text: "Couldn't save your guests — try again?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    /** render inline plan card */
    const PlanCard = ({ payload }) => {
        if (!payload) return null;
        let { location, dates, description, image, price } = payload;

        const formatCardPrice = (p) => {
            if (!p) return '$1,230.00';
            const str = String(p);
            if (str.includes('$')) return str;
            const num = Number(str.replace(/[^0-9.-]+/g, ""));
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num || 0);
        };
        price = formatCardPrice(price);

        return (
            <div className="plan-card">
                <div className="plan-image-wrapper">
                    {image ? <img src={image} alt={location} className="plan-image" /> : <div className="plan-image" style={{ background: '#333' }} />}
                </div>
                <div className="plan-content">
                    <div className="plan-header-row">
                        <h3 className="plan-city">{location || 'Your Trip'}</h3>
                        <div className="plan-weather">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                            <span>25°C</span>
                        </div>
                    </div>
                    <p className="plan-date">{dates || '18.12.2024 - 25.12.2024'}</p>
                    <p className="plan-desc">{description || 'A balanced mix of iconic sights, beaches, and authentic local experiences.'}</p>

                    <div className="plan-price-section">
                        <div className="price-label">Total price</div>
                        <div className="plan-price">{price}</div>
                    </div>

                    <div className="plan-actions-row">
                        <button className="action-icon-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        </button>
                        <button className="flex-btn info-btn" onClick={() => onOpenTripDetails?.(payload)}>Info</button>
                        <button className="flex-btn buy-btn" onClick={() => onOpenPayment?.(payload)}>Buy</button>
                    </div>
                </div>
            </div>
        );
    };

    /** formatter for bold text returned by AI */
    const formatText = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part.split('\n').map((line, j) => <React.Fragment key={j}>{line}<br /></React.Fragment>)}</span>;
        });
    };

    // If there are only opening messages, we show the "empty state" center layout
    const isEmptyState = messages.length <= 1;

    return (
        <div className="chat-view-container">

            {/* Header */}
            <div className="chat-header">
                {!isSidebarOpen ? (
                    <button className="btn-icon glass-panel fade-in" onClick={onToggleSidebar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                ) : (
                    <div style={{ width: 44 }} />
                )}

                {isEmptyState ? (
                    <div className="tab-pill glass-panel">New Chat</div>
                ) : (
                    <div className="tab-pill glass-panel">
                        {messages.slice().reverse().find(m => m.role === 'plan')?.payload?.location || 'New Chat'}
                    </div>
                )}

                <button className="btn-icon glass-panel" onClick={() => setMessages([WELCOME_MESSAGE])}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
            </div>

            {isEmptyState ? (
                <div className="chat-center-content fade-in">
                    <h1 className="logo-text-small gradient-text">NÜVIA</h1>
                    <h2 className="welcome-text">Welcome. I'll take care of your journey.</h2>
                    <p className="welcome-subtext">*Where would you like to go today?</p>
                </div>
            ) : (
                <div className="chat-history scrollarea">
                    {messages.map((msg, idx) => {
                        if (msg.hidden) return null;

                        if (msg.role === 'plan') {
                            return (
                                <div key={idx} className="chat-message msg-bot fade-in">
                                    <div className="plan-card-wrapper">
                                        <PlanCard payload={msg.payload} />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} className={`chat-message fade-in ${msg.role === 'user' ? 'msg-user' : 'msg-bot'}`}>
                                <div className={`message-bubble ${msg.role === 'user' ? 'bubble-glass' : ''}`}>
                                    {formatText(msg.text)}
                                </div>
                            </div>
                        )
                    })}
                    {isLoading && (
                        <div className="chat-message msg-bot fade-in">
                            <div className="message-bubble typing-indicator" aria-label="Assistant is thinking">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            )}

            {/* Bottom Area */}
            <div className="chat-bottom-area fade-in">
                {isEmptyState && (
                    <div className="quick-actions-scroll">
                        {["Travel Profile", "Active Booking", "Your Budget", "Offline Assistant", "Travel Together"].map((action, i) => (
                            <button key={i} className="action-pill glass-panel" onClick={() => sendUser(`Tell me more about ${action}`)}>
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                <div className="input-wrapper glass-panel main-input">
                    <button className="add-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>

                    <input
                        type="text"
                        className="bare-input"
                        placeholder="Plan your trip..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />

                    <button className="mic-btn" onClick={() => sendUser(input)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showDatePicker && (
                <DatePicker
                    onClose={() => setShowDatePicker(false)}
                    onConfirm={onDatesSelected}
                />
            )}

            {showGuestPicker && (
                <GuestPicker
                    onClose={() => setShowGuestPicker(false)}
                    onConfirm={onGuestSelected}
                />
            )}
        </div>
    );
}
