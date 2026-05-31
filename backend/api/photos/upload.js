import { supabase } from '../../lib/supabase.js';
import { authenticateToken } from '../../lib/auth.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate
  const authError = authenticateToken(req, res);
  if (authError) return authError;

  try {
    const user_id = req.user.user_id;
    const { test_id, photo_url } = req.body;

    if (!test_id || !photo_url) {
      return res.status(400).json({ error: 'test_id and photo_url required' });
    }

    // Verify test belongs to user
    const { data: test } = await supabase
      .from('tests')
      .select('id')
      .eq('id', test_id)
      .eq('user_id', user_id)
      .single();

    if (!test) {
      return res.status(403).json({ error: 'Test not found' });
    }

    // Store photo record in database
    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert([{ test_id, photo_url }])
      .select();

    if (dbError) return res.status(400).json({ error: dbError.message });

    return res.json({ message: 'Photo uploaded', photo: photoData[0] });
  } catch (error) {
    console.error('Upload photo error:', error);
    return res.status(500).json({ error: error.message });
  }
}
