const db = require('../db');
const { validateEventPayload, validateUserPayload } = require('../validators');

/**
 * Create a new event
 */
async function createEvent(req, res) {
  try {
    const payload = req.body;
    const errors = validateEventPayload(payload);
    if (errors.length) return res.status(400).json({ errors });

    const result = await db.query(
      `INSERT INTO events (title, datetime, location, capacity)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [payload.title, payload.datetime, payload.location, payload.capacity]
    );
    return res.status(201).json({ eventId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get event details including registered users
 */
async function getEventDetails(req, res) {
  const eventId = parseInt(req.params.id, 10);
  if (Number.isNaN(eventId)) return res.status(400).json({ error: 'Invalid event id' });

  try {
    const ev = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (ev.rowCount === 0) return res.status(404).json({ error: 'Event not found' });

    const event = ev.rows[0];

    const usersRes = await db.query(
      `SELECT u.id, u.name, u.email, r.registered_at
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.registered_at ASC`,
      [eventId]
    );

    return res.json({
      event: {
        id: event.id,
        title: event.title,
        datetime: event.datetime,
        location: event.location,
        capacity: event.capacity
      },
      registrations: usersRes.rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Register a user for an event
 * Body: { userId } OR { name, email } (if user doesn't exist, create)
 *
 * Concurrency handling:
 * - Wrap in a transaction
 * - Lock the event row with SELECT ... FOR UPDATE to prevent race conditions
 */
async function registerForEvent(req, res) {
  const eventId = parseInt(req.params.id, 10);
  if (Number.isNaN(eventId)) return res.status(400).json({ error: 'Invalid event id' });

  const payload = req.body;

  try {
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure event exists and lock it
      const eventRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
      if (eventRes.rowCount === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ error: 'Event not found' });
      }
      const event = eventRes.rows[0];

      // Disallow registering for past events
      if (new Date(event.datetime) <= new Date()) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'Cannot register for past events' });
      }

      // Find or create user
      let userId = payload.userId;
      if (!userId) {
        // If user details provided
        const userErrors = validateUserPayload(payload);
        if (userErrors.length) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ errors: userErrors });
        }
        // Try to find by email
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [payload.email]);
        if (userRes.rowCount > 0) {
          userId = userRes.rows[0].id;
        } else {
          const insertUser = await client.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
            [payload.name, payload.email]
          );
          userId = insertUser.rows[0].id;
        }
      } else {
        // verify user exists
        const u = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (u.rowCount === 0) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(404).json({ error: 'User not found' });
        }
      }

      // Prevent duplicate registration
      const dup = await client.query(
        'SELECT 1 FROM registrations WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );
      if (dup.rowCount > 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(409).json({ error: 'User already registered for this event' });
      }

      // Check capacity
      const countRes = await client.query('SELECT COUNT(*)::int AS cnt FROM registrations WHERE event_id = $1', [eventId]);
      const currentCount = countRes.rows[0].cnt;
      if (currentCount >= event.capacity) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'Event is full' });
      }

      // All good: insert registration
      await client.query(
        'INSERT INTO registrations (event_id, user_id) VALUES ($1, $2)',
        [eventId, userId]
      );

      await client.query('COMMIT');
      client.release();
      return res.status(201).json({ message: 'Registration successful', userId, eventId });
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Transaction error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not acquire database client' });
  }
}

/**
 * Cancel a registration
 * Body: { userId }
 */
async function cancelRegistration(req, res) {
  const eventId = parseInt(req.params.id, 10);
  if (Number.isNaN(eventId)) return res.status(400).json({ error: 'Invalid event id' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Lock event row to avoid race with registrations
      const ev = await client.query('SELECT id FROM events WHERE id = $1 FOR UPDATE', [eventId]);
      if (ev.rowCount === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ error: 'Event not found' });
      }

      const reg = await client.query(
        'SELECT 1 FROM registrations WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );
      if (reg.rowCount === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ error: 'Registration not found for this user and event' });
      }

      await client.query('DELETE FROM registrations WHERE event_id = $1 AND user_id = $2', [eventId, userId]);

      await client.query('COMMIT');
      client.release();
      return res.json({ message: 'Registration cancelled' });
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not acquire database client' });
  }
}

/**
 * List upcoming events (future only)
 * Sorted by date ASC, then by location alphabetically (custom comparator)
 */
async function listUpcomingEvents(req, res) {
  try {
    const rows = await db.query(
      `SELECT id, title, datetime, location, capacity,
         (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id)::int AS registrations_count
       FROM events e
       WHERE datetime > now()
       ORDER BY datetime ASC, location ASC`
    );

    return res.json({ events: rows.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Event stats
 */
async function eventStats(req, res) {
  const eventId = parseInt(req.params.id, 10);
  if (Number.isNaN(eventId)) return res.status(400).json({ error: 'Invalid event id' });

  try {
    const ev = await db.query('SELECT id, capacity FROM events WHERE id = $1', [eventId]);
    if (ev.rowCount === 0) return res.status(404).json({ error: 'Event not found' });
    const event = ev.rows[0];

    const cntRes = await db.query('SELECT COUNT(*)::int AS cnt FROM registrations WHERE event_id = $1', [eventId]);
    const totalRegistrations = cntRes.rows[0].cnt;
    const remainingCapacity = event.capacity - totalRegistrations;
    const percentUsed = event.capacity === 0 ? 0 : Math.round((totalRegistrations / event.capacity) * 10000) / 100;

    return res.json({
      eventId,
      totalRegistrations,
      remainingCapacity,
      percentageCapacityUsed: percentUsed
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  createEvent,
  getEventDetails,
  registerForEvent,
  cancelRegistration,
  listUpcomingEvents,
  eventStats
};
