import { jsPDF } from 'jspdf';
import { supabase } from '../../../lib/supabase.js';
import { authenticateToken } from '../../../lib/auth.js';

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
    const { id } = req.query;

    // Get test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (testError || !test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get photos
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('test_id', id);

    // Create PDF
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('CMT Labs Test Report', 20, 20);

    pdf.setFontSize(12);
    pdf.text(`Test Type: ${test.test_type}`, 20, 40);
    pdf.text(`Project: ${test.project_name || 'N/A'}`, 20, 50);
    pdf.text(`Contractor: ${test.contractor_name || 'N/A'}`, 20, 60);
    pdf.text(`Technician: ${test.technician_name || 'N/A'}`, 20, 70);
    pdf.text(`Certification ID: ${test.certification_id || 'N/A'}`, 20, 80);
    pdf.text(`Date: ${new Date(test.created_at).toLocaleDateString()}`, 20, 90);

    // Add form data
    pdf.setFontSize(10);
    let yPos = 110;
    pdf.text('Test Results:', 20, yPos);
    yPos += 10;

    if (test.form_data) {
      Object.entries(test.form_data).forEach(([key, value]) => {
        pdf.text(`${key}: ${value}`, 20, yPos);
        yPos += 8;
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
      });
    }

    // Return PDF
    const pdfBuffer = pdf.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="test-${id}.pdf"`);
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
