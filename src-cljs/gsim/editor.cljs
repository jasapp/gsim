(ns gsim.editor
  (:use [gsim.console :only [message]]
	[gsim.machine :only [machine-eval step-back]]))

(def hl-line nil)
(def editor nil)

(defn cursor-line-number []
  (-> editor .getCursor .-line))

(defn hl-line-number []
  (->> hl-line (.lineInfo editor) .-line))

(defn get-line [num]
  (.getLine editor num))

(defn set-line-class
  "Set the class of a line. The line arg can be a number or a linehandle."
  ([line] (set-line-class line nil))
  ([line class]
     (.setLineClass editor line class)))

(defn focus []
  "Focus the editor."
  (.focus editor))

(defn on-cursor-activity []
  (let [line-number (cursor-line-number)
	previous-line-number (hl-line-number)
	line (get-line line-number)
	line-difference (- line-number previous-line-number)]
    (set-line-class hl-line)
    (set! hl-line (set-line-class line-number "activeline"))
    (cond (pos? line-difference) (machine-eval line)
	  (neg? line-difference) (step-back (* -1 line-difference)))))

(defn init [element-name]
  (set! editor
	(js/CodeMirror.fromTextArea
	 (.getElement goog.dom element-name)
	 (js-obj "lineNumbers" true
		 "lineWrapping" true
		 "onCursorActivity" on-cursor-activity)))
  (focus)
  (set! hl-line (set-line-class 0 "activeline")))
