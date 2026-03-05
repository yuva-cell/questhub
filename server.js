import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

mongoose.connect(MONGO_URI)
  .then(() => console.log('⚔️  MongoDB connected – QuestHub Online'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ── SCHEMAS ───────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const CharacterSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name:         { type: String, default: 'Hero' },
  classIcon:    { type: String, default: '🧙' },
  level:        { type: Number, default: 1 },
  xp:           { type: Number, default: 0 },
  xpToNext:     { type: Number, default: 100 },
  gold:         { type: Number, default: 0 },
  hp:           { type: Number, default: 100 },
  maxHp:        { type: Number, default: 100 },
  strength:     { type: Number, default: 5 },
  intelligence: { type: Number, default: 5 },
  agility:      { type: Number, default: 5 },
  charisma:     { type: Number, default: 5 },
  totalCompleted: { type: Number, default: 0 },
  totalFailed:    { type: Number, default: 0 },
  title:        { type: String, default: 'The Beginner' }
});

const QuestSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: String,
  zone:        { type: String, enum: ['work','personal','health','learning','social'], default: 'personal' },
  difficulty:  { type: String, enum: ['trivial','easy','medium','hard','legendary'], default: 'medium' },
  xpReward:    { type: Number, default: 60 },
  goldReward:  { type: Number, default: 20 },
  status:      { type: String, enum: ['active','completed','failed'], default: 'active' },
  dueDate:     Date,
  completedAt: Date,
  createdAt:   { type: Date, default: Date.now }
});

const User      = mongoose.model('User',      UserSchema);
const Character = mongoose.model('Character', CharacterSchema);
const Quest     = mongoose.model('Quest',     QuestSchema);

// ── HELPERS ───────────────────────────────────────────────────────────────────

const XP_TABLE   = { trivial:15, easy:30, medium:60, hard:120, legendary:250 };
const GOLD_TABLE = { trivial:5,  easy:10, medium:20, hard:40,  legendary:100 };
const TITLES = [
  'The Beginner','The Apprentice','The Wanderer','The Fighter',
  'The Brave','The Skilled','The Expert','The Veteran',
  'The Champion','The Legend','The Mythic','The Immortal'
];

function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── AUTH ROUTES (public) ──────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existingEmail    = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });
    if (existingEmail)    return res.status(400).json({ error: 'Email already registered' });
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ username, email, password: hashed });

    // Auto-create character for new user
    await Character.create({ userId: user._id, name: username });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'No account found with that email' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PROTECTED ROUTES (require auth) ──────────────────────────────────────────
app.use('/api/character', auth);
app.use('/api/quests',    auth);
app.use('/api/stats',     auth);

// Character
app.get('/api/character', async (req, res) => {
  let char = await Character.findOne({ userId: req.userId });
  if (!char) char = await Character.create({ userId: req.userId });
  res.json(char);
});

app.put('/api/character', async (req, res) => {
  let char = await Character.findOneAndUpdate(
    { userId: req.userId },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json(char);
});

// Quests CRUD
app.get('/api/quests', async (req, res) => {
  const quests = await Quest.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(quests);
});

app.post('/api/quests', async (req, res) => {
  const { title, description, zone, difficulty, dueDate } = req.body;
  const xpReward   = XP_TABLE[difficulty]   || 60;
  const goldReward = GOLD_TABLE[difficulty]  || 20;
  const quest = await Quest.create({
    userId: req.userId, title, description, zone, difficulty,
    xpReward, goldReward, dueDate
  });
  res.json(quest);
});

app.put('/api/quests/:id/complete', async (req, res) => {
  const quest = await Quest.findOne({ _id: req.params.id, userId: req.userId });
  if (!quest || quest.status !== 'active')
    return res.status(400).json({ error: 'Quest not completable' });

  quest.status      = 'completed';
  quest.completedAt = new Date();
  await quest.save();

  let char = await Character.findOne({ userId: req.userId });
  if (!char) char = await Character.create({ userId: req.userId });

  char.xp   += quest.xpReward;
  char.gold += quest.goldReward;
  char.totalCompleted += 1;

  let leveledUp = false;
  while (char.xp >= char.xpToNext) {
    char.xp     -= char.xpToNext;
    char.level  += 1;
    char.xpToNext = xpForLevel(char.level);
    char.maxHp  = 100 + (char.level - 1) * 10;
    char.hp     = char.maxHp;
    char.strength     = 5 + Math.floor(char.level * 1.2);
    char.intelligence = 5 + Math.floor(char.level * 1.1);
    char.agility      = 5 + Math.floor(char.level * 0.9);
    char.charisma     = 5 + Math.floor(char.level * 0.8);
    char.title        = TITLES[Math.min(char.level - 1, TITLES.length - 1)];
    leveledUp = true;
  }
  await char.save();
  res.json({ quest, character: char, leveledUp });
});

app.put('/api/quests/:id/fail', async (req, res) => {
  const quest = await Quest.findOne({ _id: req.params.id, userId: req.userId });
  if (!quest) return res.status(404).json({ error: 'Quest not found' });
  quest.status = 'failed';
  await quest.save();

  let char = await Character.findOne({ userId: req.userId });
  if (char) {
    char.hp           = Math.max(1, char.hp - 10);
    char.totalFailed += 1;
    await char.save();
  }
  res.json({ quest, character: char });
});

app.delete('/api/quests/:id', async (req, res) => {
  await Quest.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ success: true });
});

app.get('/api/stats', async (req, res) => {
  const total     = await Quest.countDocuments({ userId: req.userId });
  const completed = await Quest.countDocuments({ userId: req.userId, status: 'completed' });
  const active    = await Quest.countDocuments({ userId: req.userId, status: 'active' });
  const byZone    = await Quest.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
    { $group: {
      _id: '$zone',
      count:     { $sum: 1 },
      completed: { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } }
    }}
  ]);
  res.json({ total, completed, active, byZone });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🏰 QuestHub Server → http://localhost:${PORT}`));
