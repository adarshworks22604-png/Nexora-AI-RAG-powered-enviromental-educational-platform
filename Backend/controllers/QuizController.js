const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/Quizattempt");
const User = require("../models/User");

const isStaff = (u) => !!u && ["admin", "teacher"].includes(u.role);
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// remove correct answers + explanations from a plain (lean) quiz object
const stripAnswers = (quiz) => ({
  ...quiz,
  questions: (quiz.questions || []).map(
    ({ correctAnswerIndex, explanation, ...rest }) => rest,
  ),
});

// returns an error message string, or null if questions are valid
const checkQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "A quiz needs at least 1 question";
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q || !q.questionText)
      return `Question ${i + 1}: questionText is required`;
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return `Question ${i + 1}: needs at least 2 options`;
    }
    if (
      !Number.isInteger(q.correctAnswerIndex) ||
      q.correctAnswerIndex < 0 ||
      q.correctAnswerIndex >= q.options.length
    ) {
      return `Question ${i + 1}: correctAnswerIndex must be a valid option index`;
    }
  }
  return null;
};

// GET /api/quizzes?status=active
exports.getQuizzes = async (req, res) => {
  try {
    const filter = {};
    const { status } = req.query;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    // students only ever see active quizzes
    if (!isStaff(req.user)) filter.isActive = true;

    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(isStaff(req.user) ? quizzes : quizzes.map(stripAnswers));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/quizzes/:id  (?mode=play hides correct answers)
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ message: "Invalid quiz id" });

    const quiz = await Quiz.findById(id).lean();
    if (!quiz || (!quiz.isActive && !isStaff(req.user))) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const hide = req.query.mode === "play" || !isStaff(req.user);
    res.json(hide ? stripAnswers(quiz) : quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/quizzes  (admin)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, questions, points } =
      req.body;

    const problem = checkQuestions(questions);
    if (problem) return res.status(400).json({ message: problem });

    const quiz = await Quiz.create({
      title,
      description,
      category,
      difficulty,
      questions,
      points,
      createdBy: req.user._id,
    });
    res.status(201).json(quiz);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/quizzes/:id  (admin)
exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ message: "Invalid quiz id" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.body.questions !== undefined) {
      const problem = checkQuestions(req.body.questions);
      if (problem) return res.status(400).json({ message: problem });
    }

    const allowed = [
      "title",
      "description",
      "category",
      "difficulty",
      "questions",
      "points",
      "isActive",
    ];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) quiz[f] = req.body[f];
    });

    await quiz.save();
    res.json(quiz);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/quizzes/:id/status  (admin) - flips isActive
exports.toggleQuizStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ message: "Invalid quiz id" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.isActive = !quiz.isActive;
    await quiz.save();
    res.json({ _id: quiz._id, isActive: quiz.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/quizzes/:id  (admin) - also removes its attempts
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ message: "Invalid quiz id" });

    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    await QuizAttempt.deleteMany({ quiz: id });
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/quizzes/:id/submit   body: { answers: [optionIndex, ...] }
exports.submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ message: "Invalid quiz id" });

    const quiz = await Quiz.findById(id);
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const { answers } = req.body;
    const total = quiz.questions.length;
    if (
      !Array.isArray(answers) ||
      answers.length !== total ||
      !answers.every((a) => Number.isInteger(a))
    ) {
      return res.status(400).json({
        message: `answers must be an array of ${total} option indexes`,
      });
    }

    let score = 0;
    const results = quiz.questions.map((q, i) => {
      const correct = answers[i] === q.correctAnswerIndex;
      if (correct) score++;
      return {
        questionText: q.questionText,
        selected: answers[i],
        correctAnswerIndex: q.correctAnswerIndex,
        correct,
        explanation: q.explanation,
      };
    });

    const prior = await QuizAttempt.exists({
      quiz: quiz._id,
      user: req.user._id,
    });

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user._id,
      answers,
      score,
      totalQuestions: total,
    });

    // points + quizzesTaken only on the first attempt (prevents point farming)
    let pointsEarned = 0;
    if (!prior) {
      pointsEarned = Math.round((quiz.points * score) / total);
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { points: pointsEarned, quizzesTaken: 1 },
      });
    }

    res.status(201).json({
      attemptId: attempt._id,
      score,
      totalQuestions: total,
      percentage: Math.round((score / total) * 100),
      pointsEarned,
      firstAttempt: !prior,
      results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/quizzes/attempts/me
exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate("quiz", "title category difficulty points")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
