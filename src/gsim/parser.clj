(ns gsim.parser
  (:require [clojure.contrib.string :as str]))

(defn tokenize-block [ block ]
  "Take a block as a string, and split it up by spaces into words."
  (remove empty? (str/split #"\s" block)))

(defn valid-word? [ word ]
  "Return true if word as a string is valid."
  (and (< 1 (. word length))
	   (not (str/blank? word)) ;; all blanks should be removed by now
	   (re-find #"^[A-Za-z]" word) ;; all words should start with a character (?)
	   (not (str/substring? " " word))))





  