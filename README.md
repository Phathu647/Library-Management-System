Library Management System (LMS)

The Library Management System is a web-based application that helps manage library tasks like keeping track of books, users, borrowing, and reports. It’s designed to make library work faster, more organized, and easy to use for admins, librarians, and students.

----Main Features----

User Roles: Admin, Librarian, and Student with different access levels.

Authentication: Secure login and registration using JWT.

Book Management: Add, edit, delete, and search for books by title, author, or ISBN.

Borrowing & Returning: Borrow books, calculate due dates and fines automatically.

Reports: View overdue books, borrowing history, and generate PDF or CSV reports.

Modern UI: Clean, responsive interface built with Tailwind CSS.

---Tech Stack-----

Backend: Node.js, Express.js, SQLite, JWT, bcryptjs

Frontend: HTML, Tailwind CSS, JavaScript, Font Awesome

Extras: Multer (uploads), Nodemailer (emails), QRCode, PDFKit, CSV Writer

----Installation----

Install Node.js and npm.

Run npm install to install dependencies.

Start the app with npm start.

Open http://localhost:3000
 in your browser.

-----Default Admin Login:----

Email: admin@library.com

Password: admin123

User Roles

Admin: Full access, manage users, books, and reports.

Librarian: Manage books and assist users.

Student: Search, borrow, return, and reserve books.

----API Endpoints (Examples)-----

POST /api/auth/login – Login

GET /api/books – Get all books

POST /api/borrow – Borrow a book

POST /api/return – Return a book

GET /api/reports/overdue – Overdue report

----Database Overview----

Includes tables for Users, Books, Borrowing Records, Reservations, and Fines, each storing important information like IDs, dates, status, and relationships between users and books.

----Configuration----

Create a .env file for your environment settings (port, JWT secret, email details, database path).

----Security----

Uses bcrypt for password hashing, JWT for authentication, and input validation to prevent SQL injection and other attacks.

----Future Plans----

Email/SMS notifications for due dates

Barcode/QR scanning

Mobile app version

Book recommendations and digital book support

----Troubleshooting----

If you face issues like database errors or port conflicts, check your environment settings, dependencies, or Node.js version.

----License----

This project is under the MIT License.