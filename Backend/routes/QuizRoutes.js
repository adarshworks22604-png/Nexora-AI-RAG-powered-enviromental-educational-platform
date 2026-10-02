const express = require("express");
const router = express.Router();

const {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  toggleQuizStatus,
  deleteQuiz,
  submitQuiz,
  getMyAttempts,
} = require("../controllers/QuizController");

// NOTE: adjust this import to match whatever your middleware/auth file
// actually exports (e.g. verifyToken/adminOnly instead of protect/isAdmin).
const protect = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
// Order matters: static paths like "/attempts/me" must come before "/:id"
router.get("/attempts/me", protect, getMyAttempts);

// Student + public
router.get("/", getQuizzes); // GET /api/quizzes?status=active
router.get("/:id", getQuizById); // add ?mode=play to hide correct answers
router.post("/:id/submit", protect, submitQuiz);

// Admin only
router.post("/", protect, isAdmin, createQuiz);
router.put("/:id", protect, isAdmin, updateQuiz);
router.patch("/:id/status", protect, isAdmin, toggleQuizStatus);
router.delete("/:id", protect, isAdmin, deleteQuiz);

const {
  getQuizzes,
  getQuizById,
  submitQuiz,
} = require("../controllers/QuizController");
const auth = require("../middleware/auth");

router.get("/", auth, getQuizzes);
router.get("/:id", auth, getQuizById);
router.post("/:id/submit", auth, submitQuiz);

module.exports = router;
