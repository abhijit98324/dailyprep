import fs from 'fs';
import path from 'path';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <user-email>');
  process.exit(1);
}

const dbPath = path.resolve(process.cwd(), 'data', 'dailyprep.json');
if (!fs.existsSync(dbPath)) {
  console.error('Database file not found yet. Start the app and register the account first.');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const idx = db.users.findIndex((u) => u.email.toLowerCase() === email);
if (idx === -1) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

db.users[idx].role = 'admin';
db.users[idx].plan = 'premium';
db.users[idx].onboarded = true;
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully promoted ${email} to Admin.`);