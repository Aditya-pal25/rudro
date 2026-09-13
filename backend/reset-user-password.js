require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    const email = 'adityapal116@gmail.com';
    const newPassword = 'Test@123456';

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

   const hashedPassword = await bcrypt.hash(newPassword, 12);

await User.updateOne(
  { _id: user._id },
  { $set: { password: hashedPassword } },
  { runValidators: false }
);

    console.log('Password reset successfully');
    console.log(`User: ${email}`);
    console.log('New password: Test@123456');

    process.exit(0);
  } catch (error) {
    console.error('Password reset failed:', error);
    process.exit(1);
  }
}

resetPassword();