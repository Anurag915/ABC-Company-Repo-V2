const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const letterSchema = new mongoose.Schema({
  letterLanguage: String,
  letterCommunBy: String,
  docketDate: Date,
  category: String,
  letterNo: String,
  letterDate: Date,
  establishment: String,
  letterSub: String,
  fileName: String,
  fileExt: String,
  letterUploadDate: { type: Date, default: Date.now },
  status: { type: Number, default: 0 },
  docketNo: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Add auto-increment plugin for letterId
letterSchema.plugin(AutoIncrement, { inc_field: 'letterId' });

module.exports = mongoose.model("Letter", letterSchema);
