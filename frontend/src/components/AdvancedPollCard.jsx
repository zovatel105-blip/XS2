import React from 'react';

const AdvancedPollCard = ({ poll, onClick, ...props }) => {
  return (
    <div className="poll-card" onClick={onClick}>
      <h3>{poll?.title || 'Untitled Poll'}</h3>
    </div>
  );
};

export default AdvancedPollCard;