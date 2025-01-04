import React, { useState } from "react";

const URLInput = ({ onSubmit }) => {
    const [url, setUrl] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("Processing...");
        try {
            const response = await fetch("http://localhost:5000/process-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                onSubmit(url); // Add URL to media library
            } else {
                setMessage(data.error || "An error occurred.");
            }
        } catch (error) {
            setMessage("Failed to process the URL. Please try again.");
        }
        setUrl("");
    };

    return (
        <div className="url-input-container">
            <form onSubmit={handleSubmit} className="url-input-form">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter media URL"
                    className="url-input-field"
                    required
                />
                <button type="submit" className="url-submit-button">
                    Download
                </button>
            </form>
            {message && <p className="url-input-message">{message}</p>}
        </div>
    );
};

export default URLInput;