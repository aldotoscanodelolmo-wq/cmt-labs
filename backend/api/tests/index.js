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
    const { project, contractor, technician, test_code } = req.query;

    let query = supabase
      .from('tests')
      .select('*')
      .eq('user_id', user_id);

    if (project) query = query.eq('project_name', project);
    if (contractor) query = query.eq('contractor_name', contractor);
    if (technician) query = query.eq('technician_name', technician);
    if (test_code) query = query.eq('test_type', test_code);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ tests: data });
  } catch (error) {
    console.error('Get tests error:', error);
    return res.status(500).json({ error: error.message });
  }
}
