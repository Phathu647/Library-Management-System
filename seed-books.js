const sqlite3 = require('sqlite3').verbose();

// Sample books data
const sampleBooks = [
    {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "9780743273565",
        category: "Fiction",
        published_year: 1925
    },
    {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "9780061120084",
        category: "Fiction",
        published_year: 1960
    },
    {
        title: "1984",
        author: "George Orwell",
        isbn: "9780451524935",
        category: "Fiction",
        published_year: 1949
    },
    {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        isbn: "9780141439518",
        category: "Fiction",
        published_year: 1813
    },
    {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        isbn: "9780316769174",
        category: "Fiction",
        published_year: 1951
    },
    {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "9780553380163",
        category: "Science",
        published_year: 1988
    },
    {
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        isbn: "9780062316097",
        category: "History",
        published_year: 2011
    },
    {
        title: "The Selfish Gene",
        author: "Richard Dawkins",
        isbn: "9780192860927",
        category: "Science",
        published_year: 1976
    },
    {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        isbn: "9780374533557",
        category: "Non-Fiction",
        published_year: 2011
    },
    {
        title: "The Lean Startup",
        author: "Eric Ries",
        isbn: "9780307887894",
        category: "Technology",
        published_year: 2011
    },
    {
        title: "Clean Code",
        author: "Robert C. Martin",
        isbn: "9780132350884",
        category: "Technology",
        published_year: 2008
    },
    {
        title: "The Art of Computer Programming",
        author: "Donald E. Knuth",
        isbn: "9780321751041",
        category: "Technology",
        published_year: 1968
    },
    {
        title: "Guns, Germs, and Steel",
        author: "Jared Diamond",
        isbn: "9780393317558",
        category: "History",
        published_year: 1997
    },
    {
        title: "The Origin of Species",
        author: "Charles Darwin",
        isbn: "9780451529060",
        category: "Science",
        published_year: 1859
    },
    {
        title: "The Wealth of Nations",
        author: "Adam Smith",
        isbn: "9780140432084",
        category: "Non-Fiction",
        published_year: 1776
    },
    {
        title: "The Art of War",
        author: "Sun Tzu",
        isbn: "9781590309637",
        category: "Non-Fiction",
        published_year: -500
    },
    {
        title: "The Republic",
        author: "Plato",
        isbn: "9780140449143",
        category: "Non-Fiction",
        published_year: -380
    },
    {
        title: "The Odyssey",
        author: "Homer",
        isbn: "9780140268867",
        category: "Fiction",
        published_year: -800
    },
    {
        title: "The Iliad",
        author: "Homer",
        isbn: "9780140275360",
        category: "Fiction",
        published_year: -800
    },
    {
        title: "The Divine Comedy",
        author: "Dante Alighieri",
        isbn: "9780140448955",
        category: "Fiction",
        published_year: 1320
    }
];

// Connect to database
const db = new sqlite3.Database('library.db');

console.log('📚 Adding sample books to the library...');

// Insert books into database
db.serialize(() => {
    // Clear existing books (optional - remove this if you want to keep existing data)
    db.run('DELETE FROM books', (err) => {
        if (err) {
            console.log('Note: Could not clear existing books (this is normal if table is empty)');
        }
    });

    // Insert sample books
    const stmt = db.prepare(`
        INSERT INTO books (title, author, isbn, category, published_year, availability_status)
        VALUES (?, ?, ?, ?, ?, 'available')
    `);

    let insertedCount = 0;
    
    sampleBooks.forEach((book, index) => {
        stmt.run([book.title, book.author, book.isbn, book.category, book.published_year], function(err) {
            if (err) {
                console.error(`❌ Error inserting book "${book.title}":`, err.message);
            } else {
                insertedCount++;
                console.log(`✅ Added: ${book.title} by ${book.author}`);
            }
            
            // Close database after all books are processed
            if (index === sampleBooks.length - 1) {
                stmt.finalize();
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    } else {
                        console.log(`\n🎉 Successfully added ${insertedCount} books to the library!`);
                        console.log('\n📋 Book categories included:');
                        const categories = [...new Set(sampleBooks.map(book => book.category))];
                        categories.forEach(category => {
                            const count = sampleBooks.filter(book => book.category === category).length;
                            console.log(`   • ${category}: ${count} books`);
                        });
                        console.log('\n🚀 You can now start the application and see the books in the library!');
                    }
                });
            }
        });
    });
});
