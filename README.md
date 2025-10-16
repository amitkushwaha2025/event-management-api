
# Event Management REST API

A complete **Event Management System** built with **Node.js**, **Express.js**, and **PostgreSQL**, providing APIs for creating events, managing user registrations, cancellations, and tracking event statistics.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Database Setup](#database-setup)
7. [Run Application](#run-application)
8. [API Documentation](#api-documentation)
9. [Example Requests & Responses](#example-requests--responses)
10. [Business Logic Rules](#business-logic-rules)
11. [Future Enhancements](#future-enhancements)
12. [Author](#author)

---

## Overview

This API manages:
- Event creation and listing
- User registration and cancellation
- Event capacity management (1–1000)
- Viewing upcoming events and event statistics

It is built following RESTful principles with input validation, error handling, and database relationships between users and events.

---

## Features

✅ Create, update, and view events  
✅ User registration and cancellation  
✅ Validate event capacity (1–1000)  
✅ Prevent duplicate registrations  
✅ Disallow past-event registrations  
✅ List upcoming events (sorted by date → location)  
✅ Event statistics (capacity used, remaining)  
✅ Proper HTTP codes and validation  

---

## Technology Stack

- **Backend Framework:** Node.js + Express.js  
- **Database:** PostgreSQL  
- **ORM/Query:** node-postgres (`pg`)  
- **Utilities:** dotenv, nodemon, morgan, helmet  

---

## 🧱 Project Structure

```

event-management-api/
├── src/
│   ├── controllers/
│   │   └── eventsController.js
│   ├── routes/
│   │   └── events.js
│   ├── db.js
│   ├── server.js
│   └── validators.js
├── migrations/
│   └── init.sql
├── package.json
├── .env
└── README.md

````

---

## ⚙️ Setup Instructions

### Install Prerequisites
Make sure these are installed:
- Node.js (v18 or later)
- npm (v9 or later)
- PostgreSQL (v14 or later)

###  Clone Repository
```bash
git clone https://github.com/your-username/event-management-api.git
cd event-management-api
````

###  Install Dependencies

```bash
npm install
```

###  Create Environment File

Create a `.env` file in your project root:

```
PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/event_db
```

> Replace `username`, `password`, and `event_db` with your actual PostgreSQL credentials.

---

## Database Setup

### Step 1 — Create Database

```bash
psql -U postgres
CREATE DATABASE event_db;
\c event_db;
```

### Step 2 — Create Tables

Execute these SQL commands in PostgreSQL:

```sql
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
```

---

## Run Application

### Start in Development Mode

```bash
npm run dev
```

### Start in Production Mode

```bash
npm start
```

Server will run at:

```
http://localhost:3000
```

---

## API Documentation

| Method   | Endpoint               | Description                                |
| :------- | :--------------------- | :----------------------------------------- |
| `POST`   | `/events`              | Create a new event                         |
| `GET`    | `/events`              | List all upcoming events                   |
| `GET`    | `/events/:id`          | Get event details + registered users       |
| `POST`   | `/events/:id/register` | Register a user for an event               |
| `DELETE` | `/events/:id/register` | Cancel a user’s registration               |
| `GET`    | `/events/:id/stats`    | Get event statistics (capacity used, etc.) |

---

## Example Requests & Responses

### Create Event

**Request**

```bash
POST /events
Content-Type: application/json
```

```json
{
  "title": "Tech Conference 2025",
  "datetime": "2025-12-20T10:00:00Z",
  "location": "Bangalore",
  "capacity": 200
}
```

**Response**

```json
{
  "eventId": 1,
  "message": "Event created successfully"
}
```

---

### Get Event Details

**Request**

```bash
GET /events/1
```

**Response**

```json
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
```

---

### Register for Event

**Request**

```bash
POST /events/1/register
Content-Type: application/json
```

```json
{
  "name": "Alice",
  "email": "alice@example.com"
}
```

**Response**

```json
{
  "message": "Registration successful",
  "userId": 2,
  "eventId": 1
}
```

**Error Responses**

```json
{ "error": "User already registered for this event" }
```

```json
{ "error": "Event is full" }
```

```json
{ "error": "Cannot register for past events" }
```

---

### Cancel Registration

**Request**

```bash
DELETE /events/1/register
Content-Type: application/json
```

```json
{
  "userId": 2
}
```

**Response**

```json
{
  "message": "Registration cancelled successfully"
}
```

**Error**

```json
{
  "error": "User not registered for this event"
}
```

---

### List Upcoming Events

**Request**

```bash
GET /events
```

**Response**

```json
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
```

---

### Event Statistics

**Request**

```bash
GET /events/1/stats
```

**Response**

```json
{
  "eventId": 1,
  "totalRegistrations": 10,
  "remainingCapacity": 190,
  "percentageCapacityUsed": 5
}
```

---

## Business Logic Rules

* Event **capacity** must be between **1 and 1000**.
* **Duplicate registration** for the same event is not allowed.
* **Past events** cannot be registered for.
* **Full events** reject new registrations.
* Registration deletion restores one available seat.
* Returns appropriate **HTTP status codes** and **error messages**.

---

## Future Enhancements

* JWT-based user authentication
* Email confirmation for registration
* Pagination for event lists
* Search and filter by location/date
* Docker containerization


```

---

Would you like me to generate a **ready-to-import Postman Collection JSON file** next (to test all endpoints instantly)?
```
