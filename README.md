# Event Management API

Node.js + Express + PostgreSQL REST API for event management.

## Features
- Create events (capacity validated: >0 and ≤1000)
- Get event details with registered users
- Register users for events (no duplicates, no past events, capacity enforced)
- Cancel registrations
- List upcoming events (sorted by date asc, then location alphabetically)
- Event stats (total registrations, remaining capacity, % used)
- Concurrency-safe registration using DB transactions and row-level locking

## Setup

1. Clone repo
2. Create a PostgreSQL database and note the DATABASE_URL. Example:
