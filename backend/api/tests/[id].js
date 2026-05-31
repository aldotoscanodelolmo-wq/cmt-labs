import { supabase } from '../../lib/supabase.js';
import { authenticateToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate
  const authError = authenticateToken(req, res);
  if (authError) return authError;

  try {
    const user_id = req.user.user_id;
    const { id } = req.query;

    // GET single test
    if (req.method === 'GET') {
      const { data: test, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (testError) return res.status(404).json({ error: 'Test not found' });

      // Get photos
      const { data: photos } = await supabase
        .from('photos')
        .select('*')
        .eq('test_id', id);

      return res.json({ test, photos });
    }

    // PUT update test
    if (req.method === 'PUT') {
      const updates = req.body;
      const { data, error } = await supabase
        .from('tests')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', id)
        .eq('user_id', user_id)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'Test updated', test: data[0] });
    }

    // DELETE test
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'Test deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Test handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
