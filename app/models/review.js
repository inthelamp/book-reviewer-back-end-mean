const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * Review statuses
 * @enum {string}
 */
const Statuses = {
	DRAFT: "Draft",
	PUBLISHED: "Published",    
	INACTIVE: "Inactive"
};

const imageSchema = new Schema(
  { 
    // _id: { type: mongoose.Schema.Types.ObjectId, select: false },
    id: { type: String, unique: true, required: true },
    fileName: { type: String, required: true },
    mimetype: { type: String, required: true },
    description: { type: String },
    size: { type: Number, required: true },
    bytes: { type: Buffer, required: true },
  },
  { timestamps: true }
);

const feedbackSchema = new Schema(
  { 
    id: { type: String, unique: true, required: true },
    comment: { type: String, required: true },
    userId: { type: String } 
  },
  { timestamps: true }  
);

// Review schema
const reviewSchema = new Schema(
  {
    id: { type: String, unique: true, required: true },
    userId: { type: String, index: true, required: true },
    subject: { type: String, required: true },    
    bookTitle: { type: String },
    bookAuthors: { type: [String], default: undefined },
    isbn: { type: String },
    bookCover: { type: imageSchema, default: undefined },
    bookImages : { type: [imageSchema], default: undefined },
    content: { type: String, required: true },
    feedbacks: { type: [feedbackSchema], default: undefined },
    status: {
      type: String,
      default: Statuses.DRAFT,
      enum: Statuses,
      required: true
    }     
  },
  { timestamps: true }
);

const Model = mongoose.model("review", reviewSchema);

module.exports = { Statuses, Model };