import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-20 w-20" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-label="MentorVerse Logo"
  >
    {/* Two chevrons representing pathways or an abstract 'M' */}
    <path d="M4 18l4-4 4 4 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 12l4-4 4 4 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* A starburst representing a spark of insight or guidance */}
    <path d="M12 2 L12 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 20 L12 22" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 12 L20 12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 12 L2 12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.07 4.93 L17.66 6.34" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.34 17.66 L4.93 19.07" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.07 19.07 L17.66 17.66" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.34 6.34 L4.93 4.93" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);