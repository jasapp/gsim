(ns gsim.editor
  (:use [gsim.console :only [message]]
	[gsim.machine :only [machine-eval step-back]]))

(def hl-line nil)
(def editor nil)

(defn cursor-line-number []
  (-> editor .getCursor .-line))

(defn hl-line-number []
  (->> hl-line (.lineInfo editor) .-line))

(defn get-line [line-number]
  (.getLine editor line-number))

(defn get-lines [line-number c]
  (map #(get-line %) (range line-number (+ line-number c))))

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
	line-difference (- line-number previous-line-number)]
    (set-line-class hl-line)
    (set! hl-line (set-line-class line-number "activeline"))
    (cond (pos? line-difference) (apply machine-eval
					(get-lines previous-line-number line-difference))
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
