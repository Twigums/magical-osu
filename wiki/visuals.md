# Visual Aspect of SITE

This file will explain everything on the visual aspect of the website, excluding gameplay related aspects. This specifically means how each page looks in format, art, and layout. Non-game user interaction is also described in this file.

The website will officially support these dimensions:
- Monitor: 1920 x 1080 px

## Home tab

The home tab is established to provide the end user a welcoming experience and a perfect first impression.

- The background is a blurred gif that shows the gameplay. It should be darkened and established in the background. All objects on this page must sit over this background.
- The header includes the title, which is the name of the website on the top left. Additionally, "Magical Mirai 2026" is stated right below it in smaller font. On the top right, there is a button/switch to change the language from English to Japanese. English should be set by default.
- The body includes the "original layout", which includes three buttons: "Play", "Tutorial", and "Info". "Tutorial" will take the user to the "Tutorial" tab. Both "Play" and "Info" will replace items on this page.
    - "Play" will replace the "original layout" with buttons to each song. Each song button will take the user to the song tab for that specific song. Additionally, there will be a visually different "Back" button that returns the layout back to the "original layout".
    - "Info" will replace the "original layout" with information about the site and the authors. Additionally, there will be a "Back" button that returns the layout back to the "original layout".
    - The "Back" buttons for both the "Play" layout and "Info" layout must be the same in style and placement. 
- The footer includes a clickable image to this repository and a clickable image to Hakyll.

## Song tab

The song tab is a generalized description for each song. The difference between these tabs are specifically to the song link, and this information is provided in `/src/songs/{SONG_NAME}`, where `{SONG_NAME}` is the name of the song.

The objects in the page fits the screen perfectly. Users across all supported dimensions should not have to scroll to view any described element of the page.

- The background is a storyboard animation for the song. The TextAlive API is used to present the lyrics as it chronologically appears in the song. After completing a line, the entire line will disappear and a new line will begin. The entire storyboard background should be slightly dim and not blurred.
- The immediate top of the page is a slightly opaque but mostly transparent, thin, white bar for the progress of the song. In the beginning, this is 0% and will fill up proportionally as the song progresses, and the filled portion is the same white but significantly more opaque.
- Below the progress bar, on the right side, are three items:
    - The first button/switch is the same language change from English to Japanese. It should be the same as the home tab's button and be placed in the same location.
    - The second button is a play button with the triangular play symbol. When pressing this, the song, storyboard, and progress bar begins and the button becomes dimmed and unclickable until the stop button is pressed.
    - The third button is a stop button with a square pause button. When pressing this, the song, storyboard, and progress bar stops and both reset to the beginning. The play button will be enabled once this button is clicked.
- Below the progress bar, on the left, is a description of the song: the song name, the author's name, and the mapper's name.
- In the center of the screen is the gameplay. There is a faint, slightly more opaque, white outline for where the game will take place. When the play button is pressed, the game will begin and not stop until the song is completed or the stop button is pressed.
    - Relative to the screen size, for tablet and monitor displays, the game sits at an aspect ratio of 4:3 inside the page. There is a small gap between the borders of the game and the top and bottom of the page. For phone displays, the aspect ratio is still 4:3. However, the gap between the borders is miniscule, and the described play, stop, and back buttons are now pushed more towards the center to give the game area more space.
- On the bottom of the screen is a single button on the right side. This is the "Back" button. This button is the same "Back" button as the one described in the "home tab" and will redirect to the "home tab".