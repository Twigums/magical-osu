# Gameplay Aspect of SITE

This file will explain everything on the gameplay aspect of the website, specifically for all songs. This includes the core gameplay, mechanics, and gameplay visuals.

The gameplay will officially support these dimensions:
- Monitor: 1920 x 1080 px

## Core Gameplay
This is a rhythm game that focuses on mouse movement and and accuracy. Notes appear in relation to the beats in the selected song. The goal of the player is to accurately hit the notes and complete the song.

The game should feel satisfying and rhythmic. The margins for the judgement window and the acceptable range of angles are the defining factor in making the gameplay feel satisfying.

A good analogy is comparing this gameplay to Beat Saber, where note hitting is determined by swiping (slashing in Beat Saber).

The TextAlive song information should be from `/wiki/6W2N_chorus_timings.jsonc`.
The TextAlive API token to use is: AIOQxRTzslB2Pfdb.

## Notes
There are two different types of notes in the game:
- Click: A red note with a specified direction. The direction can be defined in any direction in the 360 degrees around the note.
- Stream: A series of blue notes (> 1) with specified directions. The directions can be defined in any direction int he 360 degrees around each note. The notes in the stream should have directions orientated in a manner that would be feasible for a human player to properly hit them.

Directions will have an acceptable margin of error window, so the player can hit the note successfully from a range of angles. A successful hit is defined as moving from behind the note to past the arrow in the specified direction while a key is held (or dragged for touchscreen devices). When the cursor reaches the center of the note is when the judgement is called and a score is obtained for that hit if it is a successful hit.

Both types will appear and disappear in the same way. They will gradually appear as the song progresses. Each note will appear as a faint outline at first, and the inside of the note will appear more and more opaque before becoming the note's color when its the perfect time to hit the note (defined by the judgement window).

## Judgement Window
The judgement window is the acceptable margin of error for valid hits. Score is determined by when a note is correctly hit relative to the judgement window. The judgement window and scores are defined as such:
- Perfect: +/- 32 ms  -> 5 points
- Good:    +/- 100 ms -> 2 points
- Miss:    otherwise  -> 0 points

## Scoring
Scoring is simply defined as the sum of points obtained by the player according to the judgement window by the end of the song.
