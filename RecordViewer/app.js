// Initialize global variables
let records = [];
let selectedArtist = null;
let selectedAlbum = null;
let darkMode = localStorage.getItem('darkMode') === 'true';
let selectedCollectionFolders = [];
let filterDisplayAttempts = 0;

// Initialize dark mode from localStorage
if (darkMode) {
    document.body.classList.add('dark-mode');
    document.getElementById('dark-mode-toggle').innerHTML = '<i class="bi bi-moon-fill"></i>';
}

// Dark mode toggle functionality
document.getElementById('dark-mode-toggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    darkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', darkMode);
    
    // Update icon
    this.innerHTML = darkMode ? 
        '<i class="bi bi-moon-fill"></i>' : 
        '<i class="bi bi-sun-fill"></i>';
});

// Create a dedicated initialization function that runs immediately and after DOM is loaded
function initializeApp() {
    console.log('Initializing app...');
    
    // Set up event listeners
    const clearFiltersButton = document.getElementById('clear-filters');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', function() {
            clearCollectionFilters();
            displayArtists();
        });
        console.log('Clear filters button event attached');
    }
    
    // Create filter section if it doesn't exist
    ensureFilterSectionExists();
    
    // If we already have records loaded, display filters
    if (records.length > 0) {
        console.log('Records already loaded, displaying collection filters');
        forceDisplayCollectionFolders();
    }
}

// Call initialization immediately
initializeApp();

// Also call after DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded - initializing app');
    initializeApp();
    
    // Start loading data if not already done
    if (records.length === 0) {
        loadCSVData('./discogs_all.csv');
    }
});

