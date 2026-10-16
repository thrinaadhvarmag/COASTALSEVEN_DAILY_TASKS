/**
 * Rebel Mart 100% Free Email Dispatcher (Google Apps Script)
 * 
 * Instructions:
 * 1. Go to https://script.google.com and click "New project"
 * 2. Delete whatever is in Code.gs and paste this entire code
 * 3. Click "Deploy" (top right) -> "New deployment"
 * 4. Select type: "Web app" (click the gear icon next to Select type)
 * 5. Description: "Rebel Mart Email Dispatcher"
 *    Execute as: "Me (your email)"
 *    Who has access: "Anyone"   <-- VERY IMPORTANT!
 * 6. Click "Deploy"
 * 7. Click "Authorize access", choose your Google account, click "Advanced" -> "Go to Untitled project (unsafe)", and click "Allow"
 * 8. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/AKfycb.../exec)
 * 9. Paste that URL into Render Environment Variables as:
 *    GMAIL_WEBHOOK_URL = <your web app url>
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.to;
    var subject = data.subject || "Rebel Mart Notification";
    var html = data.html || "";
    var text = data.text || "";

    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: html,
      body: text,
      name: "Rebel Mart"
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      recipient: to,
      message: "Email dispatched successfully via Google MailApp"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Rebel Mart Email Webhook",
    ready: true,
    message: "Google Apps Script Webhook is active and ready to receive POST email requests!"
  })).setMimeType(ContentService.MimeType.JSON);
}
