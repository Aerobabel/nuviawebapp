import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import './PhoneAuthView.css';

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

export default function PhoneAuthView({ onBack, onComplete }) {
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(40);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const formattedPhone = useMemo(() => {
        const digits = phone.replace(/\D/g, '');
        return digits.length > 0 ? `+${digits}` : '+';
    }, [phone]);

    const isValidPhone = phone.replace(/\D/g, '').length >= 8;
    const isOtpComplete = otp.length === 6;

    // Timer for OTP resend
    useEffect(() => {
        let t;
        if (step === 'otp') {
            setTimer(40); // Reset timer when entering OTP step
            t = setInterval(() => setTimer((s) => (s > 0 ? s - 1 : 0)), 1000);
        }
        return () => clearInterval(t);
    }, [step]);

    const handlePhoneSubmit = async () => {
        if (!isValidPhone || loading) return;
        setLoading(true);
        setErrorMsg('');

        const { error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
            options: { channel: 'sms', shouldCreateUser: true },
        });

        setLoading(false);

        if (error) {
            setErrorMsg(error.message);
            return;
        }

        setStep('otp');
    };

    const handleOtpSubmit = async () => {
        if (!isOtpComplete || loading) return;
        setLoading(true);
        setErrorMsg('');

        const { error } = await supabase.auth.verifyOtp({
            phone: formattedPhone,
            token: otp,
            type: 'sms',
        });

        setLoading(false);

        if (error) {
            setErrorMsg(error.message || 'Invalid code');
            return;
        }

        // Auth Successful! 
        onComplete();
    };

    const resendOtp = async () => {
        if (timer > 0 || loading) return;
        setLoading(true);
        setErrorMsg('');
        setTimer(40);
        const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone, options: { channel: 'sms' } });
        setLoading(false);
        if (error) {
            setErrorMsg(error.message);
        }
    };

    const otpInputRefs = useRef([]);

    const handleOtpChange = (e, index) => {
        const { value } = e.target;
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = otp.split('');
        newOtp[index] = value;
        const updatedOtp = newOtp.join('');
        setOtp(updatedOtp);

        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        } else if (!value && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }

        if (updatedOtp.length === 6) {
            handleOtpSubmit();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="phone-auth-container view-container">
            <button className="back-btn btn-icon glass-panel" onClick={step === 'phone' ? onBack : () => { setStep('phone'); setErrorMsg(''); setOtp(''); }}>
                <BackIcon />
            </button>

            <div className="phone-auth-content">
                {step === 'phone' ? (
                    <div className="auth-form-step fade-in">
                        <h2 className="step-title">Enter your mobile number</h2>

                        <div className="phone-input-wrapper glass-panel">
                            <span className="country-code">+</span>
                            <input
                                type="tel"
                                className="bare-input"
                                placeholder=""
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        {errorMsg && <p className="error-text" style={{ color: '#ef4444', marginTop: 8 }}>{errorMsg}</p>}

                        <button
                            className="btn btn-primary submit-btn"
                            onClick={handlePhoneSubmit}
                            disabled={!isValidPhone || loading}
                        >
                            {loading ? 'Sending...' : 'Send Code'}
                        </button>
                    </div>
                ) : (
                    <div className="auth-form-step fade-in">
                        <p className="step-subtitle">We sent a code to your phone +{phone}</p>

                        <div className="otp-container">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className={`otp-dot ${otp[index] ? 'filled' : ''}`}></div>
                            ))}
                            {/* Hidden actual input for easy typing on desktop */}
                            <input
                                type="text"
                                className="hidden-otp-input"
                                maxLength={6}
                                value={otp}
                                disabled={loading}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ''); // only digits
                                    setOtp(val);
                                    if (val.length === 6) {
                                        // Slight delay so the UI dot can fill before verifying
                                        setTimeout(() => handleOtpSubmit(val), 100);
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        {errorMsg && <p className="error-text" style={{ color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>{errorMsg}</p>}

                        <p className="resend-text" onClick={resendOtp} style={{ cursor: timer === 0 ? 'pointer' : 'default', color: timer === 0 ? '#3b82f6' : '#9ca3af' }}>
                            {timer > 0 ? `Send another code in 0:${String(timer).padStart(2, '0')}` : 'Resend code'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
