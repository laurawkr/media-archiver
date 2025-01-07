import React from 'react';

const CommentsSection = ({ comments }) => {
    // Parse usernames and comments, skipping empty strings
    const formattedComments = [];
    for (let i = 0; i < comments.length; i += 3) {
        const username = comments[i]?.trim() || "Anonymous";
        const text = comments[i + 2]?.trim() || "No comment provided.";
        formattedComments.push({ username, text });
    }

    return (
        <div className="comments-section">
            <h3>Comments</h3>
            <ul>
                {formattedComments.map((comment, index) => (
                    <li key={index} className="comment">
                        <span className="comment-username"> {comment.username}</span>
                        <p className="comment-text"> {comment.text}</p>
                        <hr />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CommentsSection;
