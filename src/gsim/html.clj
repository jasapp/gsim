(ns gsim.html
  (:use [hiccup [page-helpers]]
		[gsim [simple]])
  (:require [clojure.contrib.string :as str]))

(defn split-gcode [ gcode-str ]
  "Take a gcode string and split it up by lines."
  (str/split #"\n" gcode-str))

(defn gcode-line [ line number ]
  [:table
   [:tbody
	[:tr 
	 [:td {:class "number"} [:code number]]
	 [:td {:class "content"} [:code {:class "plain"} line]]]]])

(defn line-class [ line-number ]
  ({0 "line alt1" 1 "line alt2"} (mod line-number 2)))
		
(defn gcode-table [ gcode-str ]
  "Take the string representation of a gcode file and
   turn it into a pretty html table."
  (let [lines (split-gcode gcode-str)]
	[:div {:id "highlighter_427008" :class "syntaxhighlighter"}
	 [:div {:class "lines"}
	  (map (fn [line number]
			 [:div {:class (line-class number) :code "gcode" :number number}
			  (gcode-line line number)])
		   lines
		   (range 1 (+ 1 (count lines))))]]))

(defn sample-table []
  (gcode-table example1))
