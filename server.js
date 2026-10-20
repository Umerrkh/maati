require('dotenv').config();
require('dns').setServers(['8.8.8.8', '1.1.1.1']); 
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true }));

const products = [
  { id: 1, name: 'Dusk bowl', price: 1800, color: '#2F5D8A', note: 'Hand-glazed stoneware, 18 cm' },
  { id: 2, name: 'Sage mug', price: 1200, color: '#7C9885', note: 'Holds 300 ml, dishwasher safe' },
  { id: 3, name: 'Sand platter', price: 3400, color: '#C9BBA2', note: 'Serves four, 32 cm wide' },
  { id: 4, name: 'Ink vase', price: 4200, color: '#1F2A3A', note: 'Narrow neck, 28 cm tall' },
  { id: 5, name: 'Moss planter', price: 2600, color: '#53705C', note: 'Drainage hole and saucer' },
  { id: 6, name: 'Salt dish set', price: 1500, color: '#E1DCD0', note: 'Set of three, 9 cm each' },
  { id: 7, name: 'Tide teapot', price: 5200, color: '#5B8DB8', note: 'Steel infuser, 800 ml' },
  { id: 8, name: 'Clay carafe', price: 3100, color: '#A5604A', note: 'Keeps water cool, 1 L' },
];

const issue = (res, user) => res.cookie('token',
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  { httpOnly: true, sameSite: 'lax', maxAge: 7 * 864e5, secure: process.env.NODE_ENV === 'production' });

app.get('/api/products', (_, res) => res.json(products));

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Fill in your name, email and password.' });
  if (password.length < 8) return res.status(400).json({ error: 'Use a password with at least 8 characters.' });
  if (await User.findOne({ email })) return res.status(409).json({ error: 'That email already has an account. Sign in instead.' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  issue(res, user);
  res.status(201).json({ name: user.name });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  issue(res, user);
  res.json({ name: user.name });
});

app.post('/api/logout', (_, res) => res.clearCookie('token').json({ ok: true }));

app.get('/api/me', async (req, res) => {
  try {
    const { id } = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const user = await User.findById(id).select('name email');
    return user ? res.json(user) : res.status(401).json({});
  } catch { res.status(401).json({}); }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 3000, () => console.log('Maati running on http://localhost:' + (process.env.PORT || 3000))))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
