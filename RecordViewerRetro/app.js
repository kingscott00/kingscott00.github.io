// Initialize global variables
let records = [];
let selectedArtist = null;
let selectedAlbum = null;
let selectedCollectionFolders = [];
let filterDisplayAttempts = 0;

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
    } else {
        console.warn('Clear filters button not found during initialization');
        // Try to show debug console with this error
        showDebugConsole('Clear filters button not found');
    }
    
    // Create filter section if it doesn't exist
    ensureFilterSectionExists();
    
    // If we already have records loaded, display filters
    if (records.length > 0) {
        console.log('Records already loaded, displaying collection filters');
        forceDisplayCollectionFolders();
    } else {
        console.log('No records loaded yet, will display filters after loading');
        // Try loading CSV with different paths
        tryMultipleCSVPaths();
    }
}

// Helper function to show the debug console with a message
function showDebugConsole(message) {
    const debugConsole = document.getElementById('debug-console');
    if (debugConsole) {
        debugConsole.style.display = 'block';
        
        const debugMessages = document.getElementById('debug-messages');
        if (debugMessages) {
            debugMessages.innerHTML += `<div class="text-warning">${message}</div>`;
        }
    }
}

// Try multiple CSV file paths since we don't know the exact path
function tryMultipleCSVPaths() {
    const possiblePaths = [
        './discogs_all.csv',
        '/discogs_all.csv',
        '../discogs_all.csv',
        'discogs_all.csv',
        // Add a test CSV with minimum data for debugging
        'test_data.csv'
    ];
    
    console.log('Trying multiple CSV paths...');
    
    // Create a test CSV file dynamically if none can be found
    createTestCSV();
    
    // Try each path with increasing delays
    possiblePaths.forEach((path, index) => {
        setTimeout(() => {
            console.log(`Attempting to load from path: ${path}`);
            loadCSVData(path, index === possiblePaths.length - 1);
        }, index * 500); // 500ms between attempts
    });
}

// Create a test CSV file with minimal data for debugging
function createTestCSV() {
    // If we can create a small test dataset in memory, do that
    const testData = `Artist,Title,Released,Label,Format,Catalog#,Collection Media Condition,Collection Sleeve Condition,CollectionFolder,Date Added,Collection Notes
The Beatles,Abbey Road,1969,Apple Records,LP,SO-383,Very Good Plus (VG+),Very Good (VG),Rock,2022-01-15,Classic album
Pink Floyd,Dark Side of the Moon,1973,Harvest,LP,SHVL 804,Near Mint (NM or M-),Very Good Plus (VG+),Rock,2022-02-20,Original pressing
Miles Davis,Kind of Blue,1959,Columbia,LP,CL 1355,Very Good (VG),Good Plus (G+),Jazz,2022-03-10,Mono version`;

    // Set as a fallback option
    window.testCSVData = testData;
    
    console.log('Created test CSV data as fallback');
}

// Call initialization immediately
initializeApp();

// Also call after DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded - initializing app');
    initializeApp();
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
        filterSection.style.display = 'block'; // Ensure visibility
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

