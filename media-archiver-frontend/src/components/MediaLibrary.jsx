import React, { useState, useEffect } from 'react';
import MediaCard from './MediaCard';

const MediaLibrary = ({ mediaList, onMediaSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [autoPlay, setAutoPlay] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter media based on search term
    const filteredMedia = mediaList.filter((media) =>
        Object.values(media)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // Play the next video based on autoPlay or shuffle
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

    // Handle Auto Play and Shuffle
    useEffect(() => {
        if (!autoPlay && !shuffle) return;

        const videoDuration = filteredMedia[currentIndex]?.duration * 1000 || 0;
        const timer = setTimeout(playNext, videoDuration);

        return () => clearTimeout(timer);
    }, [autoPlay, shuffle, currentIndex, filteredMedia, onMediaSelect]);

    // Handle Repeat functionality
    useEffect(() => {
        const videoElement = document.querySelector(`#video-${currentIndex}`);
        if (!videoElement) return;
    
        const handleEnded = () => {
            if (repeat) {
                videoElement.currentTime = 0; // Reset video to the start
                videoElement.play(); // Replay video
            }
        };
    
        videoElement.addEventListener('ended', handleEnded);
        return () => videoElement.removeEventListener('ended', handleEnded);
    }, [repeat, currentIndex]);
    

    // Button handlers
    const handleAutoPlay = () => {
        setAutoPlay((prev) => !prev);
        setShuffle(false);
        setRepeat(false);
    };

    const handleShuffle = () => {
        setShuffle((prev) => !prev);
        setAutoPlay(false);
        setRepeat(false);
    };

    const handleRepeat = () => {
        setRepeat((prev) => !prev);
        setAutoPlay(false);
        setShuffle(false);
    };

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
                <div className="control-buttons">
                    <button
                        className={`control-button ${autoPlay ? 'active' : ''}`}
                        onClick={handleAutoPlay}
                    >
                        Auto Play
                    </button>
                    <button
                        className={`control-button ${shuffle ? 'active' : ''}`}
                        onClick={handleShuffle}
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
                                        setRepeat(false); // Reset repeat when a new video is selected
                                    }}
                                />
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
