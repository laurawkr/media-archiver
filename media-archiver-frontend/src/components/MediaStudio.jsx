import React, { useState, useRef } from "react";

const MediaStudio = ({ selectedMedia, onMediaSave, onClose, isDarkMode }) => {
    const [action, setAction] = useState(""); // Track the current action (video/sound/both)
    const [clipState, setClipState] = useState({
        videoStartTime: null,
        videoEndTime: null,
        audioStartTime: null,
        audioEndTime: null,
    });
    const [clipName, setClipName] = useState("");
    const [audioSource, setAudioSource] = useState(selectedMedia); // Separate audio source
    const [videoSource, setVideoSource] = useState(selectedMedia); // Separate video source
    const videoRef = useRef(null);

    const handleActionToggle = (newAction) => {
        if (!videoRef.current || !selectedMedia) {
            console.error("Video reference or selected media is not available");
            return;
        }

        const validActions = ["video", "sound", "both"];
        if (!validActions.includes(newAction)) {
            console.error(`Invalid action: ${newAction}`);
            return;
        }

        const currentTime = videoRef.current.currentTime;

        if (action === newAction) {
            console.log(`Finalizing action: ${newAction} at time ${currentTime}`);
            setClipState((prev) => {
                const updatedState = { ...prev };
                if (newAction === "video") {
                    updatedState.videoEndTime = currentTime;
                } else if (newAction === "sound") {
                    updatedState.audioEndTime = currentTime;
                } else if (newAction === "both") {
                    updatedState.videoEndTime = currentTime;
                    updatedState.audioEndTime = currentTime;
                }
                return updatedState;
            });
            setAction(""); // Reset action state
        } else {
            console.log(`Starting new action: ${newAction} at time ${currentTime}`);
            setClipState((prev) => ({
                ...prev,
                ...(newAction === "video" && {
                    videoStartTime: currentTime,
                    videoEndTime: null,
                }),
                ...(newAction === "sound" && {
                    audioStartTime: currentTime,
                    audioEndTime: null,
                }),
                ...(newAction === "both" && {
                    videoStartTime: currentTime,
                    videoEndTime: null,
                    audioStartTime: currentTime,
                    audioEndTime: null,
                }),
            }));

            if (newAction === "video" || newAction === "both") {
                setVideoSource(selectedMedia);
            }
            if (newAction === "sound" || newAction === "both") {
                setAudioSource(selectedMedia);
            }

            setAction(newAction); // Set state
        }
    };

    const saveClip = async () => {
        console.log("Save button clicked");
    
        if (!clipName) {
            console.error("Missing clip name.");
            return;
        }
        if (!videoSource) {
            console.error("Missing video source.");
            return;
        }
    
        const hasVideo = clipState.videoStartTime !== null && clipState.videoEndTime !== null;
        const hasAudio = clipState.audioStartTime !== null && clipState.audioEndTime !== null;
    
        if (!hasVideo && !hasAudio) {
            console.error("No valid video or audio clip defined.");
            return;
        }
    
        const clipData = {
            video_url: hasVideo ? videoSource?.media_url || "" : null,
            audio_url: hasAudio ? audioSource?.media_url || "" : null,
            start_time: hasAudio ? clipState.audioStartTime : clipState.videoStartTime,
            end_time: hasAudio ? clipState.audioEndTime : clipState.videoEndTime,
            clip_name: clipName,
        };
    
        console.log("Sending clipData to backend:", clipData);
    
        try {
            const response = await fetch("http://localhost:5000/save-clip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(clipData),
            });
    
            if (response.ok) {
                const savedMedia = await response.json();
                console.log("Clip saved successfully:", savedMedia);
                onMediaSave(savedMedia);
            } else {
                console.error("Failed to save clip:", await response.text());
            }
        } catch (error) {
            console.error("Error saving clip:", error);
        }
    };
    

    return (
        <div className={`media-studio ${isDarkMode ? 'dark-theme' : ''}`}>
            <div className={`media-studio-header ${isDarkMode ? 'dark-theme' : ''}`}>
                <h2>Media Studio</h2>
                <button className="close-button" onClick={onClose}>X</button>
            </div>
            <video
                ref={videoRef}
                src={selectedMedia?.media_url || ""}
                controls
                className="small-video-player"
            />
            <div className="media-studio-info">
                <p>
                    <strong>Video Source:</strong> {videoSource?.title || "N/A"}
                </p>
                <p>
                    <strong>Audio Source:</strong> {audioSource?.title || "N/A"}
                </p>
            </div>
            <div className="media-studio-controls">
                <button onClick={() => handleActionToggle("video")}>
                    {action === "video" ? "End Video Clip" : "Clip Video"}
                </button>
                <button onClick={() => handleActionToggle("sound")}>
                    {action === "sound" ? "End Sound Clip" : "Clip Sound"}
                </button>
                <button onClick={() => handleActionToggle("both")}>
                    {action === "both" ? "End Video and Sound Clip" : "Clip Video AND Sound"}
                </button>
            </div>
            <div className="media-studio-timeline">
                <p>
                    <strong>Video Start Time:</strong> {clipState.videoStartTime ? `${clipState.videoStartTime.toFixed(2)}s` : "N/A"}
                </p>
                <p>
                    <strong>Video End Time:</strong> {clipState.videoEndTime ? `${clipState.videoEndTime.toFixed(2)}s` : "N/A"}
                </p>
                <p>
                    <strong>Audio Start Time:</strong> {clipState.audioStartTime ? `${clipState.audioStartTime.toFixed(2)}s` : "N/A"}
                </p>
                <p>
                    <strong>Audio End Time:</strong> {clipState.audioEndTime ? `${clipState.audioEndTime.toFixed(2)}s` : "N/A"}
                </p>
            </div>
            <div className="media-studio-actions">
                <input
                    type="text"
                    placeholder="Enter Clip Name"
                    value={clipName}
                    onChange={(e) => setClipName(e.target.value)}
                />
                <button
                    onClick={saveClip}
                    disabled={
                        !clipName || // Clip name must be provided
                        (!clipState.videoEndTime && !clipState.audioEndTime) // At least one type of clip must be finalized
                    }
                >
                    Save Clip
                </button>

            </div>
        </div>
    );
};

export default MediaStudio;