// Modified loadCSVData to handle fallbacks and test data
function loadCSVData(filePath, isLastAttempt = false) {
    console.log(`Attempting to load CSV from: ${filePath}`);
    
    const artistList = document.getElementById('artist-list-container');
    if (!artistList) {
        console.error('Artist list container not found');
        showDebugConsole('Artist list container not found');
        return;
    }
    
    // Only show loading indicator on first attempt
    if (records.length === 0) {
        artistList.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading your collection...</p>
            </div>
        `;
    }
    
    // If this is a second+ attempt and we already have records, don't continue
    if (records.length > 0) {
        console.log('Records already loaded, skipping additional load attempts');
        return;
    }
    
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
            console.log(`Successfully loaded ${records.length} records from ${filePath}`);
            
            if (records.length > 0) {
                // First display collection folders (which will check all boxes)
                setTimeout(() => {
                    forceDisplayCollectionFolders();
                    displayArtists();
                }, 100);
            } else {
                artistList.innerHTML = `
                    <div class="alert alert-warning m-3">
                        No records found in CSV file.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error(`Error loading CSV from ${filePath}:`, error);
            
            // If this is the last attempt and we still have no records, try the test data
            if (isLastAttempt && records.length === 0) {
                console.log('All CSV loading attempts failed, trying test data');
                
                if (window.testCSVData) {
                    console.log('Using test CSV data as fallback');
                    records = parseCSV(window.testCSVData);
                    
                    if (records.length > 0) {
                        console.log(`Loaded ${records.length} test records`);
                        forceDisplayCollectionFolders();
                        displayArtists();
                    }
                } else {
                    // Final fallback - create some minimal records
                    console.log('Creating minimal test records');
                    createMinimalTestRecords();
                    forceDisplayCollectionFolders();
                    displayArtists();
                }
                
                // If everything fails, show error in the UI
                if (records.length === 0) {
                    artistList.innerHTML = `
                        <div class="alert alert-danger m-3">
                            <h5><i class="bi bi-exclamation-triangle-fill me-2"></i>Error loading data</h5>
                            <p>${error.message}</p>
                            <hr>
                            <p class="mb-0">Possible solutions:</p>
                            <ul>
                                <li>Make sure the discogs_all.csv file exists in the correct location</li>
                                <li>Try opening this page via a local web server instead of directly from file system</li>
                                <li>Check browser console (F12) for more detailed errors</li>
                                <li>Press Ctrl+D to open debug console</li>
                            </ul>
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="tryLoadTestData()">Try with test data</button>
                        </div>
                    `;
                    
                    // Show debug console automatically
                    showDebugConsole('Failed to load any CSV data');
                }
            }
        });
}

// Create minimal test records if all else fails
function createMinimalTestRecords() {
    records = [
        {
            Artist: "Test Artist 1",
            Title: "Test Album 1",
            Released: "2020",
            Label: "Test Label",
            Format: "LP",
            "Catalog#": "TEST-001",
            "Collection Media Condition": "VG+",
            "Collection Sleeve Condition": "VG",
            CollectionFolder: "Test Folder",
            "Date Added": "2023-01-01"
        },
        {
            Artist: "Test Artist 2",
            Title: "Test Album 2",
            Released: "2021",
            Label: "Another Label",
            Format: "CD",
            "Catalog#": "TEST-002",
            "Collection Media Condition": "M-",
            "Collection Sleeve Condition": "VG+",
            CollectionFolder: "Another Folder",
            "Date Added": "2023-02-01"
        }
    ];
    console.log('Created minimal test records as last resort');
}

// Function to try loading test data on button click
window.tryLoadTestData = function() {
    if (window.testCSVData) {
        records = parseCSV(window.testCSVData);
        if (records.length > 0) {
            forceDisplayCollectionFolders();
            displayArtists();
            
            // Update the UI to show success
            const artistList = document.getElementById('artist-list-container');
            if (artistList) {
                artistList.innerHTML = `
                    <div class="alert alert-success m-3">
                        Successfully loaded ${records.length} test records.
                    </div>
                `;
                
                // Re-render the artist list after a short delay
                setTimeout(displayArtists, 1000);
            }
        }
    } else {
        createMinimalTestRecords();
        forceDisplayCollectionFolders();
        displayArtists();
    }
};

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
                if (displayCollectionFolders()) {
                    console.log(`Collection folders displayed successfully on retry ${i}`);
                }
            }, i * 200); // 200ms, 400ms, 600ms, 800ms, 1000ms
        }
    }
}

// Add function to attempt to display collection folders one more time
function tryDisplayCollectionFolders() {
    console.log('Attempting to display collection folders from DOM check...');
    if (records.length > 0) {
        displayCollectionFolders();
    } else {
        console.warn('No records available to display collection folders');
    }
}

