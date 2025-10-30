// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json()); // ✅ this enables JSON body parsing



// In-memory storage
let bookings = [];
let nextId = 1;

/**
 * Booking shape:
 * {
 *   id: Number,
 *   name: String,
 *   email: String,
 *   event: String,
 *   phone?: String,
 *   seats?: Number,
 *   createdAt: ISOString,
 *   updatedAt: ISOString
 * }
 */

/* --------------------------
   Helpers & basic validation
   -------------------------- */
function validateCreate(body) {
  const { name, email, event } = body;
  if (!name || !email || !event) {
    return { ok: false, message: 'name, email and event are required' };
  }
  // basic email pattern (not exhaustive)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return { ok: false, message: 'invalid email' };
  return { ok: true };
}

/* 1) GET /api/bookings - list all bookings
   supports optional query: ?limit=10&skip=0
*/
app.get('/api/bookings', (req, res) => {
  const { limit, skip } = req.query;
  let result = bookings.slice(); // copy

  // simple pagination
  if (skip) {
    const s = parseInt(skip);
    if (!Number.isNaN(s) && s >= 0) result = result.slice(s);
  }
  if (limit) {
    const l = parseInt(limit);
    if (!Number.isNaN(l) && l >= 0) result = result.slice(0, l);
  }

  res.json({ count: result.length, bookings: result });
});

/* 2) POST /api/bookings - create booking */
app.post('/api/bookings', (req, res) => {
  const validation = validateCreate(req.body);
  if (!validation.ok) return res.status(400).json({ error: validation.message });

  const { name, email, event, phone, seats } = req.body;
  const now = new Date().toISOString();

  const newBooking = {
    id: nextId++,
    name: String(name),
    email: String(email),
    event: String(event),
    phone: phone ? String(phone) : undefined,
    seats: seats ? Number(seats) : 1,
    createdAt: now,
    updatedAt: now
  };

  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

/* 3) GET /api/bookings/:id - get by ID */
app.get('/api/bookings/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const booking = bookings.find(b => b.id === id);
  if (!booking) return res.status(404).json({ error: 'booking not found' });
  res.json(booking);
});

/* 4) PUT /api/bookings/:id - update fields (name, email, event, phone, seats) */
app.put('/api/bookings/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const booking = bookings.find(b => b.id === id);
  if (!booking) return res.status(404).json({ error: 'booking not found' });

  // allow partial updates
  const { name, email, event, phone, seats } = req.body;
  if (email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return res.status(400).json({ error: 'invalid email' });
  }

  if (name !== undefined) booking.name = String(name);
  if (email !== undefined) booking.email = String(email);
  if (event !== undefined) booking.event = String(event);
  if (phone !== undefined) booking.phone = String(phone);
  if (seats !== undefined) booking.seats = Number(seats);

  booking.updatedAt = new Date().toISOString();
  res.json({ message: 'booking updated', booking });
});

/* 5) DELETE /api/bookings/:id - cancel */
app.delete('/api/bookings/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'booking not found' });

  const deleted = bookings.splice(index, 1)[0];
  res.json({ message: 'booking cancelled', deleted });
});

/* 6) Extra helpful endpoints (optional) */
/* Clear all bookings - useful during testing (not recommended in production) */
app.delete('/api/bookings', (req, res) => {
  const count = bookings.length;
  bookings = [];
  nextId = 1;
  res.json({ message: `cleared ${count} bookings` });
});

/* Health check */
app.get('/', (req, res) => res.send('Synergia Event Booking API is up'));

/* Start server */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
