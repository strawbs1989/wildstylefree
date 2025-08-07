const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    document.getElementById("queryText").innerHTML = `Searching for: <em>${query}</em>`;

    // Example content database (you can replace this later with your real data)
    const data = [
      {
        title: "Live DJs Tonight - Wildstyle",
        description: "Check out the live DJ lineup happening tonight on Wildstyle.vip!",
        url: "https://wildstyle.vip/schedule"
      },
      {
        title: "Top Anthems Playlist",
        description: "Listen to our handpicked music anthems from Wildstyle Radio.",
        url: "https://wildstyle.vip/anthems"
      },
      {
        title: "Meet the Presenters",
        description: "Get to know the Wildstyle Radio presenters and DJs.",
        url: "https://wildstyle.vip/presenters"
      }
    ];

    // Simple search function
    const resultsDiv = document.getElementById("results");
    const lowerQuery = query.toLowerCase();
    const matches = data.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );

    if (matches.length === 0) {
      resultsDiv.innerHTML = "<p>No results found. Try another search term.</p>";
    } else {
      matches.forEach(item => {
        const div = document.createElement("div");
        div.className = "result";
        div.innerHTML = `
          <h3><a href="${item.url}" target="_blank">${item.title}</a></h3>
          <p>${item.description}</p>
        `;
        resultsDiv.appendChild(div);
      });
    }
