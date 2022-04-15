const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  gender: { type: String },
  profileImg: { type: String, default: '/images/default-user-image.png' },
  isAdmin: { type: Boolean, required: true, default: true },
  isModerator: { type: Boolean, required: true, default: false },
  friends: { type: [{ name: String, image: String, id: String }], default: [] },
  friendRequests: { type: [{ name: String, id: String }], default: [] },
  sentRequests: { type: [{ name: String, id: String }], default: [] }
}, {
  timestamps: true,
});

userSchema.methods.hashPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

module.exports = mongoose.model('User', userSchema);
