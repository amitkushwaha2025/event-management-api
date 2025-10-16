const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventsController');

// Create Event
router.post('/', ctrl.createEvent);

// Get Event details + registered users
router.get('/:id', ctrl.getEventDetails);

// Register for event
router.post('/:id/register', ctrl.registerForEvent);

// Cancel registration
router.delete('/:id/register', ctrl.cancelRegistration);

// List upcoming events
router.get('/', ctrl.listUpcomingEvents);

// Event stats
router.get('/:id/stats', ctrl.eventStats);

module.exports = router;
