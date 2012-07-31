(ns gsim.draw
  (:use [gsim.console :only [message]]))

(def hl-line nil)
(def editor nil)

(defn code-element []
  (.getElement goog.dom "code"))

(defn cursor-line []
  (-> editor .getCursor .-line))

(defn get-line [num]
  (.getLine editor num))

(defn set-line-class
  "Set the class of a line. The line arg can be a number or a linehandle."
  ([line] (set-line-class line nil))
  ([line class]
     (.setLineClass editor line class)))

(defn on-cursor-activity []
  (let [line-number (cursor-line)
	line (get-line line-number)]
    (set-line-class hl-line)
    (set! hl-line (set-line-class line-number "activeline"))
    (message line)))

(defn init []
  (set! editor
	(js/CodeMirror.fromTextArea
	 (code-element)
	 (js-obj "lineNumbers" true
		 "lineWrapping" true
		 "onCursorActivity" on-cursor-activity)))
  (.focus editor)
  (set! hl-line (set-line-class 0 "activeline")))
