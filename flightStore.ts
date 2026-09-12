import { FlightTicketBooking, PaymentOrderRecord } from './types';
import { createPaymentOrder } from './paymentStore';

const STORAGE_KEY = 'axofacil_flight_bookings';

export function loadFlightBookings(): FlightTicketBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading flight bookings:', err);
    return [];
  }
}

export function saveFlightBookings(bookings: FlightTicketBooking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Error saving flight bookings:', err);
  }
}

// Generate an authentic 6-character airline PNR (e.g. "ACH79X", "MPM48K")
export function generatePNR(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pnr = 'ACH';
  for (let i = 0; i < 3; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

// Generate IATA 13-digit E-Ticket number (e.g. "068-9482710492")
export function generateETicketNumber(airlineCode: string = 'TM'): string {
  const prefix = airlineCode === 'TM' ? '068' : airlineCode === '4Z' ? '749' : airlineCode === 'TP' ? '047' : '157';
  let digits = '';
  for (let i = 0; i < 10; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return `${prefix}-${digits}`;
}

export function createFlightBooking(bookingData: Omit<FlightTicketBooking, 'id' | 'pnr' | 'ticketNumber' | 'createdAt' | 'boardingPassGenerated'>): FlightTicketBooking {
  const bookings = loadFlightBookings();
  const pnr = generatePNR();
  const ticketNumber = generateETicketNumber(bookingData.outboundFlight.airline.code);
  const now = new Date().toISOString();

  const newBooking: FlightTicketBooking = {
    ...bookingData,
    id: `fl-bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    pnr,
    ticketNumber,
    createdAt: now,
    boardingPassGenerated: true,
    checkInDone: false,
    qrCodeData: `IATA:M1${bookingData.passengers[0]?.lastName || 'PASSAGEIRO'}/${bookingData.passengers[0]?.firstName || 'VIAJANTE'} E${pnr} ${bookingData.outboundFlight.origin.code}${bookingData.outboundFlight.destination.code}${bookingData.outboundFlight.airline.code}${bookingData.outboundFlight.flightNumber.replace(/\s+/g, '')} ${ticketNumber}`
  };

  bookings.unshift(newBooking);
  saveFlightBookings(bookings);

  // Synchronize with general Axofácil! Payment Order Store for tracking and receipts
  try {
    const passengerNames = newBooking.passengers.map(p => `${p.firstName} ${p.lastName}`).join(', ');
    const summary = `Bilhete Aéreo [PNR: ${newBooking.pnr}] ${newBooking.outboundFlight.airline.shortName} ${newBooking.outboundFlight.origin.code} ✈ ${newBooking.outboundFlight.destination.code} (${newBooking.tripType === 'round_trip' ? 'Ida e Volta' : 'Só Ida'}) - ${newBooking.passengers.length} Passageiro(s): ${passengerNames}`;

    createPaymentOrder({
      userId: newBooking.userId,
      customerName: newBooking.contactName,
      customerPhone: newBooking.contactPhone,
      customerEmail: newBooking.contactEmail,
      targetType: 'loja',
      establishmentId: 't1',
      establishmentName: 'Turismo e Logística',
      orderItemsSummary: summary,
      subtotalAmountMT: newBooking.subtotalMT,
      deliveryFeeMT: 0,
      totalAmountMT: newBooking.totalAmountMT,
      paymentMethod: newBooking.paymentMethod === 'conta_movel' || newBooking.paymentMethod === 'cartao_simo' ? 'mpesa' : newBooking.paymentMethod,
      referenceNumber: newBooking.paymentReference,
      deliveryOption: 'pickup',
      deliveryAddress: `Aeroporto Internacional de Maputo / Terminal ${newBooking.outboundFlight.terminal}`
    });
  } catch (err) {
    console.error('Error syncing flight with payment store:', err);
  }

  return newBooking;
}

export function findBookingByPnrAndSurname(pnr: string, surname: string): FlightTicketBooking | null {
  const bookings = loadFlightBookings();
  const cleanPnr = pnr.trim().toUpperCase();
  const cleanSurname = surname.trim().toLowerCase();

  return bookings.find(b => {
    const matchPnr = b.pnr.toUpperCase() === cleanPnr;
    const matchSurname = b.passengers.some(p => p.lastName.toLowerCase() === cleanSurname) || 
                         b.contactName.toLowerCase().includes(cleanSurname);
    return matchPnr && matchSurname;
  }) || null;
}

export function performWebCheckIn(pnr: string): FlightTicketBooking | null {
  const bookings = loadFlightBookings();
  const cleanPnr = pnr.trim().toUpperCase();
  const index = bookings.findIndex(b => b.pnr.toUpperCase() === cleanPnr);
  
  if (index === -1) return null;

  bookings[index].checkInDone = true;
  bookings[index].bookingStatus = 'checkin_efetuado';
  saveFlightBookings(bookings);
  return bookings[index];
}
