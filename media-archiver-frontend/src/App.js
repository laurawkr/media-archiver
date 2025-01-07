import React, { useState, useEffect } from 'react';
import URLInput from './components/URLInput';
import MediaLibrary from './components/MediaLibrary';
import VerticalMediaViewer from './components/VerticalMediaViewer';
import StandardMediaViewer from './components/StandardMediaViewer';
import CommentsSection from './components/CommentsSection';
import './App.css';

const App = () => {
    const [mediaList, setMediaList] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);

    const fetchMediaList = async () => {
        try {
            const response = await fetch('http://localhost:5000/list-media');
            if (response.ok) {
                const data = await response.json();
                setMediaList(data);
            } else {
                console.error("Failed to fetch media list.");
            }
        } catch (error) {
            console.error("Error fetching media list:", error);
        }
    };

    useEffect(() => {
        fetchMediaList();
    }, []);
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Media Archiver</h1>
            <URLInput onSubmit={() => fetchMediaList()} />
            <div className="main-content">
                {selectedMedia && (
                    <div className="metadata-display">
                        <img
                            src={selectedMedia.thumbnail}
                            alt={selectedMedia.title}
                            className="metadata-thumbnail"
                        />
                        <h2>{selectedMedia.title}</h2>
                        <ul>
                            {Object.keys(selectedMedia).map((key) =>
                                key !== 'thumbnail' &&
                                key !== 'title' &&
                                key !== 'comments' &&
                                key !== 'best_format' ? (
                                    <li key={key}>
                                        <strong>{key}:</strong> {selectedMedia[key]}
                                    </li>
                                ) : null
                            )}
                        </ul>
                    </div>
                )}
                {/* Comments Section */}
                {selectedMedia && (
                    <CommentsSection comments={selectedMedia.comments || []} />
                )}
                {/* Media Viewer */}
                <div className="media-viewers">
                    {selectedMedia?.media_url.includes('/TikTok/') ? (
                        <VerticalMediaViewer media={selectedMedia} />
                    ) : (
                        <StandardMediaViewer media={selectedMedia} />
                    )}
                </div>
                <div className="search-container">
                    <MediaLibrary
                        mediaList={mediaList}
                        onMediaSelect={(media) => setSelectedMedia(media)}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
