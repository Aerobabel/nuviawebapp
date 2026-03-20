import { useEffect, useState } from 'react';
import './TripDetailsView.css';

const ICON_MAP = {
    activity: '\u{1F4F8}',
    museum: '\u{1F3A8}',
    park: '\u{1F332}',
    beach: '\u{1F3D6}\uFE0F',
    hiking: '\u{1F6B6}',
    landmark: '\u{1F5FD}\uFE0F',
    tour: '\u{1F4CC}',
    food: '\u{1F354}',
    restaurant: '\u{1F37D}\uFE0F',
    cafe: '\u{2615}',
    bar: '\u{1F37A}',
    lunch: '\u{1F96A}',
    dinner: '\u{1F377}',
    breakfast: '\u{1F950}',
    flight: '\u{2708}\uFE0F',
    travel: '\u{2708}\uFE0F',
    transport: '\u{1F68C}',
    transit: '\u{1F687}',
    taxi: '\u{1F695}',
    hotel: '\u{1F6CF}\uFE0F',
    stay: '\u{1F6CF}\uFE0F',
    accommodation: '\u{1F3E8}',
    resort: '\u{1F3D6}\uFE0F',
};

const hasCoordinates = (point) => Number.isFinite(Number(point?.latitude)) && Number.isFinite(Number(point?.longitude));

const clampPercent = (value) => Math.min(100, Math.max(0, value));

const buildViewport = (start, end) => {
    const points = end ? [start, end] : [start];
    const latitudes = points.map((point) => point.latitude);
    const longitudes = points.map((point) => point.longitude);

    const south = Math.min(...latitudes);
    const north = Math.max(...latitudes);
    const west = Math.min(...longitudes);
    const east = Math.max(...longitudes);

    const latPadding = Math.max((north - south) * 0.35, 0.02);
    const lonPadding = Math.max((east - west) * 0.35, 0.02);

    return {
        south: south - latPadding,
        north: north + latPadding,
        west: west - lonPadding,
        east: east + lonPadding,
    };
};

const projectPoint = (point, viewport) => {
    const width = Math.max(viewport.east - viewport.west, 0.0001);
    const height = Math.max(viewport.north - viewport.south, 0.0001);

    return {
        x: clampPercent(((point.longitude - viewport.west) / width) * 100),
        y: clampPercent((1 - (point.latitude - viewport.south) / height) * 100),
    };
};

const buildEmbedUrl = (viewport) => {
    const params = new URLSearchParams({
        bbox: `${viewport.west},${viewport.south},${viewport.east},${viewport.north}`,
        layer: 'mapnik',
    });

    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
};

const buildExternalMapUrl = (start, end) => {
    if (!end) {
        return `https://www.openstreetmap.org/?mlat=${start.latitude}&mlon=${start.longitude}#map=15/${start.latitude}/${start.longitude}`;
    }

    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${start.latitude}%2C${start.longitude}%3B${end.latitude}%2C${end.longitude}`;
};

function EventMapPreview({ event, prevEvent }) {
    if (!hasCoordinates(event)) return null;

    const eventPoint = {
        latitude: Number(event.latitude),
        longitude: Number(event.longitude),
    };
    const previousPoint = hasCoordinates(prevEvent)
        ? { latitude: Number(prevEvent.latitude), longitude: Number(prevEvent.longitude) }
        : null;

    const startPoint = previousPoint || eventPoint;
    const endPoint = previousPoint ? eventPoint : null;
    const viewport = buildViewport(startPoint, endPoint);
    const startPosition = projectPoint(startPoint, viewport);
    const endPosition = endPoint ? projectPoint(endPoint, viewport) : null;
    const mapTitle = event.title || 'Selected stop';
    const routeTitle = endPoint && prevEvent?.title
        ? `${prevEvent.title} to ${mapTitle}`
        : mapTitle;

    return (
        <div className="event-map-shell glass-panel fade-in">
            <div className="event-map-header">
                <div>
                    <div className="event-map-eyebrow">{endPoint ? 'Route preview' : 'Location preview'}</div>
                    <div className="event-map-title">{routeTitle}</div>
                </div>
                <a
                    className="event-map-link"
                    href={buildExternalMapUrl(startPoint, endPoint)}
                    target="_blank"
                    rel="noreferrer"
                >
                    {endPoint ? 'Open route' : 'Open map'}
                </a>
            </div>

            <div className="event-map-frame">
                <iframe
                    src={buildEmbedUrl(viewport)}
                    title={`Map preview for ${mapTitle}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />

                <div className="event-map-overlay" aria-hidden="true">
                    <svg className="event-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {endPosition ? (
                            <line x1={startPosition.x} y1={startPosition.y} x2={endPosition.x} y2={endPosition.y} />
                        ) : null}
                    </svg>

                    <div
                        className={`event-map-marker ${endPoint ? 'start' : 'single'}`}
                        style={{ left: `${startPosition.x}%`, top: `${startPosition.y}%` }}
                    >
                        {endPoint ? 'A' : '\u2022'}
                    </div>

                    {endPosition ? (
                        <div
                            className="event-map-marker end"
                            style={{ left: `${endPosition.x}%`, top: `${endPosition.y}%` }}
                        >
                            B
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function TripDetailsView({ onBack, plan, onOpenPayment }) {
    const [selectedDate, setSelectedDate] = useState(plan?.itinerary?.[0]?.date);
    const [activeTab, setActiveTab] = useState('Information');
    const [expandedEvent, setExpandedEvent] = useState(null);

    useEffect(() => {
        setExpandedEvent(null);
    }, [selectedDate]);

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

            <div className="trip-content">
                <img src={plan.image} alt={plan.location} className="trip-main-image fade-in" />

                <div className="trip-info-section">
                    <div className="trip-title-row">
                        <h1 className="trip-location-title">{plan.location}, {plan.country}</h1>
                        {plan.weather && (
                            <div className="weather-chip glass-panel">
                                <span>{'\u{1F324}\uFE0F'}</span>
                                <span>{plan.weather.temp}{'\u00B0'}C</span>
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
                                    const eventKey = `${selectedDate}-${index}`;
                                    const isExpanded = expandedEvent === eventKey;
                                    const prevEvent = index > 0 ? selectedDayData.events[index - 1] : null;
                                    const canShowMap = hasCoordinates(event);

                                    return (
                                        <div key={eventKey} className="event-item">
                                            <div className="event-timeline">
                                                <div className="timeline-line"></div>
                                                <div className="timeline-dot"></div>
                                            </div>
                                            <div
                                                className={`event-card glass-panel ${canShowMap ? 'has-map' : ''}`}
                                                onClick={() => canShowMap && setExpandedEvent(isExpanded ? null : eventKey)}
                                                aria-expanded={canShowMap ? isExpanded : undefined}
                                            >
                                                <div className="event-icon">
                                                    {ICON_MAP[event.icon] || ICON_MAP[event.type] || '\u{1F4CD}'}
                                                </div>
                                                <div className="event-details">
                                                    <div className="event-time">{event.time}</div>
                                                    <div className="event-title">{event.title}</div>
                                                    <div className="event-subtext">{event.details}</div>
                                                </div>
                                                <div className="event-duration">{event.duration}</div>
                                            </div>

                                            {isExpanded && canShowMap ? (
                                                <EventMapPreview event={event} prevEvent={prevEvent} />
                                            ) : null}
                                        </div>
                                    );
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
                                            <span>{ICON_MAP[item.iconValue] || '\u{1F516}'}</span>
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
