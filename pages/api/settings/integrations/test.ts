import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDriveClient } from '@/lib/google-drive';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get the user
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email as string },
    include: { company: true },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Only admins can test integrations
  if (!user.company) {
    return res.status(403).json({ message: 'Company profile required' });
  }

  // Only POST method is allowed for testing
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Determine which integration to test
  const { integration } = req.body;

  if (!integration) {
    return res.status(400).json({ message: 'Integration name is required' });
  }

  switch (integration) {
    case 'resend':
      return testResendIntegration(req, res, user);
    case 'google-drive':
      return testGoogleDriveIntegration(req, res);
    case 'gemini':
      return testGeminiIntegration(req, res);
    default:
      return res.status(400).json({ message: 'Invalid integration name' });
  }
}

// Test Resend email integration
async function testResendIntegration(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get settings from database
    const fromNameSetting = await prisma.setting.findUnique({
      where: { key: 'resend.fromName' },
    });
    
    const domainSetting = await prisma.setting.findUnique({
      where: { key: 'resend.domain' },
    });

    const fromName = fromNameSetting?.value || user.company.name;
    const domain = domainSetting?.value || 'resend.dev';
    
    // Send a test email
    const { data, error } = await resend.emails.send({
      from: `${fromName} <test@${domain}>`,
      to: user.email as string,
      subject: 'Test Email from Curiosity Invoicing',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Integration Test</h2>
          <p>This is a test email sent from your Curiosity Invoicing application.</p>
          <p>If you're receiving this email, it means your Resend email integration is working correctly!</p>
          <p>Best regards,<br>Curiosity Invoicing</p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully!',
      details: `Email sent to ${user.email}`
    });
  } catch (error) {
    console.error('Error testing Resend integration:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Google Drive integration
async function testGoogleDriveIntegration(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get Google Drive client
    const drive = await getDriveClient(req);
    
    // Test getting the user's drive info
    const about = await drive.about.get({
      fields: 'user, storageQuota',
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Google Drive integration is working correctly!',
      details: {
        user: about.data.user,
        quota: about.data.storageQuota,
      }
    });
  } catch (error) {
    console.error('Error testing Google Drive integration:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to Google Drive',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Gemini AI integration
async function testGeminiIntegration(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);
    
    // Create a model instance
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
    });

    // Generate a simple response
    const result = await model.generateContent('Say "Hello from Gemini AI!" if you can read this message.');
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
      success: true, 
      message: 'Google Gemini AI integration is working correctly!',
      details: { response: text }
    });
  } catch (error) {
    console.error('Error testing Gemini integration:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to Google Gemini AI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}