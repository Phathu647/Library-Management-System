const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('library.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'librarian', 'student')),
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Books table
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE,
    category TEXT,
    published_year INTEGER,
    availability_status TEXT DEFAULT 'available' CHECK(availability_status IN ('available', 'borrowed', 'reserved')),
    barcode TEXT,
    qr_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Borrowing records table
  db.run(`CREATE TABLE IF NOT EXISTS borrowing_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrowed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME,
    fine_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue')),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (book_id) REFERENCES books (id)
  )`);

  // Reservations table
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled', 'cancelled')),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (book_id) REFERENCES books (id)
  )`);

  // Fines table
  db.run(`CREATE TABLE IF NOT EXISTS fines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    borrowing_record_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_date DATETIME,
    status TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid')),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (borrowing_record_id) REFERENCES borrowing_records (id)
  )`);

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (name, email, role, password_hash) 
          VALUES ('Admin', 'admin@library.com', 'admin', ?)`, [adminPassword]);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Routes

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!['librarian', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  const passwordHash = bcrypt.hashSync(password, 10);
  
  db.run(
    'INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)',
    [name, email, role, passwordHash],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ message: 'User registered successfully', userId: this.lastID });
    }
  );
});

// Books routes
app.get('/api/books', (req, res) => {
  const { search, category, status } = req.query;
  let query = 'SELECT * FROM books WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (status) {
    query += ' AND availability_status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY title';
  
  db.all(query, params, (err, books) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(books);
  });
});

app.post('/api/books', authenticateToken, authorizeRole(['admin', 'librarian']), (req, res) => {
  const { title, author, isbn, category, published_year } = req.body;
  
  db.run(
    'INSERT INTO books (title, author, isbn, category, published_year) VALUES (?, ?, ?, ?, ?)',
    [title, author, isbn, category, published_year],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ error: 'ISBN already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ message: 'Book added successfully', bookId: this.lastID });
    }
  );
});

app.put('/api/books/:id', authenticateToken, authorizeRole(['admin', 'librarian']), (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, category, published_year, availability_status } = req.body;
  
  db.run(
    'UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, published_year = ?, availability_status = ? WHERE id = ?',
    [title, author, isbn, category, published_year, availability_status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      res.json({ message: 'Book updated successfully' });
    }
  );
});

app.delete('/api/books/:id', authenticateToken, authorizeRole(['admin', 'librarian']), (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({ message: 'Book deleted successfully' });
  });
});

// Borrowing routes
app.post('/api/borrow', authenticateToken, (req, res) => {
  const { bookId } = req.body;
  const userId = req.user.id;
  
  // Check if book is available
  db.get('SELECT * FROM books WHERE id = ? AND availability_status = "available"', [bookId], (err, book) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!book) {
      return res.status(400).json({ error: 'Book not available for borrowing' });
    }
    
    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Create borrowing record
    db.run(
      'INSERT INTO borrowing_records (user_id, book_id, due_date) VALUES (?, ?, ?)',
      [userId, bookId, dueDate.toISOString()],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Update book status
        db.run(
          'UPDATE books SET availability_status = "borrowed" WHERE id = ?',
          [bookId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ message: 'Book borrowed successfully', recordId: this.lastID });
          }
        );
      }
    );
  });
});

app.post('/api/return', authenticateToken, (req, res) => {
  const { recordId } = req.body;
  const userId = req.user.id;
  
  // Get borrowing record
  db.get('SELECT * FROM borrowing_records WHERE id = ? AND user_id = ? AND status = "active"', 
    [recordId, userId], (err, record) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!record) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }
    
    const returnDate = new Date();
    const dueDate = new Date(record.due_date);
    let fineAmount = 0;
    
    // Calculate fine if overdue
    if (returnDate > dueDate) {
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 1.00; // $1 per day
    }
    
    // Update borrowing record
    db.run(
      'UPDATE borrowing_records SET return_date = ?, status = "returned", fine_amount = ? WHERE id = ?',
      [returnDate.toISOString(), fineAmount, recordId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Update book status
        db.run(
          'UPDATE books SET availability_status = "available" WHERE id = ?',
          [record.book_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Create fine record if applicable
            if (fineAmount > 0) {
              db.run(
                'INSERT INTO fines (user_id, borrowing_record_id, amount) VALUES (?, ?, ?)',
                [userId, recordId, fineAmount],
                (err) => {
                  if (err) {
                    console.error('Error creating fine record:', err);
                  }
                }
              );
            }
            
            res.json({ 
              message: 'Book returned successfully', 
              fineAmount: fineAmount 
            });
          }
        );
      }
    );
  });
});

