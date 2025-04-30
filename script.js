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
let activePickerTab = 'people'; // State for search picker tab

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
    const memberTableEmptyState = document.getElementById('member-table-empty-state');
    const memberCountDisplay = document.getElementById('member-count-display');
    const searchMenuButton = document.getElementById('search-menu-btn');
    const exclusionSearchWrapper = exclusionSearchInput?.parentElement; // Get the wrapper
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

    // Updated function to render the member table
    function renderMemberTable(membersToRender) {
        if (!memberTableBody || !memberTableEmptyState) return;

        memberTableBody.innerHTML = ''; // Clear existing table rows

        if (membersToRender.length === 0) {
            memberTableEmptyState.style.display = 'block'; // Show empty state message
            memberTableBody.style.display = 'none';
        } else {
            memberTableEmptyState.style.display = 'none'; // Hide empty state message
            memberTableBody.style.display = ''; // Show table body (default display)
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
                 // Use class for styling now
                 avatarElement.classList.add('table-avatar-container'); 
                 if (member.avatar) {
                     const img = document.createElement('img');
                     img.src = member.avatar;
                     img.alt = member.name;
                     img.classList.add('table-avatar-img');
                     avatarElement.appendChild(img);
                 } else {
                     avatarElement.classList.add('table-avatar-initials');
                     avatarElement.textContent = getInitials(member.name);
                     let hash = 0;
                     for (let i = 0; i < member.name.length; i++) {
                         hash = member.name.charCodeAt(i) + ((hash << 5) - hash);
                     }
                     const color = `hsl(${hash % 360}, 70%, 60%)`; // Adjusted saturation/lightness
                     avatarElement.style.backgroundColor = color;
                 }
     
                 avatarContainer.appendChild(avatarElement);
                 const nameText = document.createElement('span');
                 nameText.textContent = member.name;
                 nameText.classList.add('table-member-name');
                 avatarContainer.appendChild(nameText);
                 nameCell.appendChild(avatarContainer);
     
                 // Action Cell
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
                         actionButton.textContent = 'Include'; // Change label to Include if excluded
                         actionButton.addEventListener('click', handleIncludeMember); 
                     } else {
                         actionButton.textContent = 'Exclude';
                         actionButton.addEventListener('click', handleExcludeMember); 
                     }                 
                 }
                 actionCell.appendChild(actionButton);
                 actionCell.classList.add('action-cell'); // Add class for text-align right if needed
     
                 // Append cells to row
                 row.appendChild(nameCell);
                 // Only Name and Action columns now
                 // row.appendChild(positionCell);
                 // row.appendChild(statusCell);
                 // row.appendChild(departmentCell);
                 // row.appendChild(workplaceCell);
                 row.appendChild(actionCell);
     
                 // Append row to table body
                 memberTableBody.appendChild(row);
            });
        }
        updateMemberCount(membersToRender.length);
    }

    // Updated Function to render selected items as blocks
    function renderSelections() {
        if (!selectedItemsContainer) return;
        selectedItemsContainer.innerHTML = ''; // Clear
        
        if (selections.length === 0) {
             // No placeholder needed here now based on new design
            // selectedItemsContainer.innerHTML = '<span class="placeholder-text">No items selected</span>'; 
            return;
        }

        selections.forEach(item => {
            const block = document.createElement('div');
            block.classList.add('selected-entity-block');
            block.dataset.itemId = item.id;

            const iconContainer = document.createElement('div');
            iconContainer.classList.add('entity-icon-container');
            // TODO: Add specific icons based on item.type
            iconContainer.innerHTML = getEntityIcon(item.type); // Placeholder function
            
            const infoContainer = document.createElement('div');
            infoContainer.classList.add('entity-info');
            const nameDiv = document.createElement('div');
            nameDiv.classList.add('entity-name');
            nameDiv.textContent = item.name;
            const typeDiv = document.createElement('div');
            typeDiv.classList.add('entity-type');
            typeDiv.textContent = item.type; // Or a more user-friendly type name
            infoContainer.appendChild(nameDiv);
            infoContainer.appendChild(typeDiv);

            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('entity-actions');

            // Only show "Add condition" for non-person types initially
            if (item.type !== 'person') {
                const addConditionBtn = document.createElement('button');
                addConditionBtn.classList.add('btn-add-condition');
                addConditionBtn.textContent = '+ Add condition';
                addConditionBtn.addEventListener('click', handleConvertEntityToCondition);
                actionsContainer.appendChild(addConditionBtn);
            }

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('btn-remove-entity');
            removeBtn.textContent = '×'; // Use multiplication sign or an SVG icon
            removeBtn.addEventListener('click', handleRemoveSelection);
            actionsContainer.appendChild(removeBtn);

            block.appendChild(iconContainer);
            block.appendChild(infoContainer);
            block.appendChild(actionsContainer);

            selectedItemsContainer.appendChild(block);
        });
    }

    // Helper to get icons (replace with actual SVGs)
    function getEntityIcon(type) {
        switch(type) {
            case 'person': return '👤'; 
            case 'department': return '🏢';
            case 'position': return '🏷️';
            case 'workplace': return '📍';
            default: return '❔';
        }
    }

    // Function to update member count display
    function updateMemberCount(count) {
        if (memberCountDisplay) {
            memberCountDisplay.textContent = count;
        }
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

             // Make the whole container clickable to open the dropdown
             const choicesInner = valueContainer.querySelector('.choices__inner');
             if (choicesInner) {
                 choicesInner.addEventListener('click', (event) => {
                    // Prevent the click from propagating to the input or remove button
                    if (event.target.closest('.choices__button') || event.target.matches('.choices__input')) {
                        return;
                    }
                    choicesInstance.showDropdown(); 
                 });
             }

        });
    }

    // Updated Function to render excluded items as tokens inside the input wrapper
    function renderExclusions() {
        if (!exclusionSearchWrapper || !exclusionSearchInput) return;

        // Remove existing tokens first
        exclusionSearchWrapper.querySelectorAll('.excluded-item-token').forEach(el => el.remove());

        let hasTokens = false;
        if (exclusions.length > 0) {
            hasTokens = true;
            exclusions.forEach(item => {
                const token = document.createElement('div');
                token.classList.add('excluded-item-token');
                token.dataset.itemId = item.id; 

                // Small avatar/initials (optional)
                const avatar = document.createElement('span');
                avatar.classList.add('token-avatar');
                if (item.avatar) {
                    avatar.innerHTML = `<img src="${item.avatar}" alt="">`;
                } else {
                    avatar.textContent = getInitials(item.name).substring(0,2);
                    // Add color hashing maybe?
                }
                token.appendChild(avatar);

                const nameSpan = document.createElement('span');
                nameSpan.classList.add('token-name');
                nameSpan.textContent = item.name;
                token.appendChild(nameSpan);

                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-exclusion-token-btn');
                removeBtn.textContent = '×'; 
                removeBtn.addEventListener('click', handleRemoveExclusion);
                token.appendChild(removeBtn);

                // Insert token BEFORE the input element
                exclusionSearchWrapper.insertBefore(token, exclusionSearchInput);
            });
        }
        
        // Add/remove class for styling input when tokens are present
        if (hasTokens) {
            exclusionSearchWrapper.classList.add('has-tokens');
        } else {
            exclusionSearchWrapper.classList.remove('has-tokens');
        }

        // Clear the input field after adding/removing tokens
        exclusionSearchInput.value = '';
        exclusionSearchInput.placeholder = hasTokens ? '' : 'Select people to exclude';
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

    // Function to render the search dropdown (either picker or results)
    function renderSearchDropdown(query = '') {
        if (!searchResultsDropdown) return;
        searchResultsDropdown.innerHTML = ''; // Clear

        if (query.length === 0) {
            // Render Entity Picker View
            renderEntityPicker();
            searchResultsDropdown.style.display = 'block';
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
        const excludedIds = new Set(exclusions.map(e => e.id)); // Exclude excluded people

        switch (activePickerTab) {
            case 'people': 
                itemsToShow = allSearchableItems.filter(item => item.type === 'person' && !selectedIds.has(item.id) && !excludedIds.has(item.id)).slice(0, 10);
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
        
        const filtered = { people: [], departments: [], positions: [], workplaces: [] };
        
        allSearchableItems.forEach(item => {
             if (!selectedIds.has(item.id) && item.name.toLowerCase().includes(lowerQuery)) {
                 if (filtered[item.type + 's']) { // Check if category exists
                     filtered[item.type + 's'].push(item);
                 }
             }
        });

        let resultsHTML = '';
        let totalResults = 0;
        
        if (filtered.people.length > 0) {
            resultsHTML += `<div class="search-group-header">People</div>${renderSearchResultItems(filtered.people.slice(0,5))}`;
            totalResults += filtered.people.length;
        }
        if (filtered.departments.length > 0) {
             resultsHTML += `<div class="search-group-header">Departments</div>${renderSearchResultItems(filtered.departments.slice(0,3))}`;
             totalResults += filtered.departments.length;
        }
        if (filtered.positions.length > 0) {
             resultsHTML += `<div class="search-group-header">Positions</div>${renderSearchResultItems(filtered.positions.slice(0,3))}`;
             totalResults += filtered.positions.length;
        }
         if (filtered.workplaces.length > 0) {
             resultsHTML += `<div class="search-group-header">Workplaces</div>${renderSearchResultItems(filtered.workplaces.slice(0,3))}`;
             totalResults += filtered.workplaces.length;
        }

        searchResultsDropdown.innerHTML = resultsHTML;

        if (totalResults > 0) {
            searchResultsDropdown.style.display = 'block';
             addDropdownItemListeners();
        } else {
            searchResultsDropdown.style.display = 'none';
        }
    }

    // Helper to render a list of items for the dropdown
    function renderSearchResultItems(items) {
        return items.map(item => `
            <div class="search-result-item" data-item-id="${item.id}">
                 <span class="result-item-icon">${getEntityIcon(item.type)}</span> 
                 <span class="result-item-name">${item.name}</span>
                 <span class="result-item-desc">${item.description || ''}</span>
             </div>
        `).join('');
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
 
     function handleSearchBlur(event) {
         setTimeout(() => {
             // Check if the focus is moving to an item within the dropdown
             const relatedTarget = event.relatedTarget;
             if (searchResultsDropdown && !searchResultsDropdown.contains(relatedTarget)) {
                  searchResultsDropdown.style.display = 'none';
              }
          }, 150); // Delay allows click on dropdown item
     }
 
     function handleSearchFocus() {
         // Show picker immediately on focus if input is empty
         if (mainSearchInput && mainSearchInput.value.trim().length === 0) {
             renderSearchDropdown();
         }
     }

     // Update to use the item found in allSearchableItems directly
     function handleSearchResultClick(event) {
         const itemId = event.currentTarget.dataset.itemId;
         const itemToAdd = allSearchableItems.find(item => item.id === itemId);
         
         // Ensure not already selected
         if (itemToAdd && !selections.some(s => s.id === itemToAdd.id)) { 
             selections.push(itemToAdd);
             renderSelections();
             if (mainSearchInput) mainSearchInput.value = '';
             if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
             filterAndRenderTable(); // Trigger filter
             console.log('Added selection:', itemToAdd);
         } else if (itemToAdd) {
             console.log('Item already selected:', itemToAdd);
             // Maybe provide feedback? For now, just close dropdown.
              if (mainSearchInput) mainSearchInput.value = '';
             if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
         }
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
             if (exclusionResultsDropdown) exclusionResultsDropdown.style.display = 'none';
             filterAndRenderTable();
             console.log('Added exclusion:', itemToAdd);
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

    function handleConvertEntityToCondition(event) {
        const blockElement = event.target.closest('.selected-entity-block');
        if (!blockElement) return;
        const itemId = blockElement.dataset.itemId;
        const selectionIndex = selections.findIndex(s => s.id === itemId);
        if (selectionIndex === -1) return;

        const item = selections[selectionIndex];

        // Remove from selections
        selections.splice(selectionIndex, 1);

        // Add to conditions (pre-filled)
        const newCondition = {
            id: nextConditionId++, // Ensure unique ID
            field: item.type, // e.g., 'department'
            operator: 'is', // Default operator
            values: [item.originalName || item.name] // Use original name if available
        };
        conditions.push(newCondition);

        // Re-render both sections and filter table
        renderSelections();
        renderConditions();
        filterAndRenderTable();
        console.log('Converted selection to condition:', newCondition);
    }

    // Modified handler to get ID from the block
     function handleRemoveSelection(event) {
        const blockElement = event.target.closest('.selected-entity-block');
        if (!blockElement) return;

        const itemIdToRemove = blockElement.dataset.itemId;
        selections = selections.filter(item => item.id !== itemIdToRemove);
        
        renderSelections(); // Re-render the pills/blocks
        filterAndRenderTable(); // Trigger filter
        console.log('Removed selection:', itemIdToRemove);
    }

    function handleSearchMenuClick() {
        // Simple toggle for now
        // TODO: Implement a proper dropdown menu if more options are needed
        if (conditionsListContainer) { // Check if the element exists
            const isHidden = conditionsListContainer.parentElement.style.display === 'none';
            conditionsListContainer.parentElement.style.display = isHidden ? 'block' : 'none';
            
            // Optionally add a default condition if shown and empty
            if (isHidden && conditions.length === 0) {
                // handleAddCondition(); // Or maybe just show the empty state
            }
        }
    }

    // Handler for picker tab clicks
    function handlePickerTabClick(event) {
        const newTab = event.target.dataset.tab;
        if (newTab && newTab !== activePickerTab) {
            activePickerTab = newTab;
            renderEntityPicker(); // Re-render the picker with the new active tab
        }
    }

    // --- INITIALIZATION --- 
    await loadData();
    if (memberData.length > 0) {
        // renderMemberTable(memberData); // Don't render full table initially
        renderSelections();
        renderConditions(); 
        renderExclusions(); 
        filterAndRenderTable(); // Call filter which should result in empty table initially
    } else {
        // ... error handling ...
        memberTableEmptyState.style.display = 'block';
        memberTableBody.style.display = 'none';
         updateMemberCount(0);
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
    if (searchMenuButton) {
        searchMenuButton.addEventListener('click', handleSearchMenuClick);
    }
}); 