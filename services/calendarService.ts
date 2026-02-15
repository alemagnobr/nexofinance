
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Transaction } from '../types';

const CALENDAR_NAME = "NEXO Finanças";

// Helper to get Access Token
const getAccessToken = async (): Promise<string | null> => {
    // 1. Try to get token from current session (this is tricky in Firebase Auth v9 without direct access)
    // 2. Best practice for client-side API calls is to request a fresh token if needed or use the one from initial login
    // Since we can't easily grab the OAuth token from `auth.currentUser`, we force a re-auth/popup if we don't have it stored.
    // For this simple app, we will use a popup flow to ensure we have the token.
    
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        return credential?.accessToken || null;
    } catch (error) {
        console.error("Error getting access token:", error);
        return null;
    }
};

// Helper to make authenticated requests
const fetchGoogleApi = async (url: string, method: string, token: string, body?: any) => {
    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Google API Error');
    }
    
    // DELETE returns 204 No Content
    if (response.status === 204) return null;
    return response.json();
};

// 1. Find or Create Calendar
const getOrCreateCalendar = async (token: string): Promise<string> => {
    // List Calendars
    const listData = await fetchGoogleApi('https://www.googleapis.com/calendar/v3/users/me/calendarList', 'GET', token);
    const existing = listData.items.find((c: any) => c.summary === CALENDAR_NAME);
    
    if (existing) return existing.id;
    
    // Create Calendar
    const newCalendar = await fetchGoogleApi('https://www.googleapis.com/calendar/v3/calendars', 'POST', token, {
        summary: CALENDAR_NAME,
        description: 'Calendário financeiro gerado pelo app NEXO.'
    });
    return newCalendar.id;
};

// 2. Create Event
export const createCalendarEvent = async (transaction: Transaction, token: string, calendarId: string): Promise<string> => {
    const event = {
        summary: `💸 Pagar: ${transaction.description}`,
        description: `Valor: R$ ${transaction.amount.toFixed(2)}\nCategoria: ${transaction.category}\nObs: ${transaction.observation || '-'}`,
        start: { date: transaction.date }, // All day event
        end: { date: transaction.date },
        colorId: '11', // Red/Tomato color for expenses
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 * 9 }   // 9 AM on the day (approx if all day) -> Actually all day reminders are diff, let's keep standard
            ]
        }
    };

    const data = await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, 'POST', token, event);
    return data.id;
};

export const syncTransactionsToCalendar = async (
    transactions: Transaction[], 
    onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void
) => {
    // 1. Auth check
    const token = await getAccessToken();
    if (!token) throw new Error("Acesso ao Google Agenda negado.");

    // 2. Calendar Setup
    const calendarId = await getOrCreateCalendar(token);

    // 3. Filter Pending Expenses without Event ID
    const toSync = transactions.filter(t => 
        t.type === 'expense' && 
        t.status === 'pending' && 
        !t.googleEventId &&
        new Date(t.date) >= new Date() // Only future/today
    );

    if (toSync.length === 0) return 0;

    // 4. Create Events
    let syncedCount = 0;
    for (const t of toSync) {
        try {
            const eventId = await createCalendarEvent(t, token, calendarId);
            onUpdateTransaction(t.id, { googleEventId: eventId });
            syncedCount++;
        } catch (e) {
            console.error(`Failed to sync transaction ${t.description}`, e);
        }
    }

    return syncedCount;
};
