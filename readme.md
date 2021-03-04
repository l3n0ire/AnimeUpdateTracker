# Anime Update Tracker

Anime Update Tracker is a all-in-one for keeping track of your progress on the anime you're watching. Currently supports tracking on Anime Update, 4anime, and  9anime with support for other sites to come.

## Installation

For users: 
<br>
Go to the [chrome store link](https://chrome.google.com/webstore/detail/anime-update-tracker/dfcboajkdkgolnlambnobofpdmejbkmb) and add the extension to your browser


For developers
1. Clone this repository
2. Turn on developer settings in chrome extensions
3. Click "load unpacked" and select the repository folder

## Usage
#### Basic Usage

1. Pin this extension so you can click on it.
2. Navigate to an episode on either https://anime-update.com/ , https://4anime.to/ or https://www13.9anime.to/
3. Click "Start Tracking" to track that episode
4. Wait 5 sec and "Currently Watching" should appear. That means tracking was successful.

#### MAL
1. Click "Login" to sign into MAL
2. A new tab will open asking you for access. Click "Allow"
3. Now all the anime you track will automatically update your MAL
4. Click "Logout" to stop MAL sync

#### Dark Mode
- Click the moon to toggle dark mode on or off

#### Last watched
- The most recently watched episode will appear in the "Last Watched" section
- Use "<-" and "->" buttons to cycle through the anime you have tracked
- "Resume" will open that episode in a new tab and will set the video to where you last left off. For 4anime.to, click play for this to take affect.
- "Next episode" will open the next episode in a new tab. Note this is availible when the next episode is availible on the site at the time of watching. It will not appear when a new episode is uploaded (This may be added in the future).
- "Delete" will remove that episode from "Last Watched" and it will no longer appear when cycling through the anime you have tracked

#### Auto Tracking
- When you start watching an episode of an anime you have tracked, the extension will automatically start tracking your progress. No need to click "Start tracking" everytime.
- Note: This only works on 4anime.to. More sites will be supported in the future.

#### Storage Sync
- Click the cloud icon to sync your extension data with chrome. Data syncs are automatically done every minute.
- Data Sync allows the extension data to be shared accross all your chrome devices. So you can start tracking on one device and continue where you left off on another.

## Issues
- Only the "video" video player on Anime Update is supported. Support for other video players is not possible at this time
- Resume may not work for some episodes on Anime Update. Please report these by opening an issue and providing a link to the episode
- Limited support for 9anime (episodes only no progress or next episode)


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Feel free to customize this extension for your own needs.

## License
[MIT](https://choosealicense.com/licenses/mit/)