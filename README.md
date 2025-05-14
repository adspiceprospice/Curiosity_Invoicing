# Curiosity Invoicing

A modern, secure, and user-friendly web application for creating, managing, sending, and storing sales offers and invoices in multiple languages. The application integrates with Google Drive for document storage, Resend for email delivery, and Google Gemini 2.5 Pro for AI-assisted template editing and workflow automation.

## Features

### Document Management
- Create sales offers and invoices in multiple languages
- Convert offers to invoices with one click
- Track document status (Draft, Sent, Accepted, etc.)
- Generate professional PDF documents
- AI-assisted document editing

### Template Management
- Customizable templates for different document types and languages
- User-friendly editor for template customization
- AI-assisted template editing

### Customer Management
- Store and manage customer information
- Track customer history and preferences
- Set preferred language per customer

### Integrations
- Google Drive for document storage
- Resend for email delivery
- Google Gemini 2.5 Pro for AI assistance

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Cloud account (for Drive API and Gemini API)
- Resend account

### Installation

1. Clone the repository
```bash
git clone https://github.com/adspiceprospice/Curiosity_Invoicing.git
cd Curiosity_Invoicing
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database
```bash
npm run prisma:migrate
```

5. Run the development server
```bash
npm run dev
```

## Technology Stack
- Frontend: React with TypeScript (Next.js)
- Backend: Next.js API routes
- Database: PostgreSQL with Prisma ORM
- Authentication: NextAuth.js
- PDF Generation: react-pdf
- Styling: TailwindCSS

## License
MIT