const express = require('express');
const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from root

// --- API ROUTES ---

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, name } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO users (id, username, name, created_at, last_active_date) VALUES (?, ?, ?, ?, ?)`,
    [id, username, name, now, now],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Username already taken or invalid data' });
      }
      db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
        res.json(row);
      });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// Get Current User (Refresh)
app.get('/api/users/:id', (req, res) => {
  db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// Get All Users (Leaderboard)
app.get('/api/users', (req, res) => {
  db.all(`SELECT id, username, name, total_study_minutes, tasks_completed, current_streak FROM users ORDER BY total_study_minutes DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Tasks
app.get('/api/tasks', (req, res) => {
  const { userId, date } = req.query;
  let query = `SELECT * FROM tasks`;
  const params = [];

  if (userId) {
    query += ` WHERE user_id = ?`;
    params.push(userId);
    if (date) {
      query += ` AND task_date = ?`;
      params.push(date);
    }
  } else if (date) {
    query += ` WHERE task_date = ?`;
    params.push(date);
  }
  
  // Just return all tasks for "Live Feed" if no filters, or specific filters
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create Task
app.post('/api/tasks', (req, res) => {
  const { userId, name, subject, estimatedMinutes, taskDate } = req.body;
  const id = uuidv4();
  const createdAt = Date.now();
  
  db.run(
    `INSERT INTO tasks (id, user_id, name, subject, estimated_minutes, status, task_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, name, subject, estimatedMinutes, 'pending', taskDate, createdAt],
    function(err) {
      if(err) return res.status(500).json({error: err.message});
      db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => {
        res.json(row);
      });
    }
  );
});

// Update Task
app.put('/api/tasks/:id', (req, res) => {
  const { status, startedAt, lastPausedAt, elapsedSeconds, actualMinutes, completedAt } = req.body;
  const id = req.params.id;

  // Dynamic update
  const updates = [];
  const params = [];
  
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (startedAt !== undefined) { updates.push('started_at = ?'); params.push(startedAt); }
  if (lastPausedAt !== undefined) { updates.push('last_paused_at = ?'); params.push(lastPausedAt); }
  if (elapsedSeconds !== undefined) { updates.push('elapsed_seconds = ?'); params.push(elapsedSeconds); }
  if (actualMinutes !== undefined) { updates.push('actual_minutes = ?'); params.push(actualMinutes); }
  
  params.push(id);

  db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({error: err.message});
    
    // If completing, update user stats
    if (status === 'completed_ontime' || status === 'completed_delayed') {
      db.get(`SELECT user_id, actual_minutes FROM tasks WHERE id = ?`, [id], (err, task) => {
        if (task) {
          db.run(`UPDATE users SET total_study_minutes = total_study_minutes + ?, tasks_completed = tasks_completed + 1 WHERE id = ?`, 
            [task.actual_minutes, task.user_id]);
        }
      });
    }

    db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => res.json(row));
  });
});

// Get Summaries
app.get('/api/summaries', (req, res) => {
  const { userId } = req.query;
  const query = userId ? `SELECT * FROM summaries WHERE user_id = ? ORDER BY date DESC` : `SELECT * FROM summaries`;
  const params = userId ? [userId] : [];
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// Create Summary
app.post('/api/summaries', (req, res) => {
  const data = req.body;
  const id = uuidv4();
  
  db.run(`INSERT INTO summaries (id, user_id, date, maths_problems, physics_problems, chemistry_problems, topics_covered, notes, self_rating, total_study_hours, tasks_completed, success_rate) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.userId, data.date, data.mathsProblems, data.physicsProblems, data.chemistryProblems, data.topicsCovered, data.notes, data.selfRating, data.totalStudyHours, data.tasksCompleted, data.successRate],
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ success: true, id });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});