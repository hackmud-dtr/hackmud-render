"use strict";

// license: CC0 as much as possible, i pulled the regexes straight from game tho so /shrug

// usage:
// var HR=require('hackmud-render.js');
// HR.init('/path/to/whiterabbit.ttf');
// //                                       script      args                result    config options
// var buffer=HR.renderHackmudScriptOutput('chats.send',{to:"dtr",msg:"hi"},{ok:true},{hardline:true}); // returns a buffer in image/png format by default
// require('fs').writeFileSync('render.png',buffer);


var CANVAS=require('node-canvas');
var HACKMUDIFFY=require('./hackmudiffy.js')


// static config-ish stuff
var NORMAL_COLORS={ // taken from shell.txt output
	"A":"#FFFFFF",	"a":"#000000",
	"B":"#CACACA",	"b":"#3F3F3F",
	"C":"#9B9B9B",	"c":"#676767",
	"D":"#FF0000",	"d":"#7D0000",
	"E":"#FF8383",	"e":"#8E3434",
	"F":"#FF8000",	"f":"#A34F00",
	"G":"#F3AA6F",	"g":"#725437",
	"H":"#FBC803",	"h":"#A88600",
	"I":"#FFD863",	"i":"#B2934A",
	"J":"#FFF404",	"j":"#939500",
	"K":"#F3F998",	"k":"#495225",
	"L":"#1EFF00",	"l":"#299400",
	"M":"#B3FF9B",	"m":"#23381B",
	"N":"#00FFFF",	"n":"#00535B",
	"O":"#8FE6FF",	"o":"#324A4C",
	"P":"#0070DD",	"p":"#0073A6",
	"Q":"#A4E3FF",	"q":"#385A6C",
	"R":"#0000FF",	"r":"#010067",
	"S":"#7AB2F4",	"s":"#507AA1",
	"T":"#B035EE",	"t":"#601C81",
	"U":"#E6C4FF",	"u":"#43314C",
	"V":"#FF00EC",	"v":"#8C0069",
	"W":"#FF96E0",	"w":"#973984",
	"X":"#FF0070",	"x":"#880024",
	"Y":"#FF6A98",	"y":"#762E4A",
	"Z":"#0C112B",	"z":"#101215"
}
var HARDLINE_COLORS={ // manually taken from screenshots of hardline :(
	"A":"#FDFDFD",	"a":"#1F0101",
	"B":"#FCFCC4",	"b":"#6D5130",
	"C":"#E3F594",	"c":"#A19C5C",
	"D":"#1FFD82",	"d":"#00EF3A",
	"E":"#BFFCC0",	"e":"#38FD5A",
	"F":"#1DFDFD",	"f":"#00FDB3",
	"G":"#9BFDF8",	"g":"#4CC076",
	"H":"#1DFAFD",	"h":"#00B3BB",
	"I":"#9CFDFD",	"i":"#52F4CF",
	"J":"#24C9FC",	"j":"#0053AA",
	"K":"#DAFEFE",	"k":"#3C2D57",
	"L":"#A923FB",	"l":"#4311A6",
	"M":"#FCF7FD",	"m":"#470B33",
	"N":"#FE1A6A",	"n":"#B10C0C",
	"O":"#FDE4A2",	"o":"#8E2D2E",
	"P":"#FD1600",	"p":"#FD1601",
	"Q":"#FDFCAB",	"q":"#BC2E24",
	"R":"#FDDD03",	"r":"#C04F01",
	"S":"#FDC165",	"s":"#FD532B",
	"T":"#FCFC14",	"t":"#BAF700",
	"U":"#FDFDBF",	"u":"#7D781A",
	"V":"#96FD02",	"v":"#2FFD01",
	"W":"#F1FD90",	"w":"#71FD0C",
	"X":"#1EFD0C",	"x":"#00FA0B",
	"Y":"#A5FD87",	"y":"#3DDE1C",
	"Z":"#611300",	"z":"#3C0401"
};
const NUM_EQUIV='CALPTFFFFF'
for(var i=0;i<NUM_EQUIV.length;++i) {
	NORMAL_COLORS[i]=NORMAL_COLORS[NUM_EQUIV[i]]
	HARDLINE_COLORS[i]=HARDLINE_COLORS[NUM_EQUIV[i]]
}
var USER_COLORS='JWLBKM' // the colors for @-usernames, in order

var ZERO_WIDTH_CHARS=/[\u200b\r]/g; // regex to match any chars that are meant to be 0-width (not-rendered)


