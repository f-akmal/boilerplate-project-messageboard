const mongoose = require('mongoose')
const mongodb = require('mongodb')

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true, select: false },
  thread_id: { type: mongodb.ObjectID, required: true },
  created_on: { type: Date, default: new Date(), index: true},
  reported: { type: Boolean, default: false, select: false }
})

module.exports = mongoose.model('reply', replySchema)