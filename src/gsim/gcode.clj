(ns gsim.gcode)

(def modals
  {1 "motion"
   2 "plane selection"
   3 "distance mode"
   4 "stopping"
   5 "feed rate mode"
   6 "units"
   7 "cutter radius compensation"
   8 "tool length offset"
   10 "return mode in canned cycles"
   12 "coordinate system selection"
   13 "path control mode" })

(defn gcode-execution-string [ code args ]
  "Print a pretty looking string"
  (.toUpperCase (name code)))

;; (def-code name modal args doc-string function)

;; (def-code g00 1
;;   "Rapid positioning"
;;   [ ]
;;   ;; draw a line here
;;   nil)

;; wrap functions like this?
;; ((let [x 1 ] (fn [] x)))

;; what about getting parameters from the line and pushing the values into a map, and then
;; binding the map to values some how?
;; (defn foo [bar {:keys [baz quux]}] 
;;   (list bar baz quux))

;; (foo 1 {:quux 3 :baz 2}) ; => (1 2 3)

(defn
  ^{:doc "Rapid positioning"
	:modal 1
	:precedence 20.0
	}
  g0 [ m { :keys [ a b c x y z ] } explicit ]
  (if (and explicit (or a b c x y z))
    (println "Rapid positioning:" a b c x y z))
  m)

(defn
  ^{:doc "Linear interpolation"
	:modal 1
	:precedence 20.1}
  g1 [ m { :keys [ f x y z ] } explicit ]
  (if (and (:verbose m) (or f x y z))
	(println "Linear interpolation:" f x y z))
  m)

(defn
  ^{:doc "Circular interpolation, clockwise"
	:modal 1
	:precedence 20.2}
  g2 [ m { :keys [ ] } explicit]
  (print "Circular interpolation\n")
  m)

(defn
  ^{:doc "Circular interpolation, counterclockwise"
	:modal 1
	:precedence 20.3}
  g3 [ m { } explicit ]
  m)

(defn
  ^{:doc "Pause"
	:precedence 10.0 }
  g4 [ m { :keys [p] } explicit ]
  (if p
	(Thread/sleep (* 1000 p))
	(throw (Exception. "G4 requires a value for P")))
  m)

(defn
  ^{:doc "Coordinate system origin setting"
	:precedence 19.3}
  g10 [ m { l :l p :p x :x y :y z :z } explicit ]
  m)

(defn
  ^{:doc "XY-plane selection"
	:precedence 11.1
	:modal 2}
  g17
  [ m { } explicit ]
  m)

(defn
  ^{:doc "XZ-plane selection"
    :precedence 11.2
    :modal 2 }
  g18
  [ m { } explicit ] m)

(defn
  ^{:doc "YZ-plane selection"
    :precedence 11.3
    :modal 2 }
  g19
  [ m { } explicit ] m )

(defn
  ^{:doc "Inch system selection"
	:precedence 12.1
	:modal 6 }
  g20 [ m { } explicit ]
  ;; is there an easy way to do this from inside the function?
  (if (not (= (:g6-modal (:g-modals m)) :g20))
    (println "Switching to the inch selection system."))
  m
   )

(defn
  ^{:doc "Cutter radius compensation off"
    :precedence 13.1
    :modal 7 }
  g40 [ m { } explicit ]
  m)

(defn
  ^{:doc "Cutter length compensation on"
	:precedence 14.1
	:modal 8 }
  g43 [ m { :keys [ h ] } explicit ]
  m)

(defn
  ^{:doc "Select coordinate system 1"
	:precedence 15.1
	:modal 12 }
  g54 [ m { } explicit ]
  m)

(defn
  ^{:doc "Setting exact path mode"
	:precedence 99
	:modal 13 }
  g61 [ m { } explicit ]
  m)

(defn
  ^{:doc "Cancel modal motion"
	:precedence 20.5
	:modal 1}
  g80 [ m { } explicit ]
  m)

(defn
  ^{:doc "Drilling cycle"
	:precedence 20.7
	:modal 1 }
  g82 [ m { :keys [ x y r z ] } explicit ]
  (if (and (:verbose m) (or x y r z))
    (println "Drilling cycle:" x y r z))
  m)

(defn
  ^{:doc "Set absolute distance mode"
    :precedence 17.1
    :modal 3 }
  g90 [ m { } explicit ]
  m)

(defn
  ^{:doc "Start inverse time mode"
	:precedence 2.1
	:modal 5 }
  g93 [ m { } explicit ]
  m)

(defn
  ^{:doc "Start units per minute mode"
	:precedence 2.2
	:modal 5 }
  g94 [ m { } explicit ]
  m)

(defn
  ^{:doc "Set canned cycle return level"
	:precedence 18.1
	:modal 10 }
  g98 [ m { } explicit ]
  m)

(defn
  ^{:doc "Set canned cycle return level"
	:precedence 18.2
	:modal 10 }
  g99 [ m { } explicit ]
  m)

(defn
  ^{:doc "Select tool"
	:precedence 5 }
  t1 [ m { } explicit ]
  (if (not (:t-modal (:other-modals m)))
    (println "Select tool: 1"))
  m)

(defn
  ^{:doc "Program stop"
	:precedence 21.0
	:modal 4 }
  m0 [ m { } explicit ]
  m )

(defn
  ^{:doc ""
	:precedence 100
	:modal 7 }
  m3 [ m { } explicit ]
  m)

(defn
  ^{:doc "Tool change"
	:precedence 6.0
	:modal 6 }
  m6 [ m { :keys [ ] } explicit ]
  m)

(defn
  ^{:doc "Coolant ..."
	:precedence 8.1
	:modal 8 }
  m7 [ m { } explicit ]
  m)

(defn
  ^{:doc "Coolant..."
	:precedence 100
	:modal 8 }
  m8 [ m { } explicit ]
  m)

(defn
  ^{:doc ""
	:precedence 9.1
	:modal 9 }
  m48 [ m { } explicit ]
  m)

(defn
  ^{:doc ""
	:precedence 9.2
	:modal 9 }
  m49 [ m { } explicit ]
  m)

