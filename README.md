the DATABASE_URL. Example: -->
# 🎟️ Event Management REST API

A complete **Event Management System** built with **Node.js**, **Express.js**, and **PostgreSQL**, providing APIs for creating events, managing user registrations, cancellations, and tracking event statistics.

---

## ⚙️ Table of Contents

1. [Overview]
2. [Features]
3. [Technology Stack]
4. [Project Structure]
5. [Setup Instructions]
6. [Database Setup]
7. [Run Application]
8. [API Documentation]
9. [Example Requests & Responses]
10. [Business Logic Rules]
11. [Future Enhancements]
12. [Author]

---

## 🧩 Overview

This API manages:
- Event creation and listing
- User registration and cancellation
- Event capacity management (1–1000)
- Viewing upcoming events and event statistics

It is built following RESTful principles with input validation, error handling, and database relationships between users and events.

---

## 🚀 Features

✅ Create, update, and view events  
✅ User registration and cancellation  
✅ Validate event capacity (1–1000)  
✅ Prevent duplicate registrations  
✅ Disallow past-event registrations  
✅ List upcoming events (sorted by date → location)  
✅ Event statistics (capacity used, remaining)  
✅ Proper HTTP codes and validation  

---

## 💻 Technology Stack

- **Backend Framework:** Node.js + Express.js  
- **Database:** PostgreSQL  
- **ORM/Query:** node-postgres (`pg`)  
- **Utilities:** dotenv, nodemon, morgan, helmet  

---

## 🧱 Project Structure

event-management-api/
├── src/
│ ├── controllers/
│ │ └── eventsController.js
│ ├── routes/
│ │ └── events.js
│ ├── db.js
│ ├── server.js
│ └── validators.js
├── migrations/
│ └── 001_init.sql
├── package.json
├── .env
└── README.md

----------------------------


---

## ⚙️ Setup Instructions

### 1️⃣ Install Prerequisites
Make sure these are installed:
- Node.js (v18 or later)
- npm (v9 or later)
- PostgreSQL (v14 or later)

### 2️⃣ Clone Repository
```bash
git clone https://github.com/your-username/event-management-api.git
cd event-management-api

-------------------------------------

npm install

------------------------------------

PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/event_db

Replace username, password, and event_db with your actual PostgreSQL credentials.

---------------------------------------

🧩 Database Setup
Step 1 — Create Database

psql -U postgres
CREATE DATABASE event_db;
\c event_db;

--------------------------------------

Step 2 — Create Tables

Execute these SQL commands in PostgreSQL:

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000)
);

CREATE TABLE registrations (
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

---------------------------------------

▶️ Run Application
Start in Development Mode

npm run dev

------------------------------------

Server will run at:

http://localhost:3000

-------------------------

API Documentation

| Method   | Endpoint               | Description                                |
| :------- | :--------------------- | :----------------------------------------- |
| `POST`   | `/events`              | Create a new event                         |
| `GET`    | `/events`              | List all upcoming events                   |
| `GET`    | `/events/:id`          | Get event details + registered users       |
| `POST`   | `/events/:id/register` | Register a user for an event               |
| `DELETE` | `/events/:id/register` | Cancel a user’s registration               |
| `GET`    | `/events/:id/stats`    | Get event statistics (capacity used, etc.) |

---------------------------------------

📬 Example Requests & Responses
➕ Create Event

Request

{
  "title": "Tech Conference 2025",
  "datetime": "2025-12-20T10:00:00Z",
  "location": "Bangalore",
  "capacity": 200
}

Response

{
  "eventId": 1,
  "message": "Event created successfully"
}

------------------------------------

Get Event Details

Request

GET /events/1

Response

{
  "event": {
    "id": 1,
    "title": "Tech Conference 2025",
    "datetime": "2025-12-20T10:00:00Z",
    "location": "Bangalore",
    "capacity": 200
  },
  "registrations": [
    {
      "id": 2,
      "name": "Alice",
      "email": "alice@example.com",
      "registered_at": "2025-10-15T09:00:00Z"
    }
  ]
}

-------------------------------------------
Register for Event

Request

POST /events/1/register
Content-Type: application/json


{
  "name": "Alice",
  "email": "alice@example.com"
}


Response

{
  "message": "Registration successful",
  "userId": 2,
  "eventId": 1
}

Error Responses

{ "error": "User already registered for this event" }

{ "error": "Event is full" }

{ "error": "Cannot register for past events" }

--------------------------------------------

Cancel Registration

Request

DELETE /events/1/register
Content-Type: application/json

{
  "userId": 2
}

Response

{
  "message": "Registration cancelled successfully"
}

Error

{
  "error": "User not registered for this event"
}

-------------------------------------------------

List Upcoming Events

Request

GET /events

Response

{
  "events": [
    {
      "id": 1,
      "title": "Tech Conference 2025",
      "datetime": "2025-12-20T10:00:00Z",
      "location": "Bangalore",
      "capacity": 200,
      "registrations_count": 1
    },
    {
      "id": 2,
      "title": "Startup Meetup",
      "datetime": "2026-01-10T09:00:00Z",
      "location": "Delhi",
      "capacity": 300,
      "registrations_count": 0
    }
  ]
}


Event Statistics

Request

GET /events/1/stats

Response

{
  "eventId": 1,
  "totalRegistrations": 10,
  "remainingCapacity": 190,
  "percentageCapacityUsed": 5
}

-------------------------------------------------

Business Logic Rules

Event capacity must be between 1 and 1000.

Duplicate registration for the same event is not allowed.

Past events cannot be registered for.

Full events reject new registrations.

Registration deletion restores one available seat.

Returns appropriate HTTP status codes and error messages.

--------------------------------------------------------------

Future Enhancements

JWT-based user authentication

Email confirmation for registration

Pagination for event lists

Search and filter by location/date

Docker containerization

