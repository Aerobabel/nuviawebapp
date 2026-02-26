import { useState } from 'react';
import './TripDetailsView.css';

const ICON_MAP = {
    activity: "📸", museum: "🎨", park: "🌲", beach: "🏖️",
    hiking: "🥾", landmark: "🏛️", tour: "📌", food: "🍔",
    restaurant: "🍽️", cafe: "☕", bar: "🍺", lunch: "🥪",
    dinner: "🍷", breakfast: "🥐", flight: "✈️", travel: "✈️",
    transport: "🚌", transit: "🚇", taxi: "🚕", hotel: "🛏️",
    stay: "🛏️", accommodation: "🏨", resort: "🌴",
};

export default function TripDetailsView({ onBack, plan, onOpenPayment }) {
    const [selectedDate, setSelectedDate] = useState(plan?.itinerary?.[0]?.date);
    const [activeTab, setActiveTab] = useState('Information');
    const [expandedEvent, setExpandedEvent] = useState(null);

    if (!plan) return null;

    const formatPrice = (value) => {
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
        } catch {
            return `$${Number(value || 0).toFixed(2)}`;
        }
    };

    const selectedDayData = plan.itinerary?.find((day) => day.date === selectedDate);

    return (
        <div className="trip-details-container scrollarea">
            {/* Header */}
            <div className="trip-header">
                <button className="btn-icon glass-panel" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div className="trip-header-pill glass-panel">
                    {plan.location}, {plan.country}
                </div>
                <button className="btn-icon glass-panel">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
            </div>

            {/* Main Content Scroll */}
            <div className="trip-content">
                <img src={plan.image} alt={plan.location} className="trip-main-image fade-in" />

                <div className="trip-info-section">
                    <div className="trip-title-row">
                        <h1 className="trip-location-title">{plan.location}, {plan.country}</h1>
                        {plan.weather && (
                            <div className="weather-chip glass-panel">
                                <span>🌤️</span>
                                <span>{plan.weather.temp}°C</span>
                            </div>
                        )}
                    </div>
                    <p className="trip-date-range">{plan.dateRange}</p>
                    <p className="trip-description">{plan.description}</p>

                    <div className="trip-tabs glass-panel">
                        <button
                            className={`trip-tab ${activeTab === 'Information' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Information')}
                        >
                            Information
                        </button>
                        <button
                            className={`trip-tab ${activeTab === 'What included' ? 'active' : ''}`}
                            onClick={() => setActiveTab('What included')}
                        >
                            What included
                        </button>
                    </div>

                    {activeTab === 'Information' && (
                        <div className="info-tab-content fade-in">
                            <div className="day-selector">
                                {plan.itinerary?.map((item) => {
                                    const dateParts = item.day ? item.day.split(' ') : [];
                                    const month = dateParts[0] || 'N/A';
                                    const dayNum = dateParts[1] || '';
                                    const isActive = item.date === selectedDate;

                                    return (
                                        <button
                                            key={item.date}
                                            className={`day-chip ${isActive ? 'active' : ''}`}
                                            onClick={() => setSelectedDate(item.date)}
                                        >
                                            <div className="day-chip-month">{month}</div>
                                            <div className="day-chip-day">{dayNum}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="event-list">
                                {selectedDayData?.events.map((event, index) => {
                                    const isExpanded = expandedEvent === index;
                                    return (
                                        <div key={index} className="event-item">
                                            <div className="event-timeline">
                                                <div className="timeline-line"></div>
                                                <div className="timeline-dot"></div>
                                            </div>
                                            <div
                                                className="event-card glass-panel"
                                                onClick={() => setExpandedEvent(isExpanded ? null : index)}
                                            >
                                                <div className="event-icon">
                                                    {ICON_MAP[event.icon] || ICON_MAP[event.type] || '📍'}
                                                </div>
                                                <div className="event-details">
                                                    <div className="event-time">{event.time}</div>
                                                    <div className="event-title">{event.title}</div>
                                                    <div className="event-subtext">{event.details}</div>
                                                </div>
                                                <div className="event-duration">{event.duration}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'What included' && (
                        <div className="included-list fade-in">
                            {plan.costBreakdown?.map((item, index) => (
                                <div key={index} className="included-item glass-panel">
                                    <div className="included-icon">
                                        {item.iconType === 'date' ? (
                                            <div className="included-date-box">
                                                <span className="inc-month">{item.iconValue.split(' ')[0]}</span>
                                                <span className="inc-day">{item.iconValue.split(' ')[1]}</span>
                                            </div>
                                        ) : item.iconType === 'icon' ? (
                                            <span>{ICON_MAP[item.iconValue] || '🔖'}</span>
                                        ) : (
                                            <img src={item.iconValue} alt="icon" className="included-thumbnail" />
                                        )}
                                    </div>
                                    <div className="included-details">
                                        <div className="included-title">{item.item}</div>
                                        <div className="included-provider">{item.provider}</div>
                                        <div className="included-subtext">{item.details}</div>
                                    </div>
                                    <div className="included-price">{formatPrice(item.price)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="trip-footer">
                <div className="trip-footer-price">
                    <span className="price-label">Total price:</span>
                    <span className="price-value">{formatPrice(plan.price)}</span>
                </div>
                <div className="trip-footer-actions">
                    <button className="btn btn-glass">Edit</button>
                    <button
                        className="btn btn-primary"
                        onClick={onOpenPayment}
                    >
                        Buy
                    </button>
                </div>
            </div>
        </div>
    );
}
