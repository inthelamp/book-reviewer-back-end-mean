const { string } = require("joi");
const Joi = require("joi");

const { v4: uuid } = require("uuid");
const Review  = require("../models/review");

// Validating review data from client
const imageSchema = Joi.object({
  id: Joi.string().required(),
  fileName: Joi.string().required(),
  mimetype: Joi.string().required(),
  size: Joi.number().required(),
  description: Joi.string().optional(),
  bytes: Joi.binary().required(),
});

// Validating review data from client
const reviewSchema = Joi.object({
  id: Joi.string(),
  subject: Joi.string().required(),
  bookTitle: Joi.string(),
  bookAuthors: Joi.array().items(Joi.string()),       
  isbn: Joi.string(),
  bookCover: imageSchema.optional(),
  bookImages: Joi.array().items(imageSchema).optional(),
  content: Joi.string().required(), 
  feedbacks: Joi.object().optional(),
  status: Joi.string().valid('Draft', 'Published', 'Inactive').required(),
});

const deleteFile = (file) => {
  if (file) {
    var fs = require('fs');
    fs.access(file.path, (err) => {
      if (err) {
        console.log(err);
        return;
      }
  
      fs.unlink(file.path, (err) => {
        if (err) throw err;
        console.log(`${file.filename} was deleted.`);
      });
    });
  }
}

/**
 * Saving review
 * @returns {json} retrun a JSON object
 */
