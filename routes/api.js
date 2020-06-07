/*
*
*
*       Complete the API routing below
*
*
*/

'use strict'

const expect = require('chai').expect
const mongoose = require('mongoose')
const threadSchema = require('../models/thread')
const Reply = require('../models/reply')

const ObjectId = mongoose.Types.ObjectId

module.exports = function (app) {

  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { board } = req.params
      const Thread = mongoose.model(board, threadSchema, board)
      const thread = new Thread(req.body)
      await thread.save()
      res.redirect(`/b/${board}`)
    })
    .get(async (req, res) => {
      const { board } = req.params
      const Thread = mongoose.model(board, threadSchema, board)
      const threads = await Thread.find({}).limit(10)
      await Promise.all(threads.map(async thread => {
        await thread.populate({
          path: 'replies',
          model: 'reply',
          options: { perDocumentLimit: 3, sort: '-created_on' }
        }).execPopulate()
      }))
      res.json(threads)
    })
    .delete(async (req, res) => {
      const { board } = req.params
      const Thread = mongoose.model(board, threadSchema, board)
      const { thread_id, delete_password } = req.body
      const thread = await Thread.findById(thread_id).select('+delete_password')
      if (thread === null) return res.send('incorrect password')
      if (thread.delete_password !== delete_password) {
        return res.send('incorrect password')
      }
      await thread.remove()
      res.send('success')
    })
    .put(async (req, res) => {
      const { board } = req.params
      const Thread = mongoose.model(board, threadSchema, board)
      const { thread_id } = req.body
      const thread = await Thread.findById(thread_id).select('+reported')
      if (thread === null) return res.send('incorrect id')
      thread.reported = true
      thread.bumped_on = new Date()
      await thread.save()
      res.send('success')
    })

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { board } = req.params
      const Thread = mongoose.model(board, threadSchema, board)
      const { thread_id } = req.body
      const reply = new Reply(req.body)
      const doc = await reply.save()
      const thread = await Thread.findById(thread_id)
      thread.replies.push(doc._id)
      thread.bumped_on = new Date()
      await thread.save()
      res.redirect(`/b/${board}/${thread_id}`)
    })
    .get(async (req, res) => {
      const { board } = req.params
      const { thread_id } = req.query
      const Thread = mongoose.model(board, threadSchema, board)
      const thread = await Thread.findById(thread_id)
      await thread.populate({
        path: 'replies',
        model: 'reply',
        options: { sort: '-created_on' }
      }).execPopulate()
      res.json(thread.toJSON())
    })
    .delete(async (req, res) => {
      const { board } = req.params
      const { thread_id, reply_id, delete_password } = req.body
      const Thread = mongoose.model(board, threadSchema, board)
      const reply = await Reply.findOne({ _id: reply_id, thread_id })
        .select('+delete_password')
      if (reply === null) return res.send('incorrect password')
      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password')
      }
      const thread = await Thread.findById(thread_id)
      thread.bumped_on = new Date()
      reply.text = '[deleted]'
      await Promise.all([reply.save(), thread.save()])
      res.send('success')
    })
    .put(async (req, res) => {
      const { board } = req.params
      const { thread_id, reply_id } = req.body
      const Thread = mongoose.model(board, threadSchema, board)
      const thread = await Thread.findById(thread_id)
      if (thread === null) return res.send('incorrect thread id')
      const reply = await Reply.findOne({ _id: reply_id, thread_id })
        .select('reported')
        if (reply === null) return res.send('incorrect reply id')
      thread.bumped_on = new Date()
      reply.reported = true
      await Promise.all([thread.save(), reply.save()])
      res.send('success')
    })
}
