# Himalaya CS2 Grand Tournament

```
index.html            main site
admin.html            admin panel (right-side dock: registrations / tickets / matches)
assets/css/           style.css · matches.css · admin.css · player.css · news.css
assets/js/            config · i18n · theme · background · main · matches · player · playlist · news · admin · admin-matches · admin-news
assets/music/          songs (mp3) + covers/  -> listed in assets/js/playlist.js
supabase/             schema.sql (run first) · matches.sql · news.sql (run after schema.sql)
```
Setup: run supabase/schema.sql then supabase/matches.sql in Supabase SQL Editor, create admin users in Authentication > Users and add their emails to `admins`, upload the folder to GitHub Pages.
