"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  username: {
    type: String,
    required: true,
    unique: true
  },
  exercises: [{
    _id: mongoose.Types.ObjectId,
    description: String,
    duration: Number,
    date: {
      type: Date,
      default: Date.now
    },
  }]
  // exercises: [{ 
  //   type: Schema.Types.ObjectId, 
  //   ref: 'Exercise' 
  // }]
});

module.exports = mongoose.model('User', userSchema);