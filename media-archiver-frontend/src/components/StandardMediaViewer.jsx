import React from 'react';

const StandardMediaViewer = ({ media }) => {
    if (!media) return null;

    return (
        <div className="viewer-container">
            <h2 className="viewer-title">{media.title}</h2>
            <video
                src={media.media_url}
                controls
                autoPlay
                muted
                className="standard-viewer"
                style={{
                    aspectRatio: '16 / 9',
                }}
                onLoadedData={() => console.log('Standard video loaded successfully:', media.media_url)}
                onError={(e) => console.error('Error loading standard video:', e)}
            />
        </div>
    );
};

export default StandardMediaViewer;