var COLOR_REGEXES={ // mostly taken from decompiled client and cleaned up a little, a few small changes made to simplify but not a ton
	startCurrencyRegex  :  /^(-)?(?:(\d{1,5})Q)?(?:(\d{1,3})T)?(?:(\d{1,3})B)?(?:(\d{1,3})M)?(?:(\d{1,3})K)?(?:(\d{1,3}))?GC(\W)/g,
	insideCurrencyRegex : /\W(-)?(?:(\d{1,5})Q)?(?:(\d{1,3})T)?(?:(\d{1,3})B)?(?:(\d{1,3})M)?(?:(\d{1,3})K)?(?:(\d{1,3}))?GC(\W)/g,
	dateRegex           : /(\d{1,4})AD D(\d{1,3})/g,
	trustCommunication  : /:::TRUST COMMUNICATION:::/g,
	trustScriptRegex    : /(#s\.|[^#\.a-z0-9_]|^)(trust|accts|autos|scripts|users|sys|corps|chats|gui|escrow|market|kernel|binmat)\.([a-z_][a-z0-9_]*)/g,
	scriptRegex         : /(#s\.|[^#\.a-z0-9_]|^)([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)/g,
	keyValueSuggestRegex: /((?:(?:"(?:[^"\n]|\.)+")|(?:[a-zA-z_]\w*))[\t ]{0,2}):([\t ]{0,2}(?:(?:È[^É]+É)|(?:"È(?:[^"É\n]|\.)*É")))/g,
	keyValueRegex       : /((?:(?:"(?:[^"\n]|\.)+")|(?:[a-zA-z_]\w*))[\t ]{0,2}):([\t ]{0,2}(?:(?:true)|(?:false)|(?:null)|(?:"(?:[^"\n]|\.)*")|(?:-?\d+\.?\d*)|\{|\[|#s\.[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*))/g,
	sectorRegex         : /(FORM|CHAOS|KIN|CHOICE|DATA|VOID)_(?:ALPHA|BETA|GAMMA|DELTA|EPSILON|ZETA|THETA|LAMBDA|SIGMA|TAU|PHI|PSI|OMEGA)_[0-9]/g,
	anonSectorRegex     : /(?:SPC|VNP|K|HJG|NGC)_[0-9]{4}/g,
	colorMapRegex       : /`([0-9a-zA-Z])([^:`\n]{1,2}|[^`\n]{3,}?)`/g,
	usernameRegex       : /@([a-z_][a-z0-9_]*)/g
}


var EM_WIDTH=16;
var EM_HEIGHT=24;

function prepCanvas(config,width,height) {
	var c=CANVAS.createCanvas(width+32,height+28);
	var ctx=c.getContext('2d');
	ctx.font='28px WhiteRabbit';
	ctx.fillStyle=config.colors.z
	ctx.fillRect(0,0,width+32,height+28);

	if(config.scanMode=='forums') {
		var normalAlpha=config.scanStrength/11
		ctx.fillStyle=config.hardline?'#350200':'#0e0e0e';
		for(var i=0;i<height+28;i+=13) {
			ctx.fillRect(0,i+2,width+32,6);
		}
	}

	ctx.save();
	ctx.fillStyle=config.colors.S;
	ctx.translate(16,9)

	config.canvas=c;
	config.ctx=ctx;
}

function uncolor(s) {
	return s.replace(/`[0-9A-Za-z](?!:.?`|.:`)([^`\n]+)`/g,'$1'); //`//syntax
}

function chunkText(text) {
	var lines=text.split('\n');
	for(var i=0;i<lines.length;++i) {
		var uncoloredLength=uncolor(s);
	}
}




function handleSingleGCColor(colors,c,s,n) {
	for(var i=0;i<s.length;++i) {
		colors[n++]='B';
	}
	if(c)
		colors[n++]=c;
	return n;
}
function colorRange(colors,start,width,color) {
	for(var i=0;i<width;++i)
		colors[start+i]=color;
}
function handleGCColorMatch(colors,it,sk) {
	var n=sk?it.index+1:it.index;
	if(it[1]) // negative sign
		colors[n++]='S';
	if(it[2])n=handleSingleGCColor(colors,'D',it[2],n) // Q
	if(it[3])n=handleSingleGCColor(colors,'V',it[3],n) // T
	if(it[4])n=handleSingleGCColor(colors,'J',it[4],n) // B
	if(it[5])n=handleSingleGCColor(colors,'L',it[5],n) // M
	if(it[6])n=handleSingleGCColor(colors,'N',it[6],n) // K
	if(it[7])n=handleSingleGCColor(colors,null,it[7],n) // normal
	colors[n++]='C'
	colors[n++]='C'
}
function PATCH(line,it,startOff=0,endOff=0,lowPriorityFill=0) {
	return line.substring(0,it.index+startOff)+'%'.repeat(it[0].length-startOff-endOff-lowPriorityFill)+line.substring(it.index+it[0].length-endOff);
}
function colorMap(line,config) {
	line=line.replace(/</g,'È').replace(/>/g,'É');
	var chars=line.split('');
	var cc=line.replace(/./g,' ').split('');
	// this whole thing is a massive mess: you have to apply the regexes in one specific order to get the same matches
	// but because of how colors nest, i apply the colors in the reverse order
	// so i build up a bunch of color layers, which i then merge on top of each other backwards
	// le sigh

	var layers=[
		cc.slice(),//sCR
		cc.slice(),//iCR
		cc.slice(),//dr
		cc.slice(),//tC
		cc.slice(),//tSR
		cc.slice(),//sR
		cc.slice(),//kVSR,
		cc.slice(),//kVR,
		cc.slice(),//sR,
		cc.slice(),//aSR
		cc.slice(),//cMR,
		cc.slice(),//uR
	]
	var L=0;


	for(var it of line.matchAll(COLOR_REGEXES.startCurrencyRegex)) {
		line=PATCH(line,it,0,1)
		handleGCColorMatch(layers[L],it,false);
	}
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.insideCurrencyRegex)) {
		line=PATCH(line,it,1,1)
		handleGCColorMatch(layers[L],it,true);
	}
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.dateRegex)) {
		line=PATCH(line,it)
		colorRange(layers[L],it.index,it[1].length,'A');
		colorRange(layers[L],it.index+it[1].length,2,'B');
		colorRange(layers[L],it.index+it[1].length+3,1,'C');
		colorRange(layers[L],it.index+it[1].length+4,it[2].length,'L');
	}
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.trustCommunication)) {
		line=PATCH(line,it)
		colorRange(layers[L],it.index,it[0].length,'D');
	}
	L++

	for(var it of line.matchAll(COLOR_REGEXES.trustScriptRegex)) {
		if(it[1]!='#s.') // special case for scriptors, don't mark this part done
			line=PATCH(line,it,it[1].length)
		colorRange(layers[L],it.index+it[1].length,it[2].length,'F');
		colorRange(layers[L],it.index+it[1].length+it[2].length+1,it[3].length,'L');
	}
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.scriptRegex)) {
		if(it[1]!='#s.') // special case for scriptors, don't mark this part done
			line=PATCH(line,it,it[1].length)
		colorRange(layers[L],it.index+it[1].length,it[2].length,'C');
		colorRange(layers[L],it.index+it[1].length+it[2].length+1,it[3].length,'L');
	}
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.keyValueSuggestRegex)) {
		line=line.substring(0,it.index+it[1].length)+'%'+line.substring(it.index+it[1].length+1); // only mark the : as used
		colorRange(layers[L],it.index,it[1].length,'N');
		colorRange(layers[L],it.index+it[1].length+1,it[2].length,'B');
		if(chars[it.index]=='`')
			layers[L][it.index]=' ';
	}
	layers[L].lowPriorityFill=true;
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.keyValueRegex)) {
		line=line.substring(0,it.index+it[1].length)+'%'+line.substring(it.index+it[1].length+1); // only mark the : as used
		colorRange(layers[L],it.index,it[1].length,'N');
		colorRange(layers[L],it.index+it[1].length+1,it[2].length,'V');
		if(chars[it.index]=='`')
			layers[L][it.index]=' ';
	}
	layers[L].lowPriorityFill=true;
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.sectorRegex)) {
		line=PATCH(line,it)
		var c;
		if(it[1]=="FORM")c='l';
		else if(it[1]=='KIN')c='N';
		else if(it[1]=='VOID')c='I';
		else if(it[1]=='DATA')c='q';
		else if(it[1]=='CHOICE')c='F';
		else if(it[1]=='CHAOS')c='D';
		colorRange(layers[L],it.index,it[0].length,c);
	}
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.anonSectorRegex)) {
		line=PATCH(line,it)
		colorRange(layers[L],it.index,it[0].length,'C');
	}
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.colorMapRegex)) {
		line=PATCH(line,it)
		colorRange(layers[L],it.index,it[0].length,it[1],'V');
		for(var j=2;j<it[0].length-1;++j) {
			if(chars[it.index+j]==' ' && layers[L][it.index+j]==it[1])
				layers[L][it.index+j]=' ';
		}
		colorRange(layers[L],it.index,2,'!');
		colorRange(layers[L],it.index+it[0].length-1,1,'!');
	}
	layers[L].lowPriorityFill=true;
	L++;

	for(var it of line.matchAll(COLOR_REGEXES.usernameRegex)) {
		line=PATCH(line,it)
		colorRange(layers[L],it.index,1,'B');
		var c=getUsernameColor(config,it[1]);
		colorRange(layers[L],it.index+1,it[1].length,c);
	}


	var colors=cc.slice();
	for(var i=layers.length;i-->0;) {
		for(var j=0;j<layers[i].length;++j) {
			if(colors[j]=='!' || colors[j]=='\n')continue;
			if(layers[i][j]!=' ' &&(!layers[i].lowPriorityFill || colors[j]==' '))
				colors[j]=layers[i][j];
		}
	}


	for(var i=0;i<chars.length;++i) {
		if(ZERO_WIDTH_CHARS.test(chars[i]) || colors[i]=='!') {
			chars.splice(i,1);
			colors.splice(i,1);
			i--;
		}
	}

	if(config.firstLineIsScript) {
		// default color for first line in script mode is A, else the below will handle it
		for(var i=0;i<colors.length && colors[i]!='\n';++i) {
			if(colors[i]==' ')
				colors[i]='A';
		}
	}

	for(var i=0;i<colors.length;++i) {
		// fill in S for any un-colored non-space char.
		if(colors[i]!=' ')continue;
		if(chars[i]==' ')continue;
		colors[i]='S';
	}

	for(var i=0;i<colors.length;++i) {
		// for spaces, copy the preceding color (to avoid color changes)
		// start of line spaces instead copy *first non-space color*
		if(colors[i]!=' ')continue;
		if(i==0 || colors[i-1]=='\n') { // start of line spaces special
			var c=null;
			for(var j=i+1;colors[j]!='\n';++j)
				if(colors[j]!=' '){
					c=colors[j];
					break;
				}
			if(!c)c='S'
			colors[i]=c;
		}
		else colors[i]=colors[i-1];
	}

	return {chars:cleanArrayOfCHars(chars,config),colors:cleanArrayOfCHars(colors,config),line}

}
function cleanArrayOfCHars(a,config) {
	return a.join('').replace(/«/g,'`'/*my copy of the font doesn't work*/).split('\n').flatMap(o=>o.match(new RegExp('.{1,'+config.maxWidth+'}','g'))||o)
}

