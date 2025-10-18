#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Library Management System - Installation Script');
console.log('================================================\n');

// Check if Node.js is installed
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
    console.error('❌ Node.js is not installed. Please install Node.js from https://nodejs.org/');
    process.exit(1);
}

// Check if npm is installed
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
    console.error('❌ npm is not installed. Please install npm.');
    process.exit(1);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
} catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('\n⚙️  Creating environment configuration...');
    const envContent = `PORT=3000
JWT_SECRET=your-secret-key-change-in-production-${Date.now()}
DB_PATH=./library.db
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file created (.env)');
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Public directory created');
}

console.log('\n🎉 Installation completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the application: npm start');
console.log('2. Open your browser: http://localhost:3000');
console.log('3. Login with admin credentials:');
console.log('   Email: admin@library.com');
console.log('   Password: admin123');
console.log('\n📚 Happy library managing!');
