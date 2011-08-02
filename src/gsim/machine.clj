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
  (-> machine :modals modal-type group))

(defn update-modal [ word machine ]
  (let [{new-type :type new-group :group} (modal-group word)]
    (->> (:arg word)
	 (assoc (new-type (:modals machine)) new-group)
	 (assoc (:modals machine) new-type)
	 (assoc machine :modals))))

(defn word-eval [ word machine args ]
  "Take our representation of a block and turn it into
   a keyword map that our functions in gcode use."
  (let [keyword-args (zipmap (map :key args) (map :arg args))
	new-machine ((:fn word) machine keyword-args (:explicit word)) ]
    (update-modal word new-machine)))

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

(defn machine-modal-block [ machine ]
  (let [f (fn [k]
	    (map (fn [x] (str (name k) x))
		 (vals (k (:modals machine)))))]
    (map (fn [w] (parse-word w false)) (concat (f :g) (f :m)))))

(defn machine-eval-inside [ machine block ]
  (let [sorted-block (sort-block block)
	next-code (first sorted-block)
	args (split-args next-code (rest sorted-block)) ]
    (if (:fn next-code)
      (let [ new-machine (word-eval next-code machine (:used args)) ]
	(recur new-machine (:not-used args)))
      {:machine machine :remaining-args (:not-used args)})))

(defn machine-eval [ machine block ]
  (let [ { after-explicit :machine args :remaining-args }
	 (machine-eval-inside machine block)
	 { after-implicit :machine leftovers :remaining-args}
	 (machine-eval-inside after-explicit
			      (concat args (machine-modal-block after-explicit)))]
    after-implicit))

(defn run-machine [ machine blocks ]
  (if (not (empty? blocks))
    (recur (machine-eval machine (first blocks)) (rest blocks))
    machine))

(defn run-file [ file ]
  (run-machine (new-machine) (parse-file file)))