// Get user's borrowed books
app.get('/api/borrowed-books', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT br.*, b.title, b.author, b.isbn
    FROM borrowing_records br
    JOIN books b ON br.book_id = b.id
    WHERE br.user_id = ? AND br.status = 'active'
    ORDER BY br.due_date
  `, [userId], (err, books) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(books);
  });
});

// Reservations routes
app.post('/api/reserve', authenticateToken, (req, res) => {
  const { bookId } = req.body;
  const userId = req.user.id;
  
  // Check if book is already borrowed
  db.get('SELECT * FROM books WHERE id = ? AND availability_status = "borrowed"', [bookId], (err, book) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!book) {
      return res.status(400).json({ error: 'Book is not available for reservation' });
    }
    
    // Check if user already has a reservation for this book
    db.get('SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status = "pending"', 
      [userId, bookId], (err, existingReservation) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingReservation) {
        return res.status(400).json({ error: 'You already have a pending reservation for this book' });
      }
      
      // Create reservation
      db.run(
        'INSERT INTO reservations (user_id, book_id) VALUES (?, ?)',
        [userId, bookId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({ message: 'Book reserved successfully', reservationId: this.lastID });
        }
      );
    });
  });
});

// Admin routes
app.get('/api/admin/stats', authenticateToken, authorizeRole(['admin']), (req, res) => {
  // Get comprehensive stats for admin dashboard
  Promise.all([
    // Total books
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM books', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Total users
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Active loans
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM borrowing_records WHERE status = "active"', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Overdue books
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM borrowing_records WHERE status = "active" AND due_date < datetime("now")', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Available books
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM books WHERE availability_status = "available"', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Borrowed books
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM books WHERE availability_status = "borrowed"', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Librarians
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "librarian"', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Students
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "student"', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    }),
    // Recent activity
    new Promise((resolve, reject) => {
      db.all(`
        SELECT br.borrowed_date as date, u.name as userName, b.title as bookTitle, 
               CASE WHEN br.return_date IS NULL THEN 'borrow' ELSE 'return' END as type
        FROM borrowing_records br
        JOIN users u ON br.user_id = u.id
        JOIN books b ON br.book_id = b.id
        ORDER BY br.borrowed_date DESC
        LIMIT 5
      `, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    })
  ])
  .then(([totalBooks, totalUsers, activeLoans, overdueBooks, availableBooks, borrowedBooks, librarians, students, recentActivity]) => {
    res.json({
      totalBooks,
      totalUsers,
      activeLoans,
      overdueBooks,
      availableBooks,
      borrowedBooks,
      librarians,
      students,
      recentActivity
    });
  })
  .catch(err => {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

// Reports routes
app.get('/api/reports/active-loans', authenticateToken, authorizeRole(['admin', 'librarian']), (req, res) => {
  db.all(`
    SELECT br.*, u.name as user_name, b.title, b.author
    FROM borrowing_records br
    JOIN users u ON br.user_id = u.id
    JOIN books b ON br.book_id = b.id
    WHERE br.status = 'active'
    ORDER BY br.borrowed_date DESC
  `, (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(records);
  });
});

app.get('/api/reports/overdue', authenticateToken, authorizeRole(['admin', 'librarian']), (req, res) => {
  db.all(`
    SELECT br.*, u.name as user_name, u.email, b.title, b.author
    FROM borrowing_records br
    JOIN users u ON br.user_id = u.id
    JOIN books b ON br.book_id = b.id
    WHERE br.status = 'active' AND br.due_date < datetime('now')
    ORDER BY br.due_date
  `, (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(records);
  });
});

app.get('/api/reports/borrowing-history', authenticateToken, authorizeRole(['admin', 'librarian']), (req, res) => {
  const { userId, startDate, endDate } = req.query;
  let query = `
    SELECT br.*, u.name as user_name, b.title, b.author
    FROM borrowing_records br
    JOIN users u ON br.user_id = u.id
    JOIN books b ON br.book_id = b.id
    WHERE 1=1
  `;
  const params = [];
  
  if (userId) {
    query += ' AND br.user_id = ?';
    params.push(userId);
  }
  
  if (startDate) {
    query += ' AND br.borrowed_date >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND br.borrowed_date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY br.borrowed_date DESC';
  
  db.all(query, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(records);
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Library Management System running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});
