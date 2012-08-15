/**
 * Author: jeff sapp
 * 
 */

CodeMirror.defineMode("ngc", function() {

    var eatLimit = function(stream, re, limit) {
	var current_count = 0;
	var ch = stream.peek();

	while (re.test(ch) && current_count < limit) {
	    current_count = current_count + 1;
	    stream.next();
	}
    };

    return {

	token: function(stream) {

	    if (stream.eatSpace()) {
		return null;
	    }

	    var returnType = null; 
	    var ch = stream.next();

	    if (/m/i.test(ch)) {
		stream.eatWhile(/\d/);
		returnType = "keyword";
	    } else if (/g/i.test(ch)) {
		stream.eatWhile(/\d/);
		returnType = "tag";
	    } else if (/[a-z]/i.test(ch)) {
		stream.eatWhile(/(\+|\-|\d|\.)/);
		returnType = "builtin";
	    } else if (ch == '(') {
		stream.skipToEnd();
		returnType = "comment";
	    } 

	    return returnType;
	}
    };
});

CodeMirror.defineMIME("text/x-ngc", "ngc");