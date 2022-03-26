"use strict";

// license: CC0

function _formatHackmudArgs(args,allowScriptor=true) { // leading space, no trailing space
	if(Array.isArray(args)) {
		var s=' [';
		for(var i=0;i<args.length;++i) {
			if(i)
				s+=',';
			s+=_formatHackmudArgs(args[i]);
		}
		s+=' ]';
		return s;
	}
	if(typeof args=='object') {
		if(!args)return ' null';
		if(allowScriptor && Object.keys(args).length==1 && typeof args.__scriptor=='string' &&  /^[a-z_][a-z_0-9]*\.[a-z_][a-z_0-9]*$/.test(args.__scriptor)) {
			return ' #s.'+args.__scriptor;
		}
		var s=' {';
		var first=true;
		for(var i in args) {
			if(!first)
				s+=',';
			first=false;
			if(/[a-zA-Z0-9_]/.test(i)) {
				s+=' '+i;
			}
			else {
				s+=' "'+i.replace(/"/g,'\\"')+'"';
			}
			s+=':'+_formatHackmudArgs(args[i]);
		}
		s+=' }';
		return s;
	}
	if(typeof args=='string')
		return ' "'+args.replace(/"/g,'\\"')+'"';
	return ' '+args.toString();
}
function formatHackmudArgs(script,args) {
	var ret='>>'+script;

	if(args) {
		ret+=_formatHackmudArgs(args,false); // false to stop top-level scriptor expansion; recursive calls will expand.
	}

	return ret;
}




function _formatHackmudOutput(s,handleOKs) {
	if(typeof s=='string')return s;
	if(Array.isArray(s))
		return s.map(o=>formatHackmudOutput(o,false)).join('\n');
	if(typeof s=='object' && s!==null) {
		if(handleOKs && typeof s.ok=='boolean') {
			var k=Object.keys(s);
			if(k.length>2 || (k.length==2 && !('msg' in s)))return formatHackmudOutput(s,false);
			var pre=s.ok===true?'`LSuccess`':'`DFailure`';
			if(s.msg)
				pre+='\n'+formatHackmudOutput(s.msg);
			return pre;
		}
		s=JSON.stringify(s,0,2).replace(/^( *)"([a-z0-9A-Z_]+)":/gm,'$1$2:')
		return s;
	}
	if(s===null || s===undefined)return '';
	return s.toString();
}

// handleOKs: whether {ok:true} (and friends) should render as Success/Failure (true), or as objects (false).
function formatHackmudOutput(s,handleOKs) {
	return _formatHackmudOutput(s,handleOKs).replace(/\t/g,'  ');
}


function formatHackmud(script,args,output,handleOKs) {
	return formatHackmudArgs(script,args)+'\n'+formatHackmudOutput(output,handleOKs);
}

module.exports={
	formatHackmudArgs,
	formatHackmudOutput,
	formatHackmud
}
