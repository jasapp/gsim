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
	var points = new Array();

	processing.setup = function() {
		processing.size(500, 500);
		processing.noLoop();
	};

	processing.add_point = function(x,y,z) {
		points.push({"x":x,"y":y,"z":z});
		processing.redraw();
	};

	processing.get_point_count = function() {
		points.length;
	};
	
	processing.remove_points = function() {
		points = new Array();
	};

	processing.remove_last_point = function() {
		points.pop();
		processing.redraw();
	};

	processing.draw_point = function(p) {
		processing.stroke(255,0,0);  
		processing.fill(255);  
		processing.ellipse(p.x,p.y,10,10); 
	};

	processing.draw = function() {
		processing.background(200,200,255);  
		var end = points.length;
		var p = 0;
		for(p=0; p<end; p++) {
			var point = points[p];

			if(p<end-1) {  
				var next = points[p+1];
				processing.line(point.x,point.y,next.x,next.y); 
			}  
			processing.draw_point(point); 
		} 
	};
}  

var canvas = document.getElementById("canvas1");  
var p = new Processing(canvas, sketchProc); 

var step_keys = function(event) {
	var something = false;
	var direction = null;
	var previous_class = "line alt1";

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
		
		if (line_number%2 == 0) {
			current_class = "line alt2";
			previous_class = "line alt1";
		} else {
			previous_class = "line alt2";
			current_class = "line alt1";
		}
		
		$("div[number="+(line_number)+"][code=gcode]").removeClass('line alt2 highlighted').addClass(previous_class);
		$("div[number="+(line_number+1)+"][code=gcode]").removeClass(current_class).addClass('line alt2 highlighted');
		$("div[number="+(line_number+2)+"][code=gcode]").removeClass('line alt2 highlighted').addClass(previous_class);

		$.getJSON('/json', { dir: direction, block: lines[line_number] }, function(d) {

			// $("h4.addedtext").remove();
			// $("div.contentToChange").append("<h4 class=\"addedtext\">" + lines[line_number] + "</h4>");
			$("div.message").empty();

			if (direction == "next") {
				p.add_point(line_number*20, line_number*30, 0);
			} else {
				p.remove_last_point();
			}

			d.responses.forEach(function(r) {
				$("div.message").append(r.message+"<br>");
				// $("div.contentToChange").append("<h4 class=\"addedtext\">" + r.message + "</h4>");
				if (r.code !== null) {
					// p.add_point(line_number*20, line_number*30, 0);
					// $("div.contentToChange").append("<h4 class=\"addedtext\">" + r.message + "</h4>");
				}
			});


		});
	}
};


var line = jQuery("div[number=1][code=gcode]");
line.removeClass('line alt2').addClass('line alt2 highlighted');

jQuery(document).keyup(step_keys);
