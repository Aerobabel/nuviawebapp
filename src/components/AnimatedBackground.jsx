import { motion } from 'framer-motion';
import './AnimatedBackground.css';

const NuviaLogo = () => (
    <svg
        className="nuvia-bg-logo"
        viewBox="0 0 561 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g>
            <path d="M433.504 165.22L474.244 40.4058H520.26L561 165.22H522.423L515.935 140.396H478.569L472.082 165.22H433.504ZM496.906 70.1606L485.316 114.533H509.189L497.598 70.1606H496.906Z" fill="white" />
            <path d="M385.585 165.22V40.4058H422.26V165.22H385.585Z" fill="white" />
            <path d="M288.536 165.22L250.996 40.4058H292.515L312.322 130.449H313.014L332.822 40.4058H374.34L336.801 165.22H288.536Z" fill="white" />
            <path d="M164.068 31.2371C154.985 31.2371 148.066 24.2309 148.066 15.8408C148.066 7.5371 154.985 0.530884 164.068 0.530884C173.236 0.530884 180.156 7.5371 180.156 15.8408C180.156 24.2309 173.236 31.2371 164.068 31.2371ZM205.499 31.2371C196.331 31.2371 189.411 24.2309 189.411 15.8408C189.411 7.5371 196.331 0.530884 205.499 0.530884C214.582 0.530884 221.501 7.5371 221.501 15.8408C221.501 24.2309 214.582 31.2371 205.499 31.2371ZM184.654 167.469C151.699 167.469 129.729 149.218 129.729 120.761V40.4058H166.403V117.128C166.403 130.276 172.804 137.541 184.74 137.541C196.677 137.541 203.078 130.276 203.078 117.128V40.4058H239.752V120.761C239.752 149.045 218.041 167.469 184.654 167.469Z" fill="white" />
            <path d="M0.502686 165.22V40.4058H31.0359L75.1492 104.24H75.7546V40.4058H112.429V165.22H82.2419L37.7827 100.348H37.1772V165.22H0.502686Z" fill="white" />
        </g>
    </svg>
);

export default function AnimatedBackground({ showLogo = true }) {
    return (
        <div className="animated-bg-container">
            {/* Sky Background */}
            <motion.div
                className="sky-layer"
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 3, ease: 'easeOut' }}
            />
            {/* Rock Foreground */}
            <motion.div
                className="rock-layer"
                initial={{ y: 150, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 2.5, ease: 'easeOut', delay: 0.3 }}
            />
            {/* NUVIA Animated Logo */}
            {showLogo && (
                <motion.div
                    className="animated-logo-wrapper"
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 2.5, ease: 'easeOut' }}
                >
                    <NuviaLogo />
                </motion.div>
            )}

            {/* Dark Gradient Overlay for UI Contrast */}
            <div className="bg-overlay" />
        </div>
    );
}
