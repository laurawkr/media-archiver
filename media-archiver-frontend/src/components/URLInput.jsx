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
        <form onSubmit={handleSubmit} className="flex gap-4 p-4">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter media URL"
                className="border p-2 flex-grow"
                required
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                Download
            </button>
            {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
        </form>
    );
};

export default URLInput;