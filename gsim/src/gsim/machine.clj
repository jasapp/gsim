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
	(let [key (keyword (str/lower-case (re-find #"^[A-Za-z]" word)))
		  arg (read-string (str/tail (dec (. word length)) word)) ]
	  {:word word
	   :code (str key arg)
	   :key key
	   :arg arg })))

(defn code-name [ code ]
  (:word code))

(defn get-code-var [ word ]
  (find-var (symbol "gsim.gcode" (:word word))))

(defn get-precedence [ word ]
  (:precedence (meta (get-code-var word))))

(defn get-args [ word ]
  (:keys
   (first
	(first
	 (:arglists (meta (get-code-var word)))))))

(defn word-eval [ word args ]
  ((get-code-var word) args))

(defn sort-block [ block ]
  "Order the block by precedence. The next code to be executed will be first."
  (let [sort-fn (fn [x]
				  (if (get-precedence x)
					(get-precedence x)
					100000))]
	(sort-by sort-fn block)))


(defn split-args [ code remaining-block ]
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
	(if (get-code-var next-code)
	  (do (word-eval next-code (:used args))
		  (if (< 0 (count (:not-used args)))
			(recur machine (:not-used args))
			machine))
	  machine)))
