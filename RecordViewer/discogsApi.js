/**
 * Discogs API client functions - Simplified version
 * This version focuses on reliability over features
 */

(function() {
    // Immediately log that the script is executing
    console.log("Discogs API script is executing");
    
    // Constants
    const DISCOGS_API_URL = 'https://api.discogs.com';
    const DISCOGS_USER_AGENT = 'RecordViewerApp/1.0';
    
    // Using a personal access token
    // This is a temporary token - replace with your own from https://www.discogs.com/settings/developers
    const DISCOGS_TOKEN = 'voKtWSCPqCbiXCULvxSOchcmCthvwiRXBClgvcGW';
    
    /**
     * Get a full artist discography
     */
    async function getFullArtistDiscography(artistName) {
        console.log(`Getting discography for: ${artistName}`);
        
        try {
            // Search for the artist ID first
            const searchUrl = new URL(`${DISCOGS_API_URL}/database/search`);
            searchUrl.searchParams.append('q', artistName);
            searchUrl.searchParams.append('type', 'artist');
            searchUrl.searchParams.append('token', DISCOGS_TOKEN);
            
            console.log(`Searching for artist: ${searchUrl.toString()}`);
            
            const searchResponse = await fetch(searchUrl, {
                headers: { 'User-Agent': DISCOGS_USER_AGENT }
            });
            
            if (!searchResponse.ok) {
                throw new Error(`Discogs API search error: ${searchResponse.status}`);
            }
            
            const searchData = await searchResponse.json();
            
            if (!searchData.results || searchData.results.length === 0) {
                throw new Error(`No artist found with name: ${artistName}`);
            }
            
            // Get the artist ID from the first result
            const artist = searchData.results[0];
            const artistId = artist.id;
            
            console.log(`Found artist ID: ${artistId}`);
            
            // Now get the artist's releases
            const releasesUrl = new URL(`${DISCOGS_API_URL}/artists/${artistId}/releases`);
            releasesUrl.searchParams.append('sort', 'year');
            releasesUrl.searchParams.append('sort_order', 'asc');
            releasesUrl.searchParams.append('token', DISCOGS_TOKEN);
            
            console.log(`Fetching releases: ${releasesUrl.toString()}`);
            
            const releasesResponse = await fetch(releasesUrl, {
                headers: { 'User-Agent': DISCOGS_USER_AGENT }
            });
            
            if (!releasesResponse.ok) {
                throw new Error(`Discogs API releases error: ${releasesResponse.status}`);
            }
            
            const releasesData = await releasesResponse.json();
            
            // Process the releases to include additional information
            const processedReleases = (releasesData.releases || []).map(release => {
                return {
                    ...release,
                    year: release.year || 'Unknown',
                    displayTitle: `${release.title} (${release.year || 'Unknown'})`,
                    role: release.role || 'Main',
                    // Create URL to release page on Discogs website
                    url: `https://www.discogs.com/release/${release.id}`
                };
            });
            
            console.log(`Processed ${processedReleases.length} releases`);
            
            return {
                artist: artist,
                releases: processedReleases
            };
        } catch (error) {
            console.error(`Error in Discogs API:`, error);
            
            // Return mock data so UI can continue
            return {
                artist: { 
                    id: 123456, 
                    title: artistName,
                    thumb: "https://via.placeholder.com/150",
                    uri: "/artists/123456"
                },
                releases: [
                    {
                        id: 123456,
                        title: "Sample Album 1 (API Error Fallback)",
                        year: "2020",
                        thumb: "https://via.placeholder.com/50?text=Error",
                        format: ["LP", "Album"],
                        type: "master",
                        role: "Main",
                        url: "https://www.discogs.com/"
                    },
                    {
                        id: 123457,
                        title: "Sample Album 2 (API Error Fallback)",
                        year: "2018",
                        thumb: "https://via.placeholder.com/50?text=Error",
                        format: ["CD", "Album"],
                        type: "master",
                        role: "Main",
                        url: "https://www.discogs.com/"
                    }
                ]
            };
        }
    }
    
    // Create the API object and add to window
    window.discogsApi = {
        getFullArtistDiscography
    };
    
    // Log success
    console.log("Discogs API client initialized successfully");
    if (window.scriptLoadStatus) {
        window.scriptLoadStatus.discogsApiInitialized = true;
    }
})();
