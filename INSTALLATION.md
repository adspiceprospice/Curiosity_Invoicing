# Installation and Setup Guide for Curiosity Invoicing

This guide will walk you through the process of setting up and running the Curiosity Invoicing application.

## Prerequisites

Before you begin, make sure you have the following installed on your system:

- **Node.js** (v18 or higher)
- **npm** (v7 or higher)
- **PostgreSQL** (v14 or higher)
- A **Google Cloud Platform** account (for Google Drive and Gemini API)
- A **Resend** account (for email functionality)

## Step 1: Clone the Repository

```bash
git clone https://github.com/adspiceprospice/Curiosity_Invoicing.git
cd Curiosity_Invoicing
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up the Database

1. Create a PostgreSQL database for the application:

```sql
CREATE DATABASE curiosity_invoicing;
```

2. Update the `.env` file with your database connection details:

```bash
cp .env.example .env.local
```

Edit the `.env.local` file and update the `DATABASE_URL` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/curiosity_invoicing"
```

3. Run Prisma migrations to set up the database schema:

```bash
npm run prisma:migrate
```

## Step 4: Set Up Authentication

1. Configure NextAuth.js by generating a secret:

```bash
openssl rand -base64 32
```

2. Add the generated secret to your `.env.local` file:

```
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
```

## Step 5: Set Up Google OAuth and Drive Integration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the following APIs:
   - Google Drive API
   - People API (for OAuth)
4. Configure OAuth consent screen:
   - Set user type to "External"
   - Add scopes for Google Drive and user profile
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add your Google credentials to `.env.local`:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 6: Set Up Google Gemini

1. Go to the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. Add the API key to your `.env.local` file:

```
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

## Step 7: Set Up Resend for Email

1. Create an account on [Resend](https://resend.com/)
2. Get your API key
3. Add it to your `.env.local` file:

```
RESEND_API_KEY=your-resend-api-key
RESEND_DOMAIN=your-domain.com  # Optional, defaults to resend.dev
```

## Step 8: Run the Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Step 9: Initial Setup

1. Sign in using Google Authentication
2. You'll be redirected to the company setup page
3. Enter your company details
4. Create templates for offers and invoices in both English and Dutch
5. Start adding customers, offers, and invoices

## Production Deployment

For production deployment, use the following steps:

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

### Deployment Options

- **Vercel**: Easy integration with Next.js
- **Netlify**: Good option with simple setup
- **Custom Server**: Use a VPS with Node.js and PostgreSQL

### Environment Considerations

For production, make sure to:

1. Use a production PostgreSQL database
2. Set proper OAuth redirect URIs for your production domain
3. Configure proper CORS settings
4. Set up proper security headers
5. Use environment variables for all sensitive information

## Troubleshooting

### Common Issues

- **Database Connection**: Check PostgreSQL credentials and ensure the server is running
- **Google Authentication**: Verify credentials and redirect URIs
- **PDF Generation**: Check font availability and rendering issues
- **Gemini API**: Ensure the API key is valid and has proper permissions

For more detailed troubleshooting, check the application logs or open an issue on GitHub.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Gemini Documentation](https://ai.google.dev/docs)
- [Resend Documentation](https://resend.com/docs)
- [React PDF Documentation](https://react-pdf.org/components)

## Application Structure

The project follows a standard Next.js structure with some additional organization for features:

```
Curiosity_Invoicing/
├── components/           # React components
│   ├── documents/        # Document-related components
│   ├── customers/        # Customer-related components
│   └── layouts/          # Layout components
├── lib/                  # Utility functions and services
│   ├── prisma.ts         # Prisma client initialization
│   ├── gemini.ts         # Google Gemini service
│   ├── google-drive.ts   # Google Drive integration
│   ├── email.ts          # Email service with Resend
│   └── translations.ts   # Multilingual support
├── pages/                # Next.js pages
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── ai/           # AI-related endpoints
│   └── dashboard/        # Dashboard pages
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── styles/               # Global styles
```

## Key Features Implementation

### Multilingual Support

The application supports multiple languages through the `translations.ts` utility. To add a new language:

1. Add a new translation object in `lib/translations.ts`
2. Update the language selector in the UI
3. Create templates for the new language

### AI Integration with Gemini

The AI assistant uses Google Gemini 2.5 Pro for natural language interaction and function calling:

1. Chat functionality in `pages/dashboard/ai-assistant.tsx`
2. API endpoint for chat in `pages/api/ai/chat.ts`
3. Function calling for workflows in `pages/api/ai/function.ts`

### Document Generation

PDF documents are generated using React PDF:

1. Template components in `components/documents/`
2. PDF generation in `components/documents/DocumentPDF.tsx`
3. Language-specific formatting for dates, currency, etc.

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.