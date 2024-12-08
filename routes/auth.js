const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../models/Users');
const auth = require('../middleware/auth');

// @route   GET api/auth
// @desc    Get logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Fetch user by ID, exclude the password
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create new user
      user = new User({
        name,
        email,
        password,
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save the user to the database
      await user.save();

      res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
      console.error('Error registering user:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/auth/signin
// @desc    Authenticate user and return token
// @access  Public
router.post(
  '/signin',
  [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user in the database
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials (email not found)' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials (password mismatch)' });
      }

      // Payload for JWT
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Sign the token and send it in the response
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600 }, // Token valid for 1 hour
        (err, token) => {
          if (err) {
            console.error('Error signing token:', err.message);
            throw err;
          }
          res.json({ token, email: user.email });  // Send the token and email to the frontend
        }
      );
    } catch (err) {
      console.error('Error authenticating user:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
