# Hippo Exchange REST API

Node.js backend for a peer-to-peer equipment sharing system. Manages user authentication, session-based security, inventory tracking, brand management, and loan history using a MySQL database.

All endpoints and helper functions are in a single index.js file. This was a requirement of the course exam for which this project was built.

## Setup

1. Clone the repo and run `npm install`
2. Set up the database by running database.sql in your MySQL client
3. Create a .env file in the project root with `DB_PASSWORD=your_mysql_password`
4. Run the server with `node index.js` — it listens on port 8000

## Endpoints

Most endpoints require a sessionID, obtained from POST /sessions.

### Users
- POST /users — Register a new user
- PUT /users/password — Update the authenticated user's password
- GET /users/active?days=N — Count users active within the last N days
- GET /users/total — Count total registered users

### Sessions
- POST /sessions — Login and receive a session ID
- DELETE /sessions — Logout and delete the current session

### Inventory
- GET /inventory — Get all inventory items owned by the authenticated user
- PUT /inventory — Deactivate an inventory item
- GET /inventory/description — Search inventory by description using phonetic matching

### Brands
- POST /brands — Add a new brand
- GET /brands — List all brands

### Loans
- POST /loans — Borrow an item
- GET /loans — Get the authenticated user's loan history
- PUT /loans — Mark a loan as returned
- GET /loans/count — Get system-wide counts of outstanding and completed loans

### Misc
- GET /mascot — Returns the mascot (hippo, obviously...)

## Database

Schema is in database.sql. Run it in your MySQL client to set up the following tables:

- tblUsers — stores registered users with hashed passwords, keyed by email
- tblSessions — tracks active login sessions, linked to a user by email
- tblBrands — a registry of equipment brands
- tblInventory — equipment items with brand, model, description, owner, and an active flag
- tblLoans — loan records tracking which user borrowed which item, with borrow and return dates

## Author

Cyrus Loyd
