import React, { useState, useEffect } from 'react';
import URLInput from './components/URLInput';
import MediaLibrary from './components/MediaLibrary';
import VerticalMediaViewer from './components/VerticalMediaViewer';
import StandardMediaViewer from './components/StandardMediaViewer';
import CommentsSection from './components/CommentsSection';
import MediaStudio from './components/MediaStudio';
import './App.css';
import { io } from "socket.io-client";

const App = () => {
    const [mediaList, setMediaList] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMetadata, setEditedMetadata] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0); 
    const [isUploading, setIsUploading] = useState(false);
    const [mediaStudioActive, setMediaStudioActive] = useState(false);
    const [showSettings, setShowSettings] = useState(false); 
    const [rootPath, setRootPath] = useState("");
    const [showDownloadByUsername, setShowDownloadByUsername] = useState(false);
    const [username, setUsername] = useState("");
    const [includePosts, setIncludePosts] = useState(true);
    const [includeReposts, setIncludeReposts] = useState(false);
    const [activeTab, setActiveTab] = useState("URLDownload"); // Default tab
  

    useEffect(() => {
        const socket = io("http://localhost:5000/progress");
        socket.on("upload_progress", (data) => {
            setUploadProgress(data.progress);
        });
        return () => socket.disconnect();
    }, []);

    const handleDownloadByUsername = async () => {
        if (!username) {
            alert("Please enter a username.");
            return;
        }
    
        try {
            const response = await fetch("http://localhost:5000/process-username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    includePosts,
                    includeReposts,
                }),
            });
    
            const result = await response.json();
            alert(result.message || "Download started.");
        } catch (error) {
            console.error("Error downloading videos:", error);
            alert("Failed to start download.");
        }
    };

    const updateRootPath = async () => {
        if (!rootPath) return alert("Please enter a valid path.");
        try {
            const response = await fetch("http://localhost:5000/update-root", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ root_path: rootPath }),
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
            } else {
                alert(result.error || "Failed to update root path.");
            }
        } catch (error) {
            console.error("Error updating root path:", error);
        }
    };    

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            setIsUploading(true);
            setUploadProgress(0);

            try {
                const response = await fetch("http://localhost:5000/upload-local", {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    console.log("File uploaded successfully");
                    fetchMediaList(); // Refresh media list
                } else {
                    console.error("File upload failed");
                }
            } catch (error) {
                console.error("Error uploading file:", error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const renderSettings = () => (
        <div className="settings-container">
            <h2>Settings</h2>
            <label>
                Root Storage Location:
                <input
                    type="text"
                    value={rootPath}
                    onChange={(e) => setRootPath(e.target.value)}
                    placeholder="Enter new root path"
                />
            </label>
            <button onClick={updateRootPath}>Save</button>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case "Settings":
                return renderSettings();
            case "DownloadByUsername":
                return (
                    <div className="settings-container">
                        <h2>Download TikTok Videos</h2>
                        <label>
                            Username:
                            <input
                                type="text"
                                placeholder="Enter TikTok username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </label>
                        <button onClick={handleDownloadByUsername}>Download</button>
                    </div>
                );
            case "LocalUpload":
                return (
                    <div className="upload-container">
                        {isUploading ? (
                            <div className="progress-bar">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                                <span>{Math.round(uploadProgress)}%</span>
                            </div>
                        ) : (
                            <label htmlFor="local-upload" className="local-upload-label">
                                Select File
                                <input
                                    id="local-upload"
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="local-upload-input"
                                />
                            </label>
                        )}
                    </div>
                );
            case "URLDownload":
                return <URLInput onSubmit={() => fetchMediaList()} />;
            default:
                return null;
        }
    };
    
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

    const handleEditClick = () => {
        setIsEditing(true);
        setEditedMetadata({ ...selectedMedia });
    };

    const handleSaveClick = async () => {
        setIsEditing(false);
        setSelectedMedia(editedMetadata);

        try {
            await fetch('http://localhost:5000/update-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedMetadata),
            });
        } catch (error) {
            console.error('Error saving metadata:', error);
        }
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setEditedMetadata(null);
    };

    const handleInputChange = (field, value) => {
        setEditedMetadata({ ...editedMetadata, [field]: value });
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Media Archiver</h1>
            

            
                <nav className="navigation-bar">
                    <button
                        className={`nav-button ${activeTab === "Settings" ? "active" : ""}`}
                        onClick={() => setActiveTab("Settings")}
                    >
                        Settings
                    </button>
                    <button
                        className={`nav-button ${activeTab === "DownloadByUsername" ? "active" : ""}`}
                        onClick={() => setActiveTab("DownloadByUsername")}
                    >
                        Download Videos By Username
                    </button>
                    <button
                        className={`nav-button ${activeTab === "LocalUpload" ? "active" : ""}`}
                        onClick={() => setActiveTab("LocalUpload")}
                    >
                        Local Upload
                    </button>
                    <button
                        className={`nav-button ${activeTab === "URLDownload" ? "active" : ""}`}
                        onClick={() => setActiveTab("URLDownload")}
                    >
                        URL Download
                    </button>
                </nav>
                {renderTabContent()}
                <div>
                    <div className="main-content">
                        {/* Metadata Panel */}
                        {selectedMedia && (
                            <div className="metadata-display">
                                <img
                                    src={selectedMedia.thumbnail}
                                    alt={selectedMedia.title}
                                    className="metadata-thumbnail"
                                />
                                <h2>
                                    {isEditing ? (
                                        <input
                                            value={editedMetadata.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                        />
                                    ) : (
                                        selectedMedia.title
                                    )}
                                </h2>
                                <ul>
                                    {Object.keys(selectedMedia).map((key) =>
                                        key !== 'thumbnail' &&
                                        key !== 'title' &&
                                        key !== 'comments' &&
                                        key !== 'best_format' ? (
                                            <li key={key}>
                                                <strong>{key}:</strong>{' '}
                                                {isEditing ? (
                                                    <input
                                                        value={editedMetadata[key]}
                                                        onChange={(e) =>
                                                            handleInputChange(key, e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    selectedMedia[key]
                                                )}
                                            </li>
                                        ) : null
                                    )}
                                    {selectedMedia.best_format && (
                                        <li>
                                            <strong>Best Format:</strong>
                                            <ul>
                                                {Object.entries(selectedMedia.best_format).map(
                                                    ([subKey, subValue]) => (
                                                        <li key={subKey}>
                                                            <strong>{subKey}:</strong>{' '}
                                                            {isEditing ? (
                                                                <input
                                                                    value={
                                                                        editedMetadata.best_format[subKey]
                                                                    }
                                                                    onChange={(e) =>
                                                                        setEditedMetadata((prev) => ({
                                                                            ...prev,
                                                                            best_format: {
                                                                                ...prev.best_format,
                                                                                [subKey]: e.target.value,
                                                                            },
                                                                        }))
                                                                    }
                                                                />
                                                            ) : (
                                                                subValue
                                                            )}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
    
                        {/* Comments Scroller */}
                        {selectedMedia && (
                            <div className="comments-section">
                                <CommentsSection 
                                    comments={selectedMedia.comments || []} 
                                    tiktokUrl={selectedMedia.source_url} // Pass the source_url
                                />
                            </div>
                        )}

                        {mediaStudioActive ? (
                            <MediaStudio
                                selectedMedia={selectedMedia}
                                onMediaSave={(savedMedia) => {
                                    console.log("Media saved:", savedMedia);
                                    setMediaStudioActive(false); // Close Media Studio
                                }}
                                onClose={() => setMediaStudioActive(false)} // Close Media Studio when X is clicked
                            />
                        ) : (
                            <div className="media-viewers">
                                {selectedMedia?.media_url.includes('/TikTok/') ? (
                                    <VerticalMediaViewer media={selectedMedia} />
                                ) : (
                                    <StandardMediaViewer media={selectedMedia} />
                                )}
                                <button
                                    onClick={() => {
                                        console.log("Open Media Studio clicked");
                                        setMediaStudioActive(true); // Open Media Studio
                                    }}
                                >
                                    Open Media Studio
                                </button>
                            </div>
                        )}
    
                        {/* Search Container */}
                        <div className="search-container">
                            <div className="search-results">
                                <MediaLibrary
                                    mediaList={mediaList}
                                    onMediaSelect={(media) => setSelectedMedia(media)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    );    
};

export default App;
