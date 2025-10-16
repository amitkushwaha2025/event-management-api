const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const eventsRoutes = require('./routes/events');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());

app.use('/events', eventsRoutes);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Event Management API listening on port ${PORT}`);
});