// Make sure the filter section exists in the DOM
function ensureFilterSectionExists() {
    const artistList = document.getElementById('artist-list');
    const existingFilter = document.getElementById('collection-filter');
    
    if (artistList && !existingFilter) {
        console.log('Creating missing filter section');
        
        // Create the filter section if it doesn't exist
        const filterSection = document.createElement('div');
        filterSection.id = 'collection-filter';
        filterSection.className = 'filter-container px-3 py-2';
        filterSection.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="text-muted">Filter by Collection</small>
                <button id="clear-filters" class="btn btn-sm btn-outline-secondary">Clear</button>
            </div>
            <div id="collection-filter-options" class="mb-2">
                <div class="placeholder-text text-center text-muted py-2">
                    <small>Loading collections...</small>
                </div>
            </div>
        `;
        
        // Insert after the section title
        const sectionTitle = artistList.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.insertAdjacentElement('afterend', filterSection);
        } else {
            artistList.prepend(filterSection);
        }
        
        // Attach click event to the new clear button
        const clearBtn = filterSection.querySelector('#clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                clearCollectionFilters();
                displayArtists();
            });
        }
    }
}

function loadCSVData(filePath) {
    console.log(`Attempting to load CSV from: ${filePath}`);
    
    const artistList = document.getElementById('artist-list-container');
    if (!artistList) {
        console.error('Artist list container not found');
        return;
    }
    
    artistList.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading your collection...</p>
        </div>
    `;
    
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => {
            if (!data || data.trim() === '') {
                throw new Error('CSV file is empty');
            }
            records = parseCSV(data);
            if (records.length > 0) {
                console.log(`Successfully loaded ${records.length} records`);
                
                // First display collection folders (which will check all boxes)
                forceDisplayCollectionFolders();
                
                // Then display artists based on all folders selected
                displayArtists();
            } else {
                artistList.innerHTML = `
                    <div class="alert alert-warning m-3">
                        No records found in CSV file.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            artistList.innerHTML = `
                <div class="alert alert-danger m-3">
                    <h5><i class="bi bi-exclamation-triangle-fill me-2"></i>Error loading data</h5>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">Possible solutions:</p>
                    <ul>
                        <li>Make sure the discogs_all.csv file exists in the same folder as this HTML file</li>
                        <li>Try opening this page via a local web server instead of directly from file system</li>
                        <li>Check browser console for more detailed errors</li>
                    </ul>
                </div>
            `;
        });
}

// Parse CSV data
function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        if (values.length === headers.length) {
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index];
            });
            result.push(record);
        }
    }
    return result;
}

// Display list of unique artists with filtering
function displayArtists() {
    const artistList = document.getElementById('artist-list-container');
    artistList.innerHTML = '';
    
    // Filter records by selected collection folders if any are selected
    let filteredRecords = records;
    if (selectedCollectionFolders.length > 0) {
        filteredRecords = records.filter(record => 
            selectedCollectionFolders.includes(record.CollectionFolder)
        );
    }
    
    const uniqueArtists = [...new Set(filteredRecords.map(record => record.Artist))].sort();

    uniqueArtists.forEach(artist => {
        const div = document.createElement('div');
        div.className = 'list-group-item';
        div.textContent = artist;
        div.onclick = () => selectArtist(artist, div);
        artistList.appendChild(div);
    });
    
    // Show stats with filter information
    let statsText = `Found ${uniqueArtists.length} artists, ${filteredRecords.length} total records`;
    if (selectedCollectionFolders.length > 0) {
        statsText += ` (filtered from ${records.length})`;
    }
    
    artistList.insertAdjacentHTML('afterbegin', `
        <div class="p-3 text-center small text-muted">
            <i class="bi bi-info-circle me-1"></i>
            ${statsText}
        </div>
    `);
}

// Force display of collection folders with multiple approaches
function forceDisplayCollectionFolders() {
    console.log('Forcing display of collection folders...');
    
    // Ensure the filter section exists
    ensureFilterSectionExists();
    
    // First direct attempt
    const success = displayCollectionFolders();
    
    // If that fails, try multiple times with delays
    if (!success) {
        console.log('First attempt failed, trying again with intervals...');
        
        // Try 5 times, with increasing delays
        for (let i = 1; i <= 5; i++) {
            setTimeout(() => {
                console.log(`Retry attempt ${i} for collection folders`);
                displayCollectionFolders();
            }, i * 200); // 200ms, 400ms, 600ms, 800ms, 1000ms
        }
    }
}

// Display unique collection folders for filtering
function displayCollectionFolders() {
    // Check and try to create the filter container if it doesn't exist
    ensureFilterSectionExists();
    
    const filterContainer = document.getElementById('collection-filter-options');
    if (!filterContainer) {
        console.error('Collection filter options container not found, even after creation attempt');
        filterDisplayAttempts++;
        
        // If we've tried too many times without success, log a more serious error
        if (filterDisplayAttempts > 10) {
            console.error('Multiple failures to find or create filter container - possible DOM manipulation issue');
        }
        return false;
    }
    
    console.log('Found collection filter container, populating filters...');
    
    // Make sure the filter container is visible
    filterContainer.style.display = 'block';
    const parentFilter = document.getElementById('collection-filter');
    if (parentFilter) {
        parentFilter.style.display = 'block';
    }
    
    // Extract unique collection folders and count items in each
    const collectionFolders = {};
    records.forEach(record => {
        const folder = record.CollectionFolder || 'Uncategorized';
        if (!collectionFolders[folder]) {
            collectionFolders[folder] = 0;
        }
        collectionFolders[folder]++;
    });
    
    // Sort folders by name
    const sortedFolders = Object.keys(collectionFolders).sort();
    
    // Clear the placeholder and add a header to confirm content is being added
    filterContainer.innerHTML = `
        <div class="text-muted small mb-2">Found ${sortedFolders.length} collection folders</div>
    `;
    
    // Initialize selected folders with all folders (for default "all checked" state)
    selectedCollectionFolders = [...sortedFolders];
    
    // Create checkbox for each folder
    sortedFolders.forEach(folder => {
        const count = collectionFolders[folder];
        
        const label = document.createElement('label');
        label.className = 'collection-label';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'collection-checkbox';
        checkbox.value = folder;
        // Set checked by default
        checkbox.checked = true;
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedCollectionFolders.includes(this.value)) {
                    selectedCollectionFolders.push(this.value);
                }
            } else {
                selectedCollectionFolders = selectedCollectionFolders.filter(f => f !== this.value);
            }
            displayArtists();
        });
        
        const folderName = document.createElement('span');
        folderName.textContent = folder;
        
        const badge = document.createElement('span');
        badge.className = 'collection-badge';
        badge.textContent = count;
        
        label.appendChild(checkbox);
        label.appendChild(folderName);
        label.appendChild(badge);
        
        filterContainer.appendChild(label);
    });
    
    // Log success and reset the attempt counter
    console.log(`Successfully displayed ${sortedFolders.length} collection folders`);
    filterDisplayAttempts = 0;
    return true;
}

// Clear all collection filters
function clearCollectionFilters() {
    selectedCollectionFolders = [];
    const checkboxes = document.querySelectorAll('.collection-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // After clearing, redisplay artists based on no filters
    displayArtists();
}

// Handle artist selection - removed discography calls
function selectArtist(artist, element) {
    selectedArtist = artist;
    document.querySelectorAll('#artist-list-container .list-group-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    displayAlbums();
    clearDetails();
}

// Display albums for selected artist
function displayAlbums() {
    const albumList = document.getElementById('album-list-container');
    albumList.innerHTML = '';
    
    const artistRecords = records.filter(record => record.Artist === selectedArtist);
    
    // Sort albums by release year (ascending)
    artistRecords.sort((a, b) => {
        const yearA = parseInt(a.Released) || 9999;
        const yearB = parseInt(b.Released) || 9999;
        return yearA - yearB;
    });
    
    if (artistRecords.length === 0) {
        albumList.innerHTML = `
            <div class="alert alert-info m-3">
                No albums found for this artist.
            </div>
        `;
        return;
    }
    
    artistRecords.forEach(record => {
        const div = document.createElement('div');
        div.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const titleEl = document.createElement('span');
        titleEl.textContent = record.Title;
        div.appendChild(titleEl);
        
        // Add year badge if available
        if (record.Released) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary rounded-pill';
            badge.textContent = record.Released;
            div.appendChild(badge);
        }
        
        div.onclick = () => selectAlbum(record, div);
        albumList.appendChild(div);
    });
}

// Handle album selection
function selectAlbum(record, element) {
    selectedAlbum = record;
    document.querySelectorAll('#album-list-container .list-group-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    displayDetails();
    fetchWikipediaInfo(record.Artist, record.Title);
}

// Display album details
function displayDetails() {
    const details = document.getElementById('album-details-container');
    
    const formattedDate = selectedAlbum['Date Added'] ? 
        new Date(selectedAlbum['Date Added']).toLocaleDateString() : 'Unknown';
        
    details.innerHTML = `
        <div class="card border-0 mb-3 animate__animated animate__fadeIn" id="album-details-card">
            <div class="card-body p-0">
                <h4 class="card-title mb-4">${selectedAlbum.Title}</h4>
                <h6 class="card-subtitle mb-4 text-muted">${selectedAlbum.Artist}</h6>
                
                <div class="row g-4 mb-4">
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <i class="bi bi-disc me-2"></i>Release Info
                            </div>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Label</span>
                                    <span class="text-muted">${selectedAlbum.Label || 'Unknown'}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Released</span>
                                    <span class="text-muted">${selectedAlbum.Released || 'Unknown'}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Format</span>
                                    <span class="text-muted">${selectedAlbum.Format || 'Unknown'}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Catalog#</span>
                                    <span class="text-muted">${selectedAlbum['Catalog#'] || 'Unknown'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <i class="bi bi-collection me-2"></i>Collection Info
                            </div>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Folder</span>
                                    <span class="text-muted">${selectedAlbum.CollectionFolder || 'Unknown'}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Date Added</span>
                                    <span class="text-muted">${formattedDate}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Media Condition</span>
                                    <span class="text-muted">${selectedAlbum['Collection Media Condition'] || 'Unknown'}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Sleeve Condition</span>
                                    <span class="text-muted">${selectedAlbum['Collection Sleeve Condition'] || 'Unknown'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                ${selectedAlbum['Collection Notes'] ? `
                <div class="card mt-4">
                    <div class="card-header">
                        <i class="bi bi-journal-text me-2"></i>Notes
                    </div>
                    <div class="card-body">
                        <p class="card-text">${selectedAlbum['Collection Notes']}</p>
                    </div>
                </div>` : ''}
            </div>
        </div>
    `;
}

// Clear details panel
function clearDetails() {
    document.getElementById('album-details-container').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="bi bi-info-circle" style="font-size: 3rem;"></i>
            <p class="mt-3">Select an album to view details</p>
        </div>
    `;
    
    // Clear Wikipedia panel
    document.getElementById('wiki-content').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="bi bi-journal-text" style="font-size: 3rem;"></i>
            <p class="mt-3">Select an album to view its Wikipedia article</p>
        </div>
    `;
}

// Fetch Wikipedia information for the selected album
function fetchWikipediaInfo(artist, albumTitle) {
    const wikiContent = document.getElementById('wiki-content');
    wikiContent.innerHTML = `
        <div class="wiki-loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading Wikipedia information...</p>
        </div>
    `;
    
    // Format the search query
    const searchQuery = `${artist} ${albumTitle} album`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Wikipedia API endpoint for searching
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&origin=*`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.query && data.query.search && data.query.search.length > 0) {
                // Get the first search result
                const pageId = data.query.search[0].pageid;
                const pageTitle = data.query.search[0].title;
                return fetch(`https://en.wikipedia.org/w/api.php?action=parse&pageid=${pageId}&prop=text&format=json&origin=*`)
                    .then(response => response.json())
                    .then(data => ({ data, pageId, pageTitle }));
            } else {
                throw new Error('No Wikipedia articles found for this album');
            }
        })
        .then(({ data, pageId, pageTitle }) => {
            if (data.parse && data.parse.text) {
                // Create a temporary div to hold the Wikipedia content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.parse.text['*'];
                
                // Extract only the infobox table
                const infobox = tempDiv.querySelector('.infobox.vevent.haudio');
                
                if (!infobox) {
                    throw new Error('Album infobox not found on Wikipedia page');
                }
                
                // Create container for the infobox with additional styling
                const infoboxContainer = document.createElement('div');
                infoboxContainer.className = 'infobox-container mb-4';
                infoboxContainer.style.maxWidth = '100%';
                infoboxContainer.style.margin = '0 auto';
                infoboxContainer.appendChild(infobox.cloneNode(true));
                
                // Fix links and images
                fixLinksAndImages(infoboxContainer);
                
                // Display the content with animation
                wikiContent.innerHTML = '';
                
                const titleEl = document.createElement('h4');
                titleEl.textContent = pageTitle;
                titleEl.className = 'mb-4';
                wikiContent.appendChild(titleEl);
                
                // Create a container with fade-in animation
                const contentContainer = document.createElement('div');
                contentContainer.style.animation = 'fadeIn 0.5s ease-out';
                contentContainer.appendChild(infoboxContainer);
                
                // Add link to full Wikipedia page
                const wikiLink = document.createElement('div');
                wikiLink.className = 'text-center mt-4';
                wikiLink.innerHTML = `
                    <a href="https://en.wikipedia.org/?curid=${pageId}" 
                       target="_blank" 
                       class="btn btn-outline-primary">
                        <i class="bi bi-box-arrow-up-right me-2"></i>View full article on Wikipedia
                    </a>
                `;
                contentContainer.appendChild(wikiLink);
                
                wikiContent.appendChild(contentContainer);
                
            } else {
                throw new Error('Failed to load article content');
            }
        })
        .catch(error => {
            wikiContent.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="bi bi-exclamation-triangle-fill me-2"></i>${error.message}</h5>
                    <p>Try searching for "${searchQuery}" on Wikipedia directly:</p>
                    <a href="https://en.wikipedia.org/wiki/Special:Search?search=${encodedQuery}" 
                       target="_blank"
                       class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-search me-1"></i>Search on Wikipedia
                    </a>
                </div>
            `;
        });
}

// Helper function to fix links and images in a DOM element
function fixLinksAndImages(element) {
    // Update links to point to Wikipedia
    const links = element.querySelectorAll('a');
    links.forEach(link => {
        if (link.getAttribute('href')) {
            const href = link.getAttribute('href');
            if (href.startsWith('/wiki/')) {
                link.href = 'https://en.wikipedia.org' + href;
            } else if (href.startsWith('./')) {
                link.href = 'https://en.wikipedia.org/wiki/' + href.substring(2);
            }
            link.target = '_blank';
            link.classList.add('text-decoration-none');
        }
    });
    
    // Handle images
    const images = element.querySelectorAll('img');
    images.forEach(img => {
        if (img.getAttribute('src') && img.getAttribute('src').startsWith('//')) {
            img.src = 'https:' + img.getAttribute('src');
        }
        img.classList.add('img-fluid');
    });
    
    // Remove edit section links
    const editLinks = element.querySelectorAll('.mw-editsection');
    editLinks.forEach(link => link.remove());
}

// Debug helper function - improved with DOM element checking
function debugLog(message, data = null) {
    console.log(`[App] ${message}`, data || '');
    
    // Also log to the debug console if it exists
    const debugMessages = document.getElementById('debug-messages');
    if (debugMessages) {
        const entry = document.createElement('div');
        entry.className = 'mb-1 border-bottom pb-1';
        entry.innerHTML = `<strong>[App]</strong> ${message}`;
        debugMessages.prepend(entry);
        
        // Limit entries
        if (debugMessages.children.length > 20) {
            debugMessages.lastChild.remove();
        }
    }
}

// Add to the debug DOM check function to make it check for collection filter
function checkDomStructure() {
    const debugMessages = document.getElementById('debug-messages');
    if (!debugMessages) return;
    
    // Clear previous messages
    debugMessages.innerHTML = '<div class="fw-bold">DOM Structure Check:</div>';
    
    // Check key elements
    const elements = [
        'artist-list', 
        'album-list-container', 
        'album-details-container', 
        'wiki-content',
        'collection-filter',
        'collection-filter-options' // Add this to check for the filter container
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        const status = el ? 
            '<span class="text-success">✓ Found</span>' : 
            '<span class="text-danger">✗ Missing</span>';
        
        debugMessages.innerHTML += `<div>${id}: ${status}</div>`;
    });
    
    // If collection filter is missing, try to display it
    const filterContainer = document.getElementById('collection-filter-options');
    if (filterContainer && records.length > 0) {
        tryDisplayCollectionFolders();
    }
}

// Signal that app is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    debugLog('Application script loaded successfully');
    
    // Show instructions for debug console
    console.log('Press Ctrl+D to show debug console and diagnose issues');
});
