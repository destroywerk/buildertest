// People Selector Logic

// --- GLOBAL DATA --- 
let memberData = []; // Initialize as empty array
let allSearchableItems = []; // Combined list for search

// --- APPLICATION STATE --- 
let selections = []; // Array to hold selected items {id, type, name, description, ...}
let conditions = []; // Array to hold condition objects {id, field, operator, values}
let nextConditionId = 0; // Simple ID generator
let exclusions = []; // Array to hold excluded items {id, type, name, ...}
let toggleOptionsState = { // State for toggle checkboxes
    excludeExternal: false,
    excludeOnLeave: false
    // Add more toggles as needed
};
let activeTab = 'members'; // State for active tab ('members', 'excluded', 'all')
let hoverTimeout = null;
let hideTimeout = null;
let hoveredMemberId = null;

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

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Document loaded. JS is running.");

    // --- Get DOM Elements --- (Good practice to get them once)
    const memberTableBody = document.getElementById('member-table-body');
    const mainSearchInput = document.getElementById('main-search');
    const searchResultsDropdown = document.getElementById('search-results-dropdown');
    const selectedItemsContainer = document.getElementById('selected-items');
    const conditionsListContainer = document.getElementById('conditions-list');
    const addConditionButton = document.getElementById('add-condition-btn');
    const toggleExternalCheckbox = document.getElementById('toggle-external');
    const toggleLeaveCheckbox = document.getElementById('toggle-leave');
    const exclusionSearchInput = document.getElementById('exclusion-search');
    const exclusionResultsDropdown = document.getElementById('exclusion-results-dropdown');
    const excludedItemsContainer = document.getElementById('excluded-items-list');
    const tabButtons = document.querySelectorAll('.tab-button');
    const hovercardElement = document.getElementById('hovercard');
    // ... (add other elements as needed)

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

        // TODO: Add Teams, Legal Entities if necessary (from original code)

        console.log(`Prepared ${allSearchableItems.length} searchable items.`);

        // Derive options lists here after memberData is loaded
        departmentOptions = [...new Set(memberData.map(m => m.department).filter(Boolean))].sort();
        positionOptions = [...new Set(memberData.map(m => m.position).filter(Boolean))].sort();
        workplaceOptions = [...new Set(memberData.map(m => m.workplace).filter(Boolean))].sort();
        statusOptions = [...new Set(memberData.map(m => m.status).filter(Boolean))].sort();
        console.log('Derived Options:', { departmentOptions, positionOptions, workplaceOptions, statusOptions });
    }

    // --- RENDER FUNCTIONS --- 

    // Function to get initials from name
    function getInitials(name) {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    // Function to render the member table
    function renderMemberTable(membersToRender) {
        if (!memberTableBody) return;

        memberTableBody.innerHTML = ''; // Clear existing table rows

        membersToRender.forEach(member => {
            const row = document.createElement('tr');
            // Add hover listeners to the row
            row.addEventListener('mouseenter', (e) => handleTableRowMouseEnter(e, member.id));
            row.addEventListener('mouseleave', handleTableRowMouseLeave);

            // Name Cell (with avatar/initials)
            const nameCell = document.createElement('td');
            const avatarContainer = document.createElement('div');
            avatarContainer.style.display = 'flex';
            avatarContainer.style.alignItems = 'center';

            const avatarElement = document.createElement('div');
            avatarElement.style.width = '2rem';
            avatarElement.style.height = '2rem';
            avatarElement.style.borderRadius = '50%';
            avatarElement.style.marginRight = '0.75rem';
            avatarElement.style.display = 'flex';
            avatarElement.style.alignItems = 'center';
            avatarElement.style.justifyContent = 'center';
            avatarElement.style.fontSize = '0.875rem';
            avatarElement.style.fontWeight = '500';
            avatarElement.style.color = 'white';
            avatarElement.style.backgroundColor = '#a5b4fc'; // Example bg

            if (member.avatar) {
                const img = document.createElement('img');
                img.src = member.avatar;
                img.alt = member.name;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                avatarElement.appendChild(img);
            } else {
                avatarElement.textContent = getInitials(member.name);
                 // Add simple color hashing based on name for initials background
                let hash = 0;
                for (let i = 0; i < member.name.length; i++) {
                    hash = member.name.charCodeAt(i) + ((hash << 5) - hash);
                }
                const color = `hsl(${hash % 360}, 70%, 70%)`;
                avatarElement.style.backgroundColor = color;
            }

            avatarContainer.appendChild(avatarElement);
            avatarContainer.appendChild(document.createTextNode(member.name));
            nameCell.appendChild(avatarContainer);

            // Other Cells
            const positionCell = document.createElement('td');
            positionCell.textContent = member.position || 'N/A';

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.classList.add('status-badge');
            statusBadge.classList.add(`status-${(member.status || 'unknown').toLowerCase().replace(/\s+/g, '-')}`);
            statusBadge.textContent = member.status || 'Unknown';
            statusCell.appendChild(statusBadge);

            const departmentCell = document.createElement('td');
            departmentCell.textContent = member.department || 'N/A';

            const workplaceCell = document.createElement('td');
            workplaceCell.textContent = member.workplace || 'N/A';

            // Action Cell
            const actionCell = document.createElement('td');
            const actionButton = document.createElement('button');
            actionButton.dataset.memberId = member.id; // Store original member ID
            actionButton.classList.add('table-action-btn') // Add class for styling

            if (activeTab === 'excluded') {
                actionButton.textContent = 'Include';
                actionButton.addEventListener('click', handleIncludeMember); 
            } else {
                // Check if already excluded
                const isExcluded = exclusions.some(ex => ex.originalId === member.id);
                if (isExcluded) {
                    actionButton.textContent = 'Included'; // Or maybe hide button?
                    actionButton.disabled = true;
                } else {
                    actionButton.textContent = 'Exclude';
                    actionButton.addEventListener('click', handleExcludeMember); 
                }
            }
            actionCell.appendChild(actionButton);

            // Append cells to row
            row.appendChild(nameCell);
            row.appendChild(positionCell);
            row.appendChild(statusCell);
            row.appendChild(departmentCell);
            row.appendChild(workplaceCell);
            row.appendChild(actionCell);

            // Append row to table body
            memberTableBody.appendChild(row);
        });
    }

    // Function to render selected items
    function renderSelections() {
        if (!selectedItemsContainer) return;
        selectedItemsContainer.innerHTML = ''; // Clear
        
        if (selections.length === 0) {
            selectedItemsContainer.innerHTML = '<span class="placeholder-text">No items selected</span>'; // Show placeholder
            return;
        }

        selections.forEach(item => {
            const pill = document.createElement('div');
            pill.classList.add('selected-item-pill');
            pill.dataset.itemId = item.id;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;
            pill.appendChild(nameSpan);

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-selection-btn');
            removeBtn.textContent = '×'; // Multiplication sign for X
            removeBtn.addEventListener('click', handleRemoveSelection);
            pill.appendChild(removeBtn);

            selectedItemsContainer.appendChild(pill);
        });
    }

    // Function to render conditions
    function renderConditions() {
        if (!conditionsListContainer) return;
        conditionsListContainer.innerHTML = ''; // Clear

        if (conditions.length === 0) {
            conditionsListContainer.innerHTML = '<span class="placeholder-text">No conditions defined</span>';
            return;
        }

        conditions.forEach(condition => {
            const conditionRow = document.createElement('div');
            conditionRow.classList.add('condition-row');
            conditionRow.dataset.conditionId = condition.id;

            // Field Dropdown
            const fieldSelect = document.createElement('select');
            fieldSelect.classList.add('condition-field');
            conditionFieldOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.value === condition.field) option.selected = true;
                fieldSelect.appendChild(option);
            });
            fieldSelect.addEventListener('change', (e) => updateCondition(condition.id, 'field', e.target.value));
            
            // Operator Dropdown
            const operatorSelect = document.createElement('select');
            operatorSelect.classList.add('condition-operator');
            // TODO: Populate based on field type
            conditionOperatorOptions.string.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                 if (opt.value === condition.operator) option.selected = true;
                operatorSelect.appendChild(option);
            });
             operatorSelect.addEventListener('change', (e) => updateCondition(condition.id, 'operator', e.target.value));

            // Value Input/Select (Using Choices.js)
            const valueContainer = document.createElement('div'); // Container for Choices.js
            valueContainer.classList.add('condition-value-container');
            
            const valueSelect = document.createElement('select');
            valueSelect.multiple = true; // Enable multi-select
            valueSelect.classList.add('condition-value-select'); // Add a class for easier selection
            valueSelect.dataset.conditionId = condition.id; // Link back to condition id

            // Determine options based on field
            let currentOptions = [];
            switch (condition.field) {
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
                // Pre-select options if they are in condition.values
                if (condition.values.includes(optValue)) {
                    option.selected = true;
                }
                valueSelect.appendChild(option);
            });

            valueContainer.appendChild(valueSelect);

            // Remove Button
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-condition-btn');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => removeCondition(condition.id));

            conditionRow.appendChild(fieldSelect);
            conditionRow.appendChild(operatorSelect);
            conditionRow.appendChild(valueContainer); // Add container for Choices.js
            conditionRow.appendChild(removeBtn);
            conditionsListContainer.appendChild(conditionRow);

             // Initialize Choices.js AFTER the element is in the DOM
            const choicesInstance = new Choices(valueSelect, {
                 removeItemButton: true,
                 placeholder: true,
                 placeholderValue: 'Select value(s)...',
                 // Add other Choices.js options if needed
             });
             
             // Add event listener for Choices.js changes
             valueSelect.addEventListener('change', (event) => {
                 // Get selected values from Choices.js instance
                 const selectedValues = Array.from(event.target.selectedOptions).map(option => option.value);
                 updateCondition(condition.id, 'values', selectedValues);
             });

        });
    }

    // Function to render excluded items
    function renderExclusions() {
        if (!excludedItemsContainer) return;
        excludedItemsContainer.innerHTML = ''; // Clear
        
        if (exclusions.length === 0) {
            excludedItemsContainer.innerHTML = '<span class="placeholder-text">No people excluded</span>';
            return;
        }

        exclusions.forEach(item => {
            const pill = document.createElement('div');
            pill.classList.add('excluded-item-pill');
            pill.dataset.itemId = item.id; // Use the unique person ID (e.g., person-X)

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;
            pill.appendChild(nameSpan);

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-exclusion-btn');
            removeBtn.textContent = '×'; 
            removeBtn.addEventListener('click', handleRemoveExclusion);
            pill.appendChild(removeBtn);

            excludedItemsContainer.appendChild(pill);
        });
    }

    // --- FILTERING LOGIC --- 
    function filterAndRenderTable() {
        console.log("Filtering data...");
        let filteredMembers = [...memberData]; // Start with full data

        // TODO 1: Apply Selections Filter
        // If selections is not empty, filter members to match selected criteria
        // e.g., if {type: 'department', name: 'Engineering'} is selected,
        // keep only members where member.department === 'Engineering'.
        // Handle multiple selections (OR logic usually) and different types (person, position etc.)
        if (selections.length > 0) {
            console.log("Applying selections:", selections);
            filteredMembers = filteredMembers.filter(member => {
                return selections.some(selection => {
                    if (selection.type === 'person') {
                        return member.id === selection.originalId;
                    }
                    if (selection.type === 'department') {
                         return member.department === selection.originalName;
                    }
                    if (selection.type === 'position') {
                         return member.position === selection.originalName;
                    }
                     if (selection.type === 'workplace') {
                         return member.workplace === selection.originalName;
                    }
                    // Add other types (team, legal) if implemented
                    return false;
                });
            });
            console.log("After selections:", filteredMembers.length);
        }

        // TODO 2: Apply Conditions Filter
        // If conditions is not empty, filter based on condition rules (AND logic usually)
        if (conditions.length > 0) {
             console.log("Applying conditions:", conditions);
             filteredMembers = filteredMembers.filter(member => {
                return conditions.every(condition => {
                    const memberValue = member[condition.field];
                    if (memberValue === undefined || memberValue === null) return false; // Cannot match if value is missing
                    
                    const memberValueString = String(memberValue);
                    
                    switch (condition.operator) {
                        case 'is':
                            return condition.values.includes(memberValueString);
                        case 'is_not':
                            return !condition.values.includes(memberValueString);
                        // Add other operators as needed
                        default:
                            return true;
                    }
                });
            });
            console.log("After conditions:", filteredMembers.length);
        }

        // TODO 3: Apply Exclusions Filter (Only for 'members' tab)
        if (activeTab === 'members' && exclusions.length > 0) {
             console.log("Applying exclusions:", exclusions);
             const excludedPersonIds = new Set(exclusions.map(ex => ex.originalId));
             filteredMembers = filteredMembers.filter(member => !excludedPersonIds.has(member.id));
             console.log("After exclusions:", filteredMembers.length);
        }

        // TODO 4: Apply Toggle Filters (Only for 'members' tab)
        if (activeTab === 'members') {
            if (toggleOptionsState.excludeExternal) {
                console.log("Applying toggle: excludeExternal");
                filteredMembers = filteredMembers.filter(member => !member.isExternal);
            }
            if (toggleOptionsState.excludeOnLeave) {
                 console.log("Applying toggle: excludeOnLeave");
                filteredMembers = filteredMembers.filter(member => member.status !== 'On Leave');
            }
            console.log("After toggles:", filteredMembers.length);
        } else if (activeTab === 'excluded') {
            // Special case: Show only excluded members
            const excludedPersonIds = new Set(exclusions.map(ex => ex.originalId));
            filteredMembers = memberData.filter(member => excludedPersonIds.has(member.id));
            console.log("Showing excluded tab:", filteredMembers.length);
        } else if (activeTab === 'all') {
             // Show members based on selections/conditions only
             // Exclusions & Toggles are already skipped implicitly if not 'members' tab
             console.log("Showing all tab (after selections/conditions):", filteredMembers.length);
        }

        // Final Render
        renderMemberTable(filteredMembers);
    }

    // --- EVENT HANDLERS --- 
    function handleSearchInput(event) {
        const query = event.target.value.toLowerCase().trim();
        
        if (!searchResultsDropdown) return;

        if (query.length < 1) { // Hide dropdown if query is short
            searchResultsDropdown.style.display = 'none';
            searchResultsDropdown.innerHTML = '';
            return;
        }

        // Filter items (excluding already selected ones)
        const selectedIds = new Set(selections.map(s => s.id));
        const filteredItems = allSearchableItems.filter(item => 
            !selectedIds.has(item.id) && 
            item.name.toLowerCase().includes(query)
            // Add more search criteria if needed (e.g., search description)
        ).slice(0, 10); // Limit results

        // Render results
        searchResultsDropdown.innerHTML = ''; // Clear previous results
        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.textContent = `${item.name} (${item.description || item.type})`; // Example display
                itemElement.classList.add('search-result-item'); // Add class for styling/event delegation
                itemElement.dataset.itemId = item.id; // Store ID to identify item on click
                itemElement.addEventListener('click', handleSearchResultClick);
                searchResultsDropdown.appendChild(itemElement);
            });
            searchResultsDropdown.style.display = 'block';
        } else {
            searchResultsDropdown.style.display = 'none';
        }
    }

    function handleSearchResultClick(event) {
        const itemId = event.currentTarget.dataset.itemId;
        const itemToAdd = allSearchableItems.find(item => item.id === itemId);
        
        if (itemToAdd && !selections.some(s => s.id === itemToAdd.id)) {
            selections.push(itemToAdd);
            renderSelections();
            // Clear search input and hide dropdown
            if (mainSearchInput) mainSearchInput.value = '';
            if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
            filterAndRenderTable(); // Trigger filter
            console.log('Added selection:', itemToAdd);
        }
    }

    function handleRemoveSelection(event) {
        const pillElement = event.target.closest('.selected-item-pill');
        if (!pillElement) return;

        const itemIdToRemove = pillElement.dataset.itemId;
        selections = selections.filter(item => item.id !== itemIdToRemove);
        
        renderSelections(); // Re-render the pills
        filterAndRenderTable(); // Trigger filter
        console.log('Removed selection:', itemIdToRemove);
    }

    function handleAddCondition() {
        const newCondition = {
            id: nextConditionId++,
            field: conditionFieldOptions[0].value, // Default to first field
            operator: conditionOperatorOptions.string[0].value, // Default to first string operator
            values: []
        };
        conditions.push(newCondition);
        renderConditions();
        filterAndRenderTable(); // Trigger filter
    }

    function updateCondition(id, key, value) {
        const conditionIndex = conditions.findIndex(c => c.id === id);
        if (conditionIndex > -1) {
            const conditionToUpdate = conditions[conditionIndex];
            const oldValue = conditionToUpdate[key]; // Store old value for comparison
            
            conditionToUpdate[key] = value;
            
            let needsReRender = false;
            let filterNeeded = false;

            // If field changes, reset operator/values and re-render the row
            if (key === 'field') {
                 conditionToUpdate.operator = conditionOperatorOptions.string[0].value; // Reset operator
                 conditionToUpdate.values = []; // Reset values
                 needsReRender = true; 
                 filterNeeded = true; // Filter needed as value changed
            } else if (key === 'operator' || key === 'values') {
                // Only filter if the actual value or operator changed
                // (Simple comparison for arrays - might need deep compare for complex values)
                if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
                    filterNeeded = true;
                }
            }

            if (needsReRender) {
                renderConditions(); // Re-render the whole conditions list
            } 
            
            if (filterNeeded) {
                filterAndRenderTable(); // Trigger filtering
            }
            
            console.log('Updated condition:', conditionToUpdate);
        }
    }

    function removeCondition(id) {
        conditions = conditions.filter(c => c.id !== id);
        renderConditions();
        filterAndRenderTable(); // Trigger filter
    }

    function handleToggleChange(event) {
        const toggleId = event.target.id;
        const isChecked = event.target.checked;

        if (toggleId === 'toggle-external') {
            toggleOptionsState.excludeExternal = isChecked;
        } else if (toggleId === 'toggle-leave') {
            toggleOptionsState.excludeOnLeave = isChecked;
        }
        // Add more else if for other toggles

        console.log("Toggle changed:", toggleOptionsState);
        filterAndRenderTable(); // Re-filter the table
    }

    function handleExclusionSearch(event) {
        const query = event.target.value.toLowerCase().trim();
        
        if (!exclusionResultsDropdown) return;

        if (query.length < 1) { 
            exclusionResultsDropdown.style.display = 'none';
            exclusionResultsDropdown.innerHTML = '';
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

        // Render results
        exclusionResultsDropdown.innerHTML = ''; 
        if (filteredPeople.length > 0) {
            filteredPeople.forEach(member => {
                const itemElement = document.createElement('div');
                // Use the unique person ID format from allSearchableItems
                const uniqueId = `person-${member.id}`;
                const displayItem = allSearchableItems.find(item => item.id === uniqueId);
                
                itemElement.textContent = `${member.name} (${member.position || 'Person'})`;
                itemElement.classList.add('search-result-item'); 
                itemElement.dataset.itemId = uniqueId; // Use the unique person ID
                itemElement.addEventListener('click', handleAddExclusion);
                exclusionResultsDropdown.appendChild(itemElement);
            });
            exclusionResultsDropdown.style.display = 'block';
        } else {
            exclusionResultsDropdown.style.display = 'none';
        }
    }

    function handleAddExclusion(event) {
         const itemId = event.currentTarget.dataset.itemId;
         // Find the corresponding item in allSearchableItems to get consistent structure
         const itemToAdd = allSearchableItems.find(item => item.id === itemId);
         
         if (itemToAdd && itemToAdd.type === 'person' && !exclusions.some(ex => ex.id === itemToAdd.id)) {
             exclusions.push(itemToAdd);
             renderExclusions();
             if (exclusionSearchInput) exclusionSearchInput.value = '';
             if (exclusionResultsDropdown) exclusionResultsDropdown.style.display = 'none';
             filterAndRenderTable();
             console.log('Added exclusion:', itemToAdd);
         }
    }

    function handleRemoveExclusion(event) {
        const pillElement = event.target.closest('.excluded-item-pill');
        if (!pillElement) return;

        const itemIdToRemove = pillElement.dataset.itemId;
        exclusions = exclusions.filter(item => item.id !== itemIdToRemove);
        
        renderExclusions();
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
        const uniqueId = `person-${memberId}`;
        
        exclusions = exclusions.filter(ex => ex.id !== uniqueId);
        renderExclusions();
        filterAndRenderTable(); // Re-render table (will remove member from excluded view)
        console.log('Included member from table:', uniqueId);
    }

    function handleTabClick(event) {
        const newTab = event.target.dataset.tab;
        if (newTab && newTab !== activeTab) {
            activeTab = newTab;
            
            // Update button styles
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tab === activeTab) {
                    btn.classList.add('active');
                }
            });

            console.log("Switched tab to:", activeTab);
            filterAndRenderTable(); // Re-filter and render based on new tab
        }
    }

    function handleSearchBlur(event) {
        setTimeout(() => {
            if (searchResultsDropdown && !searchResultsDropdown.contains(document.activeElement)) {
                searchResultsDropdown.style.display = 'none';
            }
        }, 150);
    }

    function handleSearchFocus() {
        // Optional: Show dropdown if there's already text or recent results?
        // For now, let input handler manage showing based on query length.
    }

    function handleExclusionSearchBlur(event) {
        setTimeout(() => {
            if (exclusionResultsDropdown && !exclusionResultsDropdown.contains(document.activeElement)) {
                exclusionResultsDropdown.style.display = 'none';
            }
        }, 150);
    }

    function handleExclusionSearchFocus() {
        // Optional logic
    }

    // Dummy function for local time (from Hovercard.tsx)
    function getTimeForWorkplace(workplace) {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      switch (workplace) {
        case 'New York': hours -= 5; break;
        case 'London': hours += 0; break;
        case 'Paris': case 'Madrid': case 'Berlin': case 'Munich': hours += 1; break;
        case 'Tokyo': hours += 9; break;
        default: break; 
      }
      hours = (hours + 24) % 24;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes} local time`;
    }

    // Function to populate and show hovercard
    function showHovercard(member, position) {
        if (!hovercardElement || !member) return;

        const localTime = getTimeForWorkplace(member.workplace);

        // Build hovercard content dynamically
        hovercardElement.innerHTML = `
            <div class="hovercard-header">
                ${member.avatar 
                    ? `<img src="${member.avatar}" alt="${member.name}" class="hovercard-avatar" />` 
                    : `<div class="hovercard-avatar-initials">${getInitials(member.name)}</div>`}
                <div>
                    <div class="hovercard-name">${member.name}</div>
                    <div class="hovercard-position">${member.position || '-'}</div>
                </div>
            </div>
            <div class="hovercard-details">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    ${localTime}
                </div>
                 ${member.workplace ? `<div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                    <span class="detail-badge">${member.workplace}</span>
                </div>` : ''}
                ${member.department ? `<div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                    <span class="detail-badge">${member.department}</span>
                 </div>` : ''}
            </div>
            <div class="hovercard-actions">
                 <button class="hovercard-action-btn">
                     <svg fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title>Slack Logo</title><path d="M126.12,315.1A47.06,47.06,0,1,1,79.06,268h47.06Z"/><path d="M149.84,315.1a47.06,47.06,0,0,1,94.12,0V432.94a47.06,47.06,0,1,1-94.12,0Z"/><path d="M196.9,126.12A47.06,47.06,0,1,1,244,79.06v47.06Z"/><path d="M196.9,149.84a47.06,47.06,0,0,1,0,94.12H79.06a47.06,47.06,0,0,1,0-94.12Z"/><path d="M385.88,196.9A47.06,47.06,0,1,1,432.94,244H385.88Z"/><path d="M362.16,196.9a47.06,47.06,0,0,1-94.12,0V79.06a47.06,47.06,0,1,1,94.12,0Z"/><path d="M315.1,385.88A47.06,47.06,0,1,1,268,432.94V385.88Z"/><path d="M315.1,362.16a47.06,47.06,0,0,1,0-94.12H432.94a47.06,47.06,0,1,1,0,94.12Z"/></svg>
                     Slack
                 </button>
                 <button class="hovercard-action-btn">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                     Email
                 </button>
            </div>
        `;

        // Position and show
        hovercardElement.style.top = `${position.top}px`;
        hovercardElement.style.left = `${position.left}px`;
        hovercardElement.style.display = 'block';
        hovercardElement.style.opacity = 1;
    }

    // Function to hide hovercard
    function hideHovercard() {
        if (hovercardElement) {
             hovercardElement.style.opacity = 0;
             // Use timeout to allow fade out before setting display none
             setTimeout(() => {
                 if (hovercardElement.style.opacity === '0') { // Check if still hidden
                    hovercardElement.style.display = 'none';
                    hoveredMemberId = null;
                 }
             }, 150); // Match transition duration
        }
    }

    // Hover Handlers
    function handleTableRowMouseEnter(event, memberId) {
        clearTimeout(hideTimeout);
        clearTimeout(hoverTimeout);
        const targetElement = event.currentTarget;

        hoverTimeout = setTimeout(() => {
            const rect = targetElement.getBoundingClientRect();
            const member = memberData.find(m => m.id === memberId);
            // Position relative to viewport, slightly offset from row
            // Add check to prevent going off-screen (basic)
            let top = rect.top + 5;
            let left = rect.left + 5;
            const hovercardWidth = 18 * 16; // approx width in px (18rem)
            const hovercardHeight = 250; // approx height in px

            if (left + hovercardWidth > window.innerWidth) {
                left = window.innerWidth - hovercardWidth - 10; // Adjust left
            }
             if (top + hovercardHeight > window.innerHeight) {
                top = window.innerHeight - hovercardHeight - 10; // Adjust top
            }
            if (left < 0) left = 5;
            if (top < 0) top = 5;

            hoveredMemberId = memberId;
            showHovercard(member, { top, left });
        }, 700); // Delay before showing (adjust as needed)
    }

    function handleTableRowMouseLeave() {
        clearTimeout(hoverTimeout);
        // Only hide if the mouse didn't enter the hovercard itself
        hideTimeout = setTimeout(() => {
            // Check if the hovercard element exists and if the mouse is currently over it
            if (hovercardElement && !hovercardElement.matches(':hover')) {
                 hideHovercard();
            }
        }, 200); // Short delay before hiding
    }

    function handleHovercardMouseEnter() {
        clearTimeout(hideTimeout); // Cancel hide timer if mouse enters hovercard
    }

     function handleHovercardMouseLeave() {
         // Start hide timer when leaving hovercard
        hideTimeout = setTimeout(() => {
            hideHovercard();
        }, 200); 
     }

    // --- INITIALIZATION --- 
    await loadData();
    if (memberData.length > 0) {
        renderMemberTable(memberData);
        renderSelections();
        renderConditions(); 
        renderExclusions(); // Initial render
    } else {
        console.log("No member data loaded, cannot render table.")
        // Optionally display a message in the table body
        if (memberTableBody) {
            memberTableBody.innerHTML = '<tr><td colspan="6">Failed to load member data.</td></tr>';
        }
    }

    // --- EVENT LISTENERS --- 
    if (mainSearchInput) {
        mainSearchInput.addEventListener('input', handleSearchInput);
        mainSearchInput.addEventListener('blur', handleSearchBlur);
        mainSearchInput.addEventListener('focus', handleSearchFocus);
    }
    if (addConditionButton) {
        addConditionButton.addEventListener('click', handleAddCondition);
    }
    if (toggleExternalCheckbox) {
        toggleExternalCheckbox.addEventListener('change', handleToggleChange);
    }
    if (toggleLeaveCheckbox) {
        toggleLeaveCheckbox.addEventListener('change', handleToggleChange);
    }
    if (exclusionSearchInput) {
        exclusionSearchInput.addEventListener('input', handleExclusionSearch);
        exclusionSearchInput.addEventListener('blur', handleExclusionSearchBlur);
        exclusionSearchInput.addEventListener('focus', handleExclusionSearchFocus);
    }
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
    });
    if (hovercardElement) {
        hovercardElement.addEventListener('mouseenter', handleHovercardMouseEnter);
        hovercardElement.addEventListener('mouseleave', handleHovercardMouseLeave);
    }
}); 