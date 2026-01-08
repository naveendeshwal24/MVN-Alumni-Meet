/*
 * MVN University Alumni Showcase - script.js
 * Purpose: Handle CSV data parsing, static department filtering, pagination, feedback truncation, and 'Back to Top' functionality.
 * Constraints: Vanilla JavaScript only.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and DOM Elements ---
    const CSV_FILE_PATH = 'alumni.csv';
    const CARDS_PER_PAGE = 10; // Initial limit for latest placements
    
    // Department Mapping: Major departments to their sub-departments
    const DEPARTMENT_MAPPING = {
        'SOET': ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering'],
        'LAW': ['Law', 'LLB', 'LLM', 'Legal Studies', 'Judiciary'],
        'SOPS': ['Pharmacy', 'Pharmaceutical Sciences', 'Pharm.D'],
        'SASH': ['MBBS', 'BDS', 'Nursing', 'Physiotherapy', 'Medical', 'Healthcare'],
        'SBMC': ['MBA', 'Management Studies', 'Business Administration', 'Marketing', 'Finance', 'HR'],
        'SOSAH': ['Agriculture', 'Horticulture', 'Agricultural Engineering', 'Food Technology'],
        'SOA': ['Architecture', 'Interior Design', 'Planning', 'Building Technology']
    };
    
    const cardsGrid = document.getElementById('alumni-cards-grid');
    const filterContainer = document.getElementById('department-filters');
    const showMoreBtn = document.getElementById('show-more-btn');
    const backToTopBtn = document.getElementById('back-to-top-btn');
    
    let allAlumniData = [];
    let currentFilteredData = [];
    let cardsCurrentlyDisplayed = 0;
    let currentDepartment = 'All';

    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // --- Utility Functions ---

    /**
     * Fetches the CSV file and converts it into an array of objects.
     */
    async function fetchAndParseCSV(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            cardsGrid.innerHTML = '<p class="no-results-message">Error loading alumni data. Please check the console for details.</p>';
            return [];
        }
    }

    /**
     * Parses CSV text into an array of JavaScript objects.
     */
    function parseCSV(csv) {
        const lines = csv.trim().split('\n');
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            // Simple regex to handle commas inside quotes
            const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (!values || values.length === 0) continue;

            const entry = {};
            for (let j = 0; j < headers.length; j++) {
                // Handle cases where there are fewer values than headers
                entry[headers[j]] = (j < values.length) ? values[j].replace(/^"|"$/g, '').trim() : '';
            }
            
            // Only skip the row if ALL essential fields are empty
            // Essential fields: Student_Name, Department (keep card if at least these exist)
            const hasEssentialData = entry.Student_Name && entry.Student_Name.trim() !== '' || 
                                   entry.Department && entry.Department.trim() !== '';
            
            if (hasEssentialData) {
                data.push(entry);
            }
        }
        return data;
    }

    /**
     * Creates feedback section HTML without truncation.
     * @param {string} feedback - The raw feedback text.
     * @returns {string} - HTML string for the feedback section.
     */
    function createFeedbackSection(feedback) {
        return `<div class="alumni-feedback">
            ${feedback}
        </div>`;
    }

    /**
     * Creates the HTML string for a single alumni card.
     */
    function createAlumniCard(alumni) {
        // Create image filename from student name or use boy.png as default
        let photoUrl = 'assets/images/boy.png';
        
        if (alumni.Student_Name && alumni.Student_Name.trim() !== '') {
            // Convert student name to filename format (lowercase, spaces to underscores, remove special chars)
            const filename = alumni.Student_Name
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '')
                .trim();
            
            if (filename) {
                photoUrl = `assets/images/${filename}.png`;
            }
        }
        
        const studentName = alumni.Student_Name || '';
        const department = alumni.Department || '';
        const passingYear = alumni.Passing_Year || '';
        const designation = alumni.Designation || '';
        const company = alumni.Company_or_Business || '';
        const currentPackage = alumni.Current_Package || '';
        const feedback = alumni.Feedback || '';

        // Only show fields that have data
        const departmentYearText = department && passingYear ? `${department} (${passingYear})` : 
                                  department ? department : 
                                  passingYear ? `(${passingYear})` : '';

        return `
            <div class="alumni-card" data-department="${department}">
                <div class="card-header">
                    <img src="${photoUrl}" alt="Photo of ${studentName}" class="alumni-photo" onerror="this.onerror=null;this.src='assets/images/boy.png';">
                    <div class="alumni-info">
                        ${studentName ? `<h4>${studentName}</h4>` : ''}
                        ${departmentYearText ? `<p>${departmentYearText}</p>` : ''}
                    </div>
                </div>
                <div class="card-body">
                    ${designation ? `<div class="placement-detail"><strong>Designation:</strong> ${designation}</div>` : ''}
                    ${company ? `<div class="placement-detail"><strong>Company/Business:</strong> ${company}</div>` : ''}
                    ${currentPackage ? `<div class="placement-detail"><strong>Current Package:</strong> <span class="package-badge">${currentPackage}</span></div>` : ''}
                </div>
                ${feedback ? createFeedbackSection(feedback) : ''}
            </div>
        `;
    }

    /**
     * Renders a batch of alumni cards to the DOM.
     */
    function renderNextBatch() {
        const startIndex = cardsCurrentlyDisplayed;
        const endIndex = Math.min(startIndex + CARDS_PER_PAGE, currentFilteredData.length);
        
        const batchData = currentFilteredData.slice(startIndex, endIndex);
        const cardsHtml = batchData.map(createAlumniCard).join('');
        
        // Append new cards instead of replacing all content
        cardsGrid.insertAdjacentHTML('beforeend', cardsHtml);
        
        cardsCurrentlyDisplayed = endIndex;

        // Update 'Show More' button visibility
        if (cardsCurrentlyDisplayed < currentFilteredData.length) {
            showMoreBtn.classList.remove('hidden');
        } else {
            showMoreBtn.classList.add('hidden');
        }
    }

    /**
     * Filters the alumni data based on the selected department and prepares for rendering.
     */
    function filterAndPrepareRender(department) {
        currentDepartment = department;
        
        // 1. Filter data
        let filtered;
        if (department === 'All') {
            filtered = allAlumniData;
        } else if (DEPARTMENT_MAPPING[department]) {
            // If it's a major department, filter by all its sub-departments
            const subDepartments = DEPARTMENT_MAPPING[department];
            filtered = allAlumniData.filter(alumni => 
                subDepartments.includes(alumni.Department)
            );
        } else {
            // If it's a specific sub-department, filter by exact match
            filtered = allAlumniData.filter(alumni => alumni.Department === department);
        }

        // 2. Sort by Passing_Year (latest first)
        filtered.sort((a, b) => parseInt(b.Passing_Year) - parseInt(a.Passing_Year));

        currentFilteredData = filtered;
        cardsCurrentlyDisplayed = 0;
        cardsGrid.innerHTML = ''; // Clear previous cards

        if (currentFilteredData.length === 0) {
            cardsGrid.innerHTML = '<p class="no-results-message">No alumni found for this selection.</p>';
            showMoreBtn.classList.add('hidden');
            return;
        }

        // 3. Render the first batch
        renderNextBatch();
    }

    // --- Event Listeners ---

    // Department Filter Listener
    filterContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('filter-btn')) {
            const selectedDepartment = target.getAttribute('data-department');

            // Update active button state
            filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            target.classList.add('active');

            filterAndPrepareRender(selectedDepartment);
        }
    });

    // Show More Button Listener
    showMoreBtn.addEventListener('click', () => {
        renderNextBatch();
    });

    // Back to Top Button Listener
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Scroll Listener for Back to Top Button Visibility
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };

    // --- Main Execution ---
    async function init() {
        // 1. Fetch and store all data
        allAlumniData = await fetchAndParseCSV(CSV_FILE_PATH);

        if (allAlumniData.length > 0) {
            // 2. Initial render: show 'All Departments' first batch
            filterAndPrepareRender('All');
        }
    }

    init();
});
