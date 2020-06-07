const mongoose = require('mongoose')

const ObjectId = mongoose.Schema.Types.ObjectId

const threadSchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true, select: false },
  created_on: { type: Date, default: new Date() },
  bumped_on: { type: Date, default: new Date(), index: true },
  reported: { type: Boolean, default: false, select: false },
  replies: { type: [ObjectId], default: [] }
})

module.exports = threadSchema