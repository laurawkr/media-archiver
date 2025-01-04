import React from 'react';

const StandardMediaViewer = ({ media }) => {
    if (!media) return null;

    return (
        <div className="viewer-container">
            <h2 className="viewer-title">{media.title}</h2>
            <video
                src={media.video_url}
                controls
                className="standard-viewer"
                style={{ aspectRatio: '16 / 9' }}
            />
        </div>
    );
};

export default StandardMediaViewer;