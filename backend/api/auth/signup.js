import bcryptjs from 'bcryptjs';
import { supabase } from '../../lib/supabase.js';
import { createToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, technician_name, company_name } = req.body;

    // Validate input
    if (!email || !password || !technician_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const password_hash = await bcryptjs.hash(password, 10);

    // Insert user into database
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash,
          technician_name,
          company_name
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    const user = data[0];

    // Create JWT token
    const token = createToken(user.id, user.email);

    return res.status(200).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        technician_name: user.technician_name
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: error.message });
  }
}
