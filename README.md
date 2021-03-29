# Sonos Playlist Card by [@ChrisK91](https://www.github.com/ChrisK91)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

This is an experimental using the Spotcast add on, to play your spotify playlists on sonos speakers. It is heavily influenced by [spotify-card](https://github.com/custom-cards/spotify-card), and relies on the [spotcast](https://github.com/fondberg/spotcast) connector to query the playlists.

When clicking a playlist, the "media_player.play" service will be called, with the id of the desired playlist.

UI-mode is not yet supported. I'm not a Typescript expert, so there will be some ugly code in here.

## YAML-mode

```#! yaml
type: sonos-playlist-card
name: optional string to display at the top
player: the entity to play the playlist on
playlist_type: (optional) the playlists to display (featured, discover-weekly)
account: (optional) the spotify account to query the playlists for, defaults to the default account
limit: (optional) how many playlists to show 
country_code: (optional) the country to show the featured playlists for
```
