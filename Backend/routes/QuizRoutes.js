const express = require("express");
const router = express.Router();

const {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  toggleQuizStatus,
  deleteQuiz,
  submitQuiz,
  getMyAttempts,
} = require("../controllers/QuizController");

const protect = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// "/attempts/me" must come before "/:id"
router.get("/attempts/me", protect, getMyAttempts);

router.get("/", protect, getQuizzes); // GET /api/quizzes?status=active
router.get("/:id", protect, getQuizById); // add ?mode=play to hide correct answers
router.post("/:id/submit", protect, submitQuiz);

router.post("/", protect, isAdmin, createQuiz);
router.put("/:id", protect, isAdmin, updateQuiz);
router.patch("/:id/status", protect, isAdmin, toggleQuizStatus);
router.delete("/:id", protect, isAdmin, deleteQuiz);

module.exports = router;
