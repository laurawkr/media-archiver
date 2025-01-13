import React from 'react';

const CommentsSection = ({ comments, tiktokUrl, refreshComments, isDarkMode }) => {
    // Parse usernames and comments, skipping empty strings
    const formattedComments = [];
    for (let i = 0; i < comments.length; i += 3) {
        const username = comments[i]?.trim() || "Anonymous";
        const text = comments[i + 2]?.trim() || "No comment provided.";
        formattedComments.push({ username, text });
    }

    const handleAddComments = async () => {
        try {
            const response = await fetch("http://localhost:5000/download-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tiktokUrl }),
            });
            if (response.ok) {
                alert("Comments extraction started. Refresh to view updated comments.");
                refreshComments && refreshComments(); // Refresh the comments if the function is provided
            } else {
                const error = await response.json();
                console.error("Error extracting comments:", error.details || error.message);
                alert("Failed to extract comments. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while trying to extract comments.");
        }
    };

    return (
        <div className={`comments-section ${isDarkMode ? 'dark-theme' : ''}`}>
            {/* Header */}
            <div className={`comments-header-container ${isDarkMode ? 'dark-theme' : ''}`}>
                <div className={`comments-header ${isDarkMode ? 'dark-theme' : ''}`}>
                    <h3>Comments</h3>
                </div>
            </div>

            {/* Comments List */}
            {formattedComments.length > 0 ? (
                <ul className={`comments-list ${isDarkMode ? 'dark-theme' : ''}`}>
                    {formattedComments.map((comment, index) => (
                        <li key={index} className={`comment ${isDarkMode ? 'dark-theme' : ''}`}>
                            <span className={`comment-username ${isDarkMode ? 'dark-theme' : ''}`}>
                                {comment.username}
                            </span>
                            <p className={`comment-text ${isDarkMode ? 'dark-theme' : ''}`}>
                                {comment.text}
                            </p>
                            <hr />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className={`no-comments ${isDarkMode ? 'dark-theme' : ''}`}>
                    <p>No comments available.</p>
                    <button
                        className={`add-comments-button ${isDarkMode ? 'dark-theme' : ''}`}
                        onClick={handleAddComments}
                    >
                        Add Comments
                    </button>
                </div>
            )}
        </div>
    );
};

export default CommentsSection;




