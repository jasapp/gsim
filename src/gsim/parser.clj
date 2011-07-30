(ns gsim.parser
  (:require [clojure.contrib.string :as str]))

(defn code-name [ code ]
  (:word code))

(defn tokenize-block [ #^String block ]
  "Take a block as a string, and split it up by spaces into words."
  (remove empty? (str/split #"\s" block)))

(defn valid-word? [ #^String word ]
  "Return true if word as a string is valid."
  (and (< 1 (. word length))
       (not (str/blank? word)) ;; all blanks should be removed by now
       (re-find #"^[A-Za-z]" word) ;; all words should start with a character (?)
       (not (str/substring? " " word))))

(defn get-code-var [ #^String word ]
  "Find the symbol over in gsim.gcode for word-str."
  (or (find-var (symbol "gsim.gcode" (str/lower-case word)))
      (find-var (symbol "gsim.gcode" (str/upper-case word)))))

(defn get-modal-group [ word ]
  "Takes a *parsed* word and builds the map describing the word's mode."
  (if (:fn word)
    {:type (:key word) :modal (:modal (meta (:fn word))) }))

(defn parse-gcode-number [ #^String number ]
  "Read the number off the back of a word. Turns it into an integer."
  (try
    (read-string number)
    (catch Exception _
      (read-string (str "10r" number))))) ;; specify base 10

(defn parse-word
  "Take a word string and turn it into a word."
  ([ #^String word ] (parse-word word true))
  ([ #^String word explicit ]
     (if (valid-word? word)
       (let [key (keyword (str/lower-case (re-find #"^[A-Za-z]" word)))
	     arg (parse-gcode-number (str/tail (dec (. word length)) word)) 
	     cleaned-word (str (name key) arg)
	     without-fn {:word cleaned-word :code (read-string (str key arg)) :key key :arg arg :explicit explicit }]
	 (if (get-code-var cleaned-word)
	   (assoc without-fn :fn (get-code-var cleaned-word))
	   without-fn)))))

(defn parse-block
  "Take a gcode block and map parse-word across it."
  ([ #^String block ] (parse-block block -1))
  ([ #^String block line-number]
     (let [ words (map (fn [w] (parse-word w true)) (tokenize-block block)) ]
       (if (< -1 line-number)
	 (map (fn [w] (assoc w :line-number line-number)) words)
	 words))))

(defn parse-file [ file ]
  "Take a file and map parse-block across it."
  (let [file-str (str/split #"\n" (slurp file))
	line-count (count file-str)]
    (map parse-block file-str (range 1 (+ line-count 1)))))
