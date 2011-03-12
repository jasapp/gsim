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

(defn get-code-var [ word-str ]
  (or (find-var (symbol "gsim.gcode" (str/lower-case word-str)))
	  (find-var (symbol "gsim.gcode" (str/upper-case word-str)))))

(defn parse-word [ word ]
  (if (valid-word? word)
	(let [key (keyword (str/lower-case (re-find #"^[A-Za-z]" word)))
		  arg (read-string (str/tail (dec (. word length)) word))
		  without-fn {:word word :code (str key arg) :key key :arg arg }]
	  (if (get-code-var word)
		(assoc without-fn :fn (get-code-var word))
		without-fn))))

(defn code-name [ code ]
  (:word code))

(defn get-precedence [ word ]
  (if (:fn word)
	(:precedence (meta (:fn word)))
	10000000))

(defn get-args [ word ]
  (:keys (first (filter :keys (first (:arglists (meta (:fn word))))))))
   
(defn word-eval [ machine word args ]
  "Take our representation of a block and turn it into
   a keyword map that our functions in gcode use."
  (let [ keyword-args (zipmap (map :key args)
							  (map :arg args))]
	(if (:verbose machine)
	  (println (apply str (interpose " " (cons (:word word) (map :word args))))))
	((:fn word) machine keyword-args)))

(defn sort-block [ block ]
  "Order the block by precedence. The next code to be executed will be first."
  (sort-by get-precedence block))

(defn split-args [ code remaining-block ]
  "Take a code, and the rest of the arguments and split them
   based on which arguments that particular code uses."
  (let [args (set (map keyword (get-args code)))
		used (fn [x] (contains? args (:key x)))]
	{:used (filter used remaining-block)
	 :not-used (remove used remaining-block)}))

(defn parse-block [ block-str ]
  (map parse-word (tokenize-block block-str)))

(defn machine-state [ code ]
  "FOO BAR BAZ")

;; should this recurse until the block is gone?
(defn machine-eval [ machine block ]
  (let [sorted-block (sort-block block)
		next-code (first sorted-block)
		args (split-args next-code (rest sorted-block))]
	(if (:fn next-code)
	  (let [new-machine (word-eval machine next-code (:used args))]
		  (if (< 0 (count (:not-used args)))
			(recur new-machine (:not-used args))
			new-machine))
	  machine)))
