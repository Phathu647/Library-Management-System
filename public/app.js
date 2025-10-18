// Global variables
let currentUser = null;
let authToken = null;

// API base URL
const API_BASE = '';

// Utility functions
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showSection(sectionId) {
    document.getElementById(sectionId).classList.remove('hidden');
}

function hideSection(sectionId) {
    document.getElementById(sectionId).classList.add('hidden');
}

// API functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Authentication functions
async function login(email, password) {
    try {
        const response = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        authToken = response.token;
        currentUser = response.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showToast('Login successful!', 'success');
        hideModal('login-modal');
        showDashboard();
        
        return response;
    } catch (error) {
        console.error('Login error:', error);
    }
}

async function register(name, email, password, role) {
    try {
        const response = await apiCall('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role }),
        });
        
        showToast('Registration successful! Please login.', 'success');
        hideModal('register-modal');
        
        return response;
    } catch (error) {
        console.error('Registration error:', error);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    showToast('Logged out successfully', 'success');
    showWelcomeSection();
}

// Dashboard functions
function showDashboard() {
    hideSection('welcome-section');
    showSection('dashboard');
    
    if (currentUser.role === 'admin') {
        showSection('admin-dashboard');
        hideSection('librarian-dashboard');
        hideSection('student-dashboard');
        loadAdminDashboard();
    } else if (currentUser.role === 'librarian') {
        showSection('librarian-dashboard');
        hideSection('admin-dashboard');
        hideSection('student-dashboard');
        loadLibrarianStats();
    } else {
        showSection('student-dashboard');
        hideSection('admin-dashboard');
        hideSection('librarian-dashboard');
        loadBorrowedBooks();
    }
    
    updateNavigation();
}

function showWelcomeSection() {
    hideSection('dashboard');
    showSection('welcome-section');
    updateNavigation();
}

function updateNavigation() {
    const navButtons = document.getElementById('nav-buttons');
    
    if (currentUser) {
        navButtons.innerHTML = `
            <span class="text-gray-700 mr-4">Welcome, ${currentUser.name}</span>
            <span class="text-sm text-gray-500 mr-4">${currentUser.role.toUpperCase()}</span>
            <button id="logout-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
        `;
        
        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        navButtons.innerHTML = `
            <button id="login-btn" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-sign-in-alt mr-2"></i>Login
            </button>
            <button id="register-btn" class="border border-primary text-primary px-4 py-2 rounded-lg hover:bg-blue-50 transition">
                <i class="fas fa-user-plus mr-2"></i>Register
            </button>
        `;
        
        document.getElementById('login-btn').addEventListener('click', () => showModal('login-modal'));
        document.getElementById('register-btn').addEventListener('click', () => showModal('register-modal'));
    }
}

// Book management functions
async function loadBooks(search = '', category = '', status = '') {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        
        const books = await apiCall(`/api/books?${params.toString()}`);
        return books;
    } catch (error) {
        console.error('Error loading books:', error);
        return [];
    }
}

async function addBook(bookData) {
    try {
        await apiCall('/api/books', {
            method: 'POST',
            body: JSON.stringify(bookData),
        });
        
        showToast('Book added successfully!', 'success');
        hideModal('add-book-modal');
        document.getElementById('add-book-form').reset();
        
        // Refresh the appropriate dashboard
        if (currentUser.role === 'admin') {
            loadAdminDashboard();
        } else if (currentUser.role === 'librarian') {
            loadLibrarianStats();
        }
    } catch (error) {
        console.error('Error adding book:', error);
    }
}

async function borrowBook(bookId) {
    try {
        await apiCall('/api/borrow', {
            method: 'POST',
            body: JSON.stringify({ bookId }),
        });
        
        showToast('Book borrowed successfully!', 'success');
        loadBorrowedBooks();
        searchBooks(); // Refresh search results
    } catch (error) {
        console.error('Error borrowing book:', error);
    }
}

async function returnBook(recordId) {
    try {
        await apiCall('/api/return', {
            method: 'POST',
            body: JSON.stringify({ recordId }),
        });
        
        showToast('Book returned successfully!', 'success');
        loadBorrowedBooks();
    } catch (error) {
        console.error('Error returning book:', error);
    }
}

