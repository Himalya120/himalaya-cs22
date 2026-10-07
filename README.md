# Himalaya CS2 Grand Tournament

```
index.html            main site (timer, suggested-videos strip, stream + channel, matches, register, support, donate, about)
videos.html           videos page (Shorts / long videos, plays inside the site)
admin.html            admin panel (right-side dock: registrations / tickets / matches / news / videos / timer / channel)
assets/css/           style · matches · news · videos · timer · channel · transition · player · admin
assets/js/            config · i18n · theme · background · transition · main · matches · news · yt · videos-core · suggested · timer · channel
                      · videos-page · player · playlist · admin · admin-matches · admin-news · admin-videos · admin-timer · admin-channel
assets/music/         songs (mp3) + covers/   -> listed in assets/js/playlist.js
supabase/             schema.sql -> matches.sql -> news.sql -> videos_timer_channel.sql  (run in this order)
```
Setup: run the four SQL files in Supabase > SQL Editor, create admin users in Authentication > Users and add their emails to `admins`, upload the folder to GitHub Pages.
