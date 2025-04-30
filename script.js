// People Selector Logic

// --- GLOBAL DATA --- 
let memberData = []; // Initialize as empty array
let allSearchableItems = []; // Combined list for search

// --- APPLICATION STATE --- 
let selections = []; // Array to hold selected items {id, type, name, description, avatar, originalId/Name}
let conditions = []; // Array to hold condition objects {id, field, operator, values}
let nextConditionId = 0; // Simple ID generator
let exclusions = []; // Array to hold excluded items {id, type, name, originalId, avatar}
let toggleOptionsState = { // State for toggle checkboxes
    excludeExternal: false,
    excludeOnLeave: false,
    excludeHireDate: false, // New toggle state
    hireDateMonths: 6,      // Default hire date months
    onlyStatusFilter: false,// New toggle state
    statusFilterValue: ''    // Default status filter
};
let activeTab = 'members'; // State for active tab ('members', 'excluded', 'all')
let hoverTimeout = null;
let hideTimeout = null;
let hoveredMemberId = null;
let activePickerTab = 'people'; // State for search picker tab
let isDropdownOpen = false; // Track if main search dropdown is open
let isExclusionDropdownOpen = false; // Track if exclusion dropdown is open
let isMenuDropdownOpen = false; // Track if 3-dot menu is open

// --- OPTIONS DATA (Should match original app) ---
const conditionFieldOptions = [
    { value: 'department', label: 'Department' },
    { value: 'position', label: 'Position' },
    { value: 'workplace', label: 'Workplace' },
    { value: 'status', label: 'Status' }
];

const conditionOperatorOptions = {
    string: [
        { value: 'is', label: 'Is' },
        { value: 'is_not', label: 'Is Not' }
    ]
    // Add other operator types if needed (e.g., for numbers)
};

// We need the actual lists of departments, positions etc. for the value dropdowns
// Let's derive them from the data or use the hardcoded ones from original code if necessary
let departmentOptions = [];
let positionOptions = [];
let workplaceOptions = [];
let statusOptions = []; // e.g., ['Active', 'Onboarding', 'On Leave', ...]

// --- SVG Icon Helper --- (Moved near top)
function getEntityIconSVG(type) {
    let iconPath = '';
    let iconClass = `icon-${type}`;
    switch(type) {
        case 'person': 
            iconPath = 'M15 6a3 3 0 11-6 0 3 3 0 016 0zm2 2a2 2 0 11-4 0 2 2 0 014 0zm-8 7a4 4 0 00-8 0v3h8v-3zm1 0a4 4 0 00-8 0v3h8v-3z';
            break;
        case 'department': 
            iconPath = 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 21h7.5M12 18v-9M9.75 12H12m2.25 3H12m0-6H9.75M14.25 9H12'; 
            break;
        case 'position': 
            iconPath = 'M16.5 6a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-9-6a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm9 0a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z'; // Tag icon
            break;
        case 'workplace': 
            iconPath = 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm4.5 0c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'; // Location marker
            break;
         case 'condition-group':
            iconClass = 'icon-condition-group';
            iconPath = 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0Zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0Zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0Z'; // Users icon
            break;
        default:
            iconPath = 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z'; // Question mark
    }
    return `<svg class="${iconClass}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}" /></svg>`;
}

