(ns gsim.editor
  (:use [gsim.console :only [message]]
	[gsim.machine.machine :only [machine-eval step-back new-machine]]))

(def hl-line nil)
(def editor nil)
(def machine (atom nil))

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
    (cond (pos? line-difference) 
          (swap! machine 
                 (fn [] 
                   (apply machine-eval @machine 
                          (get-lines previous-line-number line-difference))))
	  (neg? line-difference) 
          (swap! machine
                 (fn []
                   (step-back @machine (* -1 line-difference)))))))

(defn init [textarea]
  (swap! machine new-machine)
  (set! editor
	(js/CodeMirror.fromTextArea
	 (.getElement goog.dom textarea)
	 (js-obj "lineNumbers" true
		 "lineWrapping" true
		 "autofocus" true
		 "onCursorActivity" on-cursor-activity)))
  (set! hl-line (set-line-class 0 "activeline")))
