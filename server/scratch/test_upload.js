const fs = require('fs');

const uploadImage = async () => {
    try {
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✔ Logged in');

        const formData = new FormData();
        const imagePath = 'C:\\Users\\Amit MIG\\.gemini\\antigravity\\brain\\3ee98b56-60ad-4178-89a9-a38a3d27d674\\test_flower_image_1776079762389.png';
        const fileBuffer = fs.readFileSync(imagePath);
        const fileName = 'test_flower.png';
        const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
        
        formData.append('files', fileBlob, fileName);
        formData.append('title', 'Failsafe Test Image');

        console.log('Uploading image...');
        const uploadRes = await fetch('http://localhost:5000/api/media', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const uploadData = await uploadRes.json();
        console.log('✔ Upload Success!');
        console.log('Media Item:', JSON.stringify(uploadData, null, 2));

    } catch (err) {
        console.error('✖ Error:', err.message);
        process.exit(1);
    }
};

uploadImage();