// --- DOMContentLoaded Listener --- 
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Document loaded. JS is running.");

    // --- Get DOM Elements --- (Good practice to get them once)
    const memberTableBody = document.getElementById('member-table-body');
    const mainSearchInput = document.getElementById('main-search');
    const searchResultsDropdown = document.getElementById('search-results-dropdown');
    const selectedItemsContainer = document.getElementById('selected-items');
    const conditionsSection = document.getElementById('conditions-section'); // Get section
    const conditionsListContainer = document.getElementById('conditions-list'); // Get inner list
    const addConditionButton = document.getElementById('add-condition-btn'); // Button inside condition block
    const toggleExternalCheckbox = document.getElementById('toggle-external');
    const toggleLeaveCheckbox = document.getElementById('toggle-leave');
    const toggleHireDateCheckbox = document.getElementById('toggle-hire-date'); // New toggle
    const hireDateSelect = document.getElementById('hire-date-months');         // New select
    const toggleStatusFilterCheckbox = document.getElementById('toggle-status-filter'); // New toggle
    const statusFilterSelect = document.getElementById('status-filter-select');       // New select
    const exclusionSearchInput = document.getElementById('exclusion-search');
    const exclusionResultsDropdown = document.getElementById('exclusion-results-dropdown');
    // const excludedItemsContainer = document.getElementById('excluded-items-list'); // Removed? Tokens go in wrapper
    const tabButtons = document.querySelectorAll('.member-list-area .tab-button'); // Scope to member list area
    const hovercardElement = document.getElementById('hovercard');
    const memberTableEmptyState = document.getElementById('member-table-empty-state');
    const memberTableSection = document.getElementById('member-table-section'); // Need the table section for showing/hiding empty state
    // const memberCountDisplay = document.getElementById('member-count-display'); // Removed, using tab counts
    const searchMenuButton = document.getElementById('search-menu-btn');
    const searchOptionsDropdown = document.getElementById('search-options-dropdown');
    const exclusionSearchWrapper = document.getElementById('exclusion-search-wrapper'); // Get the wrapper
    const emptyStateAddConditionLink = document.getElementById('empty-state-add-condition-link');
    const mainSearchIcon = mainSearchInput.previousElementSibling; // Assuming icon is sibling
    const exclusionSearchIcon = exclusionSearchInput.previousElementSibling;

    // Inject SVG icons
    if(mainSearchIcon && mainSearchIcon.classList.contains('search-icon')) {
        mainSearchIcon.innerHTML = getEntityIconSVG('search'); // Re-use helper with a type
    }
    if(exclusionSearchIcon && exclusionSearchIcon.classList.contains('search-icon')) {
        exclusionSearchIcon.innerHTML = getEntityIconSVG('search');
    }
    if(searchMenuButton) {
        searchMenuButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>`;
    }
    // Inject menu item icons (example)
    const dropdownButtons = searchOptionsDropdown?.querySelectorAll('button');
    if (dropdownButtons && dropdownButtons.length > 1) {
        dropdownButtons[0].querySelector('.menu-icon').innerHTML = getEntityIconSVG('plus');
        dropdownButtons[1].querySelector('.menu-icon').innerHTML = getEntityIconSVG('delete');
    }
    // Inject empty state icon
    const emptyStateIconContainer = memberTableEmptyState?.querySelector('.empty-state-icon');
    if(emptyStateIconContainer) {
        emptyStateIconContainer.innerHTML = getEntityIconSVG('condition-group'); // Or a more fitting icon
    }

    // --- DATA LOADING --- 
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            memberData = await response.json(); // Assign fetched data to global variable
            console.log(`Loaded ${memberData.length} members from data.json.`);
            prepareSearchableData(); // Prepare data after fetching
        } catch (error) {
            console.error("Could not load member data:", error);
            // Optionally display an error message to the user
        }
    }

    // --- DATA PREPARATION --- 
    function prepareSearchableData() {
        if (memberData.length === 0) return;

        allSearchableItems = []; // Reset

        // 1. Add People
        memberData.forEach(member => {
            allSearchableItems.push({
                id: `person-${member.id}`, // Unique ID across types
                type: 'person',
                name: member.name,
                description: member.position || 'Person',
                avatar: member.avatar,
                originalId: member.id // Keep original ID if needed
            });
        });

        // 2. Add Departments (Calculate counts)
        const departmentCounts = {};
        memberData.forEach(member => {
            if (member.department) {
                departmentCounts[member.department] = (departmentCounts[member.department] || 0) + 1;
            }
        });
        Object.entries(departmentCounts).forEach(([dept, count], index) => {
             allSearchableItems.push({
                id: `dept-${index}`,
                type: 'department',
                name: dept,
                description: `${count} people`,
                originalName: dept // Keep original name
            });
        });
        
        // 3. Add Positions (Calculate counts)
        const positionCounts = {};
         memberData.forEach(member => {
            if (member.position) {
                positionCounts[member.position] = (positionCounts[member.position] || 0) + 1;
            }
        });
        Object.entries(positionCounts).forEach(([pos, count], index) => {
             allSearchableItems.push({
                id: `pos-${index}`,
                type: 'position',
                name: pos,
                description: `${count} people`,
                originalName: pos // Keep original name
            });
        });
        
        // 4. Add Workplaces (Calculate counts) - Optional, based on original options
        const workplaceCounts = {};
        memberData.forEach(member => {
            if (member.workplace) {
                workplaceCounts[member.workplace] = (workplaceCounts[member.workplace] || 0) + 1;
            }
        });
         Object.entries(workplaceCounts).forEach(([wp, count], index) => {
             allSearchableItems.push({
                id: `wp-${index}`,
                type: 'workplace',
                name: wp,
                description: `${count} people`,
                originalName: wp // Keep original name
            });
        });

        console.log(`Prepared ${allSearchableItems.length} searchable items.`);

        // Derive options lists here after memberData is loaded
        departmentOptions = [...new Set(memberData.map(m => m.department).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        positionOptions = [...new Set(memberData.map(m => m.position).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        workplaceOptions = [...new Set(memberData.map(m => m.workplace).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        statusOptions = [...new Set(memberData.map(m => m.status).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        
        // Populate status filter dropdown (already sorted)
        if (statusFilterSelect) {
            statusFilterSelect.innerHTML = '<option value="">Any</option>'; // Reset
            statusOptions.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                statusFilterSelect.appendChild(option);
            });
        }
        
        console.log('Derived & Sorted Options:', { departmentOptions, positionOptions, workplaceOptions, statusOptions });
        
        // Also sort allSearchableItems (optional, depends if picker requires it)
        allSearchableItems.sort((a, b) => a.name.localeCompare(b.name));
    }

    // --- RENDER FUNCTIONS --- 

    // Function to get initials from name
    function getInitials(name) {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    // Standardized function to get avatar element (img or initials div)
    function createAvatarElement(item, classNamePrefix = 'table') { // Prefixes like 'table', 'token', 'result-item', 'entity'
         const avatarElement = document.createElement('div');
         avatarElement.classList.add(`${classNamePrefix}-avatar-container`); 
         if (item.avatar) {
             const img = document.createElement('img');
             img.src = item.avatar;
             img.alt = item.name;
             img.classList.add(`${classNamePrefix}-avatar-img`);
             avatarElement.appendChild(img);
         } else {
             avatarElement.classList.add(`${classNamePrefix}-avatar-initials`);
             const initials = getInitials(item.name).substring(0, 2);
             avatarElement.textContent = initials;
             // Consistent color hashing
             let hash = 0;
             const name = item.name || ''; // Handle potentially undefined names
             for (let i = 0; i < name.length; i++) {
                 hash = name.charCodeAt(i) + ((hash << 5) - hash);
             }
             // Adjust saturation/lightness slightly for different contexts maybe?
             const color = `hsl(${hash % 360}, 70%, 85%)`; 
             const textColor = `hsl(${hash % 360}, 50%, 40%)`;
             avatarElement.style.backgroundColor = color;
             avatarElement.style.color = textColor;
         }
         return avatarElement;
    }

    // Updated function to render the member table
    function renderMemberTable(membersToRender) {
        if (!memberTableBody || !memberTableSection || !memberTableEmptyState) return;

        memberTableBody.innerHTML = ''; // Clear existing table rows
        
        // Check if the table should be in the empty state
        // Empty state occurs ONLY when:
        // 1. No selections are made AND
        // 2. No conditions are defined
        const shouldShowEmptyState = selections.length === 0 && conditions.length === 0;
        
        if (shouldShowEmptyState) {
            memberTableSection.style.display = 'none'; // Hide table section
            memberTableEmptyState.style.display = 'block'; // Show empty state
            updateTabCounts(0, 0, 0); // Explicitly set counts to 0 for empty state
        } else {
            memberTableSection.style.display = 'block'; // Show table section
            memberTableEmptyState.style.display = 'none'; // Hide empty state
            
            // Calculate counts based on the provided list (which depends on the active tab)
            let currentTabCount = membersToRender.length;
            let excludedCount = exclusions.length; 
            let allCount = calculateAllCount(); // Calculate count before exclusions/toggles
            
            if (membersToRender.length === 0 && activeTab === 'members') {
                 // Special case: Selections/conditions exist, but filters result in zero members
                 // Show a different empty state within the table area? Or just blank table?
                 // For now, show blank table, counts will reflect 0.
                  console.log("No members match current filters.");
            } else if (membersToRender.length === 0 && activeTab === 'excluded') {
                 console.log("No members are currently excluded.");
                 // Show specific message for excluded empty state?
            } else {
                 // Render table rows
                 membersToRender.forEach(member => {
                     const row = document.createElement('tr');
                     row.addEventListener('mouseenter', (e) => handleTableRowMouseEnter(e, member.id));
                     row.addEventListener('mouseleave', handleTableRowMouseLeave);
                     
                     const nameCell = document.createElement('td');
                     const avatarContainer = document.createElement('div');
                     avatarContainer.style.display = 'flex';
                     avatarContainer.style.alignItems = 'center';
         
                     const avatarElement = createAvatarElement(member, 'table'); 
                     avatarContainer.appendChild(avatarElement);
                     
                     const nameText = document.createElement('span');
                     nameText.textContent = member.name;
                     nameText.classList.add('table-member-name');
                     avatarContainer.appendChild(nameText);
                     nameCell.appendChild(avatarContainer);
         
                     const actionCell = document.createElement('td');
                     const actionButton = document.createElement('button');
                     actionButton.dataset.memberId = member.id; 
                     actionButton.classList.add('table-action-btn') 
         
                     if (activeTab === 'excluded') {
                         actionButton.textContent = 'Include';
                         actionButton.addEventListener('click', handleIncludeMember); 
                     } else {
                         const isExcluded = exclusions.some(ex => ex.originalId === member.id);
                         if (isExcluded) {
                             actionButton.textContent = 'Include';
                             actionButton.addEventListener('click', handleIncludeMember); 
                         } else {
                             actionButton.textContent = 'Exclude';
                             actionButton.addEventListener('click', handleExcludeMember); 
                         }                 
                     }
                     actionCell.appendChild(actionButton);
                     actionCell.classList.add('action-cell');
         
                     row.appendChild(nameCell);
                     row.appendChild(actionCell);
         
                     memberTableBody.appendChild(row);
                 });
            }
             // Update counts based on calculated values for the *current* state
             // Note: The count shown for 'members' tab might differ from `membersToRender.length` if toggles are active
             let displayedMembersCount = (activeTab === 'members') ? calculateMembersTabCount() : currentTabCount;
             updateTabCounts(displayedMembersCount, excludedCount, allCount);
        }
    }

    // Helper to calculate count for 'members' tab *after* toggle filters
     function calculateMembersTabCount() {
        let baseMembers = getBaseFilteredMembers(); // Get members matching selections/conditions
        // Apply Exclusions
        if (exclusions.length > 0) {
            const excludedPersonIds = new Set(exclusions.map(ex => ex.originalId));
            baseMembers = baseMembers.filter(member => !excludedPersonIds.has(member.id));
        }
        // Apply Toggles
        if (toggleOptionsState.excludeExternal) baseMembers = baseMembers.filter(member => !member.isExternal);
        if (toggleOptionsState.excludeOnLeave) baseMembers = baseMembers.filter(member => member.status !== 'On Leave');
        if (toggleOptionsState.onlyStatusFilter && toggleOptionsState.statusFilterValue) {
            baseMembers = baseMembers.filter(member => member.status === toggleOptionsState.statusFilterValue);
        }
        // TODO: Hire Date Toggle
        return baseMembers.length;
    }

    // Helper to calculate 'All' count *before* exclusions/toggles
    function calculateAllCount() {
         let baseMembers = [...memberData];
         // Apply Selections Filter
         if (selections.length > 0) {
             baseMembers = baseMembers.filter(member => {
                 return selections.some(selection => {
                     if (selection.type === 'person') return member.id === selection.originalId;
                     if (selection.type === 'department') return member.department === selection.originalName;
                     if (selection.type === 'position') return member.position === selection.originalName;
                     if (selection.type === 'workplace') return member.workplace === selection.originalName;
                     return false;
                 });
             });
         }
         // Apply Conditions Filter
         if (conditions.length > 0) {
             baseMembers = baseMembers.filter(member => {
                 return conditions.every(condition => {
                     const memberValue = member[condition.field];
                     if (memberValue === undefined || memberValue === null) return false;
                     const memberValueString = String(memberValue);
                     switch (condition.operator) {
                         case 'is': return condition.values.includes(memberValueString);
                         case 'is_not': return !condition.values.includes(memberValueString);
                         default: return true;
                     }
                 });
             });
         }
         return baseMembers.length;
    }

    // ** NEW ** Helper: Gets members matching selections & conditions (inline/standalone)
    function getBaseFilteredMembers() {
        if (selections.length === 0 && !conditions.some(c => c.isStandalone)) {
            return []; // Nothing selected/defined
        }

        let combinedMemberIds = new Set();

        // 1. Process regular selections (person, dept, etc.)
        selections.filter(s => s.type !== 'condition-block').forEach(selection => {
            memberData.forEach(member => {
                let match = false;
                if (selection.type === 'person') match = member.id === selection.originalId;
                else if (selection.type === 'department') match = member.department === selection.originalName;
                else if (selection.type === 'position') match = member.position === selection.originalName;
                else if (selection.type === 'workplace') match = member.workplace === selection.originalName;
                if (match) combinedMemberIds.add(member.id);
            });
        });

        // 2. Process inline condition blocks (converted selections)
        selections.filter(s => s.type === 'condition-block').forEach(block => {
            memberData.forEach(member => {
                // Must match original entity first
                let originalMatch = false;
                if (block.originalType === 'department') originalMatch = member.department === block.originalName;
                else if (block.originalType === 'position') originalMatch = member.position === block.originalName;
                else if (block.originalType === 'workplace') originalMatch = member.workplace === block.originalName;
                
                if (originalMatch) {
                    // Then must match ALL rules within the block
                    const allRulesMatch = block.rules.every(rule => checkRuleMatch(member, rule));
                    if (allRulesMatch) combinedMemberIds.add(member.id);
                }
            });
        });

        // 3. Process standalone condition blocks
        conditions.filter(c => c.isStandalone).forEach(block => {
            memberData.forEach(member => {
                 const allRulesMatch = block.rules.every(rule => checkRuleMatch(member, rule));
                 if (allRulesMatch) combinedMemberIds.add(member.id);
            });
        });

        // Return full member objects based on the combined IDs
        return memberData.filter(member => combinedMemberIds.has(member.id));
    }
    
    // ** NEW ** Helper: Checks if a member matches a single condition rule
    function checkRuleMatch(member, rule) {
         const memberValue = member[rule.field];
         if (memberValue === undefined || memberValue === null) return false; 
         const memberValueString = String(memberValue);
         switch (rule.operator) {
             case 'is': return rule.values.includes(memberValueString);
             case 'is_not': return !rule.values.includes(memberValueString);
             default: return true;
         }
     }

    // Updated function to render selected items/conditions as blocks
    function renderSelectionsAndConditions() {
        if (!selectedItemsContainer) return;
        selectedItemsContainer.innerHTML = ''; // Clear
        
        let hasContent = false;

        // Render Selections/Entities that haven't been converted to conditions
        selections.filter(item => item.type !== 'condition-block').forEach(item => {
            const block = document.createElement('div');
            block.classList.add('selected-entity-block');
            block.dataset.itemId = item.id;

            const iconContainer = document.createElement('div');
            iconContainer.classList.add('entity-icon-container', item.type);
            // Use standardized avatar logic for person type
            if (item.type === 'person') {
                const personAvatarElement = createAvatarElement(item, 'entity');
                iconContainer.appendChild(personAvatarElement);
            } else {
                iconContainer.innerHTML = getEntityIconSVG(item.type);
            }
            
            const infoContainer = document.createElement('div');
            infoContainer.classList.add('entity-info');
            const nameDiv = document.createElement('div');
            nameDiv.classList.add('entity-name');
            nameDiv.textContent = item.name;
            const typeDiv = document.createElement('div');
            typeDiv.classList.add('entity-type');
            typeDiv.textContent = item.type === 'person' ? item.description : item.type; // Show position for person, type otherwise
            infoContainer.appendChild(nameDiv);
            infoContainer.appendChild(typeDiv);

            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('entity-actions');

            // Show "+ Add condition" only for non-person types
            if (item.type !== 'person') {
                const addConditionBtn = document.createElement('button');
                addConditionBtn.classList.add('btn-add-condition');
                addConditionBtn.innerHTML = `${getEntityIconSVG('plus')} Add condition`;
                addConditionBtn.addEventListener('click', handleConvertEntityToCondition);
                actionsContainer.appendChild(addConditionBtn);
            }

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('btn-remove-entity');
            removeBtn.innerHTML = getEntityIconSVG('close'); // Use close icon SVG
            removeBtn.ariaLabel = `Remove ${item.name}`;
            removeBtn.addEventListener('click', handleRemoveSelection);
            actionsContainer.appendChild(removeBtn);

            block.appendChild(iconContainer);
            block.appendChild(infoContainer);
            block.appendChild(actionsContainer);

            selectedItemsContainer.appendChild(block);
            hasContent = true;
        });

        // Render Entity Blocks converted to conditions (Inline)
        selections.filter(item => item.type === 'condition-block').forEach(conditionBlockData => {
            renderInlineConditionBlock(conditionBlockData); 
            hasContent = true;
        });

        // Render Standalone Condition Blocks (from 3-dot menu)
        conditions.forEach(conditionBlockData => {
            if (conditionBlockData.isStandalone) { // Add flag to distinguish
                 renderStandaloneConditionBlock(conditionBlockData);
                 hasContent = true;
            }
        });

        // Hide conditions section if no standalone blocks exist
        if (!conditions.some(c => c.isStandalone)) {
            if (conditionsSection) conditionsSection.style.display = 'none';
        }

        // No placeholder text needed
    }

    // Renders the standalone block added via the 3-dot menu
    function renderStandaloneConditionBlock(conditionBlockData) {
         if (!conditionsSection || !conditionsListContainer) return;
         conditionsSection.style.display = 'block'; // Show the section
         // Check if block already rendered, maybe clear first if needed
         // For now, assume we clear the whole section elsewhere or render selectively
 
         const existingBlock = conditionsSection.querySelector(`.condition-block-wrapper[data-condition-block-id="${conditionBlockData.id}"]`);
         if (existingBlock) existingBlock.remove(); // Remove old if exists

         const conditionBlock = document.createElement('div');
         conditionBlock.classList.add('condition-block-wrapper');
         conditionBlock.dataset.conditionBlockId = conditionBlockData.id;
 
         // Header
         const header = document.createElement('div');
         header.classList.add('condition-block-header');
         const iconContainer = document.createElement('div');
         iconContainer.classList.add('entity-icon-container', 'condition-group');
         iconContainer.innerHTML = getEntityIconSVG('condition-group');
         const infoContainer = document.createElement('div');
         infoContainer.classList.add('entity-info');
         const nameDiv = document.createElement('div');
         nameDiv.classList.add('entity-name');
         nameDiv.textContent = 'People added based on all of the following conditions'; // Static title
         infoContainer.appendChild(nameDiv);
         const actionsContainer = document.createElement('div');
         actionsContainer.classList.add('entity-actions');
         const removeBtn = document.createElement('button');
         removeBtn.classList.add('btn-remove-entity'); 
         removeBtn.innerHTML = getEntityIconSVG('close'); 
         removeBtn.ariaLabel = 'Remove all conditions';
         removeBtn.addEventListener('click', () => handleRemoveStandaloneConditionBlock(conditionBlockData.id));
         header.appendChild(iconContainer);
         header.appendChild(infoContainer);
         header.appendChild(actionsContainer);
         conditionBlock.appendChild(header);

         // Content (Rows)
         const contentDiv = document.createElement('div');
         contentDiv.classList.add('condition-block-content');
         conditionBlockData.rules.forEach(rule => { // Assuming conditions are stored in a 'rules' array
             contentDiv.appendChild(createConditionRowElement(rule, conditionBlockData.id));
         });
         conditionBlock.appendChild(contentDiv);

         // Footer (Add Condition Button)
         const footerDiv = document.createElement('div');
         footerDiv.classList.add('condition-block-footer');
         const addBtn = document.createElement('button');
         addBtn.classList.add('add-condition-rule-btn'); // Different class/handler potentially
         addBtn.innerHTML = `${getEntityIconSVG('plus')} Add condition`;
         addBtn.addEventListener('click', () => handleAddRuleToStandaloneBlock(conditionBlockData.id)); 
         footerDiv.appendChild(addBtn);
         conditionBlock.appendChild(footerDiv);

         // Append the whole block to the section
         conditionsSection.appendChild(conditionBlock);

         // Initialize Choices.js for all new selects AFTER they are in the DOM
         contentDiv.querySelectorAll('select.condition-value-select').forEach(select => {
             initializeChoices(select);
         });
    }

    // Renders an entity that has been converted to have conditions (inline)
    function renderInlineConditionBlock(conditionBlockData) {
         if (!selectedItemsContainer) return;

         // Create the block wrapper
         const block = document.createElement('div');
         block.classList.add('condition-block-wrapper'); // Use same wrapper style
         block.dataset.itemId = conditionBlockData.id; // Use original selection ID

         // --- Header --- (Similar to entity block, but maybe different text)
         const header = document.createElement('div');
         header.classList.add('condition-block-header'); // Reuse header style

         const iconContainer = document.createElement('div');
         iconContainer.classList.add('entity-icon-container', conditionBlockData.originalType); // Use original type for icon
         iconContainer.innerHTML = getEntityIconSVG(conditionBlockData.originalType);
         
         const infoContainer = document.createElement('div');
         infoContainer.classList.add('entity-info');
         const nameDiv = document.createElement('div');
         nameDiv.classList.add('entity-name');
         nameDiv.textContent = `${conditionBlockData.originalName} with conditions`; // Indicate conditions are added
         infoContainer.appendChild(nameDiv);
         // Maybe add subtitle? const typeDiv = ...

         const actionsContainer = document.createElement('div');
         actionsContainer.classList.add('entity-actions');
         
         // Add "Add Condition" button to inline block footer
         const addBtn = document.createElement('button');
         addBtn.classList.add('add-condition-rule-btn'); 
         addBtn.innerHTML = `${getEntityIconSVG('plus')} Add condition`;
         addBtn.addEventListener('click', () => handleAddRuleToInlineBlock(conditionBlockData.id)); 

         const removeBtn = document.createElement('button');
         removeBtn.classList.add('btn-remove-entity'); 
         removeBtn.innerHTML = getEntityIconSVG('close'); 
         removeBtn.ariaLabel = `Remove ${conditionBlockData.originalName} block`;
         // Use handleRemoveSelection to remove the whole block (it's still a selection)
         removeBtn.addEventListener('click', handleRemoveSelection);

         // Add buttons to actions container (Order might matter for layout)
         actionsContainer.appendChild(addBtn); // Add condition first? Or last? Let's try last.
         actionsContainer.appendChild(removeBtn);
         
         header.appendChild(iconContainer);
         header.appendChild(infoContainer);
         header.appendChild(actionsContainer);
         block.appendChild(header);

         // --- Content (Condition Rows) --- 
         const contentDiv = document.createElement('div');
         contentDiv.classList.add('condition-block-content');
         conditionBlockData.rules.forEach(rule => { // Assuming conditions stored in 'rules'
             contentDiv.appendChild(createConditionRowElement(rule, conditionBlockData.id)); // Pass main block ID
         });
         block.appendChild(contentDiv);

         // *** FIX: Append the block to the container ***
         selectedItemsContainer.appendChild(block);

         // Initialize Choices.js for all new selects AFTER they are in the DOM
         contentDiv.querySelectorAll('select.condition-value-select').forEach(select => {
             initializeChoices(select);
         });
    }
    
    // Helper to create a single condition row DOM element (needs blockId for updates)
    function createConditionRowElement(rule, blockId) {
        const conditionRow = document.createElement('div');
        conditionRow.classList.add('condition-row');
        conditionRow.dataset.ruleId = rule.id; // Use rule ID
        conditionRow.dataset.blockId = blockId; // Reference parent block

        // Field Dropdown
        const fieldSelect = document.createElement('select');
        fieldSelect.classList.add('condition-field');
        conditionFieldOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === rule.field) option.selected = true;
            fieldSelect.appendChild(option);
        });
        fieldSelect.addEventListener('change', (e) => updateRule(blockId, rule.id, 'field', e.target.value));
        
        // Operator Dropdown
        const operatorSelect = document.createElement('select');
        operatorSelect.classList.add('condition-operator');
        // TODO: Populate based on field type (only string for now)
        conditionOperatorOptions.string.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
             if (opt.value === rule.operator) option.selected = true;
            operatorSelect.appendChild(option);
        });
         operatorSelect.addEventListener('change', (e) => updateRule(blockId, rule.id, 'operator', e.target.value));

        // Value Input/Select (Using Choices.js)
        const valueContainer = document.createElement('div');
        valueContainer.classList.add('condition-value-container');
        
        const valueSelect = document.createElement('select');
        valueSelect.multiple = true;
        valueSelect.classList.add('condition-value-select');
        valueSelect.dataset.ruleId = rule.id;
        valueSelect.dataset.blockId = blockId;

        // Populate the select with options
        let currentOptions = [];
        switch (rule.field) {
            case 'department': currentOptions = departmentOptions; break;
            case 'position': currentOptions = positionOptions; break;
            case 'workplace': currentOptions = workplaceOptions; break;
            case 'status': currentOptions = statusOptions; break;
            default: currentOptions = [];
        }

        // Populate the select with options
        currentOptions.forEach(optValue => {
            const option = document.createElement('option');
            option.value = optValue;
            option.textContent = optValue;
            if (rule.values.includes(optValue)) {
                option.selected = true;
            }
            valueSelect.appendChild(option);
        });

        valueContainer.appendChild(valueSelect);

        // Remove Button for the row
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-condition-btn');
        removeBtn.innerHTML = getEntityIconSVG('delete'); // Use delete icon
        removeBtn.ariaLabel = `Remove condition for ${rule.field}`;
        removeBtn.addEventListener('click', () => removeRule(blockId, rule.id));

        conditionRow.appendChild(fieldSelect);
        conditionRow.appendChild(operatorSelect);
        conditionRow.appendChild(valueContainer); // Add container for Choices.js
        conditionRow.appendChild(removeBtn);

        return conditionRow;
    }

    // Function to initialize Choices.js on a select element
    function initializeChoices(selectElement) {
        const isConditionValueSelect = selectElement.classList.contains('condition-value-select');
        // Destroy existing instance if it exists, to prevent errors on re-render
        if (selectElement.choices) {
             selectElement.choices.destroy();
        }
        
        // *** ADD LOGGING ***
        if (isConditionValueSelect) {
            console.log('Initializing Choices.js for multi-select value:', selectElement);
        }

        const choicesInstance = new Choices(selectElement, {
             removeItemButton: true, 
             placeholder: true,
             placeholderValue: 'Select value(s)...',
             itemSelectText: '', 
             allowHTML: false,
             // Add shouldSort: false if options are pre-sorted and you want to keep that order
             shouldSort: true, // Default sort - alphabetical is usually good here
             classNames: isConditionValueSelect ? {
                containerOuter: 'choices condition-choices',
                containerInner: 'choices__inner condition-choices__inner',
                listMultiple: 'choices__list--multiple condition-choices__list--multiple',
                item: 'choices__item choices__item--selectable condition-choices__item',
                button: 'choices__button condition-choices__button'
             } : { // Default classes otherwise
                containerOuter: 'choices',
                containerInner: 'choices__inner',
             }
         });
         // Store instance on element for potential future access/destruction
         selectElement.choices = choicesInstance;
         
         // Event listener (uses ruleId and blockId from dataset)
         selectElement.addEventListener('change', (event) => {
             const selectedValues = Array.from(event.target.selectedOptions).map(option => option.value);
             const ruleId = parseInt(event.target.dataset.ruleId, 10);
             const blockId = parseInt(event.target.dataset.blockId, 10);
             // Only trigger update if it's a condition value select
             if (!isNaN(ruleId) && !isNaN(blockId)) { 
                updateRule(blockId, ruleId, 'values', selectedValues);
             }
         });

         // Click listener for dropdown opening (for condition values)
         if (isConditionValueSelect) {
             const choicesOuter = selectElement.closest('.choices');
             const choicesInner = choicesOuter?.querySelector('.choices__inner');
             if (choicesInner) {
                 choicesInner.addEventListener('click', (event) => {
                    // Prevent if clicking on remove button or the input itself
                    if (event.target.closest('.choices__button') || event.target.matches('.choices__input')) {
                        return;
                    }
                    choicesInstance.showDropdown(); 
                 });
             }
        }
    }
    
    // Helper to update counts on tabs
    function updateTabCounts(memberCount, excludedCount, allCount) {
        console.log("Updating counts:", { memberCount, excludedCount, allCount });
        tabButtons.forEach(btn => {
            const tabType = btn.dataset.tab;
            const countSpan = btn.querySelector('.tab-count');
            if (!countSpan) {
                console.warn("Count span not found for tab:", tabType);
                return; 
            }
            let count = 0;
            if (tabType === 'members') count = memberCount;
            else if (tabType === 'excluded') count = excludedCount;
            else if (tabType === 'all') count = allCount;

            if (count > 0) {
                countSpan.textContent = count;
                countSpan.style.display = 'inline-block';
            } else {
                countSpan.textContent = '0';
                countSpan.style.display = 'none'; // Hide count if zero
            }
        });
    }

    // Updated Function to render excluded items as tokens inside the input wrapper
    function renderExclusions() {
        if (!exclusionSearchWrapper || !exclusionSearchInput) return;
        
        // --- FIX: Clear only tokens, not the input --- 
        exclusionSearchWrapper.querySelectorAll('.excluded-item-token').forEach(el => el.remove());

        let hasTokens = false;
        if (exclusions.length > 0) {
            hasTokens = true;
            [...exclusions].reverse().forEach(item => {
                const token = document.createElement('div');
                const avatar = createAvatarElement(item, 'token');
                token.appendChild(avatar);

                const nameSpan = document.createElement('span');
                nameSpan.classList.add('token-name');
                nameSpan.textContent = item.name;
                token.appendChild(nameSpan);

                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-exclusion-token-btn');
                removeBtn.innerHTML = getEntityIconSVG('close');
                removeBtn.ariaLabel = `Remove exclusion for ${item.name}`;
                removeBtn.addEventListener('click', handleRemoveExclusion);
                token.appendChild(removeBtn);

                // *** Insert BEFORE the input element ***
                exclusionSearchWrapper.insertBefore(token, exclusionSearchInput);
            });
        }
        
        // ... (handle has-tokens class, adjust placeholder)
        exclusionSearchInput.placeholder = hasTokens ? '' : 'Select people to exclude';
        // DO NOT CLEAR input value here - keep it if user was typing
    }

    // --- FILTERING LOGIC --- 
    function filterAndRenderTable() {
        console.log("Filtering data...");
        
        const baseMembers = getBaseFilteredMembers(); // Get members matching selections/conditions
        
        if (baseMembers.length === 0 && selections.length === 0 && !conditions.some(c => c.isStandalone)) {
             console.log("Filter resulted in initial empty state.");
             renderMemberTable([]); // Render empty state
             return;
        }

        let membersForCurrentTab = [];
        let membersForMembersTabCount = [...baseMembers]; // Start count calculation base
        let allTabCount = baseMembers.length; // Count before exclusions/toggles
        let excludedTabCount = exclusions.length;

        // Apply Exclusions (for 'members' and 'all' tabs rendering, and 'members' count)
        if (exclusions.length > 0) {
            const excludedPersonIds = new Set(exclusions.map(ex => ex.originalId));
            membersForMembersTabCount = membersForMembersTabCount.filter(member => !excludedPersonIds.has(member.id));
        }

        // Apply Toggles (only for 'members' tab rendering and count)
        let membersTabList = [...membersForMembersTabCount]; // Copy for rendering filter
        if (toggleOptionsState.excludeExternal) {
             membersTabList = membersTabList.filter(member => !member.isExternal);
             membersForMembersTabCount = membersForMembersTabCount.filter(member => !member.isExternal);
        }
        if (toggleOptionsState.excludeOnLeave) {
            membersTabList = membersTabList.filter(member => member.status !== 'On Leave');
            membersForMembersTabCount = membersForMembersTabCount.filter(member => member.status !== 'On Leave');
        }
        if (toggleOptionsState.onlyStatusFilter && toggleOptionsState.statusFilterValue) {
           membersTabList = membersTabList.filter(member => member.status === toggleOptionsState.statusFilterValue);
           membersForMembersTabCount = membersForMembersTabCount.filter(member => member.status === toggleOptionsState.statusFilterValue);
        }
        // TODO: Hire Date Toggle
        
        // Determine list to render based on active tab
        if (activeTab === 'members') {
            membersForCurrentTab = membersTabList;
        } else if (activeTab === 'excluded') {
            const excludedPersonIds = new Set(exclusions.map(ex => ex.originalId));
            membersForCurrentTab = memberData.filter(member => excludedPersonIds.has(member.id));
        } else if (activeTab === 'all') {
            // Apply exclusions to the base list for the 'all' tab render
             let allTabRenderList = [...baseMembers];
             if (exclusions.length > 0) {
                 const excludedPersonIds = new Set(exclusions.map(ex => ex.originalId));
                 allTabRenderList = allTabRenderList.filter(member => !excludedPersonIds.has(member.id));
             }
             membersForCurrentTab = allTabRenderList;
        }

        // Final Render
        console.log(`Rendering ${activeTab} tab with ${membersForCurrentTab.length} members.`);
        renderMemberTable(membersForCurrentTab); 
        // updateTabCounts is called within renderMemberTable now, using membersForMembersTabCount.length for 'members' count.
    }

    // Function to render the search dropdown (either picker or results)
    function renderSearchDropdown(query = '') {
        if (!searchResultsDropdown) return;
        searchResultsDropdown.innerHTML = ''; // Clear

        if (query.length === 0) {
            // Render Entity Picker View only if focused
            if (document.activeElement === mainSearchInput) {
                 renderEntityPicker();
                 searchResultsDropdown.style.display = 'block';
                 isDropdownOpen = true;
            } else {
                 searchResultsDropdown.style.display = 'none';
                 isDropdownOpen = false;
            }
        } else {
            // Render Filtered Results View
            renderFilteredSearchResults(query);
             // Display is handled within renderFilteredSearchResults
        }
    }

    // Function to render the initial entity picker
    function renderEntityPicker() {
        if (!searchResultsDropdown) return;

        const pickerTabsHTML = `
            <div class="search-picker-tabs">
                <button data-tab="people" class="${activePickerTab === 'people' ? 'active' : ''}">People</button>
                <button data-tab="departments" class="${activePickerTab === 'departments' ? 'active' : ''}">Departments</button>
                <button data-tab="workplaces" class="${activePickerTab === 'workplaces' ? 'active' : ''}">Workplaces</button>
                <button data-tab="positions" class="${activePickerTab === 'positions' ? 'active' : ''}">Positions</button>
            </div>
        `;

        let itemsToShow = [];
        const selectedIds = new Set(selections.map(s => s.id)); // Exclude selected
        const excludedPersonIds = new Set(exclusions.map(e => e.originalId)); // Exclude excluded people IDs

        switch (activePickerTab) {
            case 'people': 
                itemsToShow = allSearchableItems.filter(item => 
                    item.type === 'person' && 
                    !selectedIds.has(item.id) && 
                    !excludedPersonIds.has(item.originalId)
                ); // Remove .slice(0, 10) for people
                break;
            case 'departments': 
                itemsToShow = allSearchableItems.filter(item => item.type === 'department' && !selectedIds.has(item.id)).slice(0, 10);
                break;
            case 'workplaces': 
                 itemsToShow = allSearchableItems.filter(item => item.type === 'workplace' && !selectedIds.has(item.id)).slice(0, 10);
                break;
            case 'positions': 
                 itemsToShow = allSearchableItems.filter(item => item.type === 'position' && !selectedIds.has(item.id)).slice(0, 10);
                break;
        }

        itemsToShow.sort((a, b) => a.name.localeCompare(b.name));

        searchResultsDropdown.innerHTML = `
            ${pickerTabsHTML}
            <div class="search-picker-content">
                 ${renderSearchResultItems(itemsToShow)} 
            </div>
        `;
        
        // Add listeners after rendering
        addDropdownItemListeners();
        addPickerTabListeners();
    }

    // Function to render filtered search results (grouped)
    function renderFilteredSearchResults(query) {
        if (!searchResultsDropdown) return;
        
        const lowerQuery = query.toLowerCase();
        const selectedIds = new Set(selections.map(s => s.id));
        const excludedPersonIds = new Set(exclusions.map(e => e.originalId));
        
        const filtered = { people: [], departments: [], positions: [], workplaces: [] };
        
        allSearchableItems.forEach(item => {
             // Exclude selected items AND excluded people
             if (!selectedIds.has(item.id) && 
                 !(item.type === 'person' && excludedPersonIds.has(item.originalId)) && 
                 item.name.toLowerCase().includes(lowerQuery)) 
             {
                 // Check if the category exists in our filtered object
                 const categoryKey = item.type + 's'; // e.g., 'persons', 'departments'
                 if (filtered.hasOwnProperty(categoryKey)) {
                     filtered[categoryKey].push(item);
                 }
             }
        });

        // Sort results within each category
        for (const category in filtered) {
            filtered[category].sort((a,b) => a.name.localeCompare(b.name));
        }

        let resultsHTML = '';
        let totalResults = 0;
        const categoryOrder = ['people', 'departments', 'positions', 'workplaces'];

        categoryOrder.forEach(category => {
            if (filtered[category].length > 0) {
                const headerText = category.charAt(0).toUpperCase() + category.slice(1); // Capitalize
                resultsHTML += `<div class="search-group-header">${headerText}</div>${renderSearchResultItems(filtered[category].slice(0, 5))}`;
                totalResults += filtered[category].length;
            }
        });

        searchResultsDropdown.innerHTML = resultsHTML;

        if (totalResults > 0) {
            searchResultsDropdown.style.display = 'block';
            isDropdownOpen = true;
            addDropdownItemListeners();
        } else {
            searchResultsDropdown.style.display = 'none';
            isDropdownOpen = false;
        }
    }

    // Helper to render a list of items for the dropdown (use createAvatarElement)
    function renderSearchResultItems(items) {
        return items.map(item => {
             const avatarEl = createAvatarElement(item, 'result-item');
             return `
                 <div class="search-result-item" data-item-id="${item.id}">
                      <span class="result-item-icon" data-type="${item.type}">
                         ${avatarEl.innerHTML} 
                      </span> 
                      <span class="result-item-name">${item.name}</span>
                      <span class="result-item-desc">${item.description || ''}</span>
                  </div>
             `;
        }).join('');
    }

    // Updated helper to add listeners
    function addDropdownItemListeners() {
        searchResultsDropdown?.querySelectorAll('.search-result-item').forEach(el => {
            // Remove existing listener before adding new one to prevent duplicates
            el.removeEventListener('click', handleSearchResultClick);
            el.addEventListener('click', handleSearchResultClick);
        });
    }

    // Helper to add listeners to picker tabs
    function addPickerTabListeners() {
        searchResultsDropdown?.querySelectorAll('.search-picker-tabs button').forEach(el => {
             el.removeEventListener('click', handlePickerTabClick);
             el.addEventListener('click', handlePickerTabClick);
        });
    }

    // --- EVENT HANDLERS --- 

     function handleSearchInput(event) {
         const query = event.target.value.trim();
         renderSearchDropdown(query);
     }
 
     // More robust blur handling for dropdowns
    function handleDropdownBlur(event, dropdownElement, inputElement, isOpenFlagSetter) {
        // Use setTimeout to allow click events within the dropdown to register first
        setTimeout(() => {
            // Check if the new focused element is the input itself or inside the dropdown
            if (document.activeElement !== inputElement && !dropdownElement?.contains(document.activeElement)) {
                dropdownElement.style.display = 'none';
                isOpenFlagSetter(false);
            }
        }, 150); // Delay in milliseconds
    }
 
     function handleSearchFocus() {
         // Always try to render dropdown on focus
         const query = mainSearchInput.value.trim();
         renderSearchDropdown(query);
     }

     // Update to use the item found in allSearchableItems directly
     function handleSearchResultClick(event) {
         const itemId = event.currentTarget.dataset.itemId;
         const itemToAdd = allSearchableItems.find(item => item.id === itemId);
         
         // Ensure not already selected
         if (itemToAdd && !selections.some(s => s.id === itemToAdd.id)) { 
             selections.push(itemToAdd);
             renderSelectionsAndConditions(); // Use combined render function
             if (mainSearchInput) {
                 mainSearchInput.value = ''; // Clear input
                 mainSearchInput.focus(); // Keep focus to potentially add more
             }
             if (searchResultsDropdown) {
                 searchResultsDropdown.style.display = 'none'; // Hide dropdown
                 isDropdownOpen = false;
             }
             filterAndRenderTable(); // Trigger filter
             console.log('Added selection:', itemToAdd);
         } else if (itemToAdd) {
             console.log('Item already selected or excluded:', itemToAdd);
             // Maybe provide feedback? For now, just close dropdown.
              if (mainSearchInput) mainSearchInput.value = '';
             if (searchResultsDropdown) {
                  searchResultsDropdown.style.display = 'none';
                  isDropdownOpen = false;
             }
         }
     }

    function handleAddCondition() {
        handleAddStandaloneConditionBlock();
    }

    // Function to remove all conditions (triggered from block header)
    function handleRemoveAllConditions() {
        conditions = []; // Clear the array
        renderSelectionsAndConditions(); // Re-render (will hide the conditions block)
        filterAndRenderTable(); // Update the table
        console.log('Removed all conditions');
    }

    function updateCondition(id, key, value) {
        const conditionIndex = conditions.findIndex(c => c.id === id);
        if (conditionIndex > -1) {
            const conditionToUpdate = conditions[conditionIndex];
            const oldValue = conditionToUpdate[key];
            
            conditionToUpdate[key] = value;
            
            let needsReRender = false;
            let filterNeeded = true; // Assume filter is needed on any update

            // If field changes, reset operator/values and re-render the row fully
            if (key === 'field') {
                 conditionToUpdate.operator = conditionOperatorOptions.string[0].value; // Reset operator
                 conditionToUpdate.values = []; // Reset values
                 needsReRender = true; 
            } 
            // Check if values actually changed (for array comparison)
            else if (key === 'values' && JSON.stringify(oldValue) === JSON.stringify(value)) {
                 filterNeeded = false; // Don't re-filter if values are identical
            }
            // Operator change always needs filtering

            if (needsReRender) {
                // Instead of re-rendering all, potentially find the specific row and update it?
                // For simplicity now, re-render the whole block
                renderConditionsBlock(); 
            } 
            
            if (filterNeeded) {
                filterAndRenderTable(); // Trigger filtering
            }
            
            console.log('Updated condition:', conditionToUpdate);
        }
    }

    function removeCondition(id) {
        conditions = conditions.filter(c => c.id !== id);
        renderSelectionsAndConditions(); // Re-render main area
        filterAndRenderTable(); // Trigger filter
    }

    function handleToggleChange(event) {
        const toggleId = event.target.id;
        const isChecked = event.target.checked;

        switch (toggleId) {
            case 'toggle-external':
                toggleOptionsState.excludeExternal = isChecked;
                break;
            case 'toggle-leave':
                toggleOptionsState.excludeOnLeave = isChecked;
                break;
            case 'toggle-hire-date':
                toggleOptionsState.excludeHireDate = isChecked;
                if (hireDateSelect) hireDateSelect.disabled = !isChecked;
                break;
            case 'toggle-status-filter':
                toggleOptionsState.onlyStatusFilter = isChecked;
                if (statusFilterSelect) statusFilterSelect.disabled = !isChecked;
                // Update state immediately if checkbox is unchecked
                if (!isChecked) toggleOptionsState.statusFilterValue = '';
                break;
        }

        // Handle dropdown changes separately
        if (event.target.tagName === 'SELECT') {
             if (toggleId === 'hire-date-months') {
                 toggleOptionsState.hireDateMonths = parseInt(event.target.value, 10);
             } else if (toggleId === 'status-filter-select') {
                 toggleOptionsState.statusFilterValue = event.target.value;
             }
        }

        console.log("Toggle/Select changed:", toggleOptionsState);
        filterAndRenderTable(); // Re-filter the table
    }

    function handleExclusionSearch(event) {
        const query = event.target.value.toLowerCase().trim();
        
        if (!exclusionResultsDropdown) return;

        if (query.length < 1) { 
            exclusionResultsDropdown.style.display = 'none';
            exclusionResultsDropdown.innerHTML = '';
            isExclusionDropdownOpen = false;
            return;
        }

        // Filter *people* only, excluding those already selected or excluded
        const selectedPersonIds = new Set(selections.filter(s => s.type === 'person').map(s => s.originalId));
        const excludedPersonIds = new Set(exclusions.map(ex => ex.originalId));
        
        const filteredPeople = memberData.filter(member => 
            !selectedPersonIds.has(member.id) &&
            !excludedPersonIds.has(member.id) &&
            member.name.toLowerCase().includes(query)
        ).slice(0, 10); // Limit results

        // Sort the filtered results
        const sortedFilteredPeople = filteredPeople.sort((a, b) => a.name.localeCompare(b.name));
        
        // Render results
        exclusionResultsDropdown.innerHTML = ''; 
        if (sortedFilteredPeople.length > 0) {
            const resultItems = sortedFilteredPeople.map(member => {
                const uniqueId = `person-${member.id}`;
                return allSearchableItems.find(item => item.id === uniqueId);
            }).filter(Boolean); // Filter out any undefined items
            
            exclusionResultsDropdown.innerHTML = renderSearchResultItems(resultItems);
            exclusionResultsDropdown.style.display = 'block';
            isExclusionDropdownOpen = true;

             // Add listeners to these new items
             exclusionResultsDropdown.querySelectorAll('.search-result-item').forEach(el => {
                 el.removeEventListener('click', handleAddExclusion);
                 el.addEventListener('click', handleAddExclusion);
             });
        } else {
            exclusionResultsDropdown.style.display = 'none';
            isExclusionDropdownOpen = false;
        }
    }

    function handleAddExclusion(event) {
        const itemId = event.currentTarget.dataset.itemId;
        const itemToAdd = allSearchableItems.find(item => item.id === itemId);

        if (itemToAdd && itemToAdd.type === 'person') {
             // Check if already excluded by original ID
             if (!exclusions.some(ex => ex.originalId === itemToAdd.originalId)) {
                 exclusions.push({ ...itemToAdd }); // Add a copy
                 
                 // *** FIX: Re-render exclusion tokens ***
                 renderExclusions();
                 
                 if (exclusionSearchInput) {
                     exclusionSearchInput.value = ''; // Clear input
                     exclusionSearchInput.focus(); // Keep focus
                 }
                 if (exclusionResultsDropdown) {
                     exclusionResultsDropdown.style.display = 'none';
                     isExclusionDropdownOpen = false;
                 }
                 filterAndRenderTable(); // Trigger filter
                 console.log('Added exclusion:', itemToAdd);
             } else {
                  console.log('Person already excluded:', itemToAdd);
                  if (exclusionSearchInput) exclusionSearchInput.value = '';
                  if (exclusionResultsDropdown) {
                      exclusionResultsDropdown.style.display = 'none';
                      isExclusionDropdownOpen = false;
                  }
             }
        }
    }

    // Updated to work with tokens
    function handleRemoveExclusion(event) {
        const tokenElement = event.target.closest('.excluded-item-token');
        if (!tokenElement) return;

        const itemIdToRemove = tokenElement.dataset.itemId;
        exclusions = exclusions.filter(item => item.id !== itemIdToRemove);
        
        renderExclusions(); // Re-render tokens (will remove the clicked one)
        filterAndRenderTable();
        console.log('Removed exclusion:', itemIdToRemove);
    }

    function handleExcludeMember(event) {
        const memberId = parseInt(event.target.dataset.memberId, 10);
        const member = memberData.find(m => m.id === memberId);
        if (!member) return;
        
        // Find the corresponding item in allSearchableItems
        const uniqueId = `person-${member.id}`;
        const itemToAdd = allSearchableItems.find(item => item.id === uniqueId);

        if (itemToAdd && !exclusions.some(ex => ex.id === itemToAdd.id)) {
            exclusions.push(itemToAdd);
            renderExclusions();
            filterAndRenderTable(); // Re-render table with updated exclusions
            console.log('Excluded member from table:', itemToAdd);
        }
    }

    function handleIncludeMember(event) {
        const memberId = parseInt(event.target.dataset.memberId, 10);
        const uniqueId = `person-${memberId}`; // Construct the unique ID
        
        // Find the excluded item by the unique ID
        const exclusionIndex = exclusions.findIndex(ex => ex.id === uniqueId);
        
        if (exclusionIndex > -1) {
            const removedExclusion = exclusions.splice(exclusionIndex, 1)[0]; // Remove and get item
            renderExclusions();
            filterAndRenderTable(); // Re-render table 
            console.log('Included member from table:', removedExclusion);
        } else {
            console.warn('Could not find exclusion to remove with ID:', uniqueId);
        }
    }

    function handleTabClick(event) {
        const newTab = event.target.dataset.tab;
        if (newTab && newTab !== activeTab) {
            activeTab = newTab;
            
            // Update button styles
            tabButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === activeTab);
            });

            console.log("Switched tab to:", activeTab);
            filterAndRenderTable(); // Re-filter and render based on new tab
        }
    }

    // Updated Handler for picker tab clicks - prevent dropdown close
    function handlePickerTabClick(event) {
        event.stopPropagation(); // Prevent blur event on main input from closing dropdown
        const newTab = event.target.dataset.tab;
        if (newTab && newTab !== activePickerTab) {
            activePickerTab = newTab;
            renderEntityPicker(); // Re-render the picker with the new active tab
            mainSearchInput.focus(); // Keep focus on the main search input
        }
    }

    // --- 3-Dot Menu Handlers ---
    function handleSearchMenuClick(event) {
        event.stopPropagation(); // Prevent clicks bubbling up
        isMenuDropdownOpen = !isMenuDropdownOpen;
        if (searchOptionsDropdown) {
            searchOptionsDropdown.style.display = isMenuDropdownOpen ? 'block' : 'none';
        }
    }

    function handleMenuOptionClick(event) {
         const action = event.currentTarget.dataset.action;
         console.log('Menu action:', action);
         if (action === 'add-condition') {
             // Show the conditions section if it's hidden
             if (conditionsSection) conditionsSection.style.display = 'block';
             // Add a default condition if none exist
             if (conditions.length === 0) {
                 handleAddCondition();
             } else {
                // Maybe scroll into view?
             }
         } else if (action === 'delete-all') {
             // Confirmation might be good here in a real app
             selections = [];
             conditions = [];
             exclusions = []; // Should exclusions be cleared too?
             renderSelectionsAndConditions();
             renderExclusions();
             filterAndRenderTable();
         }
         // Close menu
         isMenuDropdownOpen = false;
         if (searchOptionsDropdown) searchOptionsDropdown.style.display = 'none';
    }

    // Global click listener to close dropdowns
    document.addEventListener('click', (event) => {
        // Close main search dropdown
        if (isDropdownOpen && !mainSearchInput.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
            searchResultsDropdown.style.display = 'none';
            isDropdownOpen = false;
        }
        // Close exclusion search dropdown
        if (isExclusionDropdownOpen && !exclusionSearchInput.contains(event.target) && !exclusionResultsDropdown.contains(event.target)) {
             exclusionResultsDropdown.style.display = 'none';
             isExclusionDropdownOpen = false;
        }
         // Close 3-dot menu dropdown
        if (isMenuDropdownOpen && !searchMenuButton.contains(event.target) && !searchOptionsDropdown.contains(event.target)) {
             searchOptionsDropdown.style.display = 'none';
             isMenuDropdownOpen = false;
        }
    });

    // --- Hovercard Handlers (Keep Existing) ---
    function getTimeForWorkplace(workplace) { /* ... existing ... */ }
    function showHovercard(member, position) { /* ... existing ... */ }
    function hideHovercard() { /* ... existing ... */ }
    function handleTableRowMouseEnter(event, memberId) { /* ... existing ... */ }
    function handleTableRowMouseLeave() { /* ... existing ... */ }
    function handleHovercardMouseEnter() { /* ... existing ... */ }
    function handleHovercardMouseLeave() { /* ... existing ... */ }
    // --- End Hovercard Handlers ---

    function handleConvertEntityToCondition(event) {
        const blockElement = event.target.closest('.selected-entity-block');
        if (!blockElement) return;
        const itemId = blockElement.dataset.itemId;
        const selectionIndex = selections.findIndex(s => s.id === itemId);
        if (selectionIndex === -1) return;

        const item = selections[selectionIndex];
        if (item.type === 'person' || item.type === 'condition-block') return;

        console.log('Converting entity to condition block:', item);

        // Transform the selection item
        const originalType = item.type;
        const originalName = item.name;
        selections[selectionIndex] = {
            ...item, 
            type: 'condition-block', 
            isStandalone: false, 
            originalType: originalType,
            originalName: originalName,
            rules: [
                 { 
                     id: `rule-${nextConditionId++}`,
                     field: originalType, 
                     operator: 'is', 
                     values: [item.originalName || item.name]
                 }
            ]
        };

        // Re-render the selections area
        renderSelectionsAndConditions(); 
        filterAndRenderTable();
    }

    // Modified handler to get ID from the block
     function handleRemoveSelection(event) {
        const blockElement = event.target.closest('.selected-entity-block');
        if (!blockElement) return;

        const itemIdToRemove = blockElement.dataset.itemId;
        selections = selections.filter(item => item.id !== itemIdToRemove);
        
        renderSelectionsAndConditions(); // Re-render the area
        filterAndRenderTable(); // Trigger filter
        console.log('Removed selection:', itemIdToRemove);
    }

    // Handler for 3-dot menu option "Add people using conditions"
    function handleAddStandaloneConditionBlock() {
         const newBlockData = {
             id: `cond-block-${nextConditionId++}`,
             isStandalone: true,
             rules: [
                 { // Add one default rule
                     id: `rule-${nextConditionId++}`,
                     field: conditionFieldOptions[0].value,
                     operator: conditionOperatorOptions.string[0].value,
                     values: []
                 }
             ]
         };
         conditions.push(newBlockData);
         renderSelectionsAndConditions(); // Re-render the main area
         filterAndRenderTable(); 
     }

    // Handler for adding rule to standalone block
    function handleAddRuleToStandaloneBlock(blockId) {
         const blockIndex = conditions.findIndex(b => b.id === blockId && b.isStandalone);
         if (blockIndex > -1) {
             conditions[blockIndex].rules.push({ /* new rule data */ });
             renderStandaloneConditionBlock(conditions[blockIndex]); // Re-render only this block
             filterAndRenderTable();
         }
     }
     
    // Handler for adding rule to inline block
    function handleAddRuleToInlineBlock(blockId) {
         const blockIndex = selections.findIndex(b => b.id === blockId && b.type === 'condition-block');
          if (blockIndex > -1) {
              selections[blockIndex].rules.push({ /* new rule data */ });
              renderInlineConditionBlock(selections[blockIndex]); // Re-render only this block
              filterAndRenderTable();
          }
    }

    // Handler for removing standalone block
    function handleRemoveStandaloneConditionBlock(blockId) {
         conditions = conditions.filter(b => !(b.id === blockId && b.isStandalone));
         renderSelectionsAndConditions();
         filterAndRenderTable();
     }

    // Handlers for updating/removing specific rules within blocks
    function updateRule(blockId, ruleId, key, value) {
        let blockToUpdate = conditions.find(b => b.id === blockId && b.isStandalone) || 
                           selections.find(b => b.id === blockId && b.type === 'condition-block');
        
        if (blockToUpdate) {
            const ruleIndex = blockToUpdate.rules.findIndex(r => r.id === ruleId);
            if (ruleIndex > -1) {
                const ruleToUpdate = blockToUpdate.rules[ruleIndex];
                const oldValue = ruleToUpdate[key];
                ruleToUpdate[key] = value;

                let needsReRender = false;
                // Reset operator/values if field changes
                if (key === 'field') {
                    ruleToUpdate.operator = conditionOperatorOptions.string[0].value;
                    ruleToUpdate.values = [];
                    needsReRender = true;
                }

                // Re-render the specific block
                if (blockToUpdate.isStandalone) {
                     renderStandaloneConditionBlock(blockToUpdate);
                } else {
                     renderInlineConditionBlock(blockToUpdate);
                }
                
                // Filter table only if value likely changed meaning
                let filterNeeded = true;
                if (key === 'values' && JSON.stringify(oldValue) === JSON.stringify(value)) {
                    filterNeeded = false; 
                }
                if (filterNeeded) {
                    filterAndRenderTable();
                }
                console.log('Updated rule:', ruleToUpdate);
            } else { console.error("Rule not found for update:", ruleId); }
        } else { console.error("Block not found for rule update:", blockId); }
    }
    function removeRule(blockId, ruleId) {
         // Find block
         // Remove rule from block.rules
         // If rules array becomes empty, maybe revert inline block back to entity?
         // Re-render block
         // Filter table
    }

    // --- INITIALIZATION --- 
    await loadData();
    renderSelectionsAndConditions(); 
    renderExclusions(); 
    filterAndRenderTable(); 

    // --- EVENT LISTENERS --- 
    if (mainSearchInput) {
        mainSearchInput.addEventListener('input', handleSearchInput);
        mainSearchInput.addEventListener('focus', handleSearchFocus);
        // Use the shared blur handler
        mainSearchInput.addEventListener('blur', (e) => handleDropdownBlur(e, searchResultsDropdown, mainSearchInput, (flag) => isDropdownOpen = flag));
    }
    // Note: Add condition button inside block is handled in renderConditionsBlock
    // if (addConditionButton) { 
    //     addConditionButton.addEventListener('click', handleAddCondition);
    // }
    if (toggleExternalCheckbox) toggleExternalCheckbox.addEventListener('change', handleToggleChange);
    if (toggleLeaveCheckbox) toggleLeaveCheckbox.addEventListener('change', handleToggleChange);
    if (toggleHireDateCheckbox) toggleHireDateCheckbox.addEventListener('change', handleToggleChange);
    if (hireDateSelect) hireDateSelect.addEventListener('change', handleToggleChange);
    if (toggleStatusFilterCheckbox) toggleStatusFilterCheckbox.addEventListener('change', handleToggleChange);
    if (statusFilterSelect) statusFilterSelect.addEventListener('change', handleToggleChange);

    if (exclusionSearchInput) {
        exclusionSearchInput.addEventListener('input', handleExclusionSearch);
        exclusionSearchInput.addEventListener('focus', handleExclusionSearch); // Show dropdown on focus too if needed
        // Use the shared blur handler
         exclusionSearchInput.addEventListener('blur', (e) => handleDropdownBlur(e, exclusionResultsDropdown, exclusionSearchInput, (flag) => isExclusionDropdownOpen = flag));
    }
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
    });
    if (hovercardElement) {
        hovercardElement.addEventListener('mouseenter', handleHovercardMouseEnter);
        hovercardElement.addEventListener('mouseleave', handleHovercardMouseLeave);
    }
    if (searchMenuButton) {
        searchMenuButton.addEventListener('click', handleSearchMenuClick);
    }
     if (searchOptionsDropdown) {
        searchOptionsDropdown.querySelectorAll('button').forEach(button => {
             button.addEventListener('click', handleMenuOptionClick);
         });
     }
     if (emptyStateAddConditionLink) {
        emptyStateAddConditionLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (conditionsSection) conditionsSection.style.display = 'block';
            if (conditions.length === 0) handleAddCondition();
            // Optionally scroll to the conditions section
            conditionsSection.scrollIntoView({ behavior: 'smooth' });
        });
     }
}); 

// Force redeploy trigger 