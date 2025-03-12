// backend/database/models/Signature.js
const mongoose = require('mongoose');

const SignatureSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  isReference: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: 'Reference signature'
  }
}, {
  timestamps: true
});

const Signature = mongoose.model('Signature', SignatureSchema);

module.exports = Signature;