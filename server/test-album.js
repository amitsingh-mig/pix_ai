const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

async function testAlbumCreation() {
    const userId = '699842310bb06e501b50738e';
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('Using Token:', token);

    try {
        const response = await api.post('http://localhost:5000/api/albums', {
            name: 'Test Album from Node Script'
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
        console.error('Error Message:', error.message);
    }
}

// Simple wrapper for axios if 'api' is not defined (oops, used 'api' from frontend context mentally)
const api = axios;

testAlbumCreation();
