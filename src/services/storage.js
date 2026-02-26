// Replicates React Native's AsyncStorage logic using Web localStorage
const SESSION_STORAGE_KEY = 'travel_chat_sessions';

export const saveSessionToStorage = (messages, currentSessionId) => {
    if (messages.length <= 1 || !currentSessionId) return;

    try {
        const firstUserMsg = messages.find((m) => m.role === 'user');
        let preview = 'New Trip';

        if (firstUserMsg) {
            preview = firstUserMsg.text || 'New Trip';
        }

        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        let sessions = stored ? JSON.parse(stored) : {};

        if (sessions[currentSessionId]) {
            // Preserve custom title if set
            if (sessions[currentSessionId].customTitle) {
                preview = sessions[currentSessionId].preview;
            }
        }

        sessions[currentSessionId] = {
            id: currentSessionId,
            preview: preview.substring(0, 30) + (sessions[currentSessionId]?.customTitle ? '' : '...'),
            timestamp: sessions[currentSessionId]?.timestamp || Date.now(),
            messages,
            customTitle: sessions[currentSessionId]?.customTitle || false,
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to save session', e);
    }
};

export const loadSessionsFromStorage = () => {
    try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const sorted = Object.values(parsed).sort(
                (a, b) => b.timestamp - a.timestamp
            );
            return sorted;
        }
    } catch (e) {
        console.error('Failed to load sessions', e);
    }
    return [];
};

export const deleteSessionFromStorage = (sessionId) => {
    try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
            let sessions = JSON.parse(stored);
            delete sessions[sessionId];
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
        }
    } catch (e) {
        console.error('Failed to delete session', e);
    }
};

export const renameSessionInStorage = (sessionId, newName) => {
    try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
            let sessions = JSON.parse(stored);
            if (sessions[sessionId]) {
                sessions[sessionId].preview = newName;
                sessions[sessionId].customTitle = true;
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
            }
        }
    } catch (e) {
        console.error('Failed to rename session', e);
    }
};
