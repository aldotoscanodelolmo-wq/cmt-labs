import { supabase } from '../../lib/supabase.js';
import { authenticateToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate
  const authError = authenticateToken(req, res);
  if (authError) return authError;

  try {
    const user_id = req.user.user_id;
    const { testId } = req.query;

    // Verify test belongs to user
    const { data: test } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('user_id', user_id)
      .single();

    if (!test) {
      return res.status(403).json({ error: 'Test not found' });
    }

    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('test_id', testId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ photos });
  } catch (error) {
    console.error('Get photos error:', error);
    return res.status(500).json({ error: error.message });
  }
}
