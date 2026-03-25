
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Transaction, AgendaEvent } from '../types';

const CALENDAR_NAME = "NEXO Finanças";

// Helper to get Access Token
const getAccessToken = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    try {
        // Tenta obter o token. Se não estiver logado ou token expirado, isso pode abrir um popup.
        // O ideal em produção é gerenciar tokens silenciosamente, mas para este escopo, o popup garante a permissão.
        if (!auth.currentUser) return null;
        
        // Força refresh do token se possível, ou pede novo via popup se necessário
        // Nota: Em Firebase v9 Web SDK, re-autenticar via popup é a maneira mais segura de garantir escopos
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
        // Se for 404 (evento já deletado) ou 410 (gone), não é erro crítico
        if (response.status === 404 || response.status === 410) return null;
        
        const err = await response.json();
        throw new Error(err.error?.message || 'Google API Error');
    }
    
    // DELETE returns 204 No Content
    if (response.status === 204) return null;
    return response.json();
};

// 1. Find or Create Calendar
const getOrCreateCalendar = async (token: string): Promise<string> => {
    const listData = await fetchGoogleApi('https://www.googleapis.com/calendar/v3/users/me/calendarList', 'GET', token);
    const existing = listData.items.find((c: any) => c.summary === CALENDAR_NAME);
    
    if (existing) return existing.id;
    
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
                { method: 'popup', minutes: 24 * 60 },
                { method: 'popup', minutes: 60 * 9 }
            ]
        }
    };

    const data = await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, 'POST', token, event);
    return data.id;
};

// 3. Update Event
export const updateCalendarEvent = async (transaction: Transaction, eventId: string) => {
    const token = await getAccessToken();
    if (!token) return; // Silent fail if no auth
    
    const calendarId = await getOrCreateCalendar(token);
    
    const event = {
        summary: `💸 Pagar: ${transaction.description}`,
        description: `Valor: R$ ${transaction.amount.toFixed(2)}\nCategoria: ${transaction.category}\nObs: ${transaction.observation || '-'}`,
        start: { date: transaction.date },
        end: { date: transaction.date },
    };

    await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, 'PATCH', token, event);
};

// 4. Delete Event
export const deleteCalendarEvent = async (eventId: string) => {
    const token = await getAccessToken();
    if (!token) return; // Silent fail
    
    const calendarId = await getOrCreateCalendar(token);
    
    await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, 'DELETE', token);
};

// 5. Bulk Sync (Create missing, Update existing)
export const syncTransactionsToCalendar = async (
    transactions: Transaction[], 
    onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void
) => {
    // 1. Auth check
    const token = await getAccessToken();
    if (!token) throw new Error("Acesso ao Google Agenda negado.");

    // 2. Calendar Setup
    const calendarId = await getOrCreateCalendar(token);

    // 3. Filter Pending Expenses
    const toSync = transactions.filter(t => 
        t.type === 'expense' && 
        t.status === 'pending' && 
        new Date(t.date) >= new Date() // Only future/today
    );

    let syncedCount = 0;
    
    for (const t of toSync) {
        try {
            if (!t.googleEventId) {
                // CREATE new event
                const eventId = await createCalendarEvent(t, token, calendarId);
                onUpdateTransaction(t.id, { googleEventId: eventId });
                syncedCount++;
            } else {
                // UPDATE existing event (ensure sync matches app state)
                // We use PATCH, so it only updates fields we send
                const event = {
                    summary: `💸 Pagar: ${t.description}`,
                    description: `Valor: R$ ${t.amount.toFixed(2)}\nCategoria: ${t.category}\nObs: ${t.observation || '-'}`,
                    start: { date: t.date },
                    end: { date: t.date },
                };
                await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${t.googleEventId}`, 'PATCH', token, event);
            }
        } catch (e) {
            console.error(`Failed to sync transaction ${t.description}`, e);
        }
    }
    return syncedCount;
};

// 6. Fetch Events from Google Calendar
export const fetchGoogleEvents = async (timeMin: Date, timeMax: Date): Promise<any[]> => {
    const token = await getAccessToken();
    if (!token) return [];

    try {
        // Fetch from primary calendar
        const primaryUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;
        const primaryData = await fetchGoogleApi(primaryUrl, 'GET', token);
        let allEvents = primaryData?.items || [];

        // Fetch from NEXO calendar if it exists
        try {
            const calendarId = await getOrCreateCalendar(token);
            if (calendarId && calendarId !== 'primary') {
                const nexoUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;
                const nexoData = await fetchGoogleApi(nexoUrl, 'GET', token);
                if (nexoData?.items) {
                    allEvents = [...allEvents, ...nexoData.items];
                }
            }
        } catch (e) {
            console.error("Error fetching NEXO calendar events", e);
        }

        return allEvents;
    } catch (error) {
        console.error("Error fetching Google events:", error);
        return [];
    }
};

// 7. Create General Event
export const createGeneralCalendarEvent = async (event: AgendaEvent): Promise<string | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    // Save to primary calendar so it's a "real" agenda event
    const calendarId = 'primary'; 

    const gEvent: any = {
        summary: event.title,
        description: event.description || '',
    };

    if (event.allDay) {
        gEvent.start = { date: event.startDate.split('T')[0] };
        gEvent.end = { date: event.endDate.split('T')[0] };
    } else {
        gEvent.start = { dateTime: event.startDate };
        gEvent.end = { dateTime: event.endDate };
    }

    const data = await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, 'POST', token, gEvent);
    return data?.id || null;
};

// 8. Update General Event
export const updateGeneralCalendarEvent = async (event: AgendaEvent, eventId: string): Promise<void> => {
    const token = await getAccessToken();
    if (!token) return;

    // Try to update in primary first, if not found, try NEXO
    const gEvent: any = {
        summary: event.title,
        description: event.description || '',
    };

    if (event.allDay) {
        gEvent.start = { date: event.startDate.split('T')[0] };
        gEvent.end = { date: event.endDate.split('T')[0] };
    } else {
        gEvent.start = { dateTime: event.startDate };
        gEvent.end = { dateTime: event.endDate };
    }

    try {
        await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, 'PATCH', token, gEvent);
    } catch (e: any) {
        if (e.message?.includes('Not Found')) {
            const calendarId = await getOrCreateCalendar(token);
            await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, 'PATCH', token, gEvent);
        }
    }
};

// 9. Delete General Event
export const deleteGeneralCalendarEvent = async (eventId: string): Promise<void> => {
    const token = await getAccessToken();
    if (!token) return;

    try {
        await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, 'DELETE', token);
    } catch (e: any) {
        if (e.message?.includes('Not Found')) {
            const calendarId = await getOrCreateCalendar(token);
            await fetchGoogleApi(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, 'DELETE', token);
        }
    }
};
