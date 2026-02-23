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
            // Small timeout to ensure the state reset triggers a restart
            setTimeout(() => setRun(true), 300);
        };

        window.addEventListener('restartTour', handleRestart);
        return () => window.removeEventListener('restartTour', handleRestart);
    }, []);

    const steps = [
        {
            target: '#nav-dashboard',
            content: 'Welcome to PIXAI! This is your Command Center where you manage everything.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '#media-gallery',
            content: 'Your entire media library lives here. We use high-performance lazy loading for a smooth browsing experience.',
            placement: 'top',
        },
        {
            target: '#search-bar',
            content: 'Search anything! Locations, AI-generated tags, or even camera models. Our AI knows exactly what is in your photos.',
            placement: 'bottom',
        },
        {
            target: '#navigation-path',
            content: 'Exploring deep? This path connects the albums you visit, allowing you to jump back to any previous view with one click.',
            placement: 'bottom',
        },
        {
            target: '#nav-upload',
            content: 'Ready to expand? Click here to start our industrial-grade bulk upload process.',
            placement: 'bottom',
        },
        {
            target: '#upload-zone',
            content: 'Drop up to 120 files here. We handle massive batches with concurrent processing and AI analysis.',
            placement: 'right',
        },
        {
            target: '#album-select',
            content: 'Organize your media into curated collections for easier management.',
            placement: 'left',
        },
        {
            target: '#location-search',
            content: 'Tag your moments! Search for specific locations or let our AI extract GPS data directly from your files.',
            placement: 'left',
        },
        {
            target: '#profile-section',
            content: 'Customize your presence! Manage your profile photo and security settings here.',
            placement: 'bottom',
        },
        {
            target: 'body',
            content: 'You are now ready to harness the full power of PIXAI. Enjoy your journey!',
            placement: 'center',
            locale: { last: 'Explore Now' }
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
            scrollOffset={100}
            styles={{
                options: {
                    primaryColor: '#FFD41D',
                    textColor: '#0F172A',
                    backgroundColor: '#ffffff',
                    arrowColor: '#ffffff',
                    zIndex: 10000,
                },
                tooltipContainer: {
                    textAlign: 'left',
                    borderRadius: '24px',
                    padding: '10px'
                },
                buttonNext: {
                    borderRadius: '12px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    padding: '12px 24px',
                    color: '#0F172A'
                },
                buttonBack: {
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginRight: '10px',
                    color: '#64748B'
                },
                buttonSkip: {
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#94A3B8'
                }
            }}
            locale={{
                last: 'Finish',
                skip: 'Skip Tour',
            }}
        />
    );
};

export default OnboardingTour;
