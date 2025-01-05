import React, { useState } from 'react';
import MediaCard from './MediaCard';

const MediaLibrary = ({ mediaList, onMediaSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMedia = mediaList.filter((media) =>
        Object.values(media)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div>
                    {/* Search Bar */}
                    <div className="search-container">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search media library..."
                className="search-input"
            />
            <button className="search-button">Search</button>
        </div>

            {/* Media Grid */}
            <div className="grid grid-cols-3 gap-6 mt-6">
            {filteredMedia.length > 0 ? (
                filteredMedia.map((media, index) => (
                    <div key={index}>
                        <MediaCard metadata={media} onMediaSelect={onMediaSelect} />
                    </div>
                ))
            ) : (
                <p className="text-gray-500 col-span-3 text-center">
                    No media found. Try a different search.
                </p>
            )}
            </div>
        </div>
    );
};

export default MediaLibrary;
