# Ruhul Exe Official

Free, static website for https://www.youtube.com/@ruhulexe. Plain HTML, CSS and JavaScript. No build step, no paid services, no database.

## Publish on GitHub Pages (free)

1. Create a free GitHub account and a new **public** repository named `ruhul-exe-official`.
2. Upload all files and folders from this project (keep the folder structure).
3. Go to **Settings > Pages**. Under "Build and deployment" choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/ruhul-exe-official/`.

## Replace the web address (important for SEO)

The files `index.html`, `sitemap.xml` and `robots.txt` contain the placeholder
`https://YOUR-USERNAME.github.io/ruhul-exe-official/`.
Replace `YOUR-USERNAME` (and the repository name, if different) with your real address.
If you later buy a custom domain, use that address instead. Then submit `sitemap.xml` in Google Search Console.

## Update the site from your Android phone

Open your repository in Chrome (github.com), tap a file in the `data` folder, tap the pencil icon, edit, then tap **Commit changes**. The site updates in about a minute.
Tip: turn on "Desktop site" in Chrome if the editor feels cramped.

### Live schedule: `data/schedule.json`

```json
[
  {
    "title": "Chill stream with subscribers",
    "start": "2026-11-08T20:00:00+05:30",
    "durationMinutes": 120,
    "note": "Optional short note"
  }
]
```

- `start` is date and time with your time zone. `+05:30` is India. Visitors see it in their own time zone.
- The status (Upcoming, Live now, Ended) is worked out automatically from `start` and `durationMinutes`.
- Optional: `"status": "cancelled"` or `"status": "postponed"`. Optional: `"url"` to link one stream to its exact YouTube live link.
- Keep the file as `[]` when nothing is scheduled.

### Updates: `data/updates.json`

```json
[
  {
    "type": "video",
    "date": "2026-11-01",
    "title": "New video is out",
    "text": "One or two short sentences.",
    "link": "https://www.youtube.com/watch?v=VIDEO_ID",
    "linkText": "Watch now"
  }
]
```

`type` can be `video`, `live`, `milestone` or `news`. `text`, `link` and `linkText` are optional. Newest date shows first. Only add real announcements and real numbers.

### Videos: `data/videos.json` (optional)

By default the site tries to load your newest uploads automatically from your channel's public feed (through the free rss2json service). If you leave `data/videos.json` as `[]` it uses that.
To choose videos yourself, list them (the 11 characters after `v=` or `shorts/` are the ID):

```json
[
  { "id": "VIDEO_ID", "title": "Video title", "date": "2026-10-30" }
]
```

To turn off auto-loading, set `"autoLoadLatestVideos": false` in `data/settings.json`.

### Instagram: `data/settings.json`

Set `"instagramUrl"` to your profile link, for example `"https://www.instagram.com/yourname/"`. The Instagram card and footer icon stay hidden until you do.

## Files

- `index.html` page content and SEO tags
- `css/style.css` design
- `js/main.js` schedule, updates, videos, mobile menu
- `data/*.json` the files you edit
- `assets/` favicon and share image (`og-image.png`)
- `sitemap.xml`, `robots.txt`, `404.html`, `.nojekyll`
