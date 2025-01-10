import React, { useState } from 'react';
import MediaCard from './MediaCard';

const MediaLibrary = ({ mediaList, onMediaSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter media based on search term
    const filteredMedia = mediaList.filter((media) =>
        Object.values(media)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="media-library-container">
            {/* Search Bar */}
            <div className="search-container">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search media library..."
                    className="search-input"
                />
            </div>

            {/* Media Grid */}
            <div className="media-grid-container">
                <div className="media-grid">
                    {filteredMedia.length > 0 ? (
                        filteredMedia.map((media, index) => (
                            <div key={index}>
                                <MediaCard metadata={media} onMediaSelect={onMediaSelect} />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center">
                            No media found. Try a different search.
                        </p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default MediaLibrary;