module.exports.Save = async (req, res) => {
  try {
    const result = reviewSchema.validate(req.body);
    if (result.error) {
        console.log(result.error.message);
        return res.json({
            error: true,
            status: 400,
            message: result.error.message,
        });
    }

    const userid = req.decoded.userid; // Passed by verifyJwt, a middleware 
    const id = uuid(); // Generating unique id for the review.
    result.value.id = id; 
    result.value.userId = userid; 

    const newReview = new Review.Model(result.value);
    await newReview.save(); // Saving into DB

    return res.status(200).json({
      success: true,
      id: id,
      message: "Review is successfully saved.",
    });
  } catch (error) {
    console.error("Review save error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Updating review
 * @returns {json} retrun a JSON object
 */
module.exports.Update = async (req, res) => {
  try {
    // Getting review form data
    const reviewFormData = req.body;
    reviewFormData.bookTitle = req.body.bookTitle ? req.body.bookTitle : undefined;
    reviewFormData.bookAuthors = req.body.bookAuthors ? JSON.parse(req.body.bookAuthors) : undefined;
    reviewFormData.isbn = req.body.isbn ? req.body.isbn : undefined;
    reviewFormData.bookCover = req.body.bookCover ? req.body.bookCover : undefined;
    reviewFormData.feedbacks = req.body.feedbacks ? req.body.feedbacks : undefined;

    // Checking validation of review form data
    const reviewResult = reviewSchema.validate(reviewFormData);
    if (reviewResult.error) {
        console.log(reviewResult.error.message);
        return res.json({
            error: true,
            status: 400,
            message: reviewResult.error.message,
        });
    }

    // Passed by verifyJwt, a middleware 
    const userid = req.decoded.userid; 
    const id = reviewResult.value.id; 
    // Retriving a review based on review id and userid
    const review = await Review.Model.findOne({ id: id, userId : userid });

    if (!review) {
      return res.json({
        error: true,
        status: 400,
        message: "No review is found for update."
      });
    }

    // Updating review 
    review.subject = reviewResult.value.subject;
    review.bookTitle = reviewResult.value.bookTitle;
    review.bookAuthors = reviewResult.value.bookAuthors;
    review.isbn = reviewResult.value.isbn;
    review.content = reviewResult.value.content;
    review.status = reviewResult.value.status;

    // Getting data of book cover image 
    if (req.file) { 
      // Creating buffer with base64 encoding
      let buffer = new Buffer.from(req.file.buffer, 'base64')
      const bookCover = {
        id: uuid(),
        fileName: req.file.originalname,
        mimetype: req.file.mimetype,   
        size: req.file.size,
        bytes: buffer, // from memory storage
      }

      // Checking validation of book cover image data
      const bookCoverResult = imageSchema.validate(bookCover);               
      if (bookCoverResult.error) {
        console.log(bookCoverResult.error.message);
        return res.json({
            error: true,
            status: 400,
            message: bookCoverResult.error.message,
        });
      }
      review.bookCover = bookCoverResult.value;
    }

    // Saving into DB
    await review.save(); 

    return res.status(200).json({
      success: true,
      message: "Review is successfully updated.",
    });
  } catch (error) {
    console.error("Review update error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Updating review
 * @returns {json} retrun a JSON object
 */
 module.exports.ChangeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 
    const id = req.headers.id; // From header

    // Retriving a review based on review id and userid
    const review = await Review.Model.findOne({ id: id, userId: userid, status: {$ne: status} });

    if (!review) {
      return res.json({
        error: true,
        status: 400,
        message: "No review is found for changing status."
      });
    }

    // Updating status 
    review.status = status;
    await review.save(); // Saving into DB

    return res.status(200).json({
      success: true,
      message: "Status is successfully updated.",
    });
  } catch (error) {
    console.error("Status update error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting all my review subjects
 * @returns {json} retrun a JSON object
 */
 module.exports.MyReviewSubjects = async (req, res) => {
  try {
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 

    // Retriving all reviews based on userid
    let reviewSubjects = await Review.Model.find({ userId: userid }, { id: 1, subject: 1, status: 1, isOwner: { $toBool: true }, _id: 0 });

    return res.status(200).json({
      success: true,
      reviewSubjects,
      message: "My review subjects are successfully retrieved.",
    });
  } catch (error) {
    console.error("My reviews error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting all review subjects not posted by the user
 * @returns {json} retrun a JSON object
 */
 module.exports.OtherReviewSubjects = async (req, res) => {
  try {    
    const userid = req.headers.userid; // From header

    // Retriving all reviews based on userid
    let otherReviewSubjects = await Review.Model.find({ userId: {$ne: userid}, status: 'Published' }, { id: 1, subject: 1, status: 1, isOwner: { $toBool: false }, _id: 0 });

    return res.status(200).json({
      success: true,
      otherReviewSubjects: otherReviewSubjects,
      message: "Other review subjects are successfully retrieved.",
    });
  } catch (error) {
    console.error("Reviews error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting a review posted by the user
 * @returns {json} retrun a JSON object
 */
 module.exports.MyReview = async (req, res) => {
  try {    
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 
    const id = req.headers.id; // From header
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "Review id is not provided."
      });
    }
    
    // Retriving a review based on review id and userid
    // Using lean to decode image as base64
    const review = await Review.Model.findOne({ id: id, userId : userid }, { _id: 0, __v: 0, bookCover: { _id: 0, updatedAt: 0 }}).lean();

    if (!review) {
      return res.json({
        error: true,
        status: 400,
        message: "No my review is found."
      });
    }

    return res.status(200).json({
      success: true,
      review,
      message: "My review is successfully retrieved.",
    });
  } catch (error) {
    console.error("My review error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Getting a review published
 * @returns {json} retrun a JSON object
 */
 module.exports.Review = async (req, res) => {
  try {    
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "Review id is not provided."
      });
    }

    // Retriving a published review based on id
    // Using lean to decode image as base64
    const review = await Review.Model.findOne({ id: id, status: "Published" }, { _id: 0, __v: 0, bookCover: { _id: 0, updatedAt: 0 }}).lean();

    if (!review) {
      return res.json({
        error: true,
        status: 400,
        message: "No review is found."
      });
    }

    return res.status(200).json({
      success: true,
      review,
      message: "Review is successfully retrieved.",
    });
  } catch (error) {
    console.error("Getting review error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

/**
 * Delete a review posted by the user
 * @returns {json} retrun a JSON object
 */
 module.exports.Delete = async (req, res) => {
  try {    
    const { userid } = req.decoded; // Passed by verifyJwt, a middleware 
    const id = req.headers.id;
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "Review id is not provided."
      });
    }

    // Retriving a review based on review id and userid
    let review = await Review.Model.findOne({ id: id, userId : userid });

    if (!review) {
      return res.json({
        error: true,
        status: 400,
        message: "No review to be deleted is found."
      });
    }

    review.deleteOne(function(err) {
      if (err) {
        return res.status(500).json({
          error: true,
          message: err.message,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Review is successfully deleted.",
        });
      }
    });
  } catch (error) {
    console.error("Deleting review error", error);

    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};