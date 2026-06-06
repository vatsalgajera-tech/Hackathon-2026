const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Name is required'], trim: true },
  email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'] },
  role: {
    type: String,
    enum: ['admin', 'procurement_officer', 'manager', 'vendor'],
    default: 'procurement_officer',
  },
  vendorId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  isActive:           { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// ── Mongoose v9: async pre hooks do NOT receive `next` ─────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
