const mongoose = require('mongoose')

const JobSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: [true, 'Please provide uuid name'],
      maxlength: 50,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('UUID', JobSchema)