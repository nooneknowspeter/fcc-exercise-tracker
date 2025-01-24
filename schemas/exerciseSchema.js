const mongoose = require("mongoose");

const { Schema } = mongoose;

module.exports = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});

