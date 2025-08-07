function handleSearch(event) {
      if (event.key === "Enter") {
        const query = document.getElementById("searchInput").value.trim();
        if (query !== "") {
          const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
          window.open(searchUrl, '_blank');
        }
      }
    }

    function toggleTheme() {
      document.body.classList.toggle("dark");
    }

    function switchTab(event, tabName) {
      const tabs = document.querySelectorAll(".tab");
      tabs.forEach(tab => tab.classList.remove("active"));
      event.target.classList.add("active");

      const content = document.getElementById("content");
      if (tabName === 'home') {
        content.innerHTML = `
          <h2>Welcome to WildstyleRadio Browser</h2>
          <p>Your secure, stylish browsing starts here. This is a prototype layout designed to mimic a secure custom browser for desktop and Android.</p>
          <p class="loading">Loading secure modules...</p>
          <iframe class="radio" src="https://yourstreamurl.com/embed" title="Wildstyle Radio Player"></iframe>
        `;
      } else if (tabName === 'wildstyle') {
        content.innerHTML = `<iframe src="https://wildstyle.vip" style="width:100%; height:80vh; border:none;"></iframe>`;
      } else if (tabName === 'nowPlaying') {
        content.innerHTML = `
          <h2>Now Playing on WildstyleRadio</h2>
          <iframe src="https://yourstreamurl.com/nowplaying" style="width:100%; height:80vh; border:none;"></iframe>
        `;
      }
    }
