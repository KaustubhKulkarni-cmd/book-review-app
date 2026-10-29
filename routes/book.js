
const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "replace-this-jwt-secret";

const books = [
  {
    id: 1,
    title: "The Alchemist",
    author: "Paulo Coelho",
    reviews: []
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    reviews: []
  }
];

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication token required"
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token"
      });
    }

    req.user = user;
    next();
  });
}

// Get all books
router.get("/", (req, res) => {
  res.json(books);
});

// Search books by title
router.get("/search/:title", (req, res) => {
  const title = req.params.title.toLowerCase();

  const results = books.filter((book) =>
    book.title.toLowerCase().includes(title)
  );

  res.json(results);
});

// Get a single book and its reviews
router.get("/:id", (req, res) => {
  const book = books.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  res.json(book);
});

// Add a review
router.post("/:id/reviews", authenticateToken, (req, res) => {
  const book = books.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const { rating, comment } = req.body;

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    typeof comment !== "string" ||
    !comment.trim()
  ) {
    return res.status(400).json({
      message: "Rating must be 1-5 and comment is required"
    });
  }

  const review = {
    id: Date.now(),
    username: req.user.username,
    rating,
    comment: comment.trim()
  };

  book.reviews.push(review);

  res.status(201).json({
    message: "Review added successfully",
    review
  });
});

// Update your own review
router.put("/:bookId/reviews/:reviewId", authenticateToken, (req, res) => {
  const book = books.find(
    (item) => item.id === Number(req.params.bookId)
  );

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const review = book.reviews.find(
    (item) => item.id === Number(req.params.reviewId)
  );

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.username !== req.user.username) {
    return res.status(403).json({
      message: "You can only update your own review"
    });
  }

  const { rating, comment } = req.body;

  if (
    rating !== undefined &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    return res.status(400).json({
      message: "Rating must be between 1 and 5"
    });
  }

  if (rating !== undefined) review.rating = rating;

  if (comment !== undefined) {
    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty"
      });
    }

    review.comment = comment.trim();
  }

  res.json({
    message: "Review updated successfully",
    review
  });
});

// Delete your own review
router.delete("/:bookId/reviews/:reviewId", authenticateToken, (req, res) => {
  const book = books.find(
    (item) => item.id === Number(req.params.bookId)
  );

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const review = book.reviews.find(
    (item) => item.id === Number(req.params.reviewId)
  );

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.username !== req.user.username) {
    return res.status(403).json({
      message: "You can only delete your own review"
    });
  }

  book.reviews = book.reviews.filter(
    (item) => item.id !== Number(req.params.reviewId)
  );

  res.json({ message: "Review deleted successfully" });
});

module.exports = router;
