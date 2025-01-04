import React from 'react';
import MediaCard from './MediaCard';

const MediaLibrary = ({ mediaList }) => {
    return (
        <div className="grid grid-cols-3 gap-4 mt-6">
            {mediaList.length > 0 ? (
                mediaList.map((media, index) => (
                    <MediaCard key={index} metadata={media} />
                ))
            ) : (
                <p className="text-gray-500 col-span-3 text-center">No media available. Add some URLs to start.</p>
            )}
        </div>
    );
};

export default MediaLibrary;