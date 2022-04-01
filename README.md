# hackmud-render

node-canvas based hackmud-output renderer

## prep

node-canvas may require some secondary package installation; see https://www.npmjs.com/package/canvas for details.
(On mac, I also needed to `npm install nan`, but I did not on Debian; YMMV)

You will also need the white rabbit ttf, which can be grabbed from the https://github.com/DrizzlyBear/hackmud_chat_web repo, specifically https://github.com/DrizzlyBear/hackmud_chat_web/blob/main/assets/whiterabbit-webfont.ttf

## usage

```js
var HR=require('hackmud-render.js');
HR.init('/path/to/whiterabbit.ttf');
//                                       script      args                result    config options
var buffer=HR.renderHackmudScriptOutput('chats.send',{to:"dtr",msg:"hi"},{ok:true},{hardline:true}); // returns a buffer in image/png format by default
require('fs').writeFileSync('render.png',buffer); // save the file
```

## config options

* `hardline`: boolean; default false
  - If true, use the hardline colors (note: these colors are very approximate)
* `maxWidth`: positive integer; default 150
  - How many characters wide to render.
  - Output rendering will be the minimum of the specified width, or the longest line present.
  - Any lines longer than `maxWidth` are hard-wrapped like in-game.
* `blockMode`: boolean; default true
  - If `true`, render each character individually with 1 pixel of space between to reproduce the spacing in-game.
  - If `false`, render blocks of text together (slightly narrower).
* `seenUsernames`: array or object; default []
  - If an array, taken to be an array of usernames that have already been seen, in order; they will be assigned colors appropriately.
  - If an object, it should consist of `{username:"color code"}` pairs.
* `imageFormat`: string (mime type); default "image/png"
  - The format of the image buffer to return
* `debugRendering`: boolean; default false
  - If true, draws a box around each color span (or, in `blockMode`, character).
* `scan`: boolean, number, or string; default false
  - If a positive number, clamped/floored to an integer between 1 and 11, used as an approximate gui.vfx setting for game-style (soft, over-text) scanlines
  - If a negative number, negated, then clamped/floored to an integer between 1 and 11, used as an approximate gui.vfx setting for forums-style (hard, under-text) scanlines
  - If `0` or `false`, no scanlines drawn
  - If `true` or the string `"game"`, equivalent to passing `6`
  - If the string `"forums"`, equivalent to passing `-6`.
  - Anything else is ignored
* `bloom`: integer
  - Clamped/floored to an integer between 0 and 11. Approximates in-game bloom with text shadows (very badly).

## using with discord.js bots

If you use discord.js for bots, it's easy to send the buffer as an attachment.
Here is roughly the code I use for /hackmud-render with risk:

```js
// assume command is some sort of object dealing with the command that was run
// msg is a discord.js message object

var buf=HR.renderHackmudScriptOutput(
	command.script,
	command.args,
	command.output,
	{
		hardline:command.hardline,
		maxWidth:125,
		blockMode:true,
		seenUsernames:['farmer_john'],
		imageFormat:"image/png",
		debugRendering:false
	}
)

msg.reply({files:[{attachment:buf,name:"hackmud-render.png"}]})
```
