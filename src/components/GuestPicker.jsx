import React, { useState } from 'react';
import './GuestPicker.css';

export default function GuestPicker({ onClose, onConfirm }) {
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childAges, setChildAges] = useState([]);

    const handleChildrenChange = (count) => {
        setChildren(count);
        if (count > childAges.length) {
            setChildAges([...childAges, ...Array(count - childAges.length).fill(12)]);
        } else {
            setChildAges(childAges.slice(0, count));
        }
    };

    const handleAgeChange = (index, age) => {
        const newAges = [...childAges];
        newAges[index] = age;
        setChildAges(newAges);
    };

    const renderNumberPicker = (title, value, onSelect, start, end) => {
        const data = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        return (
            <div className="picker-section">
                <h3 className="picker-label">{title}</h3>
                <div className="scroll-row">
                    {data.map((item) => (
                        <button
                            key={item}
                            className={`circle-btn ${item === value ? 'selected' : ''}`}
                            onClick={() => onSelect(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content picker-modal fade-in glass-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="icon-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <h2 className="modal-title">Who is traveling?</h2>
                    <div style={{ width: 24 }}></div>
                </div>

                <div className="picker-body scrollarea">
                    {renderNumberPicker('Adults', adults, setAdults, 1, 7)}
                    {renderNumberPicker('Kids', children, handleChildrenChange, 0, 7)}

                    {childAges.map((age, index) => (
                        <React.Fragment key={index}>
                            {renderNumberPicker(
                                index === 0 ? 'How old is first child?' : index === 1 ? 'How old is second child?' : `How old is child ${index + 1}?`,
                                age,
                                (val) => handleAgeChange(index, val),
                                0, 14
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="picker-footer">
                    <button className="btn btn-primary full-width round-btn" onClick={() => onConfirm({ adults, children })}>Save</button>
                </div>
            </div>
        </div>
    );
}
