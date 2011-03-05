(ns gsim.machine
  (:use [ring.handler.dump])
  (:require [gsim.gcode :as gcode])
  (:require [clojure.contrib.string :as str]))

(defn new-machine []
  {:config {}
   :code "FOO BAR BAZ"})

(def *machine* (new-machine))

(defn tokenize-block [ block ]
  (remove empty? (str/split #"\s" block)))

(defn valid-word? [ word ]
  (and (< 1 (. word length))
	   (not (str/blank? word)) ;; all blanks should be remove by now
	   (re-find #"^[A-Za-z]" word) ;; all words should start with a character (?)
	   (not (str/substring? " " word))))

(defn parse-word [ word ]
  (if (valid-word? word)
	(let [key (keyword (str/upper-case (re-find #"^[A-Za-z]" word)))
		  arg (read-string (str/tail (dec (. word length)) word)) ]
	  {:code (str key arg)
	   :key key
	   :arg arg })))

(defn parse-block [ block ]
  (map parse-word (tokenize-block block)))

(defn machine-state [ code ]
  "FOO BAR BAZ")

(defn machine-eval [ code ]
  (print-str (handle-dump code)))

