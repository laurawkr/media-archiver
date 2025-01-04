import React from 'react';

const VerticalMediaViewer = ({ media }) => {
    if (!media) return null;

    return (
        <div className="viewer-container">
            <h2 className="viewer-title">{media.title}</h2>
            <video
                src={media.media_url}
                controls
                autoPlay
                muted
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
