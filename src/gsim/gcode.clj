(ns gsim.gcode)

(def codes
  {:g0 { :modal 1 }
   :g1 { :modal 1 }
   :g2 { :modal 1 }
   :g3 { :modal 1 :doc "Circular interpolation, counterclockwise" }
   :g4 { :doc "Dwell" }
   :g5 { :doc "High-precision contour control" }
   :g7 { :doc "Imaginary axis designation" }
   :g9 { :doc "Exact stop check" }
   :g10 { :doc " " }
   :g11 { :doc "Data write cancel" }
   :g12 { :doc "Full-circle interpolation, clockwise" }
   :g13 { :doc "Full-circle interpolation, counterclockwise" }
   :g17 { :modal 2 :doc "XY plane selection" }
   :g18 { :modal 2 :doc "ZX plane selection" }
   :g19 { :modal 2 :doc "YZ plane selection" }
   :g20 { :modal 6 }
   :g21 { :modal 6 }
   :g38.2 { :modal 1 :doc "Straight probe" }
   :g40 { :modal 7 }
   :g41 { :modal 7 }
   :g42 { :modal 7 }
   :g43 { :modal 8 }
   :g49 { :modal 8 }
   :g54 { :modal 12 }
   :g55 { :modal 12 }
   :g56 { :modal 12 }
   :g57 { :modal 12 }
   :g58 { :modal 12 }
   :g59 { :modal 12 }
   :g59.1 { :modal 12 }
   :g59.2 { :modal 12 }
   :g59.3 { :modal 12 }
   :g61 { :modal 13 }
   :g61.1 { :modal 13 }
   :g64 { :modal 13 }   
   :g80 { :modal 1 }
   :g81 { :modal 1 }
   :g82 { :modal 1 }
   :g83 { :modal 1 }
   :g84 { :modal 1 }
   :g85 { :modal 1 }
   :g86 { :modal 1 }
   :g87 { :modal 1 }
   :g88 { :modal 1 }
   :g89 { :modal 1 }
   :g90 { :modal 3 }
   :g91 { :modal 3 }
   :g93 { :modal 5 }
   :g94 { :modal 5 }
   :g98 { :modal 10 }
   :g99 { :modal 10 }   
   })

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
  g0 [ { :keys [ a b c x y z ] } ]
  (print "Moving around really fast\n")
  nil)

;; a line like this could turn into something like
;; G00 X1 Y1 Z1.0
;; 
;; (g00 { :x 1 :y 1 :z 1.0 })
;;
;; but how do we know that it shouldn't be:
;; (x1 { :g 0 :y 1 :z 1.0 } )?

(defn
  ^{:doc "Linear interpolation"
	:modal 1
	:precedence 20.1}
  g1 [ {f :f x :x y :y z :z} ])

(defn
  ^{:doc "Circular interpolation, clockwise"
	:modal 1
	:precedence 20.2}
  g2 [ { :keys [ ] } ]
	   (print "Circular interpolation\n")
	   )

(defn
  ^{:doc "Circular interpolation, counterclockwise"
	:modal 1
	:precedence 20.3}
  g3 [ ])

(defn
  ^{:doc "Pause"
	:precedence 10.0 }
  g4 [ { :keys [p] } ]
  (print "Pause\n")
  (Thread/sleep (* 1000 p)))

(defn
  ^{:doc "Coordinate system origin setting"
	:precedence 19.3}
  g10 [ { l :l p :p x :x y :y z :z } ]
  )

(defn
  ^{:doc "XY-plane selection"
	:precedence 11.1
	:modal 2}
  g17
  [ ])

(defn
  ^{:doc "XZ-plane selection"
	:precedence 11.2
	:modal 2}
  g18
  [ ])

(defn
  ^{:doc "YZ-plane selection"
	:precedence 11.3
	:modal 2}
  g19
  [ ])
