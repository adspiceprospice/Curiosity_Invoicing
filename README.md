# Curiosity Invoicing

A modern, secure, and user-friendly web application for creating, managing, sending, and storing sales offers and invoices in multiple languages. The application integrates with Google Drive for document storage, Resend for email delivery, and Google Gemini 2.5 Pro for AI-assisted template editing and workflow automation.

![Curiosity Invoicing](https://i.imgur.com/xBk7rZY.png) <!-- This is a placeholder - replace with actual screenshot -->

## Key Features

### Document Management
- ✅ Create sales offers and invoices in multiple languages (English, Dutch)
- ✅ Convert offers to invoices with one click
- ✅ Track document status (Draft, Sent, Accepted, Paid, etc.)
- ✅ Generate professional PDF documents
- ✅ AI-assisted document editing

### Template Management
- ✅ Customizable templates for different document types and languages
- ✅ User-friendly editor for template customization
- ✅ AI-assisted template editing

### Customer Management
- ✅ Store and manage customer information
- ✅ Track customer history and preferences
- ✅ Set preferred language per customer

### Integrations
- ✅ Google Drive for document storage
- ✅ Resend for email delivery
- ✅ Google Gemini 2.5 Pro for AI assistance

### AI-Powered Features
- 🤖 Natural language interface for creating documents
- 🤖 AI-assisted template editing
- 🤖 Function calling for automated workflows
- 🤖 Multi-step processes with user approval
- 🤖 Multilingual support in AI interactions

## Technology Stack

- **Frontend**: React with TypeScript (Next.js)
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **PDF Generation**: @react-pdf/renderer
- **Styling**: TailwindCSS
- **AI**: Google Gemini 2.5 Pro
- **Email**: Resend
- **Storage**: Google Drive API

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Cloud account (for Drive API and Gemini API)
- Resend account

### Quick Installation

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

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md).

## AI Capabilities

The Gemini integration enables:

1. **Conversational Document Creation**
   - "Create a new offer for Acme Corp for website development services"
   - "Draft an invoice for the social media management project"

2. **Multilingual Support**
   - "Create a Dutch version of my latest invoice"
   - "Translate this offer to English"

3. **Workflow Automation**
   - "Find all unpaid invoices and draft reminder emails"
   - "Convert all accepted offers from last month to invoices"

4. **Content Editing**
   - "Add a 10% discount to all line items in this offer"
   - "Update the payment terms to Net 30 in all my invoice templates"

5. **Document Summarization**
   - "Show me a summary of all invoices sent this quarter"
   - "What's the total value of pending offers?"

## Screenshots

<!-- Replace with actual screenshots -->
![Dashboard](https://i.imgur.com/jKbFQsF.png)
![AI Assistant](https://i.imgur.com/xY5fPtQ.png)
![Document Editor](https://i.imgur.com/uNf2KdL.png)
![PDF Preview](https://i.imgur.com/rWfB9X4.png)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini for AI capabilities
- Next.js and Vercel for the amazing framework
- TailwindCSS for styling
- Prisma for database access
- React PDF for document generation