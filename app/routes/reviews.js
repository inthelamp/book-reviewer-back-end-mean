const express = require("express");
const router = express.Router();

const multer  = require('multer');
const storage = multer.memoryStorage()
// Saving book cover into memory
const bookCovers = multer({ storage: storage });
const bookImages = multer({ dest: 'uploads/bookImages/' });

const { verifyJwt } = require("../middlewares/verifyJwt");
const review = require("../controllers/review");

router.post("/save", verifyJwt, review.Save);
// router.patch('/update', verifyJwt, function (req, res) {
//     review.Update(req, res);
// });
router.post('/update', verifyJwt, bookCovers.single('bookCover'), review.Update);
router.patch('/changeStatus', verifyJwt, function (req, res) {
    review.ChangeStatus(req, res);
});
router.delete("/delete", verifyJwt, review.Delete);
router.get("/myReviewSubjects", verifyJwt, review.MyReviewSubjects);
router.get("/otherReviewSubjects", function (req, res) {
    review.OtherReviewSubjects(req, res);
});
router.get("/myreview", verifyJwt, review.MyReview);
router.get("/reviews/:id", function (req, res) {
    review.Review(req, res);
});

module.exports = router;