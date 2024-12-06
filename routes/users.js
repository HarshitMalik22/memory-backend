const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../models/Users');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post(
  '/',
  [
    // Validate name, email, and password
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    // Return errors if validation fails
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if the email already exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'Email already exists' });
      }

      // Create a new user instance
      user = new User({
        name,
        email,
        password,
      });

      // Generate salt and hash the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save the user to the database
      await user.save();

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Sign the JWT and send it as a response
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600 }, // Token expires in 1 hour
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Private
router.put(
  '/:id',
  [
    // Validate optional fields
    check('name', 'Name must be at least 1 character').optional().isLength({ min: 1 }),
    check('email', 'Enter a valid email').optional().isEmail(),
    check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Get the user by ID
      let user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const { name, email, password } = req.body;

      // Update fields if provided
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      // Save updated user to the database
      await user.save();
      res.json({ msg: 'User updated successfully', user });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await User.findByIdAndRemove(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
