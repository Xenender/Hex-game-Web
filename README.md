# Hex-game-Web

<h2>Composition of the project:</h2>

     2 files:

     -clientHex1_5.html -> The client side code, containing html, css and JavaScript
     -serveurHex.js -> The server-side code, containing JavaScript

     to launch the server: node serverHex.js
     then go to: http://localhost:8888/


<h2>Implemented features:</h2>

     -All hands-on, using socket.io

     -The first player who connects can set the game: the size of the checkerboard and the number of players

     -The exit of a player (he closes the web page):
         -If the game is not launched: if he was the host of the game, the host switches to another client.
         -If the game is started:- The host can choose to continue the game or not by overriding or not the pawns of the player who left. (Functional for the moment only when the last player entered in the game leaves)
                                  - If there is only one player left: he has won

     -Automatic victory detection: If a player connects from top to bottom or from left to right the checkerboard with his pawns, he wins

     -If the checkerboard is filled then the game is drawn.

     - Instant messaging: possibility to communicate with other players in the chat at the bottom of the page

     - Prevent bugs: a player cannot enter the game several times, 2 players cannot have the same name
    
     -Restart a game directly when one ends



<h2>Possible improvement:</h2>

     implement CSS to make the interface prettier.
