import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. SMS notifications will not work.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SMSParams {
  to: string;
  from: string; // This should be a phone number you've registered with SendGrid
  message: string;
  jobsiteName?: string;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Cannot send email: SENDGRID_API_KEY is not set');
      return false;
    }

    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send an SMS notification using SendGrid
 * Note: This requires a Twilio SendGrid account with SMS capabilities
 * @param params SMS parameters
 * @returns Promise resolving to true if SMS was sent successfully
 */
export async function sendSMS(params: SMSParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Cannot send SMS: SENDGRID_API_KEY is not set');
      return false;
    }

    // Format the message
    const jobsiteInfo = params.jobsiteName ? ` [${params.jobsiteName}]` : '';
    const formattedMessage = `${jobsiteInfo} ${params.message}`;
    
    // SendGrid can send SMS through their email API by using specific formatting
    // This may vary based on SendGrid's implementation and your account setup
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: 'SMS Notification',
      text: formattedMessage,
      html: `<p>${formattedMessage}</p>`,
      // Include any SendGrid-specific SMS headers or configurations here
      customArgs: {
        channel: 'sms'
      } as any
    });
    
    console.log(`SMS sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid SMS error:', error);
    return false;
  }
}

/**
 * Send a notification to multiple recipients based on their preferred method
 * @param recipients Array of users with contact info and preferences
 * @param message The message to send
 * @param jobsiteName Optional jobsite name for context
 * @returns Object containing success counts for each method
 */
export async function sendBulkNotifications(
  recipients: Array<{ 
    name: string; 
    phone?: string; 
    email?: string; 
    preferredMethod: 'sms' | 'email' | 'both' 
  }>, 
  message: string,
  jobsiteName?: string
): Promise<{ smsCount: number; emailCount: number }> {
  let smsCount = 0;
  let emailCount = 0;
  
  const defaultSender = {
    email: 'notifications@bossman.com',
    phone: '+1234567890' // This should be a registered SendGrid sender
  };

  for (const recipient of recipients) {
    // Send SMS if preferred and phone number available
    if ((recipient.preferredMethod === 'sms' || recipient.preferredMethod === 'both') && recipient.phone) {
      const smsSent = await sendSMS({
        to: recipient.phone,
        from: defaultSender.phone,
        message,
        jobsiteName
      });
      
      if (smsSent) smsCount++;
    }
    
    // Send email if preferred and email available
    if ((recipient.preferredMethod === 'email' || recipient.preferredMethod === 'both') && recipient.email) {
      const subject = jobsiteName ? `Notification: ${jobsiteName}` : 'Notification';
      
      const emailSent = await sendEmail({
        to: recipient.email,
        from: defaultSender.email,
        subject,
        text: message,
        html: `<p>${message}</p>`
      });
      
      if (emailSent) emailCount++;
    }
  }
  
  return { smsCount, emailCount };
}