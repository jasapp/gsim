(ns gsim.machine.machine
  (:use [gsim.machine.draw :only [clear drop-line redraw-location]])
  (:require [gsim.machine.parse :as p]
	    [gsim.machine.gcode :as g]))

(def default-modals
  {:g { :1 0 :2 17 :3 90 :5 93 :6 20 :7 40 :8 43 :10 98 :12 54 :13 61 }
   :m { :4 0 :6 6 :7 3 :8 7 :9 48 }})

(defn modal-words [machine]
  (let [modals (:modals machine)
	modal-types (keys modals)]
    (mapcat (fn [t] (map #(keyword (str (name t) %)) (vals (t modals)))) modal-types)))

(defn modal-blocks [machine]
  (let [[blocks _]
	(p/parse-block (apply str (map name (modal-words machine))))]
    (filter #(-> % :details :fn) (map g/decorate blocks))))

(defn new-machine [ ]
  {:location {:x 0 :y 0 :z 0}
   :registers { }
   :modals default-modals
   :previous-machine nil
   })

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

;; the explicit arg is used to distinguish between words being evaluated
;; from strings we've parsed, or modal words in the machine already
(defn- word-eval 
  ([machine word args]
     (word-eval machine word args false))
  ([machine word args explicit]
     ((-> word :details :fn) machine (keyword-map args) explicit)))

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
      (recur (word-eval machine (first next-words) (rest next-words) true) left-overs)
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

(defn previous-machine [m]
  (:previous-machine m))

(defn add-machine [new old]
  (assoc new :previous-machine old))

(defn machine-eval [m & gcode-lines]
  (reduce (fn [n gcode-line] 
            (let [blocks (p/parse gcode-line)]
              (assoc (machine-eval-inside n blocks)
                :previous-machine n))) 
          m gcode-lines))

;; Uck. Not digging this :location reference. This needs to be cleaned up soon. 
(defn step-back
  ([m] (step-back m 1))
  ([m steps]
     (let [new-old-machine (reduce :previous-machine m (range 0 steps))]
       (drop-line steps)
       (redraw-location (:location new-old-machine))
       new-old-machine)))
