// const mongoose = require('mongoose');
// const otpSchema = new mongoose.Schema({
//   email:    { type: String, required: true, lowercase: true, trim: true },
//   otp:      { type: String, required: true },
//   type:     { type: String, enum: ['register','login'], required: true },
//   tempData: { name: String, phone: String, password: String },
//   attempts: { type: Number, default: 0 },
//   expiresAt:{ type: Date, required: true, default: () => new Date(Date.now() + 10*60*1000) },
// }, { timestamps: true });
// otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete
// otpSchema.index({ email: 1, type: 1 });
// module.exports = mongoose.model('OTP', otpSchema);



const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    otp: {
      type: String,
      required: true
    },

    type: {
      type: String,
      // Includes admin-login for separate 2FA flow
      enum: ['register', 'login', 'forgot-password', 'admin-login'],
      required: true
    },

    tempData: {
      name: String,
      phone: String,
      password: String
    },

    attempts: {
      type: Number,
      default: 0
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000)
    },

    // Used after the forgot-password OTP has been verified.
    // The raw reset token is never stored in the database.
    resetTokenHash: {
      type: String,
      default: null
    },

    resetTokenExpire: {
      type: Date,
      default: null
    },

    resetVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Automatically remove expired OTP records.
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

otpSchema.index({
  email: 1,
  type: 1
});

module.exports = mongoose.model('OTP', otpSchema);