(ns gsim.machine
  (:use [gsim.draw :only [clear drop-obj]])
  (:require [gsim.parse :as p]
	    [gsim.gcode :as g]))

(def b1 "N100 G1 X1.0 Z1.0 F0.0123")
(def b2
  "N1 G0 x6.0 z5.0
   N2 G1 x6.2 z5.0 f0.012
   N3 G2 x7.0 z6.0 r1.0")

(def machines (atom nil))

(def default-modals
  {:g { :1 0 :2 17 :3 90 :5 93 :6 20 :7 40 :8 43 :10 98 :12 54 :13 61 }
   :m { :4 0 :6 6 :7 3 :8 7 :9 48 }})

(defn modal-words [machine]
  (let [modals (:modals machine)
	modal-types (keys modals)]
    ;; just try returning keywords instead of strings
    (mapcat (fn [t] (map #(keyword (str (name t) %)) (vals (t modals)))) modal-types)))
;;    (mapcat (fn [t] (map #(str t %) (vals (t modals)))) modal-types)))

(defn modal-blocks [machine]
  (let [[blocks _]
	;; why are we calling name here? should modal-words return keywords instead
	;; of strings? 
	(p/parse-block (apply str (map name (modal-words machine))))]
    (filter #(-> % :details :fn) (map g/decorate blocks))))

(defn- new-machine [ ]
  {:location {:x 0 :y 0 :z 0}
   :registers { }
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
      (if (not (empty? left-overs))
	(let [modal-words (modal-blocks machine)]
	  (modal-eval machine (concat modal-words left-overs)))
	machine))))

(defn- block-eval [machine block]
  (let [[words comment] block]
    (block-eval-inside machine (map g/decorate words))))

(defn- machine-eval-inside [machine blocks]
  (if (empty? blocks)
    machine
    (recur (block-eval machine (first blocks)) (rest blocks))))

(defn line-eval
  ([gcode-str] (line-eval (new-machine) gcode-str))
  ([machine gcode-str]
     (block-eval machine (p/parse-block gcode-str))))

(defn current-machine []
  (peek @machines))

(defn drop-machine []
  (swap! machines pop))

(defn add-machine [m]
  (swap! machines conj m))

(defn startup-machine []
  (if (empty? @machines)
    (add-machine (new-machine))))

(defn machine-eval [gcode-str]
  (startup-machine)
  (let [blocks (p/parse gcode-str)]
    (add-machine (machine-eval-inside (current-machine) blocks))))

;; terribly broken. 
(defn step-back
  ([] (step-back 1))
  ([steps]
     (doseq [_ (range 0 steps)]
       (drop-machine)
       (drop-obj 2))))