function drawText(config,color,text,chPos,line,bloom) {
		if(bloom) {
			var alp=config.ctx.globalAlpha;
			config.ctx.globalAlpha=0.1*config.bloom/10
			config.ctx.shadowBlur=2
			config.ctx.fillStyle='transparent';//config.colors[color];
			config.ctx.shadowColor=config.colors[color];

			for(var x=-1.5;x<=1.5;++x)
				for(var y=-1.5;y<=1.5;++y) {
					config.ctx.shadowOffsetX=x*2
					config.ctx.shadowOffsetY=y*2
					config.ctx.fillText(text,chPos*config.em_width,(line+1)*config.em_height)
				}

			config.ctx.shadowBlur=0;
			config.ctx.shadowOffsetX=0;
			config.ctx.shadowOffsetY=0;
			config.ctx.shadowColor='transparent'
			config.ctx.globalAlpha=alp;
		}
		else {
			config.ctx.fillStyle=config.colors[color];
			config.ctx.fillText(text,chPos*config.em_width,(line+1)*config.em_height)
			if(config.debugRendering) {
				config.ctx.strokeStyle=config.colors[color];
				config.ctx.strokeRect(chPos*config.em_width,line*config.em_height,text.length*config.em_width-1,config.em_height)
			}
		}
}


