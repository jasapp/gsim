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

(defmacro def-gcode [ name modal precedence doc args & body ]
  `(defn 
     ^{ :doc ~doc :modal ~modal :precedence ~precedence }
     ~name [ ~'m { :keys ~args } ~'e ]
     (if (and ~'e (:verbose ~'m))
       (if (not (= "" ~doc)) (println ~doc) (println ~name)))
     ~@body))

(def-gcode g0 1 20.0
  "Rapid positioning" 
  [ a b c x y z ]
  m)

(def-gcode g1 1 20.1 
  "Linear interpolation" 
  [ f x y z ]
  m)

(def-gcode g2 1 20.2
  "Circular interpolation, clockwise" 
  [ ] m)

(def-gcode g3 1 20.3
  "Circular interpolation, counterclockwise"
  [ ] m)

(def-gcode g4 0 10.0
  "Pause"
  [ p ]
  (Thread/sleep (* 1000 p))
  (throw (Exception. "G4 requires a value for P"))
  m)

(def-gcode g10 0 19.3
  "Coordinate system origin setting"
  [ l p x y z ]
  m)

(def-gcode g17 2 11.1
  "XY-plane selection"
  [ ] m)

(def-gcode g18 2 11.2
  "XZ-plane selection"
  [ ] m)

(def-gcode g19 2 11.3
  "YZ-plane selection"
  [ ] m)

(def-gcode g20 6 12.1
  "Inch system selection"
  [ ] m)

(def-gcode g40 7 13.1
  "Cutter radius compensation off"
  [ ] m)

(def-gcode g43 8 14.1
  "Cutter length compensation on"
  [ h ] m)

(def-gcode g54 12 15.1
  "Select coordinate system 1"
  [ ] m)

(def-gcode g61 13 99
  "Setting exact path mode"
  [ ] m)

(def-gcode g80 1 20.5
  "Cancel modal motion"
  [ ] m)

(def-gcode g82 1 20.7
  "Drilling cycle"
  [ x y z r ] 
  m)

(def-gcode g90 3 17.1
  "Set absolute distance mode"
  [ ] m)

(def-gcode g93 5 2.1
  "Start inverse time mode"
  [ ] m)

(def-gcode g94 5 2.2
  "Start units per minute mode"
  [ ] m)

(def-gcode g98 10 18.1
  "Set canned cycle return level"
  [ ] m)

(def-gcode g99 10 18.2
  "Set canned cycle return level"
  [ ] m)

(def-gcode t1 0 5
  "Select tool"
  [ ] m)

(def-gcode m0 4 21.0
  "Program stop"
  [ ] m)

(def-gcode m3 0 7
  "Starting spindle clockwise"
  [ ] m)

(def-gcode m4 0 7.1
  "Starting spindle couter-clockwise"
  [ ] m)

(def-gcode m5 0 7.2
  "Stopping spindle"
  [ ] m)

(def-gcode m6 6 6.0
  "Tool change"
  [ ] m)

(def-gcode m7 8 8.1
  "Coolant..."
  [ ] m)

(def-gcode m8 8 100
  "Coolant..."
  [ ] m)

(def-gcode m48 9 9.1
  ""
  [ ] m)

(def-gcode m49 9 9.2
  ""
  [ ] m)
