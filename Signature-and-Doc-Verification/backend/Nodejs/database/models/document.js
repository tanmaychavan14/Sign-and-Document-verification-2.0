// backend/models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  documentType: {
    type: String,
    default: 'Unknown'
  },
  extractedText: {
    type: String
  },
  structuredData: {
    type: Object
  }
}, {
  timestamps: true
});

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;