async function reserveBook(bookId) {
    try {
        await apiCall('/api/reserve', {
            method: 'POST',
            body: JSON.stringify({ bookId }),
        });
        
        showToast('Book reserved successfully!', 'success');
    } catch (error) {
        console.error('Error reserving book:', error);
    }
}

// Student dashboard functions
async function loadBorrowedBooks() {
    try {
        const books = await apiCall('/api/borrowed-books');
        displayBorrowedBooks(books);
    } catch (error) {
        console.error('Error loading borrowed books:', error);
    }
}

function displayBorrowedBooks(books) {
    const container = document.getElementById('borrowed-books-list');
    
    if (books.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No borrowed books</p>';
        return;
    }
    
    container.innerHTML = books.map(book => {
        const dueDate = new Date(book.due_date);
        const isOverdue = dueDate < new Date();
        const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 ${isOverdue ? 'bg-red-50 border-red-200' : ''}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${book.title}</h4>
                        <p class="text-gray-600">by ${book.author}</p>
                        <p class="text-sm text-gray-500">ISBN: ${book.isbn || 'N/A'}</p>
                        <p class="text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}">
                            Due: ${dueDate.toLocaleDateString()}
                            ${isOverdue ? '(Overdue)' : `(${daysUntilDue} days left)`}
                        </p>
                    </div>
                    <button onclick="returnBook(${book.id})" 
                            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                        <i class="fas fa-undo mr-2"></i>Return
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function searchBooks() {
    const searchTerm = document.getElementById('book-search').value;
    const category = document.getElementById('category-filter').value;
    
    try {
        const books = await loadBooks(searchTerm, category);
        displaySearchResults(books);
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

function displaySearchResults(books) {
    const container = document.getElementById('books-list');
    const resultsSection = document.getElementById('search-results');
    
    if (books.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No books found</p>';
        showSection('search-results');
        return;
    }
    
    container.innerHTML = books.map(book => {
        const isAvailable = book.availability_status === 'available';
        const canBorrow = isAvailable && currentUser;
        const canReserve = !isAvailable && currentUser;
        
        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${book.title}</h4>
                        <p class="text-gray-600">by ${book.author}</p>
                        <p class="text-sm text-gray-500">ISBN: ${book.isbn || 'N/A'}</p>
                        <p class="text-sm text-gray-500">Category: ${book.category || 'N/A'}</p>
                        <p class="text-sm text-gray-500">Year: ${book.published_year || 'N/A'}</p>
                        <span class="inline-block px-2 py-1 text-xs rounded-full ${
                            isAvailable ? 'bg-green-100 text-green-800' : 
                            book.availability_status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                        }">
                            ${book.availability_status.toUpperCase()}
                        </span>
                    </div>
                    <div class="ml-4 space-y-2">
                        ${canBorrow ? `
                            <button onclick="borrowBook(${book.id})" 
                                    class="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-book-reader mr-2"></i>Borrow
                            </button>
                        ` : ''}
                        ${canReserve ? `
                            <button onclick="reserveBook(${book.id})" 
                                    class="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
                                <i class="fas fa-bookmark mr-2"></i>Reserve
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    showSection('search-results');
}

// Admin dashboard functions
async function loadAdminDashboard() {
    try {
        const stats = await apiCall('/api/admin/stats');
        
        // Update admin dashboard stats
        document.getElementById('admin-total-books').textContent = stats.totalBooks || 0;
        document.getElementById('admin-total-users').textContent = stats.totalUsers || 0;
        document.getElementById('admin-active-loans').textContent = stats.activeLoans || 0;
        document.getElementById('admin-overdue-books').textContent = stats.overdueBooks || 0;
        document.getElementById('admin-available-books').textContent = stats.availableBooks || 0;
        document.getElementById('admin-borrowed-books').textContent = stats.borrowedBooks || 0;
        document.getElementById('admin-librarians').textContent = stats.librarians || 0;
        document.getElementById('admin-students').textContent = stats.students || 0;
        
        // Load recent activity
        if (stats.recentActivity && stats.recentActivity.length > 0) {
            const activityHTML = stats.recentActivity.map(activity => `
                <div class="flex items-start py-2 border-b border-gray-100 last:border-0">
                    <i class="fas fa-${activity.type === 'borrow' ? 'book-reader' : 'undo'} text-primary mt-1 mr-3"></i>
                    <div class="flex-1">
                        <p class="text-sm text-gray-900">${activity.userName} ${activity.type === 'borrow' ? 'borrowed' : 'returned'} "${activity.bookTitle}"</p>
                        <p class="text-xs text-gray-500">${new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                </div>
            `).join('');
            document.getElementById('admin-recent-activity').innerHTML = activityHTML;
        } else {
            document.getElementById('admin-recent-activity').innerHTML = '<p class="text-gray-500 text-sm">No recent activity</p>';
        }
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Librarian dashboard functions
async function loadLibrarianStats() {
    try {
        const [books, overdueRecords, activeLoans] = await Promise.all([
            loadBooks(),
            apiCall('/api/reports/overdue'),
            apiCall('/api/reports/active-loans')
        ]);
        
        const availableBooks = books.filter(book => book.availability_status === 'available').length;
        
        document.getElementById('total-books').textContent = books.length;
        document.getElementById('available-books').textContent = availableBooks;
        document.getElementById('overdue-books').textContent = overdueRecords.length;
        document.getElementById('active-loans').textContent = activeLoans.length || 0;
    } catch (error) {
        console.error('Error loading librarian stats:', error);
    }
}

// Overdue report functions
async function loadOverdueReport() {
    try {
        const overdueBooks = await apiCall('/api/reports/overdue');
        displayOverdueReport(overdueBooks);
    } catch (error) {
        console.error('Error loading overdue report:', error);
    }
}

function displayOverdueReport(overdueBooks) {
    const container = document.getElementById('overdue-report-content');
    
    if (overdueBooks.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No overdue books found</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine Amount</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${overdueBooks.map(book => {
                        const dueDate = new Date(book.due_date);
                        const daysOverdue = Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24));
                        const fineAmount = daysOverdue * 1.00; // $1 per day
                        
                        return `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">${book.user_name}</div>
                                        <div class="text-sm text-gray-500">${book.email}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">${book.title}</div>
                                        <div class="text-sm text-gray-500">by ${book.author}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${dueDate.toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        ${daysOverdue} days
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    $${fineAmount.toFixed(2)}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Borrowing history functions
async function loadBorrowingHistory(startDate = '', endDate = '') {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const history = await apiCall(`/api/reports/borrowing-history?${params.toString()}`);
        displayBorrowingHistory(history);
    } catch (error) {
        console.error('Error loading borrowing history:', error);
    }
}

function displayBorrowingHistory(history) {
    const container = document.getElementById('borrowing-history-content');
    
    if (history.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No borrowing history found</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrowed Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${history.map(record => {
                        const borrowedDate = new Date(record.borrowed_date);
                        const dueDate = new Date(record.due_date);
                        const returnDate = record.return_date ? new Date(record.return_date) : null;
                        const isOverdue = !returnDate && dueDate < new Date();
                        const isReturned = !!returnDate;
                        
                        return `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${record.user_name}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">${record.title}</div>
                                        <div class="text-sm text-gray-500">by ${record.author}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${borrowedDate.toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${dueDate.toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${returnDate ? returnDate.toLocaleDateString() : 'Not returned'}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        isReturned ? 'bg-green-100 text-green-800' :
                                        isOverdue ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }">
                                        ${isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    $${record.fine_amount ? record.fine_amount.toFixed(2) : '0.00'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Manage books functions
async function loadManageBooks(search = '', category = '') {
    try {
        const books = await loadBooks(search, category);
        displayManageBooks(books);
    } catch (error) {
        console.error('Error loading books for management:', error);
    }
}

function displayManageBooks(books) {
    const container = document.getElementById('manage-books-content');
    
    if (books.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No books found</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="space-y-4">
            ${books.map(book => `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">${book.title}</h4>
                            <p class="text-gray-600">by ${book.author}</p>
                            <p class="text-sm text-gray-500">ISBN: ${book.isbn || 'N/A'} | Category: ${book.category || 'N/A'} | Year: ${book.published_year || 'N/A'}</p>
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${
                                book.availability_status === 'available' ? 'bg-green-100 text-green-800' : 
                                book.availability_status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                            }">
                                ${book.availability_status.toUpperCase()}
                            </span>
                        </div>
                        <div class="ml-4 space-x-2">
                            <button onclick="editBook(${book.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button onclick="deleteBook(${book.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }
    
    try {
        await apiCall(`/api/books/${bookId}`, {
            method: 'DELETE'
        });
        
        showToast('Book deleted successfully!', 'success');
        loadManageBooks(); // Refresh the list
    } catch (error) {
        console.error('Error deleting book:', error);
    }
}

async function editBook(bookId) {
    // For now, just show a simple prompt - you can enhance this with a proper edit modal
    const newTitle = prompt('Enter new title:');
    if (newTitle) {
        try {
            await apiCall(`/api/books/${bookId}`, {
                method: 'PUT',
                body: JSON.stringify({ title: newTitle })
            });
            
            showToast('Book updated successfully!', 'success');
            loadManageBooks(); // Refresh the list
        } catch (error) {
            console.error('Error updating book:', error);
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing authentication
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showWelcomeSection();
    }
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await login(email, password);
    });
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;
        await register(name, email, password, role);
    });
    
    // Add book form
    document.getElementById('add-book-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookData = {
            title: document.getElementById('book-title').value,
            author: document.getElementById('book-author').value,
            isbn: document.getElementById('book-isbn').value,
            category: document.getElementById('book-category').value,
            published_year: parseInt(document.getElementById('book-year').value)
        };
        await addBook(bookData);
    });
    
    // Search books
    document.getElementById('search-books-btn').addEventListener('click', searchBooks);
    
    // Modal close buttons
    document.getElementById('close-login').addEventListener('click', () => hideModal('login-modal'));
    document.getElementById('close-register').addEventListener('click', () => hideModal('register-modal'));
    document.getElementById('close-add-book').addEventListener('click', () => hideModal('add-book-modal'));
    
    // Add book button
    document.getElementById('add-book-btn').addEventListener('click', () => showModal('add-book-modal'));
    
    // Overdue report button
    document.getElementById('overdue-report-btn').addEventListener('click', () => {
        showModal('overdue-report-modal');
        loadOverdueReport();
    });
    
    // Borrowing history button
    document.getElementById('borrowing-history-btn').addEventListener('click', () => {
        showModal('borrowing-history-modal');
        loadBorrowingHistory();
    });
    
    // Manage books button
    document.getElementById('manage-books-btn').addEventListener('click', () => {
        showModal('manage-books-modal');
        loadManageBooks();
    });
    
    // Filter history button
    document.getElementById('filter-history-btn').addEventListener('click', () => {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        loadBorrowingHistory(startDate, endDate);
    });
    
    // Manage books search button
    document.getElementById('manage-search-btn').addEventListener('click', () => {
        const search = document.getElementById('manage-search').value;
        const category = document.getElementById('manage-category-filter').value;
        loadManageBooks(search, category);
    });
    
    // Modal close buttons
    document.getElementById('close-overdue-report').addEventListener('click', () => hideModal('overdue-report-modal'));
    document.getElementById('close-borrowing-history').addEventListener('click', () => hideModal('borrowing-history-modal'));
    document.getElementById('close-manage-books').addEventListener('click', () => hideModal('manage-books-modal'));
    
    // Click outside modal to close
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('fixed')) {
            const modals = ['login-modal', 'register-modal', 'add-book-modal', 'overdue-report-modal', 'borrowing-history-modal', 'manage-books-modal'];
            modals.forEach(modalId => {
                if (!document.getElementById(modalId).classList.contains('hidden')) {
                    hideModal(modalId);
                }
            });
        }
    });
});
