# Library Management System (LMS)

A comprehensive web-based Library Management System designed to automate and efficiently manage library operations including book inventory, user management, borrowing/returning processes, and reporting.

## Features

###  Authentication & Authorization 
- **Role-based Access Control**: Admin, Librarian, and Student roles
- **Secure Authentication**: JWT-based token authentication
- **User Registration**: Self-registration for students and librarians

###  Book Management
- **Add/Edit/Delete Books**: Complete CRUD operations for book catalog
- **Advanced Search**: Search by title, author, ISBN, or category
- **Book Status Tracking**: Available, Borrowed, Reserved status
- **Barcode/QR Code Support**: Ready for barcode scanning integration

###  Borrowing & Returning
- **Book Borrowing**: Easy checkout process with due date calculation
- **Return Management**: Track returns and calculate fines automatically
- **Reservation System**: Reserve books that are currently checked out
- **Fine Calculation**: Automatic fine calculation for overdue books

###  Reporting & Analytics
- **Overdue Reports**: Track overdue books and users
- **Borrowing History**: Complete transaction history
- **Usage Analytics**: Library usage statistics
- **Export Functionality**: PDF and CSV export capabilities

###  Modern User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Tailwind CSS**: Modern, clean interface design
- **Role-specific Dashboards**: Customized views for different user types
- **Real-time Updates**: Live status updates and notifications

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **SQLite**: Database for data persistence
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing

### Frontend
- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No framework dependencies
- **Font Awesome**: Icons and visual elements

### Additional Libraries
- **Multer**: File upload handling
- **Nodemailer**: Email notifications
- **QRCode**: QR code generation
- **PDFKit**: PDF report generation
- **CSV Writer**: CSV export functionality

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Step 2: Install Dependencies
```bash
npm install
```

# Production mode
npm start
```

### Step 4: Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

## Default Login Credentials

### Admin Account
- **Email**: admin@library.com
- **Password**: admin123
- **Role**: Admin

## User Roles & Permissions

### Admin
- Full system access
- User management
- Book catalog management
- Generate all reports
- System configuration

### Librarian
- Book management
- User assistance
- Basic reporting
- Transaction oversight

### Student
- Search and browse books
- Borrow and return books
- Reserve books
- View personal borrowing history

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Books
- `GET /api/books` - Get all books (with search/filter)
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Borrowing
- `POST /api/borrow` - Borrow a book
- `POST /api/return` - Return a book
- `GET /api/borrowed-books` - Get user's borrowed books

### Reservations
- `POST /api/reserve` - Reserve a book

### Reports
- `GET /api/reports/overdue` - Get overdue books report
- `GET /api/reports/borrowing-history` - Get borrowing history

## Database Schema

### Users Table
- `id` (Primary Key)
- `name` (Text)
- `email` (Unique)
- `role` (admin/librarian/student)
- `password_hash` (Encrypted)
- `created_at` (Timestamp)

### Books Table
- `id` (Primary Key)
- `title` (Text)
- `author` (Text)
- `isbn` (Unique)
- `category` (Text)
- `published_year` (Integer)
- `availability_status` (available/borrowed/reserved)
- `barcode` (Text)
- `qr_code` (Text)
- `created_at` (Timestamp)

### Borrowing Records Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `book_id` (Foreign Key)
- `borrowed_date` (Timestamp)
- `due_date` (Timestamp)
- `return_date` (Timestamp)
- `fine_amount` (Real)
- `status` (active/returned/overdue)

### Reservations Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `book_id` (Foreign Key)
- `reservation_date` (Timestamp)
- `status` (pending/fulfilled/cancelled)

### Fines Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `borrowing_record_id` (Foreign Key)
- `amount` (Real)
- `issue_date` (Timestamp)
- `paid_date` (Timestamp)
- `status` (unpaid/paid)

## Usage Guide

### For Students
1. **Register**: Create an account with your email and student role
2. **Login**: Access your personalized dashboard
3. **Search Books**: Use the search functionality to find books
4. **Borrow Books**: Click "Borrow" on available books
5. **View Borrowed Books**: Check your current borrowings and due dates
6. **Return Books**: Return books before or on the due date
7. **Reserve Books**: Reserve books that are currently borrowed

### For Librarians
1. **Login**: Use librarian credentials
2. **Manage Books**: Add, edit, or remove books from the catalog
3. **Assist Users**: Help students with borrowing and returning
4. **Generate Reports**: Create reports on library usage and overdue books

### For Administrators
1. **Full Access**: Complete system administration
2. **User Management**: Manage all user accounts
3. **System Reports**: Generate comprehensive analytics
4. **Book Management**: Full catalog management
5. **Fine Management**: Handle overdue fines and payments

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=your-secret-key-here
DB_PATH=./library.db
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Email Configuration
For email notifications, configure SMTP settings in the server.js file or use environment variables.

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Secure authentication with expiration
- **Role-based Access**: Granular permission system
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries

## Future Enhancements

- [ ] Email/SMS notifications for due dates
- [ ] Barcode/QR code scanning integration
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with external library systems
- [ ] Automated fine collection
- [ ] Book recommendation system
- [ ] Digital book support

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure SQLite is properly installed
   - Check file permissions for database creation

2. **Authentication Issues**
   - Verify JWT secret is set correctly
   - Check token expiration settings

3. **Port Already in Use**
   - Change the PORT in server.js or .env file
   - Kill existing processes using the port

4. **Module Not Found Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js version compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Library Management System** - Making library operations efficient and user-friendly! 
