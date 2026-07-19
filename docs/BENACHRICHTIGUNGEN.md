# E-Mail-Benachrichtigungen abschalten

Wenn du bei jedem Agent-Lauf oder Repository-Update eine E-Mail bekommst, kannst du das so ändern:

## GitHub (Repository & Actions)

1. Öffne: **https://github.com/settings/notifications**
2. Unter **Actions**:
   - Häkchen bei **E-Mail** entfernen
   - Nur **Web** aktiv lassen (optional)
3. Oder nur für dieses Repo:
   - Gehe zu **https://github.com/Thcjk/Kronenchronik**
   - Klicke oben auf **Watch** → **Custom**
   - Deaktiviere **Actions** und **Pull requests** (falls gewünscht)

> In diesem Projekt läuft CI nur noch bei Pull Requests, nicht bei jedem Push auf `main`. Das reduziert E-Mails bereits.

## Cursor Cloud Agent

1. Cursor Desktop öffnen
2. **Einstellungen** → **Notifications** / **Benachrichtigungen**
3. E-Mail-Benachrichtigungen für Cloud Agents / Background Agents deaktivieren

## GitHub Pages Deploy

Das Spiel wird bei Änderungen automatisch auf GitHub Pages veröffentlicht. Dafür kann GitHub weiterhin eine Benachrichtigung senden – über die Actions-Einstellung oben abschaltbar.
