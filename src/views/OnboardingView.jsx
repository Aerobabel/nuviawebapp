import { useEffect, useRef, useState } from 'react';
import './OnboardingView.css';

const questions = [
    {
        id: 'origin',
        text: "Where are you planning to start your journey from? (Please enter your departure city or airport)",
        type: 'input'
    },
    {
        id: 'experience',
        text: "What type of travel experiences do you prefer?",
        type: 'options',
        options: ["Beach vacation", "Cultural exploration", "Adventure and outdoor activities", "Food and culinary experiences", "Relaxation and wellness", "Urban exploration", "Other (please specify)"]
    },
    {
        id: 'exploration',
        text: "How do you like to explore destinations?",
        type: 'options',
        options: ["Walking tours and exploring on foot", "Guided tours with transportation", "Self-driving and exploration", "Public transportation", "Other (please specify)"]
    },
    {
        id: 'currency',
        text: "What's your preferred currency for budget calculations?",
        type: 'options',
        options: ["USD", "EUR", "GBP", "JPY", "Other (please specify)"]
    },
    {
        id: 'accommodation',
        text: "What's your typical accommodation preference?",
        type: 'options',
        options: ["Luxury hotels and resorts", "Mid-range hotels", "Budget-friendly options", "Vacation rentals/apartments", "Unique stays (trips/camps)"]
    }
];

export default function OnboardingView({ onComplete }) {
    const [history, setHistory] = useState([
        { type: 'bot', text: "Hi there! I'm your travel assistant. Excited to meet you! 👋" },
        { type: 'bot', text: "Before we start planning your perfect getaway, I'd love to learn a bit about your travel preferences. This will help me create truly personalized recommendations just for you." },
        { type: 'bot', text: "Could you please answer a few quick questions about your travel style?" }
    ]);
    const [currentStep, setCurrentStep] = useState(0);
    const [inputValue, setInputValue] = useState('');

    const bottomRef = useRef(null);

    useEffect(() => {
        // Add the first question after initial greeting
        if (history.length === 3) {
            setTimeout(() => {
                setHistory(prev => [...prev, { type: 'bot', text: questions[0].text, qId: questions[0].id }]);
            }, 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleAnswer = (answer) => {
        if (!answer.trim()) return;

        // Add user answer
        setHistory(prev => [...prev, { type: 'user', text: answer }]);
        setInputValue('');

        // Advance to next question or complete
        const nextStep = currentStep + 1;
        if (nextStep < questions.length) {
            setTimeout(() => {
                setCurrentStep(nextStep);
                setHistory(prev => [...prev, { type: 'bot', text: questions[nextStep].text, qId: questions[nextStep].id }]);
            }, 600);
        } else {
            setTimeout(() => {
                setHistory(prev => [...prev, {
                    type: 'bot',
                    text: "Thanks for sharing your preferences! I can now help you:\n\n✈️ Plan complete trips tailored to your unique style\n🏨 Book flights, hotels, and activities in one place\n🗺️ Create personalized itineraries based on your interests\n💰 Find the best deals in your preferred currency\n📲 Access all your bookings offline and find Wi-Fi spots\n💡 Discover hidden gems and local experiences that match your preferences\n\nJust tell me your destination, and let's make your next journey unforgettable! Need any help getting started?"
                }]);
                setTimeout(onComplete, 3000); // Transition to main chat after reading
            }, 600);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAnswer(inputValue);
        }
    };

    const currentQ = questions[currentStep];

    return (
        <div className="onboarding-container view-container">

            {/* Header */}
            <div className="chat-header">
                <button className="icon-btn glass-panel">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <button className="icon-btn glass-panel">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
            </div>

            {/* Chat History */}
            <div className="chat-history scrollarea">
                {history.map((msg, i) => (
                    <div key={i} className={`chat-message fade-in ${msg.type === 'user' ? 'msg-user' : 'msg-bot'}`}>
                        <div className={`message-bubble ${msg.type === 'user' ? 'bubble-glass' : ''}`}>
                            {msg.text.split('\n').map((line, j) => (
                                <span key={j}>{line}<br /></span>
                            ))}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Options if current question is options-based */}
            {currentQ && currentQ.type === 'options' && history[history.length - 1]?.type === 'bot' && (
                <div className="options-container fade-in">
                    {currentQ.options.map((opt, i) => (
                        <button
                            key={i}
                            className="pill-btn glass-panel"
                            onClick={() => handleAnswer(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-area margin-top-auto">
                <div className="input-wrapper glass-panel">
                    <button className="add-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>

                    <input
                        type="text"
                        className="bare-input"
                        placeholder={(currentQ && currentQ.type === 'input') ? "Type your answer..." : "Plan your trip"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <button className="mic-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
