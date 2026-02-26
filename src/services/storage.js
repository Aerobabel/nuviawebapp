import { supabase } from '../lib/supabase';

const SESSION_STORAGE_KEY = 'travel_chat_sessions';
const PREVIEW_MAX_LEN = 30;

const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

const readLocalSessionsMap = () =>
    safeParse(localStorage.getItem(SESSION_STORAGE_KEY), {});

const writeLocalSessionsMap = (sessionsMap) => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionsMap));
};

const sortSessions = (sessionsMap) =>
    Object.values(sessionsMap).sort((a, b) => b.timestamp - a.timestamp);

const normalizeMessages = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const normalizeTimestamp = (value, fallbackUpdatedAt = '') => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string') {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;

        const parsedValue = Date.parse(value);
        if (!Number.isNaN(parsedValue)) return parsedValue;
    }

    const parsedUpdatedAt = Date.parse(fallbackUpdatedAt || '');
    return Number.isNaN(parsedUpdatedAt) ? Date.now() : parsedUpdatedAt;
};

const toLocalSession = (row) => ({
    id: row.session_id || row.sessionId || row.id,
    preview: row.preview || row.title || 'New Trip...',
    timestamp: normalizeTimestamp(row.timestamp ?? row.updated_at, row.updated_at),
    messages: normalizeMessages(row.messages),
    customTitle: !!(row.custom_title ?? row.customTitle),
});

const toCloudSession = (session, userId) => ({
    user_id: userId,
    session_id: session.id,
    preview: session.preview,
    timestamp: session.timestamp,
    messages: session.messages,
    custom_title: !!session.customTitle,
    updated_at: new Date(session.timestamp).toISOString(),
});

const toCloudSessionMinimal = (session, userId) => ({
    user_id: userId,
    session_id: session.id,
    preview: session.preview,
    messages: session.messages,
    updated_at: new Date(session.timestamp || Date.now()).toISOString(),
});

const resolveUserId = async (userId = null) => {
    if (userId) return userId;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.warn('Unable to resolve auth user for cloud sync', error);
            return null;
        }
        return data?.user?.id || null;
    } catch (error) {
        console.warn('Unexpected auth lookup failure for cloud sync', error);
        return null;
    }
};

const upsertSessionsToCloud = async (sessions, userId) => {
    if (!userId || !sessions.length) return;
    const validSessions = sessions.filter((session) => session?.id);
    if (!validSessions.length) return;

    const fullPayload = validSessions.map((session) => toCloudSession(session, userId));
    const minimalPayload = validSessions.map((session) => toCloudSessionMinimal(session, userId));

    let { error } = await supabase
        .from('chat_sessions')
        .upsert(fullPayload, { onConflict: 'user_id,session_id' });
    if (!error) return;

    console.warn('chat_sessions full upsert failed, retrying minimal composite upsert', error);
    ({ error } = await supabase
        .from('chat_sessions')
        .upsert(minimalPayload, { onConflict: 'user_id,session_id' }));
    if (!error) return;

    console.warn('chat_sessions minimal composite upsert failed, retrying minimal session_id upsert', error);
    ({ error } = await supabase
        .from('chat_sessions')
        .upsert(minimalPayload, { onConflict: 'session_id' }));
    if (!error) return;

    console.warn('chat_sessions upsert fallback failed, retrying minimal insert/update loop', error);

    for (const session of sessions) {
        const row = toCloudSessionMinimal(session, userId);
        const { error: insertError } = await supabase
            .from('chat_sessions')
            .insert(row);

        if (!insertError) continue;

        const { error: updateError } = await supabase
            .from('chat_sessions')
            .update(row)
            .eq('user_id', userId)
            .eq('session_id', session.id);

        if (updateError) {
            console.error('Failed to sync session row to cloud', updateError);
        }
    }
};

export const saveSessionToStorage = async (messages, currentSessionId, userId = null) => {
    if (messages.length <= 1 || !currentSessionId) return;

    try {
        const firstUserMsg = messages.find((m) => m.role === 'user');
        const stored = readLocalSessionsMap();
        const existing = stored[currentSessionId];

        let preview = firstUserMsg?.text || 'New Trip';
        if (existing?.customTitle) {
            preview = existing.preview;
        }

        const nextSession = {
            id: currentSessionId,
            preview:
                preview.substring(0, PREVIEW_MAX_LEN) + (existing?.customTitle ? '' : '...'),
            timestamp: existing?.timestamp || Date.now(),
            messages,
            customTitle: existing?.customTitle || false,
        };

        stored[currentSessionId] = nextSession;
        writeLocalSessionsMap(stored);

        const resolvedUserId = await resolveUserId(userId);
        await upsertSessionsToCloud([nextSession], resolvedUserId);
    } catch (e) {
        console.error('Failed to save session', e);
    }
};

