/**
 * CMT Labs API Client
 * Handles all communication between frontend and backend API
 * Manages authentication, test saves, and data retrieval
 */

const CMTLabsAPI = {
    // Configuration
    API_URL: 'https://cmt-labs-backend.vercel.app',

    // Get the JWT token from localStorage
    getToken() {
        return localStorage.getItem('cmt_token');
    },

    // Set the JWT token in localStorage
    setToken(token) {
        if (token) {
            localStorage.setItem('cmt_token', token);
        } else {
            localStorage.removeItem('cmt_token');
        }
    },

    // Get current user from localStorage
    getCurrentUser() {
        const user = localStorage.getItem('cmt_user');
        return user ? JSON.parse(user) : null;
    },

    // Set current user in localStorage
    setCurrentUser(user) {
        if (user) {
            localStorage.setItem('cmt_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('cmt_user');
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Sign up a new user
     */
    async signup(email, password, technicianName, companyName) {
        try {
            const response = await fetch(`${this.API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    technician_name: technicianName,
                    company_name: companyName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Store token and user info
            this.setToken(data.token);
            this.setCurrentUser(data.user);

            return data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user info
            this.setToken(data.token);
            this.setCurrentUser(data.user);

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Logout user
     */
    logout() {
        this.setToken(null);
        this.setCurrentUser(null);
    },

    /**
     * Save a test
     */
    async saveTest(testData) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            const response = await fetch(`${this.API_URL}/api/tests/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    test_id: testData.testId,
                    test_type: testData.testCode,
                    form_data: testData.formData,
                    test_results: testData.formData,
                    project_name: testData.formData.projectName?.value || '',
                    contractor_name: testData.contractor || '',
                    technician_name: testData.createdBy || '',
                    certification_id: testData.formData.certification_id?.value || '',
                    technician_signature: testData.formData.certification_signature?.value || ''
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save test');
            }

            console.log('Test saved successfully:', data);
            return data;
        } catch (error) {
            console.error('Save test error:', error);
            throw error;
        }
    },

    /**
     * Get all tests with optional filters
     */
    async getTests(filters = {}) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            // Build query string from filters
            const queryParams = new URLSearchParams();
            if (filters.project) queryParams.append('project', filters.project);
            if (filters.contractor) queryParams.append('contractor', filters.contractor);
            if (filters.technician) queryParams.append('technician', filters.technician);
            if (filters.test_code) queryParams.append('test_code', filters.test_code);

            const url = `${this.API_URL}/api/tests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch tests');
            }

            return data.tests || [];
        } catch (error) {
            console.error('Get tests error:', error);
            throw error;
        }
    },

    /**
     * Get a single test by ID
     */
    async getTest(testId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            const response = await fetch(`${this.API_URL}/api/tests/${testId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch test');
            }

            return data;
        } catch (error) {
            console.error('Get test error:', error);
            throw error;
        }
    },

    /**
     * Update a test
     */
    async updateTest(testId, testData) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            const response = await fetch(`${this.API_URL}/api/tests/${testId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update test');
            }

            return data;
        } catch (error) {
            console.error('Update test error:', error);
            throw error;
        }
    },

    /**
     * Delete a test
     */
    async deleteTest(testId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            const response = await fetch(`${this.API_URL}/api/tests/${testId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete test');
            }

            return data;
        } catch (error) {
            console.error('Delete test error:', error);
            throw error;
        }
    },

    /**
     * Upload photo for a test
     */
    async uploadPhoto(file, testId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('test_id', testId);

            const response = await fetch(`${this.API_URL}/api/photos/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload photo');
            }

            return data;
        } catch (error) {
            console.error('Upload photo error:', error);
            throw error;
        }
    },

    /**
     * Get photos for a test
     */
    async getPhotos(testId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            const response = await fetch(`${this.API_URL}/api/photos/${testId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch photos');
            }

            return data.photos || [];
        } catch (error) {
            console.error('Get photos error:', error);
            throw error;
        }
    },

    /**
     * Generate PDF for a test
     */
    async generatePDF(testId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated. Please login first.');
            }

            const response = await fetch(`${this.API_URL}/api/tests/${testId}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            // Return blob for PDF download
            return await response.blob();
        } catch (error) {
            console.error('Generate PDF error:', error);
            throw error;
        }
    }
};

// Make it globally available
window.CMTLabsAPI = CMTLabsAPI;
