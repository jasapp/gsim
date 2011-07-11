(ns gsim.machine
  (:use [ring.handler.dump])
  (:require [gsim.gcode :as gcode])
  (:require [clojure.contrib.string :as str]))

(defn new-machine []
  {:config {}
   :verbose false
   :g-modals { 1 :g0 2 :g17 3 :g90 5 :g93 6 :g20 7 :g40 8 :g43 10 :g98 12 :g54 13 :g61 }
   :m-modals { 4 :m0 6 :m6 7 :m3 8 :m7 9 :m48 }})

(def *machine* (new-machine))

(defn get-modal-group [ word ]
  (if (:fn word)
	(let [m (meta (:fn word))]
	  (keyword (str/as-str (:key word) (:modal m) "-modal")))))

(defn get-modal-map [ words ]
  (zipmap
   (map (fn [w] (if (:fn w)
				  (get-modal-group w)
				  (keyword (gensym))))
		words)
   words))

(defn tokenize-block [ block ]
  (remove empty? (str/split #"\s" block)))

(defn valid-word? [ word ]
  (and (< 1 (. word length))
	   (not (str/blank? word)) ;; all blanks should be removed by now
	   (re-find #"^[A-Za-z]" word) ;; all words should start with a character (?)
	   (not (str/substring? " " word))))

(defn get-code-var [ word-str ]
  (or (find-var (symbol "gsim.gcode" (str/lower-case word-str)))
	  (find-var (symbol "gsim.gcode" (str/upper-case word-str)))))

(defn parse-gcode-number [ number-str ]
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

(defn get-machine-modals [ machine ]
  (let [ b (fn [x] (parse-word (. (str/as-str x) toUpperCase) false)) ]
	(get-modal-map
	 (map b (concat (vals (:g-modals machine))
					(vals (:m-modals machine)))))))

(defn make-implicit [ word ]
  (assoc (dissoc word :explicit) :explicit false))

(defn code-name [ code ]
  (:word code))

(defn get-precedence [ word ]
  (if (:fn word)
	(:precedence (meta (:fn word)))
	1000))

(defn get-args [ word ]
  (:keys (first (filter :keys (first (:arglists (meta (:fn word))))))))

(defn update-machine-modals [ machine word ]
  (let [modal-group (get-modal-group word)
		modal-key (:key word) ]
	(if (= (:key word) :g)
	  (assoc machine :g-modals (assoc (:g-modals machine) modal-group (:code word)))
	  (assoc machine :m-modals (assoc (:m-modals machine) modal-group (:code word))))))

(defn word-eval [ machine word args ]
  "Take our representation of a block and turn it into
   a keyword map that our functions in gcode use."
  (let [keyword-args (zipmap (map :key args) (map :arg args))
		new-machine ((:fn word) machine keyword-args) ]
	(if (and (:verbose machine)) ;; (:explicit word))
	  (println (apply str (interpose " " (cons (:word word) (map :word args))))))
	(update-machine-modals new-machine word)))

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

(defn parse-block
  "Take a gcode block and map parse-word across it."
  ([ block-str ] (parse-block block-str -1))
  ([ block-str line-number]
	 (let [ words (map parse-word (tokenize-block block-str)) ]
	   (if (< -1 line-number)
		 (map (fn [w] (assoc w :line-number line-number)) words)
		 words))))

(defn parse-file [ file ]
  "Take a file and map parse-block across it."
  (let [file-str (str/split #"\n" (slurp file))
		line-count (count file-str)]
	(map parse-block file-str (take line-count (iterate (fn [x] (+ x 1)) 1)))))

(defn mark-not-explicit [ parsed-word ]
  (assoc parsed-word :explicit false))

(defn merge-block [ machine block ]
  "Take a machine, a block and merge the defaults from the
   machine with the block giving precedence to the block."
  (vals
   (merge (get-machine-modals machine)
		  (get-modal-map block))))

(defn machine-eval-inside [ machine block ]
  (let [sorted-block (sort-block block)
		next-code (first sorted-block)
		args (split-args next-code (rest sorted-block)) ]
	(if (:fn next-code)
	  (let [new-machine (word-eval machine next-code (:used args))]
		(if (< 0 (count (:not-used args)))
		  (recur new-machine (:not-used args))
		  new-machine))
	  machine)))

;; should this recurse until the block is gone?
(defn machine-eval [ machine block ]
  (let [sorted-block (sort-block (merge-block machine block))]
	(machine-eval-inside machine sorted-block)))

(defn run-machine [ machine blocks ]
  (if (not (empty? blocks))
	(recur (machine-eval machine (first blocks)) (rest blocks))
	machine))

(defn run-file [ file ]
  (run-machine (new-machine) (parse-file file)))