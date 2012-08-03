(ns gsim.gcode
  (:use [gsim.draw :only [line drop-one sphere]]
	[gsim.console :only [message]]))
;;   (:use-macros [gsim.gcode :only [def-gcode]]))

(defn- modal-value [machine modal-type modal-group]
  (-> machine :modals modal-type modal-group))

(defn- update-modal [machine modal-type modal-group value]
  (let [current (-> machine :modals modal-type)]
    (assoc machine :modals
	   (merge (:modals machine)
		  {modal-type (assoc current modal-group value)}))))

(defn- location [machine]
  (:location machine))

(defn- update-location [machine location-map]
  (assoc machine :location
	 (merge (location machine)
		location-map)))

(def codes (atom {}))

(defn- add-code! [ code-name modal precedence doc args f]
  (swap! codes assoc (keyword code-name)
         {:modal modal :doc doc :precedence precedence :args args :fn f}))

(defn- args-used [code]
  (-> @codes code :args))

(defn- has-fn? [code]
  (-> @codes code))

(defn decorate [word]
  (let [code (:word word)]
    (if (has-fn? code)
      (assoc word :details (-> @codes code))
      word)))

(defn sort-block [block]
  (reverse (sort-by #(-> % :details :precedence) block)))

(defn- location-str [m]
  (format "%s,%s,%s" (:x m) (:y m) (:z m)))

(defn- merge-locations [& locs]
  (apply merge-with #(or %2 %1) locs))

;; this should only take ONE new coord at a time
(defn- g0-inside [m args]
  (let [next-location (merge (location m) args)]
    (if (not (empty? args))
      (do (line (location m) next-location "color" 0xff0000)
	  (update-location m next-location))
      m)))

;; looks at x,y,z
(defn- g0
  [m args e]
  (if (not (empty? args))
    (do
      (drop-one) ;; drop the last current location ball
      (let [new-m (-> m
		      (g0-inside (select-keys args [:x]))
		      (g0-inside (select-keys args [:y]))
		      (g0-inside (select-keys args [:z]))	
		      (update-modal :g :1 0))]
	(message (format "Rapid to: %s" (location-str (merge-locations (location m) args))))
	(sphere (:location new-m))
	new-m))
      m))
(add-code! :g0 1 20.0 "Rapid positioning" [:x :y :z] g0)

(defn- g1
  [m {:keys [f x y z]} e]
  (message (str "G1" x y z f))
  (line x y z)
  (update-modal m :g :1 1))
(add-code! :g1 1 20.1 "Linear interpolation" [:f :x :y :z] g1)

(defn g2
  [m {:keys [ f x y z r ]} e]
  (message (str "G2" x y z f r))
  (update-modal m :g :1 2))
(add-code! :g2 1 20.2 "Circular interpolation, clockwise" [:f :x :y :z :r] g2)

(defn g3
  [m {:keys  [ f x y z r ]} e]
  (message (str "G3" x y z f r))
  (update-modal m :g :1 3))
(add-code! :g3 1 20.2 "Circular interpolation, clockwise" [:f :x :y :z :r] g3)

;; (def-gcode g0 1 20.0
;;  "Rapid positioning"
;; [ a b c x y z ]
;; m)

;; (def-gcode g1 1 20.1
;;   "Linear interpolation"
;;   [ f x y z ]
;;   m)

;; (def-gcode g2 1 20.2
;;   "Circular interpolation, clockwise"
;;   [ f x y z r ]
;;   m)

;; (def-gcode g3 1 20.3
;;   "Circular interpolation, counterclockwise"
;;   [ f x y z r ]
;;   m)

;; (def-gcode g4 0 10.0
;;   "Pause"
;;   [ p ]
;;   (Thread/sleep (* 1000 p))
;;   (throw (Exception. "G4 requires a value for P"))
;;   m)