export const loadSessionsFromStorage = () => {
    try {
        const sessionsMap = readLocalSessionsMap();
        return sortSessions(sessionsMap);
    } catch (e) {
        console.error('Failed to load sessions', e);
    }
    return [];
};

export const loadSessionMessagesFromStorage = (sessionId) => {
    const sessionsMap = readLocalSessionsMap();
    return sessionsMap[sessionId]?.messages || null;
};

export const loadSessionsForUser = async (userId = null) => {
    const localSessionsMap = readLocalSessionsMap();
    const resolvedUserId = await resolveUserId(userId);

    if (!resolvedUserId) {
        return sortSessions(localSessionsMap);
    }

    // Push local cache first so device-local sessions aren't lost when user logs in elsewhere.
    await upsertSessionsToCloud(Object.values(localSessionsMap), resolvedUserId);

    let { data, error } = await supabase
        .from('chat_sessions')
        .select('session_id, preview, timestamp, messages, custom_title, updated_at')
        .eq('user_id', resolvedUserId)
        .order('timestamp', { ascending: false });

    if (error) {
        console.warn('Ordered load failed, retrying without order', error);
        ({ data, error } = await supabase
            .from('chat_sessions')
            .select('session_id, preview, timestamp, messages, custom_title, updated_at')
            .eq('user_id', resolvedUserId));
    }

    if (error) {
        console.warn('Full-column load failed, retrying minimal-column load', error);
        ({ data, error } = await supabase
            .from('chat_sessions')
            .select('session_id, preview, messages, updated_at')
            .eq('user_id', resolvedUserId));
    }

    if (error) {
        console.warn('Minimal-column load failed, retrying wildcard load', error);
        ({ data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', resolvedUserId));
    }

    if (error) {
        console.error('Failed to load cloud sessions', error);
        return sortSessions(localSessionsMap);
    }

    const merged = { ...localSessionsMap };
    (data || []).forEach((row) => {
        const session = toLocalSession(row);
        if (!session?.id) return;
        merged[session.id] = session;
    });

    writeLocalSessionsMap(merged);
    return sortSessions(merged);
};

export const deleteSessionFromStorage = async (sessionId, userId = null) => {
    try {
        const sessionsMap = readLocalSessionsMap();
        delete sessionsMap[sessionId];
        writeLocalSessionsMap(sessionsMap);

        const resolvedUserId = await resolveUserId(userId);
        if (resolvedUserId) {
            const { error } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('user_id', resolvedUserId)
                .eq('session_id', sessionId);
            if (error) {
                console.error('Failed to delete cloud session', error);
            }
        }
    } catch (e) {
        console.error('Failed to delete session', e);
    }
};

export const renameSessionInStorage = async (sessionId, newName, userId = null) => {
    try {
        const sessionsMap = readLocalSessionsMap();
        if (!sessionsMap[sessionId]) return;

        sessionsMap[sessionId].preview = newName;
        sessionsMap[sessionId].customTitle = true;
        sessionsMap[sessionId].timestamp = Date.now();
        writeLocalSessionsMap(sessionsMap);

        const resolvedUserId = await resolveUserId(userId);
        if (resolvedUserId) {
            let { error } = await supabase
                .from('chat_sessions')
                .update({
                    preview: newName,
                    custom_title: true,
                    timestamp: sessionsMap[sessionId].timestamp,
                    updated_at: new Date(sessionsMap[sessionId].timestamp).toISOString(),
                })
                .eq('user_id', resolvedUserId)
                .eq('session_id', sessionId);

            if (error) {
                ({ error } = await supabase
                    .from('chat_sessions')
                    .update({
                        preview: newName,
                        updated_at: new Date(sessionsMap[sessionId].timestamp).toISOString(),
                    })
                    .eq('user_id', resolvedUserId)
                    .eq('session_id', sessionId));
            }

            if (error) {
                console.error('Failed to rename cloud session', error);
            }
        }
    } catch (e) {
        console.error('Failed to rename session', e);
    }
};
