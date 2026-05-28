-- CMT Labs Database Schema
-- Run this in Supabase SQL Editor

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create tests table
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL, -- e.g., "ASTM C39"
  form_data JSONB NOT NULL, -- All form field values
  test_results JSONB, -- Copy of form_data for clarity
  project_name TEXT,
  contractor_name TEXT,
  technician_name TEXT,
  certification_id TEXT,
  technician_signature TEXT, -- Image URL or base64
  status TEXT DEFAULT 'draft', -- draft, submitted, completed
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Create pdfs table
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_tests_user_id ON tests(user_id);
CREATE INDEX idx_tests_project ON tests(project_name);
CREATE INDEX idx_tests_contractor ON tests(contractor_name);
CREATE INDEX idx_tests_technician ON tests(technician_name);
CREATE INDEX idx_tests_test_type ON tests(test_type);
CREATE INDEX idx_photos_test_id ON photos(test_id);
CREATE INDEX idx_pdfs_test_id ON pdfs(test_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests (users can only see their own tests)
CREATE POLICY "Users can view their own tests"
  ON tests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tests"
  ON tests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tests"
  ON tests FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own tests"
  ON tests FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for photos
CREATE POLICY "Users can view photos from their own tests"
  ON photos FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM tests WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos to their own tests"
  ON photos FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id FROM tests WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for pdfs
CREATE POLICY "Users can view PDFs from their own tests"
  ON pdfs FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM tests WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert PDFs to their own tests"
  ON pdfs FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id FROM tests WHERE user_id = auth.uid()
    )
  );
