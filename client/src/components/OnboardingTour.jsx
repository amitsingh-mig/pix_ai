import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const OnboardingTour = ({ onTourEnd }) => {
    const [run, setRun] = useState(false);

    useEffect(() => {
        const isTourCompleted = localStorage.getItem('tourCompleted');
        if (!isTourCompleted) {
            setRun(true);
        }

        const handleRestart = () => {
            localStorage.removeItem('tourCompleted');
            setRun(false);
            setTimeout(() => setRun(true), 100);
        };

        window.addEventListener('restartTour', handleRestart);
        return () => window.removeEventListener('restartTour', handleRestart);
    }, []);

    const steps = [
        {
            target: '.sidebar',
            content: 'Use this sidebar to navigate between dashboard sections.',
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '.media-gallery',
            content: 'This is your media library. All uploaded images and videos appear here.',
            placement: 'bottom',
        },
        {
            target: '.upload-button',
            content: 'Click here to upload new images or videos.',
            placement: 'bottom',
        },
        {
            target: '.upload-form',
            content: 'Select image or video to upload here.',
            placement: 'right',
        },
        {
            target: '.tag-input',
            content: 'Add tags manually to organize your media.',
            placement: 'top',
        },
        {
            target: '.ai-tag-button',
            content: 'Click here and AI will automatically generate tags for your image.',
            placement: 'top',
        },
        {
            target: '.search-bar',
            content: 'Use AI search to instantly find media files.',
            placement: 'bottom',
        },
        {
            target: '.profile-menu',
            content: 'Access your account settings and logout here.',
            placement: 'bottom',
        },
        {
            target: 'body',
            content: 'You are ready to use PIXAI.',
            placement: 'center',
        },
    ];

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            localStorage.setItem('tourCompleted', 'true');
            if (onTourEnd) onTourEnd();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#FFD41D',
                    textColor: '#0F172A',
                    zIndex: 1000,
                },
            }}
            locale={{
                last: 'Finish',
                skip: 'Skip Tour',
            }}
        />
    );
};

export default OnboardingTour;
