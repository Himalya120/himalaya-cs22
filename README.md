# Himalaya CS2 Grand Tournament

```
index.html            main site
admin.html            admin panel (right-side dock: registrations / tickets / matches)
assets/css/           style.css · matches.css · admin.css
assets/js/            config · i18n · theme · background · main · matches · admin · admin-matches
supabase/             schema.sql (run first) · matches.sql (run second)
```
Setup: run supabase/schema.sql then supabase/matches.sql in Supabase SQL Editor, create admin users in Authentication > Users and add their emails to `admins`, upload the folder to GitHub Pages.
