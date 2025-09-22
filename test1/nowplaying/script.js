// Now Playing functionality
class NowPlayingWidget {
    constructor() {
        this.apiUrl = "https://api.live365.com/station/a50378";
        this.updateInterval = 30000; // 30 seconds
        this.intervalId = null;
        this.isLoading = false;
       
        // DOM elements
        this.artElement = document.getElementById("np-art");
        this.titleElement = document.getElementById("np-title");
        this.artistElement = document.getElementById("np-artist");
        this.cardElement = document.getElementById("nowPlaying");
       
        this.init();
    }

    init() {
        this.fetchNowPlaying();
        this.startAutoUpdate();
        this.setupErrorHandling();
    }

    async fetchNowPlaying() {
        if (this.isLoading) return;
       
        this.isLoading = true;
        this.cardElement.classList.add('loading');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(this.apiUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.updateDisplay(data);
            this.cardElement.classList.remove('error');

        } catch (error) {
            console.error("Now Playing fetch error:", error);
            this.handleError(error);
        } finally {
            this.isLoading = false;
            this.cardElement.classList.remove('loading');
        }
    }

    updateDisplay(data) {
        const np = data.now_playing || {};
       
        // Update album art with fallback
        const artUrl = np.art || "placeholder.png";
        if (this.artElement.src !== artUrl) {
            this.artElement.src = artUrl;
        }

        // Update text content
        this.titleElement.textContent = np.title || "Unknown Title";
        this.artistElement.textContent = np.artist || "Unknown Artist";

        // Add fade-in animation
        this.cardElement.classList.add('updated');
        setTimeout(() => this.cardElement.classList.remove('updated'), 500);
    }

    handleError(error) {
        this.cardElement.classList.add('error');
       
        if (error.name === 'AbortError') {
            this.titleElement.textContent = "Request timeout";
        } else if (!navigator.onLine) {
            this.titleElement.textContent = "No internet connection";
        } else {
            this.titleElement.textContent = "Error loading track";
        }
       
        this.artistElement.textContent = "";
        this.artElement.src = "placeholder.png";
    }

    startAutoUpdate() {
        this.intervalId = setInterval(() => {
            this.fetchNowPlaying();
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    setupErrorHandling() {
        // Handle image load errors
        this.artElement.onerror = () => {
            this.artElement.src = "placeholder.png";
        };

        // Handle visibility change (pause updates when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoUpdate();
            } else {
                this.startAutoUpdate();
                this.fetchNowPlaying(); // Immediate update when tab becomes visible
            }
        });
    }

    // Public method to manually refresh
    refresh() {
        this.fetchNowPlaying();
    }
}

// Initialize the widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nowPlayingWidget = new NowPlayingWidget();
});