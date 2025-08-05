const content = document.getElementById("content");

    function switchTab(event, tab) {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      event.target.classList.add("active");

      if (tab === "home") {
        content.innerHTML = `
          <h2>Welcome to WildstyleRadio Browser</h2>
          <p>Your secure, stylish browsing starts here. This is a prototype layout designed to mimic a secure custom browser for desktop and Android.</p>
          <p class="loading">Loading secure modules...</p>
          <iframe class="radio" src="https://yourstreamurl.com/embed" title="Wildstyle Radio Player"></iframe>
        `;
      } else if (tab === "wildstyle") {
        content.innerHTML = `<iframe src="https://wildstyle.vip" width="100%" height="100%" style="border:none;"></iframe>`;
      } else if (tab === "nowPlaying") {
        fetchLiveSong();
      }
    }

    function fetchLiveSong() {
      content.innerHTML = `<h2>Now Playing</h2><p class="loading">Loading live track info...</p><iframe class="radio" src="https://yourstreamurl.com/embed" title="Wildstyle Radio Player"></iframe>`;
      // Placeholder for live data fetch - Replace with actual API URL
      fetch("https://api.wildstyle.vip/nowplaying")
        .then(res => res.json())
        .then(data => {
          content.innerHTML = `
            <h2>Now Playing</h2>
            <p><strong>${data.artist}</strong> - ${data.title}</p>
            <iframe class="radio" src="https://yourstreamurl.com/embed" title="Wildstyle Radio Player"></iframe>
          `;
        })
        .catch(() => {
          content.innerHTML += `<p style="color: red;">Unable to fetch live info.</p>`;
        });
    }

    document.getElementById("searchInput").addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        const query = this.value.trim();
        if (query !== "") {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
      }
    });

    function toggleTheme() {
      document.body.classList.toggle("light-mode");
    }