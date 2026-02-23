try {
    console.log('Testing authRoutes...');
    require('./routes/authRoutes');
    console.log('Testing mediaRoutes...');
    require('./routes/mediaRoutes');
    console.log('Testing adminRoutes...');
    require('./routes/adminRoutes');
    console.log('Testing albumRoutes...');
    require('./routes/albumRoutes');
    console.log('Testing userRoutes...');
    require('./routes/userRoutes');
    console.log('All routes loaded successfully!');
} catch (err) {
    console.error('Error loading routes:', err);
}
