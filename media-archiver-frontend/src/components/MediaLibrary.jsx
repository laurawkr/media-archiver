import React, { useState, useEffect } from 'react'; // Fix: Import hooks
import MediaCard from './MediaCard'; // Fix: Import MediaCard

const MediaLibrary = ({ mediaList, onMediaSelect, addTag, removeTag, selectedTags = [], searchTerm, setSearchTerm }) => {
    const [autoPlay, setAutoPlay] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter media based on search term and selected tags
    const filteredMedia = mediaList.filter((media) => {
        const matchesSearchTerm = Object.values(media)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesTags = selectedTags.length
            ? selectedTags.every((tag) => media.tags?.includes(tag))
            : true;

        return matchesSearchTerm && matchesTags;
    });

    const playNext = () => {
        if (shuffle) {
            const randomIndex = Math.floor(Math.random() * filteredMedia.length);
            setCurrentIndex(randomIndex);
            onMediaSelect(filteredMedia[randomIndex]);
        } else if (autoPlay) {
            const nextIndex = (currentIndex + 1) % filteredMedia.length;
            setCurrentIndex(nextIndex);
            onMediaSelect(filteredMedia[nextIndex]);
        }
    };
    

    useEffect(() => {
        if (!autoPlay && !shuffle) return;

        const videoDuration = filteredMedia[currentIndex]?.duration * 1000 || 0;
        const timer = setTimeout(playNext, videoDuration);

        return () => clearTimeout(timer);
    }, [autoPlay, shuffle, currentIndex, filteredMedia, onMediaSelect]);

    return (
        <div className="media-library-container">

            {/* Selected Tags */}
            {selectedTags?.length > 0 && (
                <div className="selected-tags-container">
                    {selectedTags.map((tag, index) => (
                        <span key={index} className="selected-tag">
                            {tag}
                            <span
                                className="remove-tag"
                                onClick={() => removeTag(tag)} // Fix: Use removeTag prop
                            >
                                &times;
                            </span>
                        </span>
                    ))}
                </div>
            )}

            {/* Search Bar */}
            <div className="search-container">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} // Fix: Use setSearchTerm prop
                    placeholder="Search media library..."
                    className="search-input"
                />
                <div className="control-buttons">
                    <button
                        className={`control-button ${autoPlay ? 'active' : ''}`}
                        onClick={() => setAutoPlay((prev) => !prev)}
                    >
                        Auto Play
                    </button>
                    <button
                        className={`control-button ${shuffle ? 'active' : ''}`}
                        onClick={() => setShuffle((prev) => !prev)}
                    >
                        Shuffle
                    </button>
                </div>
            </div>

            {/* Media Grid */}
            <div className="media-grid-container">
                <div className="media-grid">
                    {filteredMedia.length > 0 ? (
                        filteredMedia.map((media, index) => (
                            <div key={index}>
                                <MediaCard
                                    metadata={media}
                                    onMediaSelect={(selectedMedia) => {
                                        setCurrentIndex(index);
                                        onMediaSelect(selectedMedia);
                                        setRepeat(false);
                                    }}
                                />
                                <div className="tag-container">
                                    {media.tags?.length ? (
                                        media.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="tag-badge"
                                                onClick={() => addTag(tag)} // Fix: Use addTag prop
                                            >
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="no-tags">No tags available</span>
                                    )}
                                </div>
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
