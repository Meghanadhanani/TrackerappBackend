// require('dotenv').config();  // Ensure environment variables are loaded
// const express = require('express');
// const cors = require('cors'); // Import CORS middleware
// const pool = require('./db'); // Import database connection
// const bcrypt = require('bcrypt'); // For password hashing

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Enable CORS for all routes
// app.use(cors({
//   origin: '*', // Allow all origins (for testing purposes)
//   methods: 'GET,POST,PUT,DELETE',
//   allowedHeaders: 'Content-Type,Authorization'
// }));

// app.use(express.json());

// // Sample API Route to test DB connection
// app.get('/users', async (req, res) => {
//     console.log('Fetching users...');  // Add log here to see if route is hit
//     try {
//         const result = await pool.query('SELECT * FROM public.users');
//         console.log('Result from DB:', result.rows);  // Log result from DB
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error:', err);  // Log error if any
//         res.status(500).send('Server Error');
//     }
// });



// app.post('/signup', async (req, res) => {
//   const { username, password, email } = req.body;  // Get data from the request body

//   // Check if all required fields are provided
//   if (!username || !password || !email) {
//       return res.status(400).json({ message: 'Please provide all fields' });
//   }

//   try {
//       // Check if the user already exists
//       const userCheck = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
//       if (userCheck.rows.length > 0) {
//           return res.status(400).json({ message: 'User already exists' });
//       }

//       // Hash the password
//       const saltRounds = 10; // You can adjust the number of salt rounds
//       const hashedPassword = await bcrypt.hash(password, saltRounds);

//       // Insert the new user into the database
//       const result = await pool.query(
//           'INSERT INTO public.users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
//           [username, email, hashedPassword]
//       );

//       // Return the newly created user data
//       res.status(201).json({
//           message: 'User created successfully',
//           user: result.rows[0],
//       });
//   } catch (err) {
//       console.error('Error:', err);
//       res.status(500).send('Server Error');
//   }
// });


// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
// });


require('dotenv').config();  // Ensure environment variables are loaded
const express = require('express');
const cors = require('cors'); // Import CORS middleware
const pool = require('./db'); // Import database connection
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'; // Better to use environment variable

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both email and password'
        });
    }

    try {
        const userResult = await pool.query(
            'SELECT * FROM public.users WHERE email = $1',
            [email]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'mysecretkey',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Sample API Route to test DB connection
app.get('/users', async (req, res) => {
    console.log('Fetching users...');  // Add log here to see if route is hit
    try {
        const result = await pool.query('SELECT * FROM public.users');
        console.log('Result from DB:', result.rows);  // Log result from DB
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);  // Log error if any
        res.status(500).send('Server Error');
    }
});



app.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;  // Get data from the request body

  // Check if all required fields are provided
  if (!username || !password || !email) {
      return res.status(400).json({ message: 'Please provide all fields' });
  }

  try {
      // Check if the user already exists
      const userCheck = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
      if (userCheck.rows.length > 0) {
        Alert.alert("User already exists")
          return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password
      const saltRounds = 10; // You can adjust the number of salt rounds
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert the new user into the database
      const result = await pool.query(
          'INSERT INTO public.users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
          [username, email, hashedPassword]
      );

      // Return the newly created user data
      res.status(201).json({
          message: 'User created successfully',
          user: result.rows[0],
      });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).send('Server Error');
  }
});






// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);  // Debug log
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: "Invalid token" });
    }
};

// Initialize database tables
const initDB = async () => {
    try {
        // Create notes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                lectures JSONB NOT NULL DEFAULT '[]',
                total_lectures INTEGER NOT NULL,
                completed_lectures JSONB DEFAULT '[]',
                subject VARCHAR(255),
                date VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

initDB();

// Update the POST endpoint for creating notes
// Add this route to test JSON handling
app.post('/api/notes', verifyToken, async (req, res) => {
    try {
        console.log('Received note data:', req.body);
        const { title, lectures, totalLectures, subject, date } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!title || !lectures || !totalLectures || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Ensure lectures is an array
        const lecturesArray = Array.isArray(lectures) ? lectures : [];

        const result = await pool.query(
            `INSERT INTO notes 
            (user_id, title, lectures, total_lectures, completed_lectures, subject, date) 
            VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6, $7) 
            RETURNING *`,
            [
                userId,
                title,
                JSON.stringify(lecturesArray),
                totalLectures,
                JSON.stringify([]),
                subject,
                date || new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
            ]
        );

        // Format the response
        const newNote = {
            ...result.rows[0],
            lectures: JSON.parse(result.rows[0].lectures),
            completed_lectures: JSON.parse(result.rows[0].completed_lectures || '[]')
        };

        res.status(201).json({
            success: true,
            note: newNote,
            message: 'Note created successfully'
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating note',
            error: error.message
        });
    }
});




app.get('/api/notes', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    console.log("Extracted userId from token:", req.user.userId);

    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        const notes = result.rows.map(note => ({
            ...note,
            lectures: note.lectures || [],  // ✅ No JSON.parse()
            completed_lectures: note.completed_lectures || []
        }));
        


        res.json({
            success: true,
            notes: notes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching notes',
            error: error.message 
        });
    }
});

app.post('/api/notes', verifyToken, async (req, res) => {
    try {
        console.log('Received note data:', req.body);
        const { title, lectures, totalLectures, subject, date } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!title || !lectures || !totalLectures || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Clean up lectures array and convert to JSON string
        const cleanedLectures = JSON.stringify(
            lectures
                .map(lecture => lecture.trim())
                .filter(lecture => lecture.length > 0)
        );

        // Convert completed_lectures to JSON string
        const completedLectures = JSON.stringify([]);

        const result = await pool.query(
            `INSERT INTO notes 
            (user_id, title, lectures, total_lectures, completed_lectures, subject, date) 
            VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6, $7) 
            RETURNING *`,
            [
                userId,
                title.trim(),
                cleanedLectures,
                totalLectures,
                completedLectures,
                subject.trim(),
                date || new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
            ]
        );

        // Parse the JSON strings back to arrays for the response
        const newNote = {
            ...result.rows[0],
            lectures: JSON.parse(result.rows[0].lectures),
            completed_lectures: JSON.parse(result.rows[0].completed_lectures)
        };

        res.status(201).json({
            success: true,
            note: newNote,
            message: 'Note created successfully'
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating note',
            error: error.message
        });
    }
});
  
  
  

app.delete('/api/notes/:id', verifyToken, async (req, res) => {
    const noteId = req.params.id;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
            [noteId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Note not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting note',
            error: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
// node server.js
