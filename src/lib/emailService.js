// src/lib/emailService.js - For future email integration
// This is a template for when you want to implement actual email sending

import nodemailer from 'nodemailer'

export class EmailService {
  static async sendPasswordResetEmail(email, resetToken, userName) {
    // TODO: Configure your email service (Gmail, SendGrid, etc.)
    const transporter = nodemailer.createTransporter({
      // Example for Gmail:
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
      
      // Example for SendGrid:
      // host: 'smtp.sendgrid.net',
      // port: 587,
      // auth: {
      //   user: 'apikey',
      //   pass: process.env.SENDGRID_API_KEY
      // }
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@irpa-system.com',
      to: email,
      subject: 'Password Reset - IRPA Security System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3cd; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ IRPA Security System</h1>
              <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
              <p>Hello ${userName},</p>
              
              <p>We received a request to reset your password for your IRPA Security System account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                  <li>This link will expire in 15 minutes for your security</li>
                  <li>If you did not request this password reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                  <li>If you continue to receive these emails, contact your system administrator</li>
                </ul>
              </div>
              
              <p>If you're having trouble clicking the button, you can also visit the forgot password page and enter this reset code manually:</p>
              <p style="font-family: monospace; background: #374151; color: #f3f4f6; padding: 10px; border-radius: 5px; text-align: center; font-size: 18px; letter-spacing: 2px;">${resetToken}</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from the IRPA Security System.</p>
              <p>© ${new Date().getFullYear()} Smile 4 Life Security. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Password reset email sent successfully:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      throw new Error('Failed to send email')
    }
  }

  // Test email configuration
  static async testEmailConfig() {
    try {
      const transporter = nodemailer.createTransporter({
        // Your email config here
      })
      
      await transporter.verify()
      console.log('Email configuration is valid')
      return true
    } catch (error) {
      console.error('Email configuration error:', error)
      return false
    }
  }
}