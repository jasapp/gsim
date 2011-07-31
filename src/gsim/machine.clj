(ns gsim.machine
  (:use [gsim.parser :only [parse-word parse-file modal-group explicit? ]])
  (:require [gsim.gcode :as gcode]
	    [clojure.contrib.string :as str]))

(defn default-modals [ ]
  {:g { :1 0 :2 17 :3 90 :5 93 :6 20 :7 40 :8 43 :10 98 :12 54 :13 61 }
   :m { :4 0 :6 6 :7 3 :8 7 :9 48 }})

(defn new-machine [ ]
  {:config { }
   :verbose true
   :registers { }
   :modals (default-modals)})

(defn modal [ modal-type group machine ]
  (group (modal-type (:modals machine))))

(defn update-modal [ word machine ]
  (let [{new-type :type new-group :group} (modal-group word)]
    (assoc machine :modals
	   (assoc (:modals machine) new-type
		  (assoc (new-type (:modals machine)) new-group (:arg word))))))

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

(defn update-machine-modals [ word machine ]
  (let [modal-group (get-modal-group word)
		modal-key (:key word) ]
	(cond (= (:key word) :g)
		  (assoc machine :g-modals (assoc (:g-modals machine) modal-group (:code word)))
		  (= (:key word) :m)
		  (assoc machine :m-modals (assoc (:m-modals machine) modal-group (:code word)))
		  true
		  (assoc machine :other-modals (assoc (:other-modals machine) modal-group (:code word))))))

(defn word-eval [ word machine args ]
  "Take our representation of a block and turn it into
   a keyword map that our functions in gcode use."
  (let [keyword-args (zipmap (map :key args) (map :arg args))
	new-machine ((:fn word) machine keyword-args) ]
    (update-machine-modals new-machine word)))

(defn sort-block [ block ]
  "Order the block by precedence. The next code to be executed will be first."
  (sort-by (fn [b] (:precedence b)) block))

(defn split-args [ code remaining-block ]
  "Take a code, and the rest of the arguments and split them
   based on which arguments that particular code uses."
  (let [args (set (map keyword (:fn-args code)))
	used (fn [x] (contains? args (:key x)))]
	{:used (filter used remaining-block)
	 :not-used (remove used remaining-block)}))

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