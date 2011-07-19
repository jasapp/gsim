(ns gsim.machine
  (:use [gsim.parser :only [parse-word parse-file]])
  (:require [gsim.gcode :as gcode]
			[clojure.contrib.string :as str]))

(defn new-machine []
  {:config {}
   :verbose true
   :g-modals {:g1-modal :g0 :g2-modal :g17 :g3-modal :g90 :g5-modal :g93 :g6-modal :g20 :g7-modal
			  :g40 :g8-modal :g43 :g10-modal :g98 :g12-modal :g54 :g13-modal :g61 }
   :m-modals {:m4-modal :m0 :m6-modal :m6 :m7-modal :m3 :m8-modal :m7 :m9-modal :m48 }})

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

(defn get-machine-modals [ machine ]
  (let [ b (fn [x] (parse-word (. (str/as-str x) toUpperCase) false)) ]
	(get-modal-map
	 (map b (concat (vals (:g-modals machine))
					(vals (:m-modals machine)))))))

(defn make-implicit [ word ]
  (assoc (dissoc word :explicit) :explicit false))

(defn get-precedence [ word ]
  (if (:fn word)
	(:precedence (meta (:fn word)))
	1000))

(defn get-args [ word ]
  (:keys (first (filter :keys (first (:arglists (meta (:fn word))))))))

(defn update-machine-modals [ machine word ]
  (let [modal-group (get-modal-group word)
		modal-key (:key word) ]
	(cond (= (:key word) :g)
		  (assoc machine :g-modals (assoc (:g-modals machine) modal-group (:code word)))
		  (= (:key word) :m)
		  (assoc machine :m-modals (assoc (:m-modals machine) modal-group (:code word)))
		  true
		  (assoc machine :other-modals (assoc (:other-modals machine) modal-group (:code word))))))

(defn word-eval [ machine word args ]
  "Take our representation of a block and turn it into
   a keyword map that our functions in gcode use."
  (let [keyword-args (zipmap (map :key args) (map :arg args))
		new-machine ((:fn word) machine keyword-args) ]
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

(defn mark-not-explicit [ parsed-word ]
  (assoc parsed-word :explicit false))

(defn explicit? [ parsed-word ]
  (:explicit parsed-word))

(defn merge-block [ machine block ]
  "Take a machine, a block and merge the defaults from the
   machine with the block giving precedence to the block."
  (vals
   ;; and special support for M7 and M8 support here, since they're in
   ;; the same modal group and can both be enabled at the same time
   (merge (get-machine-modals machine)
		  (get-modal-map block))))

(defn machine-eval-inside [ machine block responses ]
  (let [sorted-block (sort-block block)
		next-code (first sorted-block)
		args (split-args next-code (rest sorted-block)) ]
	(if (:fn next-code)
	  (let [{ new-machine :machine message :message code :code}
			(word-eval machine next-code (:used args))]
		(if (< 0 (count (:not-used args)))
		  (recur new-machine (:not-used args)
				 (if (and (explicit? next-code) (or message code))
				   (conj responses {:message message :code code})
				   responses))
		  {:machine new-machine :responses responses}))
	  {:machine machine :responses responses})))

;; should this recurse until the block is gone?
(defn machine-eval [ machine block ]
  (let [sorted-block (sort-block (merge-block machine block))]
	(machine-eval-inside machine sorted-block [])))

(defn run-machine [ machine blocks ]
  (if (not (empty? blocks))
	(recur (machine-eval machine (first blocks)) (rest blocks))
	machine))

(defn run-file [ file ]
  (run-machine (new-machine) (parse-file file)))