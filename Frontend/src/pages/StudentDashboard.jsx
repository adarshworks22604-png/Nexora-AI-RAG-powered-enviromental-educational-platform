import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { useAuth } from "../contexts/AuthContext";
import Chatbot from "../components/Chatbot";
import EcoLearningSections from "../components/EcoLearningSections";
import { ecoFacts, ecoPageContent } from "../data/eco-content";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalPoints: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [ecoFactIndex, setEcoFactIndex] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const factTimer = window.setInterval(() => {
      setEcoFactIndex((currentIndex) => (currentIndex + 1) % ecoFacts.length);
    }, 9000);
    return () => window.clearInterval(factTimer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all available tasks
      const tasksResponse = await axios.get("/api/tasks");
      const tasks = tasksResponse.data.data;

      // Fetch fresh user data for points
      const userResponse = await axios.get("/api/auth/me");
      const currentUser = userResponse.data.data.user;

      // Calculate stats
      const totalTasks = tasks.length;

      let completedTasks = 0;
      let pendingTasks = 0;

      tasks.forEach((task) => {
        const submission = task.submissions?.find(
          (sub) =>
            (sub.student._id || sub.student).toString() === user.id.toString(),
        );
        if (submission) {
          if (submission.status === "approved") {
            completedTasks++;
          } else if (submission.status === "pending") {
            pendingTasks++;
          }
        }
      });

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        totalPoints: currentUser.points,
      });

      // Fetch leaderboard
      const leaderboardResponse = await axios.get("/api/users/leaderboard");

      // Fetch modules
      const modulesResponse = await axios.get("/api/modules");

      setRecentTasks(tasks.slice(0, 5));
      setLeaderboard(leaderboardResponse.data.data.slice(0, 5));
      setModules(modulesResponse.data.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (task) => {
    const submission = task.submissions.find(
      (sub) =>
        (sub.student._id || sub.student).toString() === user.id.toString(),
    );
    if (!submission) return "not-started";
    return submission.status;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="badge badge-success">Completed</span>;
      case "pending":
        return <span className="badge badge-warning">Attempted</span>;
      case "rejected":
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge badge-info">Started</span>;
    }
  };

  const handleAttemptTask = (task) => {
    // Navigate to tasks page with the task ID in state to auto-open submission
    navigate("/tasks", { state: { taskId: task.id || task._id } });
  };

  const handleSubmitTask = () => {
    // Navigate to tasks page where they can select a task to submit
    navigate("/tasks");
  };

  const getVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getEmbedUrl = (url) => {
    const videoId = getVideoId(url);
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
      : url;
  };

  return (
    <main className="dashboard student-dashboard">
      <div className="container student-dashboard__container">
        <header className="dashboard-header student-dashboard__hero">
          <p className="student-dashboard__eyebrow">
            {ecoPageContent.hero.eyebrow}
          </p>
          <h1 className="dashboard-title">Welcome back, {user.name}!</h1>
          <p className="dashboard-subtitle">{ecoPageContent.hero.subtitle}</p>
          <div className="student-dashboard__fact" aria-live="polite">
            <span className="student-dashboard__fact-icon" aria-hidden="true">
              ✦
            </span>
            <div>
              <span className="student-dashboard__fact-label">
                {ecoPageContent.hero.factLabel}
              </span>
              <p key={ecoFactIndex}>{ecoFacts[ecoFactIndex]}</p>
            </div>
          </div>
          <nav
            className="student-dashboard__hero-actions"
            aria-label="Dashboard shortcuts"
          >
            <a className="btn btn-primary" href="#eco-explore">
              {ecoPageContent.hero.exploreLabel}
            </a>
            <a
              className="btn student-dashboard__secondary-link"
              href="#student-progress"
            >
              {ecoPageContent.hero.progressLabel}
            </a>
          </nav>
        </header>

        <section
          className="student-dashboard__progress-wrap"
          id="student-progress"
          aria-labelledby="student-progress-title"
        >
          <header className="student-dashboard__progress-heading">
            <h2 id="student-progress-title">{ecoPageContent.progress.title}</h2>
            <p>{ecoPageContent.progress.description}</p>
          </header>
          {loading ? (
            <div
              className="student-dashboard__loading"
              aria-label="Loading your progress"
              aria-busy="true"
            >
              <div className="student-dashboard__skeleton student-dashboard__skeleton--challenge" />
              <div className="student-dashboard__skeleton-grid">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    className="student-dashboard__skeleton student-dashboard__skeleton--stat"
                    key={item}
                  />
                ))}
              </div>
              <div className="student-dashboard__skeleton student-dashboard__skeleton--chart" />
            </div>
          ) : (
            <>
              <section
                className="student-dashboard__challenge-row"
                aria-label="Daily challenge and tip"
              >
                <DailyChallenge user={user} onBrowseTasks={handleSubmitTask} />
                <DailyTip />
              </section>

              <section
                className="student-dashboard__stats-section"
                aria-label="Your activity at a glance"
              >
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{stats.totalPoints}</div>
                    <div className="stat-label">Total Points</div>
                    {stats.totalPoints === 0 && (
                      <p className="student-dashboard__stat-note">
                        Complete your first task to earn points.
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.totalTasks}</div>
                    <div className="stat-label">Total Tasks</div>
                    {stats.totalTasks === 0 && (
                      <p className="student-dashboard__stat-note">
                        New tasks will appear here.
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.completedTasks}</div>
                    <div className="stat-label">Completed</div>
                    {stats.completedTasks === 0 && (
                      <p className="student-dashboard__stat-note">
                        Your first finished task starts a streak.
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.pendingTasks}</div>
                    <div className="stat-label">Pending</div>
                    {stats.pendingTasks === 0 && (
                      <p className="student-dashboard__stat-note">
                        Nothing is awaiting review.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Progress Section */}
              <section
                className="grid grid-2 student-dashboard__progress"
                aria-label="Your progress"
              >
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">📊 Task Completion</h2>
                  </div>
                  <div className="card-body">
                    <div className="mt-6 mb-6">
                      {(() => {
                        const completedPct = stats.totalTasks
                          ? (stats.completedTasks / stats.totalTasks) * 100
                          : 0;
                        const pendingPct = stats.totalTasks
                          ? (stats.pendingTasks / stats.totalTasks) * 100
                          : 0;

                        return (
                          <div>
                            <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-green-500 transition-all duration-500 flex items-center justify-center"
                                style={{ width: `${completedPct}%` }}
                                title={`Completed: ${Math.round(completedPct)}%`}
                              >
                                {completedPct > 10 && (
                                  <span className="text-xs text-white font-bold">
                                    {Math.round(completedPct)}%
                                  </span>
                                )}
                              </div>
                              <div
                                className="h-full bg-yellow-500 transition-all duration-500 flex items-center justify-center"
                                style={{ width: `${pendingPct}%` }}
                                title={`Attempted: ${Math.round(pendingPct)}%`}
                              >
                                {pendingPct > 10 && (
                                  <span className="text-xs text-white font-bold">
                                    {Math.round(pendingPct)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">
                                  Completed ({stats.completedTasks})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">
                                  Attempted ({stats.pendingTasks})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-green-800">
                          Overall Completion Rate
                        </span>
                        <span className="text-sm font-bold text-green-800">
                          {stats.totalTasks
                            ? Math.round(
                                (stats.completedTasks / stats.totalTasks) * 100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-green-600 h-6 rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">⭐ Level Progress</h2>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-blue-700">
                          Current Level
                        </span>
                        <span className="text-sm font-medium text-blue-700">
                          {Math.floor(stats.totalPoints / 100) + 1}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${stats.totalPoints % 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {100 - (stats.totalPoints % 100)} points to next level
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-800">
                        Total Points: {stats.totalPoints}
                      </p>
                      <p className="text-sm text-blue-600">
                        Keep completing tasks to level up!
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>

        <EcoLearningSections />

        {!loading && (
          <div className="student-dashboard__legacy-content">
            {/* Badges */}
            {user.badges && user.badges.length > 0 && (
              <div className="card mb-6">
                <div className="card-header">
                  <h3 className="card-title">🏆 Your Badges</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-3">
                    {user.badges.map((badge, index) => (
                      <div
                        key={index}
                        className="text-center p-3 border rounded"
                      >
                        <div className="text-2xl mb-2">🏅</div>
                        <div className="font-semibold">{badge.name}</div>
                        <div className="text-sm text-gray-600">
                          {badge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-2">
              {/* Recent Tasks */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">📋 Recent Tasks</h3>
                </div>
                <div className="card-body">
                  {recentTasks.length === 0 ? (
                    <p className="text-gray-500">No tasks assigned yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentTasks.map((task) => {
                        const status = getTaskStatus(task);
                        return (
                          <div key={task._id} className="border rounded p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{task.title}</h4>
                              {getStatusBadge(status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {task.description}
                            </p>
                            <div className="flex justify-between items-center text-sm">
                              <span className="badge badge-info">
                                {task.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {task.points} points
                                </span>
                                {status === "not-started" && (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleAttemptTask(task)}
                                  >
                                    Attempt
                                  </button>
                                )}
                                {status === "pending" && (
                                  <button
                                    className="btn btn-sm btn-warning"
                                    disabled
                                  >
                                    Attempted
                                  </button>
                                )}
                                {status === "approved" && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    disabled
                                  >
                                    Completed
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">🏆 Leaderboard</h3>
                </div>
                <div className="card-body">
                  {leaderboard.length === 0 ? (
                    <p className="text-gray-500">No data available.</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((student, index) => (
                        <div
                          key={student._id}
                          className={`flex justify-between items-center p-2 rounded ${
                            student._id === user.id
                              ? "bg-blue-50 border border-blue-200"
                              : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-bold text-lg mr-2">
                              {index + 1}
                            </span>
                            <span
                              className={`ml-2 ${student._id === user.id ? "font-semibold" : " "}`}
                            >
                              {student.name}
                            </span>
                            {student._id === user.id && (
                              <span className="ml-2 text-blue-600 text-sm">
                                (You)
                              </span>
                            )}
                          </div>
                          <span className="font-semibold">
                            {student.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video Modules Section */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="card-title">📺 Video Modules</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-6">
                  {modules.length === 0 ? (
                    <p className="text-gray-500 col-span-3 text-center">
                      No video modules available.
                    </p>
                  ) : (
                    modules.map((module) => {
                      const videoId = getVideoId(module.videoUrl);
                      const isPlaying = playingVideo === module._id;

                      return (
                        <div
                          key={module._id}
                          className="border rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          style={{ flex: "1 1 320px", maxWidth: "560px" }}
                        >
                          <div
                            className="bg-gray-200 relative group"
                            style={{ aspectRatio: "16/9" }}
                          >
                            {isPlaying ? (
                              <iframe
                                src={getEmbedUrl(module.videoUrl)}
                                title={module.title}
                                className="w-full h-full object-cover"
                                allowFullScreen
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              ></iframe>
                            ) : (
                              <div
                                className="w-full h-full cursor-pointer relative"
                                onClick={() => setPlayingVideo(module._id)}
                              >
                                <img
                                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                  alt={module.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/640x360?text=Video+Thumbnail";
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all">
                                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                    <svg
                                      className="w-5 h-5 text-white fill-current"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4
                              className="font-semibold mb-1 truncate"
                              title={module.title}
                            >
                              {module.title}
                            </h4>
                            <span className="badge badge-info text-xs">
                              {module.category}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Quizzes Section */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="card-title">📝 Available Quizzes</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-2 gap-4">
                  {[
                    { title: "Eco-Friendly Habits", questions: 10, points: 50 },
                    { title: "Recycling 101", questions: 8, points: 40 },
                    { title: "Carbon Footprint", questions: 12, points: 60 },
                    {
                      title: "Wildlife Conservation",
                      questions: 15,
                      points: 75,
                    },
                  ].map((quiz, index) => (
                    <div
                      key={index}
                      className="border rounded p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-lg">{quiz.title}</h4>
                        <p className="text-sm text-gray-600">
                          {quiz.questions} Questions • {quiz.points} Points
                        </p>
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate("/quizzes")}
                      >
                        Start Quiz
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="card-title">🚀 Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/tasks")}
                  >
                    View All Tasks
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate("/quizzes")}
                  >
                    Take a Quiz
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleSubmitTask}
                  >
                    Submit Task
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={() => navigate("/performance")}
                  >
                    View Performance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <section
          className="student-dashboard__cta"
          aria-labelledby="student-dashboard-cta-title"
        >
          <div>
            <h2 id="student-dashboard-cta-title">
              {ecoPageContent.callToAction.title}
            </h2>
            <p>{ecoPageContent.callToAction.description}</p>
          </div>
          <button className="btn btn-primary" onClick={handleSubmitTask}>
            {ecoPageContent.callToAction.buttonLabel}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    </main>
  );
};

const DailyChallenge = ({ user, onBrowseTasks }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const { updateUser } = useAuth();

  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    try {
      const response = await axios.get("/api/games/daily-challenge");
      if (response.data.success) {
        setChallenge(response.data.data);
        if (response.data.data.completed) {
          setCompleted(true);
        }
      }
    } catch (error) {
      console.error("Error fetching daily challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await axios.post("/api/games/complete-challenge", {
        points: challenge.points,
      });

      if (response.data.success) {
        setCompleted(true);
        updateUser({ points: response.data.data.points });
      }
    } catch (error) {
      console.error("Error completing challenge:", error);
      if (error.response && error.response.data.message) {
        alert(error.response.data.message);
      }
    }
  };

  if (loading)
    return (
      <div className="card student-dashboard__daily-card">
        <div
          className="card-body student-dashboard__challenge-skeleton"
          aria-label="Loading daily challenge"
          aria-busy="true"
        >
          <div className="student-dashboard__skeleton student-dashboard__skeleton--line" />
          <div className="student-dashboard__skeleton student-dashboard__skeleton--line-short" />
        </div>
      </div>
    );

  if (!challenge)
    return (
      <div className="card student-dashboard__daily-card student-dashboard__empty-challenge">
        <div className="card-body">
          <span className="student-dashboard__empty-icon" aria-hidden="true">
            🌿
          </span>
          <div>
            <h2>No challenge today</h2>
            <p>
              There is no daily challenge available right now. You can still
              make a difference with a regular task.
            </p>
            <button
              className="student-dashboard__text-link"
              onClick={onBrowseTasks}
            >
              Browse your tasks <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div
      className={`card student-dashboard__daily-card ${completed ? "is-completed" : ""}`}
    >
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌱</span>
              <h2
                className={`text-xl font-bold ${completed ? "text-gray-600" : "text-green-800"}`}
              >
                Daily Eco Challenge
              </h2>
            </div>
            <h4 className="font-semibold text-lg mb-2">{challenge.title}</h4>
            <p className="text-gray-600 mb-4">{challenge.description}</p>
            <div className="flex items-center gap-2">
              <span
                className={`badge ${completed ? "badge-secondary" : "badge-success"}`}
              >
                +{challenge.points} Points
              </span>
              <span className="text-sm text-gray-500">Expires in 24h</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            {completed ? (
              <button className="btn btn-secondary" disabled>
                Completed! ✓
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleComplete}>
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DailyTip = () => {
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      try {
        const response = await axios.get("/api/games/daily-tip");
        if (response.data.success) {
          setTip(response.data.data.tip);
        }
      } catch (error) {
        console.error("Error fetching daily tip:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTip();
  }, []);

  if (loading || !tip) return null;

  return (
    <div className="card student-dashboard__tip-card">
      <div className="card-body flex items-start gap-4">
        <div className="text-3xl">💡</div>
        <div>
          <h2 className="font-bold text-blue-800 mb-1">Daily Eco Tip</h2>
          <p className="text-blue-900">{tip}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