function getUsernameColor(config,user) {
	if(!config.seenUsernames[user])
		config.seenUsernames[user]=USER_COLORS[config.usernameInd++%USER_COLORS.length];
	return config.seenUsernames[user];
}



// pass null for script (and whatever for args) to skip the script/args line.
function renderHackmudScriptOutput(script,args,output,config={}) {
	config=Object.assign({ // default config options
		hardline:false,
		maxWidth:150,
		blockMode:true, // if true, render characters individually to preserve the hackmuddy line-gap-between-blocks, if false, don't (will make output narrower),
		seenUsernames:[], // can be an array, in which case the usernames are assigned colors in order, *or* a object of {username:"color code"} pairs
		imageFormat:"image/png",
		debugRendering:false,
		scan:false,
		bloom:0
	},config);
	// other things get added to config; don't try to override them.

	if(config.hardline)
		config.colors=HARDLINE_COLORS;
	else
		config.colors=NORMAL_COLORS;

	if(config.scan) {
		if(config.scan===true || config.scan=="game") {
			config.scanMode='game'
			config.scanStrength=6;
		}
		else if(config.scan=="forums") {
			config.scanMode='forums'
			config.scanStrength=6;
		}
		else if(typeof config.scan=='number') {
			if(config.scan > 0) {
				config.scanMode='game';
				config.scanStrength=config.scan;
			}
			else if(config.scan < 0) {
				config.scanMode='forums';
				config.scanStrength=-config.scan;
			}
			config.scanStrength=Math.floor(config.scanStrength)
			if(config.scanStrength>11)config.scanStrength=11;
		}
	}
	if(config.bloom) {
		if(typeof config.bloom!="number")delete config.bloom;
		config.bloom=Math.floor(config.bloom)
		if(config.bloom > 11)config.bloom=11;
		if(config.bloom <=0)delete config.bloom;
	}

	config.em_height=EM_HEIGHT;
	config.em_width=config.blockMode?EM_WIDTH+1:EM_WIDTH;

	if(Array.isArray(config.seenUsernames)) {
		var a=config.seenUsernames;
		config.seenUsernames={}
		config.usernameInd=0;
		for(var i=0;i<a.length;++i) {
			getUsernameColor(config,a[i]);
		}
	}
	else {
		config.usernameInd=Object.keys(config.seenUsernames).length
	}

	if(script) {
		output=HACKMUDIFFY.formatHackmud(script,args,output,true)
		config.firstLineIsScript=true;
	}
	else {
		output=HACKMUDIFFY.formatHackmudOutput(output,true)
		config.firstLineIsScript=false;
	}


	var res=colorMap(output,config); // this is where most if the work happens

	var longest=Math.max(...res.chars.map(o=>o.length));
	var height=res.chars.length * config.em_height;
	var width=longest*config.em_width;

	prepCanvas(config,width,height);

	function drawInternal(bloom) {
		if(config.blockMode) {
			for(var i=0;i<res.chars.length;++i) {
				if(res.colors[i].length==0)continue;
				for(var j=0;j<res.colors[i].length;++j) {
					drawText(config,res.colors[i][j],res.chars[i][j],j,i,bloom);
				}
			}
		}
		else {
			for(var i=0;i<res.chars.length;++i) {
				if(res.colors[i].length==0)continue;
				var c=res.colors[i][0]
				var last=0;
				for(var j=1;j<res.colors[i].length;++j) {
					if(res.colors[i][j]==c)continue;
					drawText(config,c,res.chars[i].substring(last,j),last,i,bloom);
					last=j;
					c=res.colors[i][j];
				}
				drawText(config,c,res.chars[i].substring(last,j),last,i,bloom);
			}
		}
	}

	if(config.bloom)
		drawInternal(config.bloom);
	drawInternal(false)



	if(config.scanMode=='game') {
		config.ctx.restore();
		var normalAlpha=config.scanStrength/11;
		config.ctx.globalCompositeOperation='soft-light';
		config.ctx.fillStyle=config.hardline?'#350200':'#0e0e0e';
		for(var i=0;i<height+28;i+=13) {
			config.ctx.globalAlpha=normalAlpha/4;
			config.ctx.fillRect(0,i,width+32,1);

			config.ctx.globalAlpha=normalAlpha/2;
			config.ctx.fillRect(0,i+1,width+32,1);

			config.ctx.globalAlpha=3*normalAlpha/4;
			config.ctx.fillRect(0,i+2,width+32,1);

			config.ctx.globalAlpha=normalAlpha;
			config.ctx.fillRect(0,i+3,width+32,3);

			config.ctx.globalAlpha=3*normalAlpha/4;
			config.ctx.fillRect(0,i+6,width+32,1);

			config.ctx.globalAlpha=normalAlpha/2;
			config.ctx.fillRect(0,i+7,width+32,1);

			config.ctx.globalAlpha=normalAlpha/4;
			config.ctx.fillRect(0,i+8,width+32,1);
		}
	}

	return config.canvas.toBuffer(config.imageFormat);

}

function init(path) {
	CANVAS.registerFont(path,{family:"WhiteRabbit"})
}

module.exports={
	init,
	renderHackmudScriptOutput
}
