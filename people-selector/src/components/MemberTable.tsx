import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Condition } from './PeopleSelectorContent';
import { Member as BaseMember } from '../types/Member';

interface Member extends BaseMember {
  added: boolean;
  isExternal?: boolean;
}

// Sample data for members
const memberData: Member[] = [
  // Assigning unique avatars to ~75% and initials to ~25%
  // Assigning statuses: ~90% Active, ~5% Onboarding, ~5% On Leave
  { id: 1, name: 'Wade Warren', position: 'Product Designer', status: 'Active', department: 'Design', workplace: 'London', added: true, avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: 2, name: 'Darlene Robertson', position: 'Product Designer', status: 'Active', department: 'Design', workplace: 'London', added: true, avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: 19, name: 'Isabella Silva', position: 'Product Designer', status: 'Active', department: 'Design', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/women/19.jpg' },
  { id: 28, name: 'Alex Chen', position: 'Product Designer', status: 'Active', department: 'Design', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/28.jpg', isExternal: true },
  { id: 29, name: 'Nina Patel', position: 'Product Designer', status: 'Active', department: 'Design', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/women/29.jpg' },

  { id: 7, name: 'Emily Davis', position: 'UX Designer', status: 'Active', department: 'Design', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/women/7.jpg' },
  { id: 23, name: 'Sophia Lee', position: 'UX Designer', status: 'Onboarding', department: 'Design', workplace: 'Berlin', added: false, avatar: undefined, isExternal: true }, // Status: Onboarding
  { id: 30, name: 'Marcus Wong', position: 'UX Designer', status: 'Active', department: 'Design', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/30.jpg' },
  { id: 31, name: 'Laura Schmidt', position: 'UX Designer', status: 'Active', department: 'Design', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/women/31.jpg' },
  { id: 32, name: 'Ryan Cooper', position: 'UX Designer', status: 'Active', department: 'Design', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },

  // Keep only ID 3 for James Wilson
  { id: 3, name: 'James Wilson', position: 'Software Engineer', status: 'Active', department: 'Engineering', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/3.jpg' }, 
  { id: 20, name: 'William Jones', position: 'Software Engineer', status: 'Active', department: 'Engineering', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/20.jpg' },
  { id: 33, name: 'Emma Thompson', position: 'Software Engineer', status: 'Active', department: 'Engineering', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { id: 34, name: 'Lucas Kim', position: 'Software Engineer', status: 'Active', department: 'Engineering', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/34.jpg' },
  { id: 35, name: 'Sarah Chen', position: 'Software Engineer', status: 'Active', department: 'Engineering', workplace: 'New York', added: false, avatar: undefined }, // Initials

  { id: 8, name: 'Robert Martinez', position: 'Frontend Developer', status: 'Active', department: 'Engineering', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/8.jpg' },
  { id: 36, name: 'Anna Kowalski', position: 'Frontend Developer', status: 'Active', department: 'Engineering', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/36.jpg' },
  { id: 37, name: 'David Park', position: 'Frontend Developer', status: 'Active', department: 'Engineering', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/37.jpg' },
  { id: 38, name: 'Maria Santos', position: 'Frontend Developer', status: 'Active', department: 'Engineering', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/38.jpg' },
  { id: 39, name: 'Thomas Weber', position: 'Frontend Developer', status: 'Onboarding', department: 'Engineering', workplace: 'Berlin', added: false, avatar: undefined }, // Status: Onboarding

  { id: 10, name: 'David Thompson', position: 'Backend Developer', status: 'Active', department: 'Engineering', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/men/10.jpg' },
  { id: 40, name: 'Julia Fischer', position: 'Backend Developer', status: 'Active', department: 'Engineering', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/women/40.jpg' },
  { id: 41, name: 'Michael Zhang', position: 'Backend Developer', status: 'Active', department: 'Engineering', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/41.jpg' },
  { id: 42, name: 'Sofia Garcia', position: 'Backend Developer', status: 'Active', department: 'Engineering', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/42.jpg' },
  { id: 43, name: 'Daniel Kim', position: 'Backend Developer', status: 'On Leave', department: 'Engineering', workplace: 'New York', added: false, avatar: undefined }, // Status: On Leave

  { id: 4, name: 'Marjory Dawes', position: 'Marketing Manager', status: 'Active', department: 'Marketing', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { id: 44, name: 'John Smith', position: 'Marketing Manager', status: 'Active', department: 'Marketing', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { id: 45, name: 'Elena Rodriguez', position: 'Marketing Manager', status: 'Active', department: 'Marketing', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/45.jpg' },
  { id: 46, name: 'Andreas Mueller', position: 'Marketing Manager', status: 'On Leave', department: 'Marketing', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/46.jpg' }, // Status: On Leave
  { id: 47, name: 'Lisa Wang', position: 'Marketing Manager', status: 'Active', department: 'Marketing', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/women/47.jpg' },

  { id: 9, name: 'Lisa Anderson', position: 'Content Strategist', status: 'Active', department: 'Marketing', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/9.jpg' },
  { id: 48, name: 'Mark Johnson', position: 'Content Strategist', status: 'Active', department: 'Marketing', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/48.jpg' },
  { id: 49, name: 'Carmen Lopez', position: 'Content Strategist', status: 'Onboarding', department: 'Marketing', workplace: 'Madrid', added: false, avatar: undefined }, // Status: Onboarding
  { id: 50, name: 'Felix Schmidt', position: 'Content Strategist', status: 'Active', department: 'Marketing', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/50.jpg' },
  { id: 51, name: 'Yuki Tanaka', position: 'Content Strategist', status: 'Active', department: 'Marketing', workplace: 'Tokyo', added: false, avatar: 'https://randomuser.me/api/portraits/women/51.jpg' },

  { id: 21, name: 'Olivia Miller', position: 'Marketing Specialist', status: 'Active', department: 'Marketing', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/women/21.jpg' },
  { id: 52, name: 'James Lee', position: 'Marketing Specialist', status: 'Active', department: 'Marketing', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { id: 53, name: 'Isabella Martinez', position: 'Marketing Specialist', status: 'Active', department: 'Marketing', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/53.jpg' },
  { id: 54, name: 'Lukas Weber', position: 'Marketing Specialist', status: 'Onboarding', department: 'Marketing', workplace: 'Berlin', added: false, avatar: undefined }, // Status: Onboarding
  { id: 55, name: 'Sophia Kim', position: 'Marketing Specialist', status: 'Active', department: 'Marketing', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/women/55.jpg' },

  { id: 5, name: 'Sarah Johnson', position: 'Product Manager', status: 'Active', department: 'Product', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/5.jpg' },
  { id: 6, name: 'Michael Chen', position: 'Product Manager', status: 'Active', department: 'Product', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/6.jpg' },
  { id: 24, name: 'Benjamin Wilson', position: 'Product Manager', status: 'On Leave', department: 'Product', workplace: 'Paris', added: false, avatar: undefined, isExternal: true }, // Status: On Leave
  { id: 56, name: 'Emma Davis', position: 'Product Manager', status: 'Active', department: 'Product', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/women/56.jpg' },
  { id: 57, name: 'Lucas Martin', position: 'Product Manager', status: 'Active', department: 'Product', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/men/57.jpg' },

  { id: 12, name: 'Daniel Lee', position: 'Data Scientist', status: 'Active', department: 'Data Science', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/12.jpg' },
  { id: 58, name: 'Sophie Wilson', position: 'Data Scientist', status: 'Active', department: 'Data Science', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/58.jpg' },
  { id: 59, name: 'Alex Thompson', position: 'Data Scientist', status: 'Onboarding', department: 'Data Science', workplace: 'New York', added: false, avatar: undefined }, // Status: Onboarding
  { id: 60, name: 'Maria Rodriguez', position: 'Data Scientist', status: 'Active', department: 'Data Science', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/60.jpg' },
  { id: 61, name: 'Thomas Chen', position: 'Data Scientist', status: 'Active', department: 'Data Science', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/men/61.jpg' },

  { id: 26, name: 'Ethan Anderson', position: 'Data Engineer', status: 'Active', department: 'Data Science', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/26.jpg' },
  // { id: 62, name: 'Anna Lee', position: 'Data Engineer', status: 'Active', department: 'Data Science', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/62.jpg' }, // Removed Anna Lee
  { id: 63, name: 'David Kim', position: 'Data Engineer', status: 'On Leave', department: 'Data Science', workplace: 'New York', added: false, avatar: undefined }, // Status: On Leave
  { id: 64, name: 'Elena Santos', position: 'Data Engineer', status: 'Active', department: 'Data Science', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/64.jpg' },
  { id: 65, name: 'Marcus Zhang', position: 'Data Engineer', status: 'Active', department: 'Data Science', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/men/65.jpg' },

  { id: 13, name: 'Maria Garcia', position: 'Customer Success Manager', status: 'Active', department: 'Customer Success', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/13.jpg' },
  // { id: 66, name: 'James Wilson', position: 'Customer Success Manager', status: 'Active', department: 'Customer Success', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/66.jpg' }, // Removed duplicate James Wilson
  { id: 67, name: 'Sofia Martinez', position: 'Customer Success Manager', status: 'On Leave', department: 'Customer Success', workplace: 'Berlin', added: false, avatar: undefined }, // Status: On Leave
  { id: 68, name: 'Lucas Brown', position: 'Customer Success Manager', status: 'Active', department: 'Customer Success', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/68.jpg' },
  { id: 69, name: 'Emma Taylor', position: 'Customer Success Manager', status: 'Active', department: 'Customer Success', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/women/69.jpg' },

  { id: 25, name: 'Ava Thompson', position: 'Customer Success Representative', status: 'Active', department: 'Customer Success', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/25.jpg' },
  { id: 70, name: 'Michael Park', position: 'Customer Success Representative', status: 'Active', department: 'Customer Success', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/70.jpg' },
  { id: 71, name: 'Laura Chen', position: 'Customer Success Representative', status: 'Active', department: 'Customer Success', workplace: 'New York', added: false, avatar: undefined }, // Initials
  { id: 72, name: 'Daniel Santos', position: 'Customer Success Representative', status: 'Active', department: 'Customer Success', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/men/72.jpg' },
  { id: 73, name: 'Sophie Martin', position: 'Customer Success Representative', status: 'Active', department: 'Customer Success', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/women/73.jpg' },

  { id: 16, name: 'Thomas Brown', position: 'Sales Director', status: 'Active', department: 'Sales', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/16.jpg' },
  { id: 74, name: 'Emma Wilson', position: 'Sales Director', status: 'Active', department: 'Sales', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/74.jpg' },
  { id: 75, name: 'James Lee', position: 'Sales Director', status: 'Active', department: 'Sales', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 76, name: 'Maria Rodriguez', position: 'Sales Director', status: 'Active', department: 'Sales', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/76.jpg' },
  { id: 77, name: 'Lucas Chen', position: 'Sales Director', status: 'Active', department: 'Sales', workplace: 'Paris', added: false, avatar: undefined }, // Initials

  { id: 27, name: 'Mia Martinez', position: 'Sales Manager', status: 'Active', department: 'Sales', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/27.jpg' },
  { id: 78, name: 'David Thompson', position: 'Sales Manager', status: 'Active', department: 'Sales', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/78.jpg' },
  { id: 79, name: 'Anna Kim', position: 'Sales Manager', status: 'Active', department: 'Sales', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/women/79.jpg' },
  { id: 80, name: 'Michael Davis', position: 'Sales Manager', status: 'Active', department: 'Sales', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/80.jpg' },
  { id: 81, name: 'Sophie Garcia', position: 'Sales Manager', status: 'Active', department: 'Sales', workplace: 'Paris', added: false, avatar: undefined }, // Initials

  { id: 11, name: 'Jennifer White', position: 'HR Manager', status: 'Active', department: 'Human Resources', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/11.jpg' },
  // { id: 82, name: 'Thomas Wilson', position: 'HR Manager', status: 'Active', department: 'Human Resources', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/82.jpg' }, // Renamed Thomas Wilson
  { id: 82, name: 'Thomas R. Wilson', position: 'HR Manager', status: 'Active', department: 'Human Resources', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/82.jpg' }, 
  { id: 83, name: 'Maria Chen', position: 'HR Manager', status: 'Active', department: 'Human Resources', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/women/83.jpg' },
  { id: 84, name: 'Lucas Martinez', position: 'HR Manager', status: 'Active', department: 'Human Resources', workplace: 'Madrid', added: false, avatar: undefined }, // Initials
  { id: 85, name: 'Emma Brown', position: 'HR Manager', status: 'Active', department: 'Human Resources', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/women/85.jpg' },

  { id: 14, name: 'John Taylor', position: 'DevOps Engineer', status: 'Active', department: 'DevOps', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/14.jpg' },
  { id: 86, name: 'Anna Lee', position: 'DevOps Engineer', status: 'Active', department: 'DevOps', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/women/86.jpg' },
  { id: 87, name: 'David Chen', position: 'DevOps Engineer', status: 'Active', department: 'DevOps', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/87.jpg' },
  { id: 88, name: 'Sofia Thompson', position: 'DevOps Engineer', status: 'Active', department: 'DevOps', workplace: 'Madrid', added: false, avatar: undefined }, // Initials
  { id: 89, name: 'Michael Wilson', position: 'DevOps Engineer', status: 'Active', department: 'DevOps', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/men/89.jpg' },

  { id: 15, name: 'Sophie Martin', position: 'QA Engineer', status: 'Active', department: 'Quality Assurance', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/women/15.jpg' },
  { id: 90, name: 'James Park', position: 'QA Engineer', status: 'Active', department: 'Quality Assurance', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/90.jpg' },
  { id: 91, name: 'Elena Rodriguez', position: 'QA Engineer', status: 'Active', department: 'Quality Assurance', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/91.jpg' },
  { id: 92, name: 'Thomas Lee', position: 'QA Engineer', status: 'Active', department: 'Quality Assurance', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/92.jpg' },
  { id: 93, name: 'Anna Chen', position: 'QA Engineer', status: 'Active', department: 'Quality Assurance', workplace: 'New York', added: false, avatar: undefined }, // Initials

  { id: 17, name: 'Emma Wilson', position: 'Legal Counsel', status: 'Active', department: 'Legal', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/17.jpg' },
  { id: 94, name: 'Michael Thompson', position: 'Legal Counsel', status: 'Active', department: 'Legal', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/94.jpg' },
  { id: 95, name: 'Sofia Martinez', position: 'Legal Counsel', status: 'Active', department: 'Legal', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/women/95.jpg' },
  { id: 96, name: 'David Chen', position: 'Legal Counsel', status: 'Active', department: 'Legal', workplace: 'New York', added: false, avatar: 'https://randomuser.me/api/portraits/men/96.jpg' },
  { id: 97, name: 'Anna Brown', position: 'Legal Counsel', status: 'Active', department: 'Legal', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/women/97.jpg' },

  { id: 18, name: 'Lucas Rodriguez', position: 'Operations Manager', status: 'Active', department: 'Operations', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/men/18.jpg' },
  { id: 98, name: 'Emma Davis', position: 'Operations Manager', status: 'Active', department: 'Operations', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/women/98.jpg' },
  // { id: 99, name: 'Thomas Wilson', position: 'Operations Manager', status: 'Active', department: 'Operations', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/men/99.jpg' }, // Removed duplicate Thomas Wilson
  // { id: 101, name: 'James Chen', position: 'Operations Manager', status: 'Active', department: 'Operations', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/men/101.jpg' }, // Renamed James Chen
  { id: 101, name: 'James C. Chen', position: 'Operations Manager', status: 'Active', department: 'Operations', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/men/101.jpg' }, 
  { id: 100, name: 'Maria Lee', position: 'Operations Manager', status: 'Active', department: 'Operations', workplace: 'New York', added: false, avatar: undefined }, // Initials

  { id: 22, name: 'James Davis', position: 'Finance Manager', status: 'Active', department: 'Finance', workplace: 'London', added: false, avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { id: 102, name: 'Sofia Thompson', position: 'Finance Manager', status: 'Active', department: 'Finance', workplace: 'Berlin', added: false, avatar: 'https://randomuser.me/api/portraits/women/102.jpg' },
  { id: 103, name: 'Michael Martinez', position: 'Finance Manager', status: 'Active', department: 'Finance', workplace: 'Madrid', added: false, avatar: 'https://randomuser.me/api/portraits/men/103.jpg' },
  { id: 104, name: 'Emma Wilson', position: 'Finance Manager', status: 'Active', department: 'Finance', workplace: 'New York', added: false, avatar: undefined }, // Initials
  { id: 105, name: 'Lucas Chen', position: 'Finance Manager', status: 'Active', department: 'Finance', workplace: 'Paris', added: false, avatar: 'https://randomuser.me/api/portraits/men/105.jpg' }
];

export { memberData };

export interface MemberTableProps {
  activeTab: string;
  onExclude: (member: {
    id: number;
    type: 'person' | 'department' | 'position' | 'workplace' | 'advanced' | 'team' | 'legal';
    name: string;
    description: string;
    avatar?: string;
    workplace?: string;
  }) => void;
  onInclude: (id: number) => void;
  selections: Array<{
    id: number;
    type: 'person' | 'department' | 'position' | 'workplace' | 'advanced' | 'team' | 'legal';
    name: string;
    description: string;
    avatar?: string;
    workplace?: string;
  }>;
  exclusions: Array<{
    id: number;
    type: 'person' | 'department' | 'position' | 'workplace' | 'advanced' | 'team' | 'legal';
    name: string;
    description: string;
    avatar?: string;
    workplace?: string;
  }>;
  conditions: Condition[];
  itemConditions: Record<number, Condition[]>;
  onCountsChange: (counts: { members: number; excluded: number; all: number; }) => void;
  toggleOptions: {
    excludeExternal: boolean;
    // Add status filter props
    onlyIncludeStatus: boolean;
    statusFilter: string[];
  };
}

const MemberTable: React.FC<MemberTableProps> = ({
  activeTab,
  onExclude,
  onInclude,
  selections,
  exclusions,
  conditions,
  itemConditions,
  onCountsChange,
  toggleOptions // Contains onlyIncludeStatus and statusFilter now
}) => {
  // Helper function to check if a member matches a condition
  const memberMatchesCondition = (member: Member, condition: Condition): boolean => {
    if (!condition.values || condition.values.length === 0) return true;
    
    const memberValue = member[condition.field as keyof Member];
    if (memberValue === undefined) return false;
    return condition.values.includes(String(memberValue));
  };

  // Get selected members based *only* on selections and conditions (before exclusions)
  const selectedMembers = useMemo(() => {
    console.log("Recalculating selectedMembers. Selections:", selections.map(s => ({id: s.id, type: s.type, name: s.name})));
    return memberData.filter(member => {
      // Check if member matches any selection's conditions
      const match = selections.some(selection => {
        console.log(`  Checking member ${member.id} (${member.name}) against selection ${selection.id} (${selection.name}, type: ${selection.type})`);
        const selectionConditions = itemConditions[selection.id] || [];
        
        // For advanced selections, only include members if there are conditions with values
        if (selection.type === 'advanced') {
          const hasValidConditions = selectionConditions.some(condition => 
            condition.values && condition.values.length > 0
          );
          if (!hasValidConditions) {
            console.log(`    Advanced selection ${selection.id} has no valid conditions. Result: false`);
            return false; // Don't include if no valid conditions
          }
          // Check conditions that have values
          const advancedMatch = selectionConditions
            .filter(condition => condition.values && condition.values.length > 0)
            .every(condition => {
                const conditionResult = memberMatchesCondition(member, condition);
                console.log(`      Advanced condition check: field=${condition.field}, values=${condition.values}, memberValue=${member[condition.field as keyof Member]}, Result: ${conditionResult}`);
                return conditionResult;
            });
          console.log(`    Advanced selection ${selection.id} overall match: ${advancedMatch}`);
          return advancedMatch;
        }

        // For regular selections
        if (selectionConditions.length === 0) { // Direct match (no further conditions)
          if (selection.type === 'person') {
            const personMatch = member.id === selection.id;
            console.log(`    Direct person check: member.id=${member.id}, selection.id=${selection.id}. Result: ${personMatch}`);
            return personMatch;
          }
          if (selection.type === 'department' || selection.type === 'position' || selection.type === 'workplace') {
            const attributeMatch = member[selection.type] === selection.name.split(' (')[0];
            console.log(`    Direct ${selection.type} check: member.${selection.type}=${member[selection.type]}, selection.name=${selection.name.split(' (')[0]}. Result: ${attributeMatch}`);
            return attributeMatch;
          }
          console.log(`    Direct match check failed (unknown type or condition): type=${selection.type}. Result: false`);
          return false;
        }

        // Regular selection with conditions
        const conditionMatch = selectionConditions.every(condition => {
           const conditionResult = memberMatchesCondition(member, condition);
           console.log(`      Regular condition check: field=${condition.field}, values=${condition.values}, memberValue=${member[condition.field as keyof Member]}, Result: ${conditionResult}`);
           return conditionResult;
        });
        console.log(`    Regular selection ${selection.id} with conditions overall match: ${conditionMatch}`);
        return conditionMatch;
      }); // End of selections.some callback
      
      console.log(`  --> Overall match for member ${member.id}: ${match}`);
      return match;
    });
  }, [selections, itemConditions]); // Removed exclusions dependency here

  // Filter members based on active tab and exclusions
  const filteredMembers = useMemo(() => {
    console.log('Calculating filteredMembers...');
    console.log('Active Tab:', activeTab);
    console.log('Selected Members (before exclusion/status filter):', selectedMembers.map(m => m.id));
    console.log('Exclusions:', exclusions.map(e => e.id));
    console.log('Toggle Options:', toggleOptions);

    // Apply status filter first if the toggle is on
    let statusFilteredMembers = selectedMembers;
    if (toggleOptions.onlyIncludeStatus && toggleOptions.statusFilter.length > 0) {
      statusFilteredMembers = selectedMembers.filter(member => 
        toggleOptions.statusFilter.includes(member.status)
      );
      console.log('Members after status filter:', statusFilteredMembers.map(m => ({id: m.id, status: m.status })));
    } else {
      console.log('Status filter not active or empty.');
    }


    let result;
    if (activeTab === 'members') {
      // Show status-filtered members that are NOT manually excluded
      result = statusFilteredMembers.filter(member => {
        const isExcluded = exclusions.some(excl => excl.id === member.id);
        return !isExcluded;
      });
      console.log('Filtered Members (Members Tab):', result.map(m => m.id));
    } else if (activeTab === 'excluded') {
      // Show status-filtered members that ARE manually excluded
      // OR show members excluded purely by the status filter
      result = selectedMembers.filter(member => { // Start from selectedMembers again for excluded tab logic
         const isManuallyExcluded = exclusions.some(excl => excl.id === member.id);
         const isExcludedByStatus = toggleOptions.onlyIncludeStatus && 
                                    toggleOptions.statusFilter.length > 0 && 
                                    !toggleOptions.statusFilter.includes(member.status);
         return isManuallyExcluded || isExcludedByStatus;
      });
      console.log('Filtered Members (Excluded Tab):', result.map(m => m.id));
    } else { // 'all' tab
      // Show all initially selected members, regardless of exclusion or status filter status 
      // (as 'all' implies pre-exclusion/filter view of selections)
      result = selectedMembers; 
      console.log('Filtered Members (All Tab):', result.map(m => m.id));
    }
    return result;
  }, [activeTab, selectedMembers, exclusions, toggleOptions]); // Add toggleOptions dependency

    // Update counts based on the final filtered lists reflecting status filter and manual exclusions
  useEffect(() => {
      // Recalculate status-filtered members here for accurate counts
      let statusFilteredForCount = selectedMembers;
      if (toggleOptions.onlyIncludeStatus && toggleOptions.statusFilter.length > 0) {
          statusFilteredForCount = selectedMembers.filter(member => 
              toggleOptions.statusFilter.includes(member.status)
          );
      }

      // Count members tab: statusFilteredForCount NOT in manual exclusions
      const membersCount = statusFilteredForCount.filter(member => 
          !exclusions.some(excl => excl.id === member.id)
      ).length;
      
      // Count excluded tab: selectedMembers ARE manually excluded OR excluded by status filter
      const excludedCount = selectedMembers.filter(member => {
         const isManuallyExcluded = exclusions.some(excl => excl.id === member.id);
         const isExcludedByStatus = toggleOptions.onlyIncludeStatus && 
                                    toggleOptions.statusFilter.length > 0 && 
                                    !toggleOptions.statusFilter.includes(member.status);
         return isManuallyExcluded || isExcludedByStatus;
      }).length;
      
      onCountsChange({
        members: membersCount,
        excluded: excludedCount,
        all: selectedMembers.length // 'all' count remains based on initial selections
      });
 }, [selectedMembers, exclusions, toggleOptions, onCountsChange]); // Dependencies for count updates

  const renderMembers = () => {
    if (filteredMembers.length === 0) {
      return (
        <div className="flex flex-col items-center h-full text-gray-500 px-4 pt-[30px]">
          <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg mb-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-base mb-2">No members yet</div>
          <div className="text-sm text-center text-gray-500">
            Set conditions to add members who meet multiple requirements or directly add people, departments, workplaces etc{' '}
            <button className="text-blue-600 hover:text-blue-700">Learn more</button>.
          </div>
        </div>
      );
    }

    return filteredMembers.map((member) => (
      <div
        key={member.id}
        className="px-4 py-1.5 border-b border-gray-200 hover:bg-gray-50"
      >
        <div className="flex items-center">
          <div className="w-10">
            {member.avatar ? (
              <img 
                src={member.avatar} 
                alt={member.name} 
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          <div className="flex-grow pl-0">
            <div className="text-sm">{member.name}</div>
          </div>
          <div className="w-[120px] flex items-center justify-center">
            <span className={`px-2 py-1 text-xs rounded-full ${
              member.status === 'Active' ? 'bg-green-100 text-green-800' : 
              member.status === 'Onboarding' ? 'bg-blue-100 text-blue-800' : 
              member.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800' // Default/fallback
            }`}>
              {member.status || 'Unknown'} {/* Display assigned status */}
            </span>
          </div>
          <div className="w-20 text-center">
            {/* Determine button state based on manual exclusions AND status filter */}
             {(exclusions.some(excl => excl.id === member.id) || 
               (toggleOptions.onlyIncludeStatus && toggleOptions.statusFilter.length > 0 && !toggleOptions.statusFilter.includes(member.status))) ? (
              <button
                onClick={() => {
                  // Include should only remove manual exclusion, not override status filter
                  onInclude(member.id); 
                }}
                // Disable include if they are excluded *only* by status filter? Or allow override?
                // For now, allow override of manual exclusion. Status filter is handled by toggle.
                className="px-2 py-1 text-xs font-medium rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                // disabled={!exclusions.some(excl => excl.id === member.id)} // Optional: disable if only excluded by status
              >
                Include
              </button>
            ) : (
              <button
                onClick={() => onExclude({
                  id: member.id,
                  type: 'person',
                  name: member.name,
                  description: member.position || 'No position',
                  avatar: member.avatar
                })}
                className="px-2 py-1 text-xs font-medium rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Exclude
              </button>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="h-full">
      {renderMembers()}
    </div>
  );
};

export default MemberTable; 