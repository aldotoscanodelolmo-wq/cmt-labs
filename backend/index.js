// CMT Labs Backend API Server
// Runs on Node.js + Express + Supabase

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { jsPDF } from 'jspdf';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'https://yourdomain.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTH ENDPOINTS
// ============================================

// Signup
app.post('/api/auth/signup', async (req, res) => {
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
      return res.status(400).json({ error: error.message });
    }

    const user = data[0];

    // Create JWT token
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        technician_name: user.technician_name
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user from database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        technician_name: user.technician_name
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TEST ENDPOINTS
// ============================================

// Save test (create or update)
app.post('/api/tests/save', authenticateToken, async (req, res) => {
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
      res.json({ message: 'Test updated', test: data[0] });
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
      res.json({ message: 'Test created', test: data[0] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tests with filtering
app.get('/api/tests', authenticateToken, async (req, res) => {
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
    res.json({ tests: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single test
app.get('/api/tests/:id', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

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

    res.json({ test, photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update test
app.put('/api/tests/:id', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
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
    res.json({ message: 'Test updated', test: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete test
app.delete('/api/tests/:id', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Test deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PHOTO ENDPOINTS
// ============================================

// Upload photo
app.post('/api/photos/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { test_id } = req.body;
    const file = req.file;

    if (!file || !test_id) {
      return res.status(400).json({ error: 'File and test_id required' });
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

    // Upload to Supabase Storage
    const filename = `${test_id}/${Date.now()}-${file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from('test-photos')
      .upload(filename, file.buffer, {
        contentType: file.mimetype
      });

    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    // Get public URL
    const { data } = supabase.storage
      .from('test-photos')
      .getPublicUrl(filename);

    // Store photo record in database
    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert([{ test_id, photo_url: data.publicUrl }])
      .select();

    if (dbError) return res.status(400).json({ error: dbError.message });

    res.json({ message: 'Photo uploaded', photo: photoData[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get photos for test
app.get('/api/photos/:test_id', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { test_id } = req.params;

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

    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('test_id', test_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PDF ENDPOINTS
// ============================================

// Generate PDF
app.get('/api/tests/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

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
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`CMT Labs API Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
