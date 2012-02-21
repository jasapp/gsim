(ns gsim.sample.machine
  (:require [gsim.sample.parse :as p]
	    [gsim.sample.gcode :as g]))

(def b1 "N100 G1 X1.0 Z1.0 F0.0123")

(def default-modals
  {:g { :1 0 :2 17 :3 90 :5 93 :6 20 :7 40 :8 43 :10 98 :12 54 :13 61 }
   :m { :4 0 :6 6 :7 3 :8 7 :9 48 }})

(defn modal-words [machine]
  (let [modals (:modals machine)
	modal-types (keys modals)]
    (mapcat (fn [t] (map #(str t %) (vals (t modals)))) modal-types)))

(defn modal-blocks [machine]
  (let [[blocks _]
	(p/parse-block (apply str (map name (modal-words machine))))]
    (filter #(-> % :details :fn) (map g/decorate blocks))))

(defn- new-machine [ ]
  {:registers { }
   :modals default-modals})

(defn- next-word [block]
  (let [sorted-block (g/sort-block block)
	word (first sorted-block)
	remaining (rest sorted-block)]
    (if (-> word :details :fn)
      [word remaining]
      [nil sorted-block])))

(defn- consume-arg-fn [word]
  (fn [x] (contains? (set (-> word :details :args)) (:address x))))

(defn- split-args [word args]
  (let [consume? (consume-arg-fn word)]
    [(filter consume? args)
     (remove consume? args)]))
  
(defn- split-block [block]
  (let [[word remaining] (next-word block)
	[used-args unused-args] (split-args word remaining)]
    (if word
      [(concat [word] used-args) unused-args]
      [nil unused-args])))

(defn keyword-map [args]
  (zipmap
   (map :address args)
   (map #(or (:arg %) (:imperial-arg %) (:metric-arg %)) args)))

(defn- word-eval [machine word args]
  ((-> word :details :fn) machine (keyword-map args) nil))

(defn modal-eval [machine args]
  (if (empty? args)
    machine
    (let [[next-words left-overs] (split-block args)]
      (if (not (empty? next-words))
	(recur (word-eval machine (first next-words) (rest next-words)) left-overs)
	machine))))

(defn- block-eval-inside [machine block]
  (let [[next-words left-overs] (split-block block)]
    (if (not (empty? next-words))
      (recur (word-eval machine (first next-words) (rest next-words)) left-overs)
      (let [modal-words (modal-blocks machine)]
	(modal-eval machine (concat modal-words left-overs))))))

(defn- block-eval [machine block]
  (let [[words comment] (p/parse-block block)]
    (block-eval-inside machine (map g/decorate words))))

(defn- machine-eval-inside [machine blocks]
  (if (empty? blocks)
    machine
    (recur (block-eval machine (first blocks)) (rest blocks))))

(defn machine-eval
  ([gcode-str] (machine-eval (new-machine) gcode-str))
  ([machine gcode-str]
     (let [blocks (p/parse gcode-str)]
       (machine-eval-inside machine blocks))))