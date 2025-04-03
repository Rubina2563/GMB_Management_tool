/**
 * Migration script to add first_name field to users
 * 
 * This script updates the users table to add a first_name field
 * and sets a default value based on username for existing users.
 */
// Import database from the correct file
import Database from 'better-sqlite3';

// Use the same database file path as in server/db.ts
const db = new Database('users.db');

export async function migrateDatabaseSchema() {
  console.log('Starting database migration for first_name field...');
  
  try {
    // First check if the column already exists
    const checkColumnExists = db.prepare(`
      PRAGMA table_info(users)
    `).all().filter(col => col.name === 'first_name');
    
    // If column doesn't exist, add it
    if (checkColumnExists.length === 0) {
      console.log('Adding first_name column to users table...');
      
      db.prepare(`
        ALTER TABLE users 
        ADD COLUMN first_name TEXT
      `).run();
      
      console.log('Column added successfully.');
      
      // Update existing users with a default first_name based on their username
      console.log('Updating existing users with default first_name...');
      
      db.prepare(`
        UPDATE users 
        SET first_name = username
        WHERE first_name IS NULL
      `).run();
      
      console.log('Existing users updated successfully.');
    } else {
      console.log('first_name column already exists. Migration not needed.');
    }
    
    console.log('Migration completed successfully.');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// If this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabaseSchema()
    .then(success => {
      if (success) {
        console.log('Migration completed successfully');
        process.exit(0);
      } else {
        console.error('Migration failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}