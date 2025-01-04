import React from 'react';

const VerticalMediaViewer = ({ media }) => {
    if (!media) return null;

    return (
        <div className="viewer-container">
            <h2 className="viewer-title">{media.title}</h2>
            <video
                src={media.video_url}
                controls
                className="vertical-viewer"
                style={{ aspectRatio: '9 / 16' }}
            />
        </div>
    );
};

export default VerticalMediaViewer;