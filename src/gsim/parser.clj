(ns gsim.parser
  (:require [clojure.contrib.string :as str]))

(defn code-name [ code ]
  (:word code))

(defn tokenize-block [ block ]
  "Take a block as a string, and split it up by spaces into words."
  (remove empty? (str/split #"\s" block)))

(defn valid-word? [ word ]
  "Return true if word as a string is valid."
  (and (< 1 (. word length))
	   (not (str/blank? word)) ;; all blanks should be removed by now
	   (re-find #"^[A-Za-z]" word) ;; all words should start with a character (?)
	   (not (str/substring? " " word))))

(defn get-code-var [ word-str ]
  "Find the symbol over in gsim.gcode for word-str."
  (or (find-var (symbol "gsim.gcode" (str/lower-case word-str)))
	  (find-var (symbol "gsim.gcode" (str/upper-case word-str)))))

(defn parse-gcode-number [ number-str ]
  "Read the number off the back of a word. Turns it into an integer."
  (try
	(read-string number-str)
	(catch Exception _
	  (read-string (str "10r" number-str))))) ;; specify base 10

(defn parse-word
  ([ word ] (parse-word word true))
  ([ word explicit ]
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
  ([ block-str ] (parse-block block-str -1))
  ([ block-str line-number]
	 (let [ words (map (fn [w] (parse-word w true)) (tokenize-block block-str)) ]
	   (if (< -1 line-number)
		 (map (fn [w] (assoc w :line-number line-number)) words)
		 words))))

(defn parse-file [ file ]
  "Take a file and map parse-block across it."
  (let [file-str (str/split #"\n" (slurp file))
		line-count (count file-str)]
	(map parse-block file-str (take line-count (iterate (fn [x] (+ x 1)) 1)))))
