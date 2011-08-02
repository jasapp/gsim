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

(defn code-var [ #^String word ]
  "Find the symbol over in gsim.gcode for word-str."
  (or (find-var (symbol "gsim.gcode" (str/lower-case word)))
      (find-var (symbol "gsim.gcode" (str/upper-case word)))))

(defn parse-gcode-number [ #^String number ]
  "Read the number off the back of a word. Turns it into an integer."
  (try
    (read-string number)
    (catch Exception _
      (read-string (str "10r" number))))) ;; specify base 10

(defn add-key [ word #^String word-string ]
  (assoc word
    :key (keyword (str/lower-case (re-find #"^[A-Za-z]" word-string)))))

(defn add-arg [ word #^String word-string ]
  (assoc word
    :arg (parse-gcode-number (str/tail (dec (. word-string length)) word-string))))

(defn modal-group [ word ]
  "Takes a *parsed* word and builds the map describing the word's mode."
  (if (:fn word)
    {:type (:key word)
     :group (-> word :fn meta :modal str keyword)}))

(defn add-cleaned-word [ word ]
  (assoc word :word (str (name (:key word)) (:arg word))))

(defn add-code [ word ]
  (assoc word :code (read-string (str (:key word) (:arg word)))))

(defn add-block-fn [ word ]
  "Add a function to this word if one exists."
  (if (code-var (:word word))
    (->> word :word code-var (assoc word :fn))
    word))

(defn add-modal-group [ word ]
  "Add the modal group."
  (if (modal-group word)
    (assoc word :modal (modal-group word))
    word))

(defn add-precedence [ word ]
  "Add precedence." 
  (if (:fn word)
    (->> word :fn meta :precedence (assoc word :precedence))
    (assoc word :precedence 10000.0)))

(defn add-explicit [ word explicit ]
  "Mark a word as explicit."
  (assoc word :explicit explicit))

(defn add-fn-args [ word ]
  "Return the arguments that a word can possibly accept."
  (if (:fn word)
    (->> word :fn meta :arglists first (filter :keys) first :keys (assoc word :fn-args))
    word))

(defn explicit? [ word ]
  "Check to see if a word is marked as explicit."
  (:explicit word))

(defn parse-word
  "Take a word string and turn it into a word."
  ([ #^String word-string ] (parse-word word-string true))
  ([ #^String word-string explicit ]
     (if (valid-word? word-string)
       (-> { }
	   (add-key word-string)
	   (add-arg word-string)
	   add-cleaned-word
	   add-code
	   add-block-fn
	   add-modal-group
	   add-precedence
	   add-fn-args
	   (add-explicit explicit)))))

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
 