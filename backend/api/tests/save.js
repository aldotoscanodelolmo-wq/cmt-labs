import { supabase } from '../../lib/supabase.js';
import { authenticateToken } from '../../lib/auth.js';

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
    const {
      test_id,
      test_type,
      form_data,
      project_name,
      contractor_name,
      technician_name,
      certification_id,
      technician_signature
    } = req.body;

    const user_id = req.user.user_id;

    if (test_id) {
      // Update existing test
      const { data, error } = await supabase
        .from('tests')
        .update({
          test_type,
          form_data,
          test_results: form_data,
          project_name,
          contractor_name,
          technician_name,
          certification_id,
          technician_signature,
          updated_at: new Date()
        })
        .eq('id', test_id)
        .eq('user_id', user_id)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'Test updated', test: data[0] });
    } else {
      // Create new test
      const { data, error } = await supabase
        .from('tests')
        .insert([
          {
            user_id,
            test_type,
            form_data,
            test_results: form_data,
            project_name,
            contractor_name,
            technician_name,
            certification_id,
            technician_signature,
            status: 'draft'
          }
        ])
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'Test created', test: data[0] });
    }
  } catch (error) {
    console.error('Save test error:', error);
    return res.status(500).json({ error: error.message });
  }
}
