const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const isPlaceholder = emailUser === 'your-email@gmail.com' || emailPass === 'your_gmail_app_password';
  if (!emailUser || !emailPass || isPlaceholder) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev mode fallback: log OTP to terminal console instead of crashing
      return {
        sendMail: async (opts) => {
          console.log(`\n========================================\n📧 [DEV EMAIL OTP] To: ${opts.to}\nSubject: ${opts.subject}\nText: ${opts.text}\n========================================\n`);
          return true;
        },
      };
    }
    throw new Error('EMAIL_USER or EMAIL_PASS is missing from .env');
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter;
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>

<body style="margin:0;padding:0;background:#050505;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0"
  style="background:#050505;padding:40px 20px;">

  <tr>
    <td align="center">

      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#0d0d0d;border:1px solid #202020;">

        <!-- HEADER -->
        <tr>
          <td style="background:#E8351A;padding:24px 40px;text-align:center;">

            <h1 style="
              margin:0;
              font-size:32px;
              letter-spacing:4px;
              color:#fff;
              font-weight:700;
            ">
              RUDROHAM
            </h1>

            <p style="
              margin:4px 0 0;
              font-size:11px;
              color:rgba(255,255,255,0.8);
              letter-spacing:3px;
              text-transform:uppercase;
            ">
              Premium Streetwear
            </p>

          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="
            background:#050505;
            border-top:1px solid #161616;
            padding:16px 40px;
            text-align:center;
          ">

            <p style="
              margin:0;
              font-size:11px;
              color:#555;
            ">
              © 2026 RUDROHAM. All rights reserved.
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>

</table>

</body>
</html>
`;

const sendOTPEmail = async (email, otp, type, name = '') => {
  const tp = getTransporter();

  let subject;
  let bodyContent;

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  if (type === 'reset') {
    subject = `${otp} is your Rudroham password reset OTP`;

    bodyContent = `
      ${
        name
          ? `
          <p style="
            margin:0 0 8px;
            font-size:14px;
            color:#888;
          ">
            Hey ${name},
          </p>
          `
          : ''
      }

      <h2 style="
        margin:0 0 10px;
        font-size:22px;
        color:#F2EDE4;
      ">
        Password Reset
      </h2>

      <p style="
        margin:0 0 28px;
        font-size:14px;
        line-height:1.6;
        color:#888;
      ">
        We received a request to reset the password for your
        Rudroham account.
      </p>

      <!-- OTP BOX -->
      <div style="
        background:#161616;
        border:2px solid #E8351A;
        padding:24px;
        text-align:center;
        margin-bottom:24px;
      ">

        <p style="
          margin:0 0 8px;
          font-size:11px;
          color:#777;
          letter-spacing:3px;
          text-transform:uppercase;
        ">
          Password Reset OTP
        </p>

        <p style="
          margin:0;
          font-size:40px;
          font-weight:700;
          letter-spacing:14px;
          color:#E8351A;
          font-family:'Courier New',monospace;
        ">
          ${otp}
        </p>

      </div>

      <p style="
        margin:0 0 12px;
        font-size:12px;
        line-height:1.6;
        color:#888;
      ">
        This OTP is valid for
        <strong style="color:#F2EDE4;">
          10 minutes
        </strong>.
      </p>

      <p style="
        margin:0;
        font-size:12px;
        line-height:1.6;
        color:#666;
      ">
        Never share this OTP with anyone.
        Rudroham will never ask you for your OTP.
      </p>

      <div style="
        margin-top:28px;
        padding-top:20px;
        border-top:1px solid #222;
      ">

        <p style="
          margin:0;
          font-size:11px;
          line-height:1.6;
          color:#555;
        ">
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

      </div>
    `;
  }

  // ============================================================
  // REGISTRATION / LOGIN OTP
  // ============================================================

  else {
    const isRegister = type === 'register';

    subject = isRegister
      ? `${otp} is your Rudroham registration OTP`
      : `${otp} is your Rudroham login OTP`;

    bodyContent = `
      ${
        name
          ? `
          <p style="
            margin:0 0 8px;
            font-size:14px;
            color:#888;
          ">
            Hey ${name},
          </p>
          `
          : ''
      }

      <h2 style="
        margin:0 0 8px;
        font-size:22px;
        color:#F2EDE4;
      ">
        ${isRegister ? 'Verify Your Email' : 'Login OTP'}
      </h2>

      <p style="
        margin:0 0 28px;
        font-size:14px;
        color:#888;
      ">
        ${
          isRegister
            ? 'Complete your registration with this OTP.'
            : 'Use this OTP to log in securely.'
        }
      </p>

      <div style="
        background:#161616;
        border:2px solid #E8351A;
        padding:24px;
        text-align:center;
        margin-bottom:24px;
      ">

        <p style="
          margin:0 0 6px;
          font-size:11px;
          color:#777;
          letter-spacing:3px;
          text-transform:uppercase;
        ">
          One-Time Password
        </p>

        <p style="
          margin:0;
          font-size:40px;
          font-weight:700;
          letter-spacing:14px;
          color:#E8351A;
          font-family:'Courier New',monospace;
        ">
          ${otp}
        </p>

      </div>

      <p style="
        font-size:12px;
        color:#888;
      ">
        ⏱ Expires in
        <strong style="color:#F2EDE4;">
          10 minutes
        </strong>.
        Never share this OTP with anyone.
      </p>
    `;
  }

  // ============================================================
  // SEND EMAIL
  // ============================================================

  await tp.sendMail({
    from: `"RUDROHAM" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: emailTemplate(bodyContent),

    // Plain-text fallback
    text:
      type === 'reset'
        ? `Your Rudroham password reset OTP is: ${otp}. This OTP expires in 10 minutes. Never share this OTP with anyone.`
        : `Your Rudroham OTP is: ${otp}. This OTP expires in 10 minutes. Never share this OTP with anyone.`,
  });
};

module.exports = {
  generateOTP,
  sendOTPEmail,
};