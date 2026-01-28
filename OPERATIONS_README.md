# Operations Portal - Setup Guide

## Overview

The **Operations Portal** is a standalone application for managing client Mutual Fund (MF) and Bond reports. It operates independently from the main portfolio management system with its own authentication and interface.

### Key Features

- ✅ **Standalone Application** - Separate from main app, no sidebar integration
- ✅ **Dedicated Login** - Independent authentication for operations staff
- ✅ **Client Search** - Find clients by ID or name
- ✅ **CSV Upload** - Upload MF and Bond reports
- ✅ **Data Display** - View uploaded reports in organized tables
- ✅ **Email Notifications** - Send reports to clients
- ✅ **Data Export** - Export reports to CSV

---

## Quick Start

### 1. Access the Portal

**Login Page**: `http://localhost:5173/operations-login`

### 2. Login Credentials

Use an account with `operations` or `super_admin` role:
- Username: `operations@test.com` (if created)
- Password: Your operations password

### 3. After Login

You'll be redirected to: `http://localhost:5173/operations-dashboard`

## Prerequisites

- PostgreSQL database running
- Node.js and npm installed
- SMTP server credentials (for email functionality)

## Setup Steps

### 1. Database Setup

Run the SQL schema to create the required tables:

```bash
# Option 1: Using psql command line
psql -U your_username -d your_database -f backend/database/operations_schema.sql

# Option 2: Using pgAdmin or another GUI tool
# Open the file backend/database/operations_schema.sql and execute it
```

This will create:
- `mf_reports` table
- `bond_reports` table
- Necessary indexes and triggers

### 2. Install Dependencies

Backend dependencies are already installed. If you need to reinstall:

```bash
cd backend
npm install nodemailer csv-parser multer
```

### 3. Configure SMTP (for Email Functionality)

Edit `backend/.env` and add:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@portfolioview.com
```

#### Gmail Setup:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password (Security → App passwords)
4. Use the app password in `SMTP_PASS`

#### Other Email Providers:
- **Outlook/Office365**: `smtp.office365.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Update host and port accordingly

### 4. Start the Application

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd Frontend/client
npm run dev
```

### 5. Access the Dashboard

1. Login to the application
2. Navigate to: `http://localhost:5173/operations`
3. You should see the Operations Dashboard

## Usage

### Searching for Clients

1. Enter a Client ID or Name in the search box
2. Click "Search" or press Enter
3. Select a client from the results

### Uploading MF Reports

1. Select a client first
2. Click the "Upload MF Report" card
3. Choose a CSV file with the following columns:
   - AMC Name
   - Scheme Name
   - Scheme Code
   - Folio No
   - Scheme Category
   - Units
   - Avg Cost (₹)
   - Invested Amount (₹)
   - Current NAV (₹)
   - NAV Date
   - Current Value (₹)
   - Unrealized P&L (₹)
   - Unrealized P&L %

4. The data will be automatically processed and displayed

### Uploading Bond Reports

1. Select a client first
2. Click the "Upload Bond Report" card
3. Choose a CSV file with the following columns:
   - Bond Name
   - ISIN
   - Issuer Name
   - Bond type
   - Invested/ Principal Amount
   - Issue Date
   - Purchase Date
   - Coupon Rate
   - Coupon Frequency
   - Maturity Date
   - Call Date
   - YTM %
   - YTC %

4. The data will be automatically processed and displayed

### Sending Emails

1. After uploading data, click one of the email buttons:
   - "Send MF Email" - Sends only MF report
   - "Send Bond Email" - Sends only Bond report
   - "Send Combined Email" - Sends both MF and Bond reports

2. Confirm the action
3. Email will be sent to the client's registered email address

### Exporting Data

Click the "Export CSV" button to download the currently displayed data (MF or Bond) as a CSV file.

## Sample CSV Files

Sample CSV files are provided in the `backend` directory:
- `sample_mf.csv` - Sample Mutual Fund data
- `sample_bond.csv` - Sample Bond data

You can use these for testing.

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure the schema has been executed

### CSV Upload Fails
- Check file size (max 10MB)
- Verify CSV format matches expected columns
- Check browser console for detailed errors

### Email Not Sending
- Verify SMTP credentials in `.env`
- Check if SMTP server allows connections
- For Gmail, ensure App Password is used (not regular password)
- Check backend logs for detailed error messages

### Client Not Found
- Ensure the client exists in the `users` table
- Verify the `client_id` matches exactly

## API Endpoints

All endpoints require authentication (Bearer token).

### Search Clients
```
GET /api/operations/clients/search?client_id=XXX
```

### Get MF Data
```
GET /api/operations/clients/:client_id/mf
```

### Get Bond Data
```
GET /api/operations/clients/:client_id/bonds
```

### Upload MF CSV
```
POST /api/operations/upload/mf
Content-Type: multipart/form-data
Body: file (CSV file), client_id (string)
```

### Upload Bond CSV
```
POST /api/operations/upload/bonds
Content-Type: multipart/form-data
Body: file (CSV file), client_id (string)
```

### Send Email
```
POST /api/operations/send-email/:client_id
Content-Type: application/json
Body: { "report_type": "mf" | "bond" | "both" }
```

## Security

- All routes are protected with authentication
- Only users with `super_admin` or `operations` role can access
- File uploads are validated (type, size)
- SQL injection protection via parameterized queries
- CSRF protection via CORS configuration

## Support

For issues or questions:
1. Check the walkthrough.md for detailed implementation details
2. Review backend logs for error messages
3. Check browser console for frontend errors
4. Verify database schema is correctly installed
