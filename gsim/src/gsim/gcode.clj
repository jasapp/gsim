(ns gsim.gcode)

(def codes
  {:g03 { :doc "Circular interpolation, counterclockwise" }
   :g04 { :doc "Dwell" }
   :g05 { :doc "High-precision contour control" }
   :g07 { :doc "Imaginary axis designation" }
   :g09 { :doc "Exact stop check" }
   :g10 { :doc "Programmable data input" }
   :g11 { :doc "Data write cancel" }
   :g12 { :doc "Full-circle interpolation, clockwise" }
   :g13 { :doc "Full-circle interpolation, counterclockwise" }
   :g17 { :doc "XY plane selection" }
   :g18 { :doc "ZX plane selection" }})

(defn gcode-execution-string [ code args ]
  "Print a pretty looking string"
  (.toUpperCase (name code)))

(defn
  ^{:doc "Rapid positioning" }
  g00 [ {x :x y :y z :z} ])

(defn
  ^{:doc "Linear interpolation" }
  g01 [ {f :f x :x y :y z :z} ])

(defn
  ^{:doc "Circular interpolation, clockwise" }
  g02 [ ])

(defn
  ^{:doc "Pause" }
  g04 [ seconds ]
  (Thread/sleep (* 1000 seconds)))
