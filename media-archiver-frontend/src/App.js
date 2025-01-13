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
    const [searchTerm, setSearchTerm] = useState(''); 
    const [isEditing, setIsEditing] = useState(false);
    const [editedMetadata, setEditedMetadata] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0); 
    const [isUploading, setIsUploading] = useState(false);
    const [mediaStudioActive, setMediaStudioActive] = useState(false);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [rootPath, setRootPath] = useState("");
    const [showDownloadByUsername, setShowDownloadByUsername] = useState(false);
    const [username, setUsername] = useState("");
    const [includePosts, setIncludePosts] = useState(true);
    const [includeReposts, setIncludeReposts] = useState(false);
    const [activeTab, setActiveTab] = useState("URLDownload"); // Default tab
    const [maxScreenWidth, setMaxScreenWidth] = useState(window.screen.width);


    useEffect(() => {
        const socket = io("http://localhost:5000/progress");
        socket.on("upload_progress", (data) => {
            setUploadProgress(data.progress);
        });
        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        // Update maxScreenWidth if the window is resized
        const handleResize = () => {
          setMaxScreenWidth(window.screen.width);
        };
    
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (selectedMedia) {
            // Check if the "New" tag exists and remove it
            const updatedTags = selectedMedia.tags?.filter((tag) => tag !== "New") || [];
    
            if (updatedTags.length !== (selectedMedia.tags?.length || 0)) {
                const updatedMedia = { ...selectedMedia, tags: updatedTags };
    
                // Update backend metadata
                fetch("http://localhost:5000/update-metadata", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedMedia),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.message) {
                            console.log("Updated metadata successfully:", data.message);
                            setSelectedMedia(updatedMedia); // Update UI
                        }
                    })
                    .catch((error) => console.error("Error updating metadata:", error));
            }
        }
    }, [selectedMedia]);    

    const [selectedTags, setSelectedTags] = useState([]); // Add state to track selected tags

    const addTag = (tag) => {
        if (!selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // Fetch the current root path from the backend
    const fetchRootPath = async () => {
        try {
        const response = await fetch("http://localhost:5000/get-root");
        if (response.ok) {
            const data = await response.json();
            setRootPath(data.root_path); // Set the rootPath state
        } else {
            console.error("Failed to fetch root path.");
        }
        } catch (error) {
        console.error("Error fetching root path:", error);
        }
    };

    // Call fetchRootPath when the component mounts
    useEffect(() => {
        fetchRootPath();
    }, []);

    const [isDarkMode, setIsDarkMode] = useState(false);

    // Toggle theme
    const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-theme', !isDarkMode);
    };

    const removeTag = (tag) => {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
    };

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
        <div className={`settings-container ${isDarkMode ? 'dark-theme' : ''}`}>
          <h2>Settings</h2>
          {/* Dark Mode */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>Dark Mode:</label>
            <span style={{ fontWeight: 'bold' }}>
              {isDarkMode ? 'ON' : 'OFF'}
            </span>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleTheme}
              style={{ marginRight: '5px' }}
            />
          </div>
      
          {/* Root Storage Location */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
            <label style={{ marginBottom: '5px' }}>
              Root Storage Location:
              <span style={{ marginLeft: '10px', fontStyle: 'italic', color: 'grey' }}>
                {rootPath || 'No path set'}
              </span>
            </label>
            <input
              type="text"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              placeholder="Enter new root path"
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '5px',
              }}
            />
          </div>
      
          {/* Save Button */}
          <button onClick={updateRootPath} style={{ padding: '10px 20px' }}>
            Save
          </button>
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
            <style>
                {`
                @media (max-width: ${maxScreenWidth}px) {
                    body {
                    transform: scale(0.95);
                    transform-origin: top left;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                    color: #333;
                    }
                }
                `}
            </style>
            <header className={`page-header ${isDarkMode ? 'dark-theme' : ''}`}>
                <h1 className="text-4xl font-extrabold mb-6 text-center text-purple-400">Media Archiver</h1>
            </header>
                <nav className="navigation-bar ${isDarkMode ? 'dark-theme' : ''}">
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
                        {/* Metadata Viewer */}
                        {selectedMedia && (
                        <div className={`metadata-display ${isDarkMode ? 'dark-theme' : ''}`}>
                            <img
                                src={selectedMedia.thumbnail}
                                alt={selectedMedia.title}
                                className="metadata-thumbnail"
                            />
                            <h2 className={`metadata-title ${isDarkMode ? 'dark-theme' : ''}`}>
                                {selectedMedia.title}
                            </h2>
                            <ul className="metadata-list">
                                {Object.keys(selectedMedia).map((key) =>
                                    key !== 'thumbnail' &&
                                    key !== 'title' &&
                                    key !== 'comments' &&
                                    key !== 'best_format' ? (
                                        <li key={key} className={`metadata-item ${isDarkMode ? 'dark-theme' : ''}`}>
                                            <strong className="metadata-key">{key}:</strong> {selectedMedia[key]}
                                        </li>
                                    ) : null
                                )}
                                {selectedMedia.best_format && (
                                    <li className={`metadata-item ${isDarkMode ? 'dark-theme' : ''}`}>
                                        <strong className="metadata-key">Best Format:</strong>
                                        <ul className="metadata-sublist">
                                            {Object.entries(selectedMedia.best_format).map(([subKey, subValue]) => (
                                                <li key={subKey} className={`metadata-subitem ${isDarkMode ? 'dark-theme' : ''}`}>
                                                    <strong className="metadata-subkey">{subKey}:</strong> {subValue}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                            </ul>

                                {/* Tags Section */}
                                <div className="tag-container ${isDarkMode ? 'dark-theme' : ''}">
                                    {selectedMedia.tags?.length ? (
                                        selectedMedia.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className={`tag-badge ${
                                                    selectedTags.includes(tag) ? 'active' : ''
                                                }`}
                                                onClick={() =>
                                                    selectedTags.includes(tag)
                                                        ? removeTag(tag)
                                                        : addTag(tag)
                                                }
                                            >
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span>No tags available</span>
                                    )}
                                    {/* Add Tags Feature */}
                                    <button
                                    className="add-tag-button"
                                    onClick={() => setIsAddingTag(true)}
                                    >
                                    Add Tags
                                    </button>
                                    {isAddingTag && (
                                    <div className="add-tag-input-container ${isDarkMode ? 'dark-theme' : ''}">
                                        <input
                                        type="text"
                                        placeholder="Enter a tag"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        className="add-tag-input"
                                        />
                                        <button
                                        className="save-tag-button"
                                        onClick={async () => {
                                            if (newTag.trim()) {
                                            const updatedTags = [...(selectedMedia.tags || []), newTag.trim()];
                                            const updatedMedia = { ...selectedMedia, tags: updatedTags };

                                            try {
                                                await fetch('http://localhost:5000/update-metadata', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(updatedMedia),
                                                });
                                                setSelectedMedia(updatedMedia); // Update UI
                                                setIsAddingTag(false);
                                                setNewTag("");
                                            } catch (error) {
                                                console.error('Error saving tag:', error);
                                                alert('Failed to save tag.');
                                            }
                                            }
                                        }}
                                        >
                                        Save
                                        </button>
                                        <button className="cancel-tag-button" onClick={() => setIsAddingTag(false)}>
                                        Cancel
                                        </button>
                                    </div>
                                    )}
                                </div>
                            </div>
                        )}
    
                        {/* Comments Scroller */}
                        {selectedMedia && (
                            <div className="comments-section ${isDarkMode ? 'dark-theme' : ''}">
                                <CommentsSection 
                                    isDarkMode={isDarkMode}
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
                                onClose={() => setMediaStudioActive(false)}
                                isDarkMode={isDarkMode} 
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
                        <div className="search-container ${isDarkMode ? 'dark-theme' : ''}">
                            <div className="search-results ${isDarkMode ? 'dark-theme' : ''}">
                            <MediaLibrary
                                mediaList={mediaList}
                                onMediaSelect={(media) => setSelectedMedia(media)}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                addTag={addTag}
                                removeTag={removeTag}
                                selectedTags={selectedTags}
                                isDarkMode={isDarkMode}
                            />
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    );    
};

export default App;
