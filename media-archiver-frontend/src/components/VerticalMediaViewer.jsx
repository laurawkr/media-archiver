import React, { useEffect, useRef } from 'react';

const VerticalMediaViewer = ({ media, repeat }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const handleEnded = () => {
            if (repeat) {
                videoElement.currentTime = 0; // Reset video to the start
                videoElement.play(); // Replay video
            }
        };

        videoElement.addEventListener('ended', handleEnded);
        return () => videoElement.removeEventListener('ended', handleEnded);
    }, [repeat]);

    if (!media) return null;

    return (
        <div className="viewer-container">
            <h2 className="viewer-title">
            {media.title.length > 100 ? `${media.title.substring(0, 100)}...` : media.title}
            </h2>
            <video
                ref={videoRef}
                src={media.media_url}
                controls
                autoPlay
                className="vertical-viewer"
                style={{
                    aspectRatio: '9 / 16',
                }}
                onLoadedData={() => console.log('Vertical video loaded successfully:', media.media_url)}
                onError={(e) => console.error('Error loading vertical video:', e)}
            />
        </div>
    );
};

export default VerticalMediaViewer;

