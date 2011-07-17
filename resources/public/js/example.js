var line_number = 0;

var lines =  [ "G20",
			   "G00",
			   "G17 G40 G80",
			   "T01",
			   "G00 X1.0 Y1.0 Z1.0",
			   "M06 X1.0",
			   "G90 G54 G00 X0.375 S900 M03",
			   "G43 Z1.0 H01 M08",
			   "G99 G82 R-0.4 Z-0.608 P200 F8.0",
			   "Y0.74 Y1.125",
			   "G98 Y1.625",
			   "G99 X1.6875 R0.1 Z-0.258"];

function sketchProc(processing) {  
	processing.setup = function() {
		processing.size(100, 100);
		processing.background(255);
	};

	processing.draw = function() { };
}  

var canvas = document.getElementById("canvas1");  
var processingInstance = new Processing(canvas, sketchProc); 

var step_keys = function(event) {
	var something = false;
	var direction = null;

	if ( event.keyCode == '13' ) {
		event.preventDefault();
	}

	if (event.keyCode == '38' && line_number > 0) {
		direction = "back";
		something = true;
		line_number -= 1; 
	}

	if (event.keyCode == '40' && line_number < lines.length-1 ) {
		direction = "next";
		something = true;
		line_number += 1; 
	}

 	if (something) {
		$.getJSON('/json', { dir: direction, block: lines[line_number] }, function(d) { });
		$("h1.addedtext").remove();
		$("div.contentToChange").append("<h1 class=\"addedtext\">" + lines[line_number] + "</h1>");
	}
};

$("div.contentToChange").append("<h1 class=\"addedtext\">" + lines[line_number] + "</h1>");
jQuery(document).keyup(step_keys);
