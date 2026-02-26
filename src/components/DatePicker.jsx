import { useCallback, useMemo, useState } from 'react';
import './DatePicker.css';

const toKey = (d) => {
    if (!d) return null;
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TODAY_KEY = toKey(new Date());

const generateMonths = () => {
    const list = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(2028, 2, 1);

    let y = start.getFullYear();
    let m = start.getMonth();

    while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        let lead = first.getDay();
        lead = lead === 0 ? 6 : lead - 1; // Monday start
        if (lead === -1) lead = 6;

        const days = [];
        for (let i = 0; i < lead; i++) days.push(null);
        for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d));

        list.push({
            key: `${y}-${m}`,
            title: first.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            days,
        });

        m += 1;
        if (m > 11) { m = 0; y += 1; }
    }
    return list;
};

export default function DatePicker({ onClose, onConfirm }) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [activeTab, setActiveTab] = useState('Dates');

    const months = useMemo(() => generateMonths(), []);

    const onDayPress = useCallback((d) => {
        if (!d) return;
        const k = toKey(d);

        if (!startDate || (startDate && endDate)) {
            setStartDate(k);
            setEndDate(null);
            return;
        }

        if (k < startDate) {
            setStartDate(k);
            setEndDate(null);
        } else {
            setEndDate(k);
        }
    }, [startDate, endDate]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content picker-modal fade-in glass-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="icon-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div className="modal-tabs">
                        <button className={`modal-tab ${activeTab === 'Dates' ? 'active' : ''}`} onClick={() => setActiveTab('Dates')}>Dates</button>
                        <button className={`modal-tab ${activeTab === 'Flexible' ? 'active' : ''}`} onClick={() => setActiveTab('Flexible')}>Flexible</button>
                    </div>
                    <div style={{ width: 44 }}></div>
                </div>

                <div className="week-header">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <span key={d}>{d}</span>)}
                </div>

                <div className="picker-body scrollarea">
                    {months.map(month => (
                        <div key={month.key} className="month-block">
                            <h3 className="month-title">{month.title}</h3>
                            <div className="days-grid">
                                {month.days.map((d, i) => {
                                    if (!d) return <div key={i} className="day empty-day" />;
                                    const k = toKey(d);
                                    const isStart = k === startDate;
                                    const isEnd = k === endDate;
                                    const isMid = startDate && endDate && k > startDate && k < endDate;
                                    const isToday = k === TODAY_KEY;

                                    let className = "day";
                                    if (isStart) className += " selected-start";
                                    if (isEnd) className += " selected-end";
                                    if (isMid) className += " in-range";
                                    if (isToday && !isStart && !isEnd) className += " is-today";

                                    return (
                                        <button
                                            key={i}
                                            className={className}
                                            onClick={() => onDayPress(d)}
                                        >
                                            {d.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="picker-footer blur-footer">
                    <button
                        className="btn btn-primary full-width round-btn"
                        disabled={!startDate || !endDate}
                        onClick={() => onConfirm({ startDate, endDate })}
                    >
                        Select
                    </button>
                </div>
            </div>
        </div>
    );
}