// Display unique collection folders for filtering
function displayCollectionFolders() {
    console.log('Display collection folders called');
    
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
    
    console.log('Found collection filter container, populating filters...', filterContainer);
    
    // Make sure the filter container is visible
    filterContainer.style.display = 'block';
    const parentFilter = document.getElementById('collection-filter');
    if (parentFilter) {
        parentFilter.style.display = 'block';
        console.log('Ensured parent filter container is visible');
    }
    
    // Make sure we have records to work with
    if (!records || records.length === 0) {
        console.error('No records available to extract collection folders');
        filterContainer.innerHTML = `
            <div class="text-muted small mb-2">No records loaded yet</div>
        `;
        return false;
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
    
    console.log(`Found ${sortedFolders.length} collection folders`);
    
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

// Handle artist selection - updated to include discography fetch
function selectArtist(artist, element) {
    selectedArtist = artist;
    document.querySelectorAll('#artist-list-container .list-group-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    displayAlbums();
    clearDetails();
    
    // Fetch artist discography
    fetchArtistDiscography(artist);
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
    
    // Clear discography panel
    document.getElementById('discography-container').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="bi bi-music-note-list" style="font-size: 3rem;"></i>
            <p class="mt-3">Select an artist to view their discography</p>
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

// Improved fetch artist discography from Wikipedia
function fetchArtistDiscography(artist) {
    const discographyContainer = document.getElementById('discography-container');
    
    // Show loading indicator
    discographyContainer.innerHTML = `
        <div class="wiki-loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading discography for ${artist}...</span>
            </div>
            <p>Loading discography for ${artist}...</p>
        </div>
    `;
    
    // Format the search query for artist
    const searchQuery = `${artist}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Wikipedia API endpoint for searching
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&origin=*`;
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Wikipedia search failed: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.query && data.query.search && data.query.search.length > 0) {
                // Get the first search result
                const pageId = data.query.search[0].pageid;
                console.log(`Found Wikipedia page for ${artist}, ID: ${pageId}`);
                return fetch(`https://en.wikipedia.org/w/api.php?action=parse&pageid=${pageId}&prop=text&format=json&origin=*`);
            } else {
                throw new Error(`No Wikipedia article found for ${artist}`);
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Wikipedia content fetch failed: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.parse && data.parse.text && data.parse.text['*']) {
                console.log(`Successfully fetched Wikipedia content for ${artist}`);
                
                // Create a temporary div to hold the Wikipedia content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.parse.text['*'];
                
                // Look for Discography section
                let discographySection = null;
                let discographyHeader = null;
                
                // First try to find h2 with id="Discography"
                discographyHeader = tempDiv.querySelector('h2 span[id="Discography"]');
                if (discographyHeader) {
                    discographySection = discographyHeader.closest('h2');
                }
                
                // If not found, try to find h2 containing "Discography" text
                if (!discographySection) {
                    const allH2s = tempDiv.querySelectorAll('h2');
                    for (const h2 of allH2s) {
                        if (h2.textContent.includes('Discography')) {
                            discographySection = h2;
                            break;
                        }
                    }
                }
                
                // If still not found, try "Selected discography" or other variations
                if (!discographySection) {
                    const variations = ["Selected discography", "Studio albums", "Albums", "Recordings"];
                    for (const variation of variations) {
                        const span = tempDiv.querySelector(`h2 span[id="${variation}"], h3 span[id="${variation}"]`);
                        if (span) {
                            discographySection = span.closest('h2, h3');
                            break;
                        }
                        
                        // Try text search as well
                        const headers = tempDiv.querySelectorAll('h2, h3');
                        for (const header of headers) {
                            if (header.textContent.includes(variation)) {
                                discographySection = header;
                                break;
                            }
                        }
                        
                        if (discographySection) break;
                    }
                }
                
                if (!discographySection) {
                    throw new Error(`No discography section found for ${artist} on Wikipedia`);
                }
                
                console.log(`Found discography section for ${artist}`);
                
                // Create a container for the discography content
                const discographyContent = document.createElement('div');
                discographyContent.className = 'wiki-discography';
                
                // Add the section heading first
                const headingEl = document.createElement('h3');
                headingEl.className = 'mb-4';
                headingEl.innerHTML = discographySection.innerHTML;
                discographyContent.appendChild(headingEl);
                
                // Get all elements after the h2/h3 until next h2/h3
                let currentElement = discographySection.nextElementSibling;
                let foundContent = false;
                
                while (currentElement && 
                       !currentElement.matches('h2, div.mw-heading.mw-heading2')) {
                    // Skip references if they're directly under the heading
                    if (currentElement.classList && 
                        !currentElement.classList.contains('reflist') && 
                        !currentElement.classList.contains('mw-empty-elt')) {
                        
                        discographyContent.appendChild(currentElement.cloneNode(true));
                        foundContent = true;
                    }
                    currentElement = currentElement.nextElementSibling;
                }
                
                if (!foundContent) {
                    throw new Error('Discography section appears empty');
                }
                
                // Fix links and images
                fixLinksAndImages(discographyContent);
                
                // Add a page link
                const pageTitle = data.parse.title;
                const wikiLink = document.createElement('div');
                wikiLink.className = 'text-center mt-4';
                wikiLink.innerHTML = `
                    <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}" 
                       target="_blank" 
                       class="btn btn-outline-primary">
                        <i class="bi bi-box-arrow-up-right me-2"></i>View full article on Wikipedia
                    </a>
                `;
                
                // Display the content
                discographyContainer.innerHTML = '';
                discographyContainer.appendChild(discographyContent);
                discographyContainer.appendChild(wikiLink);
                
                console.log('Discography content added to container');
                
            } else {
                throw new Error('Failed to extract content from Wikipedia response');
            }
        })
        .catch(error => {
            console.error('Error fetching discography:', error);
            
            discographyContainer.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="bi bi-exclamation-triangle-fill me-2"></i>Discography Unavailable</h5>
                    <p>${error.message}</p>
                    <p>Try searching for "${artist} discography" on Wikipedia directly:</p>
                    <a href="https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(artist)}+discography" 
                       target="_blank"
                       class="btn btn-outline-primary btn-sm mt-2">
                        <i class="bi bi-search me-1"></i>Search on Wikipedia
                    </a>
                </div>
            `;
        });
}

// Enhanced helper function to fix links and images in a DOM element
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
        if (img.getAttribute('src')) {
            const src = img.getAttribute('src');
            if (src.startsWith('//')) {
                img.src = 'https:' + src;
            } else if (!src.startsWith('http')) {
                img.src = 'https://en.wikipedia.org' + src;
            }
        }
        img.classList.add('img-fluid');
    });
    
    // Remove edit section links and ref markers
    const elementsToRemove = element.querySelectorAll('.mw-editsection, .reference, .noprint');
    elementsToRemove.forEach(el => el.remove());
    
    // Add custom styling to tables
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
        table.classList.add('table', 'table-sm', 'text-light');
        table.style.borderColor = 'var(--border-color)';
        table.style.width = '100%';
        
        // Style table headers
        const ths = table.querySelectorAll('th');
        ths.forEach(th => {
            th.style.backgroundColor = '#111';
            th.style.color = 'var(--primary-color)';
            th.style.borderColor = 'var(--border-color)';
        });
        
        // Style table cells
        const tds = table.querySelectorAll('td');
        tds.forEach(td => {
            td.style.borderColor = 'var(--border-color)';
        });
    });
    
    // Style discography lists
    const lists = element.querySelectorAll('ul, ol');
    lists.forEach(list => {
        list.style.marginBottom = '1rem';
        
        const items = list.querySelectorAll('li');
        items.forEach(item => {
            item.style.marginBottom = '0.5rem';
        });
    });
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

// Override window.onerror to catch and display errors
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at', source, ':', lineno);
    showDebugConsole(`Error: ${message} (${source}:${lineno})`);
    return false; // Let default error handling run too
};

// Add an extra initialization check that runs very late
setTimeout(() => {
    console.log('Late initialization check...');
    if (records.length === 0) {
        console.warn('Still no records loaded after 3 seconds');
        showDebugConsole('No records loaded after 3 seconds, trying emergency fallback');
        createMinimalTestRecords();
        forceDisplayCollectionFolders();
        displayArtists();
    }
}, 3000);

// Signal that app is fully loaded
window.addEventListener('load', () => {
    debugLog('Window fully loaded');
    console.log('Press Ctrl+D to show debug console and diagnose issues');
});
