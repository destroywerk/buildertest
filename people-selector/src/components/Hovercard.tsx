import React from 'react';
import { Member } from '../types/Member';

// Dummy time zone simulation
const getTimeForWorkplace = (workplace?: string): string => {
  const now = new Date();
  let hours = now.getHours();
  let minutes: string | number = now.getMinutes();

  // Adjust hours based on a simple mapping (replace with a proper library for real use)
  switch (workplace) {
    case 'New York': hours -= 5; break;
    case 'London': hours += 0; break;
    case 'Paris':
    case 'Madrid':
    case 'Berlin':
    case 'Munich': hours += 1; break;
    case 'Tokyo': hours += 9; break;
    default: break; // Default to local time (or UTC)
  }

  // Handle hour wrapping
  hours = (hours + 24) % 24; 

  minutes = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutes} local time`;
};

interface HovercardProps {
  member: Member;
  position: { top: number; left: number };
  onMouseEnter: () => void; // To clear hide timeout
  onMouseLeave: () => void; // To start hide timeout
}

const Hovercard: React.FC<HovercardProps> = ({
  member,
  position,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!member) return null;

  const localTime = getTimeForWorkplace(member.workplace);

  return (
    <div
      className="absolute z-20 bg-white rounded-3xl shadow-xl p-4 w-72 border border-gray-100"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={onMouseEnter} // Keep card open when mouse enters it
      onMouseLeave={onMouseLeave} // Start hide timer when mouse leaves card
    >
      {/* Header */}
      <div className="flex items-center mb-4">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full mr-3" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl mr-3">
            {member.name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div>
          <div className="font-semibold text-base text-gray-800">{member.name}</div>
          <div className="text-sm text-gray-500">{member.position}</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5 mb-4 text-sm text-gray-700">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {localTime}
        </div>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs">{member.workplace}</span>
        </div>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs">{member.department}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400">
          {/* SVG from logo-slack-svgrepo-com.svg */}
          <svg fill="currentColor" className="w-4 h-4 mr-1.5" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <title>Slack Logo</title>
            <path d="M126.12,315.1A47.06,47.06,0,1,1,79.06,268h47.06Z"/>
            <path d="M149.84,315.1a47.06,47.06,0,0,1,94.12,0V432.94a47.06,47.06,0,1,1-94.12,0Z"/>
            <path d="M196.9,126.12A47.06,47.06,0,1,1,244,79.06v47.06Z"/>
            <path d="M196.9,149.84a47.06,47.06,0,0,1,0,94.12H79.06a47.06,47.06,0,0,1,0-94.12Z"/>
            <path d="M385.88,196.9A47.06,47.06,0,1,1,432.94,244H385.88Z"/>
            <path d="M362.16,196.9a47.06,47.06,0,0,1-94.12,0V79.06a47.06,47.06,0,1,1,94.12,0Z"/>
            <path d="M315.1,385.88A47.06,47.06,0,1,1,268,432.94V385.88Z"/>
            <path d="M315.1,362.16a47.06,47.06,0,0,1,0-94.12H432.94a47.06,47.06,0,1,1,0,94.12Z"/>
          </svg>
          Slack
        </button>
        <button className="flex-1 flex items-center justify-center px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          Email
        </button>
      </div>
    </div>
  );
};

export default Hovercard; 