/*
*
*
*       FILL IN EACH UNIT TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]----
*       (if additional are added, keep them at the very end!)
*/

const chai = require('chai')
const assert = chai.assert
const mongodb = require('mongodb')
const mongoose = require('mongoose')

const Reply = require('../models/reply')
const threadSchema = require('../models/thread')

const Thread = mongoose.model('general', threadSchema, 'general')

suite('Unit Tests', () => {
  suite('Reply unit tests', () => {
    test('Properties saved _id, text, created_on, delete_password & reported', () => {
      const formData = {
        text: 'Hello World',
        delete_password: 'delete',
        thread_id: new mongodb.ObjectID()
      }
      const reply = new Reply(formData)
      assert.exists(reply._id)
      assert.equal(reply.text, formData.text)
      assert.exists(reply.created_on)
      assert.equal(reply.delete_password, formData.delete_password)
      assert.equal(reply.reported, false)
      assert.equal(reply.thread_id, formData.thread_id)
    })
  })
  suite('Thread unit tests', () => {
    test('Properties saved _id, text, created_on, bumped_on, reported, delete_password, replies', () => {
      const formData = { text: 'Hello World', delete_password: 'delete' }
      const thread = new Thread(formData)
      assert.exists(thread._id)
      assert.equal(thread.text, formData.text)
      assert.deepEqual(thread.created_on, thread.bumped_on)
      assert.equal(thread.reported, false)
      assert.equal(thread.delete_password, formData.delete_password)
      assert.isArray(thread.replies)
    })
  })
})