var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    lineWrapping: true,

    onCursorActivity: function() {
	var line_number = editor.getCursor().line;
	var line = editor.getLine(line_number);

	editor.setLineClass(hlLine, null, null);
	hlLine = editor.setLineClass(line_number, null, "activeline");
    }});

var hlLine = editor.setLineClass(0, "activeline");
editor.focus();


