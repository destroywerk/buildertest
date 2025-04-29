import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Member } from '../types/Member'; // Assuming Member type is needed for people
// import { Item } from './PeopleSelectorContent'; // Item is not exported, define locally

// Define Item locally (based on definition in PeopleSelectorContent)
export interface Item {
  id: number;
  type: 'person' | 'department' | 'position' | 'workplace' | 'advanced' | 'team' | 'legal';
  name: string;
  description: string;
  avatar?: string;
  workplace?: string;
}

// Define the types for data props more explicitly if needed
interface DataItem extends Item {
  // Add any specific properties needed for display
}

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  people: Member[];
  departments: DataItem[];
  workplaces: DataItem[];
  positions: DataItem[];
  onItemSelect: (item: DataItem | Member) => void; // Adjust type as needed
  searchQuery: string;
}

// Placeholder icons - replace with actual icons later
const Icons = {
  // All: () => <span>A</span>, // Removed All
  People: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  Departments: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 21h18" />
    </svg>
  ),
  Workplaces: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  Positions: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-17.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
};

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isOpen,
  onClose,
  people,
  departments,
  workplaces,
  positions,
  onItemSelect,
  searchQuery
}) => {
  const [activeTab, setActiveTab] = useState<'People' | 'Departments' | 'Workplaces' | 'Positions'>('People'); // Default to People
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter data based on search query (basic implementation)
  const filteredPeople = useMemo(() => 
    people.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name)),
    [people, searchQuery]);
  const filteredDepartments = useMemo(() => 
    departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
               .sort((a, b) => a.name.localeCompare(b.name)),
    [departments, searchQuery]);
  const filteredWorkplaces = useMemo(() => 
    workplaces.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .sort((a, b) => a.name.localeCompare(b.name)),
    [workplaces, searchQuery]);
  const filteredPositions = useMemo(() => 
    positions.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
             .sort((a, b) => a.name.localeCompare(b.name)),
    [positions, searchQuery]);


  const renderList = (items: (Member | DataItem)[], type: string) => {
     if (!items || items.length === 0) {
       return <div className="p-4 text-sm text-gray-500">No {type} found.</div>;
     }
     return (
       <ul className="max-h-60 overflow-y-auto">
         {items.map((item) => (
           <li
             key={`${type}-${item.id}`}
             className="p-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center space-x-2"
             onClick={() => { onItemSelect(item); onClose(); }}
           >
             {/* Basic rendering - enhance later with avatars etc. */}
             {item.avatar && <img src={item.avatar} alt={item.name} className="w-5 h-5 rounded-full" />}
             {!item.avatar && ('type' in item ? item.type === 'person' : true) && (
              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs">{item.name.split(' ').map(n => n[0]).join('')}</div>
             )}
             {/* Add icons for other types if needed (e.g., based on item.type if it exists) */}
             <span>{item.name}</span>
             {/* Conditionally render description if it exists */  }
             {'description' in item && item.description && <span className="text-gray-500 text-xs ml-1">({item.description.split(' (')[0].trim()})</span>}

           </li>
         ))}
       </ul>
     );
   };

  const renderContent = () => {
    switch (activeTab) {
      case 'People':
        return renderList(filteredPeople, 'people');
      case 'Departments':
        return renderList(filteredDepartments, 'departments');
      case 'Workplaces':
        return renderList(filteredWorkplaces, 'workplaces');
      case 'Positions':
        return renderList(filteredPositions, 'positions');
      // case 'All': // Removed All case
      default:
        // Default should maybe render People or be handled explicitly
        return renderList(filteredPeople, 'people'); 
    }
  };


  if (!isOpen) return null;

  return (
    // Styling inspired by the image: rounded, shadow, semi-transparent blurred background
    <div
      ref={dropdownRef}
      className="absolute z-10 mt-1 w-full bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden pt-2 px-6 pb-0" // Changed pb-5 to pb-0
    >
      {/* Tabs */}
      <div className="flex mb-2 -mx-6 px-4"> {/* Changed mb-4 to mb-2 */} 
        {(['People', 'Departments', 'Workplaces', 'Positions'] as const).map((tab) => { // Removed 'All'
          const Icon = Icons[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium focus:outline-none transition-colors duration-150 rounded-xl ${ // Adjusted padding, added rounded-xl
                isActive
                  ? 'bg-purple-700/10 text-purple-700' // Reverted back to Purple bg (10%), purple text
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50' // Inactive state without border
              }`}
            >
              <Icon />
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="-mx-2"> {/* Negative margin to counteract item padding? */} 
        {renderContent()}
      </div>
    </div>
  );
};

export default SearchDropdown;

// Define Item type locally if not imported correctly
// export interface Item {
//   id: number;
//   type: 'person' | 'department' | 'position' | 'workplace' | 'advanced' | 'team' | 'legal';
//   name: string;
//   description: string;
//   avatar?: string;
//   workplace?: string;
// } 