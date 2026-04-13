import React from 'react';

const DebugApp = () => {
    console.log('DebugApp is rendering');
    return (
        <div style={{ padding: '50px', background: 'gold', color: 'black', fontSize: '24px', textAlign: 'center' }}>
            <h1>DEBUG MODE ACTIVE</h1>
            <p>If you can see this, the React environment is working fine.</p>
        </div>
    );
};

export default DebugApp;
