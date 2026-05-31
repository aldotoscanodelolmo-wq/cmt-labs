import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    return null;
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const createToken = (user_id, email) => {
  return jwt.sign(
    { user_id, email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
