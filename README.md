# CMT Labs - Material Testing Software

Complete field-to-report testing management for construction materials labs. Built with a professional web interface and production-ready backend.

## Features

- 23 ASTM material testing protocols
- Real-time test data entry and management
- Photo capture and storage
- PDF report generation
- Technician certification tracking
- QR code integration
- Multi-device support (laptops, tablets, phones)
- Secure authentication and data storage

## Project Structure

```
cmt-labs/
├── frontend/
│   ├── index.html           (Testing application)
│   └── landing-page.html    (Marketing landing page)
├── backend/
│   ├── index.js             (Express API server)
│   ├── package.json         (Dependencies)
│   ├── .env                 (Environment variables)
│   └── database-schema.sql  (PostgreSQL schema)
└── README.md
```

## Tech Stack

- **Frontend:** HTML5, JavaScript, CSS3
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT + bcryptjs
- **File Storage:** Supabase Storage
- **Hosting:** Vercel
- **PDF Generation:** jsPDF

## Getting Started

### Prerequisites
- Node.js 16+
- Supabase account (free tier available)
- Vercel account (free tier available)

### Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` in the `backend/` folder
3. Fill in your Supabase credentials
4. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```
6. Open `frontend/index.html` in your browser

### Deployment

See `DEPLOYMENT_GUIDE.md` for complete step-by-step instructions for deploying to Vercel.

## API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

**Tests:**
- `POST /api/tests/save` - Create/update test
- `GET /api/tests` - List tests with filtering
- `GET /api/tests/:id` - Get single test
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test

**Photos:**
- `POST /api/photos/upload` - Upload photo
- `GET /api/photos/:test_id` - Get photos for test

**Reports:**
- `GET /api/tests/:id/pdf` - Generate PDF report

## Database Schema

Tables:
- `users` - User accounts and credentials
- `tests` - Material testing records
- `photos` - Test photos and images
- `pdfs` - Generated reports

All data is encrypted and secured with Row Level Security (RLS) policies.

## License

MIT

## Support

For deployment issues, check:
1. Vercel logs (dashboard)
2. Supabase dashboard
3. Browser console (F12)
4. Network tab for API responses
