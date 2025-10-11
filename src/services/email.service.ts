import { apiClient } from '../utils/axios.utils';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface SessionDetails {
  mentorName: string;
  userName: string;
  date: string;
  time: string;
  duration: string;
  joinUrl: string;
  sessionType: 'chat' | 'audio' | 'video' | 'group';
  amount?: number;
}

/**
 * Email Service for sending emails through the API
 */
export class EmailService {
  private static API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/1.0';

  /**
   * Send a confirmation email with join button
   * @param userEmail User's email address
   * @param sessionDetails Session details including join URL
   * @returns Promise with the API response
   */
  static async sendSessionConfirmation(userEmail: string, sessionDetails: SessionDetails): Promise<any> {
    try {
      const emailHtml = this.generateSessionConfirmationEmail(sessionDetails);
      
      const response = await apiClient.post('/send-email', {
        to: userEmail,
        subject: `Your ${sessionDetails.sessionType.toUpperCase()} Session is Confirmed!`,
        html: emailHtml
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for session confirmation email
   * @param sessionDetails Session details
   * @returns HTML string for the email
   */
  private static generateSessionConfirmationEmail(sessionDetails: SessionDetails): string {
    const { mentorName, userName, date, time, duration, joinUrl, sessionType, amount } = sessionDetails;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Session Confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 30px auto;
              background: #fff;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #4caf50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              margin: 20px 0;
              color: #333;
            }
            .thankyou {
              background: #fff7f8;
              border: 1px solid #ffd6db;
              color: #d86570;
              padding: 12px;
              border-radius: 6px;
            }
            .invoice {
              border-top: 1px dashed #ddd;
              margin-top: 20px;
              padding-top: 15px;
            }
            .invoice-row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
            }
            .invoice-total {
              font-weight: bold;
            }
            .join-button {
              display: block;
              width: fit-content;
              margin: 20px auto;
              padding: 15px 25px;
              background-color: #4caf50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .session-details {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .session-type {
              text-transform: uppercase;
              font-weight: bold;
              color: #4caf50;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #999;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${sessionType.toUpperCase()} Session Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p><strong>Your ${sessionType} session with ${mentorName} has been confirmed!</strong></p>
              
              <div class="session-details">
                <p>🗓 <strong>Date:</strong> ${date}</p>
                <p>⏰ <strong>Time:</strong> ${time}</p>
                <p>⏳ <strong>Duration:</strong> ${duration}</p>
                <p>🎯 <strong>Session Type:</strong> <span class="session-type">${sessionType}</span></p>
              </div>
              
              ${amount ? `
              <div class="invoice">
                <div class="invoice-row"><span>Session Charge</span><span>₹${amount.toFixed(2)}</span></div>
                <div class="invoice-row invoice-total"><span>Total Paid</span><span>₹${amount.toFixed(2)}</span></div>
              </div>
              ` : ''}
              
              <p>Please join 5 minutes before your scheduled time. Being late may reduce your available session time.</p>
              
              <a href="${joinUrl}" class="join-button">👉 Join Session</a>
              
              <div class="thankyou">
                🌸 Thank you for choosing AlterBuddy. We’re grateful to support your healing journey and can’t wait to connect you with your mentor. 🌸
              </div>
              
              <p style="margin-top: 16px;">If you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
              <p>©️ 2025 AlterBuddy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}