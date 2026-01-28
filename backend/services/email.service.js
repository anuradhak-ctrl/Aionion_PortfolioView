import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service
 * Handles SMTP email sending for client notifications
 */

class EmailService {
    constructor() {
        // Configure SMTP transport (using placeholder values for now)
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'your-email@example.com',
                pass: process.env.SMTP_PASS || 'your-password'
            }
        });

        this.fromEmail = process.env.SMTP_FROM || 'noreply@portfolioview.com';
    }

    /**
     * Send MF report email to client
     */
    async sendMFReportEmail(clientEmail, clientName, reportData) {
        try {
            const htmlContent = this.generateMFReportHTML(clientName, reportData);

            const mailOptions = {
                from: this.fromEmail,
                to: clientEmail,
                subject: 'Your Mutual Fund Portfolio Report',
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ MF Report email sent:', info.messageId);
            return {
                success: true,
                messageId: info.messageId,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send MF report email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Send Bond report email to client
     */
    async sendBondReportEmail(clientEmail, clientName, reportData) {
        try {
            const htmlContent = this.generateBondReportHTML(clientName, reportData);

            const mailOptions = {
                from: this.fromEmail,
                to: clientEmail,
                subject: 'Your Bond Portfolio Report',
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Bond Report email sent:', info.messageId);
            return {
                success: true,
                messageId: info.messageId,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send Bond report email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Send combined MF and Bond report email
     */
    async sendCombinedReportEmail(clientEmail, clientName, mfData, bondData) {
        try {
            const htmlContent = this.generateCombinedReportHTML(clientName, mfData, bondData);

            const mailOptions = {
                from: this.fromEmail,
                to: clientEmail,
                subject: 'Your Portfolio Report - MF & Bonds',
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Combined Report email sent:', info.messageId);
            return {
                success: true,
                messageId: info.messageId,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send combined report email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Generate HTML content for MF report
     */
    generateMFReportHTML(clientName, reportData) {
        const totalValue = reportData.reduce((sum, item) => sum + (parseFloat(item.current_value) || 0), 0);
        const totalInvested = reportData.reduce((sum, item) => sum + (parseFloat(item.invested_amount) || 0), 0);
        const totalPL = totalValue - totalInvested;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .summary { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .summary-item { display: inline-block; margin: 10px 20px; }
          .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; color: #667eea; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #667eea; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f5f5f5; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mutual Fund Portfolio Report</h1>
            <p>Dear ${clientName},</p>
            <p>Here is your latest Mutual Fund portfolio summary</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Invested</div>
              <div class="summary-value">₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Current Value</div>
              <div class="summary-value">₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total P&L</div>
              <div class="summary-value ${totalPL >= 0 ? 'positive' : 'negative'}">
                ₹${totalPL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Folio No</th>
                <th>Units</th>
                <th>Current Value</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(item => `
                <tr>
                  <td>${item.scheme_name || '-'}</td>
                  <td>${item.folio_no || '-'}</td>
                  <td>${parseFloat(item.units || 0).toFixed(4)}</td>
                  <td>₹${parseFloat(item.current_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  <td class="${parseFloat(item.unrealized_pl || 0) >= 0 ? 'positive' : 'negative'}">
                    ₹${parseFloat(item.unrealized_pl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Portfolio View. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Generate HTML content for Bond report
     */
    generateBondReportHTML(clientName, reportData) {
        const totalInvested = reportData.reduce((sum, item) => sum + (parseFloat(item.invested_principal_amount) || 0), 0);

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .summary { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .summary-item { display: inline-block; margin: 10px 20px; }
          .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; color: #f5576c; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          th { background: #f5576c; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f5f5f5; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bond Portfolio Report</h1>
            <p>Dear ${clientName},</p>
            <p>Here is your latest Bond portfolio summary</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Invested</div>
              <div class="summary-value">₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Holdings</div>
              <div class="summary-value">${reportData.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Bond Name</th>
                <th>ISIN</th>
                <th>Invested Amount</th>
                <th>Coupon Rate</th>
                <th>Maturity Date</th>
                <th>YTM %</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(item => `
                <tr>
                  <td>${item.bond_name || '-'}</td>
                  <td>${item.isin || '-'}</td>
                  <td>₹${parseFloat(item.invested_principal_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  <td>${parseFloat(item.coupon_rate || 0).toFixed(2)}%</td>
                  <td>${item.maturity_date ? new Date(item.maturity_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td>${parseFloat(item.ytm_percent || 0).toFixed(2)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Portfolio View. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Generate HTML content for combined report
     */
    generateCombinedReportHTML(clientName, mfData, bondData) {
        // Calculate MF totals
        const mfTotalValue = mfData.reduce((sum, item) => sum + (parseFloat(item.current_value) || 0), 0);
        const mfTotalInvested = mfData.reduce((sum, item) => sum + (parseFloat(item.invested_amount) || 0), 0);

        // Calculate Bond totals
        const bondTotalInvested = bondData.reduce((sum, item) => sum + (parseFloat(item.invested_principal_amount) || 0), 0);

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .section-title { font-size: 20px; font-weight: bold; margin: 30px 0 15px; color: #667eea; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          th { background: #667eea; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f5f5f5; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Portfolio Report</h1>
            <p>Dear ${clientName},</p>
            <p>Here is your complete portfolio summary</p>
          </div>

          <div class="section-title">📊 Mutual Funds (${mfData.length} holdings)</div>
          <p><strong>Total Invested:</strong> ₹${mfTotalInvested.toLocaleString('en-IN')} | <strong>Current Value:</strong> ₹${mfTotalValue.toLocaleString('en-IN')}</p>

          <div class="section-title">🏦 Bonds (${bondData.length} holdings)</div>
          <p><strong>Total Invested:</strong> ₹${bondTotalInvested.toLocaleString('en-IN')}</p>

          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Portfolio View. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ SMTP server is ready to send emails');
            return true;
        } catch (error) {
            console.error('❌ SMTP server connection failed:', error);
            return false;
        }
    }
}

export default new EmailService();
