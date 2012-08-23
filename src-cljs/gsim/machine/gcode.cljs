(ns gsim.machine.gcode
  (:use [gsim.machine.draw :only [line cw-arc ccw-arc redraw-location]]
	[gsim.console :only [message]])
  (:use-macros [gsim.macros :only [def-code]]))

(defn- modal-value [machine modal-type modal-group]
  (-> machine :modals modal-type modal-group))

(defn- update-modal [machine modal-type modal-group value]
  (let [current (-> machine :modals modal-type)]
    (assoc machine :modals
	   (merge (:modals machine)
		  {modal-type (assoc current modal-group value)}))))

(defn- speed [machine]
  (-> machine :registers :speed))

(defn- tool [machine]
  (-> machine :registers :tool))

(defn- update-speed [machine speed]
  (assoc-in machine [:registers :speed] speed))

(defn- update-tool [machine tool offset]
  (-> machine
      (assoc-in [:registers :tool] tool)
      (assoc-in [:registers :offset] offset)))

(defn location [machine]
  (:location machine))

(defn- update-location [machine location-map]
  (assoc machine :location
	 (merge (location machine)
		location-map)))

(def codes (atom {}))

(defn- add-code! [code-name f args]
  (swap! codes assoc (keyword code-name)
         {:modal 0 :precedence 1.0 :args args :fn f}))

(defn- args-used [code]
  (-> @codes code :args))

(defn- has-fn? [code]
  (-> @codes code)) ;; why is this not returning the value of :fn?

(defn add-message! [code-name f]
  (swap! codes #(assoc-in % [(keyword code-name) :message-fn] f)))

(defn message-fn [code]
  (get-in @codes [code :message-fn] (fn [m args e] nil)))

(defn modal-fn [code]
  (fn [m args e] m))

;;
;; make sure we handle words like G03 AND words with arguments like T1010 and S300
;; 
(defn decorate [word]
  (let [code (:word word)
        address (:address word)]
    (if (has-fn? code)
      (assoc word :details (-> @codes code))
      (if (has-fn? address)
        (assoc word :details {:fn ((-> @codes address :fn) (:arg word))})
        word))))

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
    (let [new-m (-> m
		    (g0-inside (select-keys args [:x]))
		    (g0-inside (select-keys args [:y]))
		    (g0-inside (select-keys args [:z]))	
		    (update-modal :g :1 0))]
      (message (format "Rapid to: %s" (location-str (merge-locations (location m) args))))
      (redraw-location (:location new-m))
      new-m)
    m))
(add-code! :g0 g0 [:x :y :z])

(defn- g1
  [m args e]
  (if (not (empty? args))
    (let [new-m (-> m
		    (update-location (merge (location m) args))
		    (update-modal :g :1 1))]
      (line (location m) (location new-m) "color" 0x00ff00)
      (message (format "Linear interpolation to: %s" (location-str (location new-m))))
      (redraw-location (:location new-m))
      new-m)
    m))
(add-code! :g1 g1 [:f :x :y :z])

;; (add-message! (fn [m args e]
;;                 (format "Linear interpolation to: %s" (location-str (location e)))))
;; (modal-group [g0 g1 g2 g3])

(defn g2
  [m args e]
  (if (not (empty? args))
    (let [new-m (-> m
		    (update-location (merge (location m) args))
		    (update-modal :g :1 2))]
      (cw-arc (location m) (location new-m) (:r args) "color" 0x00ff00)
      (message (format "Clockwise circular interpolation: %s" (location-str (location new-m))))
      (redraw-location (:location new-m))
      new-m)
    m))

(add-code! :g2 g2 [:f :x :y :z :r])

(defn g3
  [m args e]
  (if (not (empty? args))
    (let [new-m (-> m (update-location (merge (location m) args)) (update-modal :g :1 3))]
      (ccw-arc (location m) (location new-m) (:r args) "color" 0x00ff00)
      (message (format "Counter-clockwise circular interpolation: %s" (location-str (location new-m))))
      (redraw-location (:location new-m))
      new-m)
    m))
(add-code! :g3 g3 [:f :x :y :z :r])

(defn- g96
  [m args e]
  (if e 
    (do (message (str "Spindle CSS Mode: " e))
        (update-modal m :g :5 96))
    m))
(add-code! :g96 g96 [])

(defn- g97 
  [m args e]
  (if e
    (do (message (str "Spindle RPM Mode: " e))
        (update-modal m :g :5 97))
    m))
(add-code! :g97 g97 [:s])

(defn m3 [m args e]
  (if e
    (do (message (str "Starting Spindle: " (speed m)))
        (update-modal m :m :7 3))
    m))
(add-code! :m3 m3 [])

(defn m4 [m args e]
  (if e
    (do (message (str "Starting Spindle CCW: " (speed m)))
        (update-modal m :m :7 4))
    m))
(add-code! :m4 m4 [])

;; (defn m5 [m args e]
;;   (if e 
;;     (do (message "Stopping Spindle")
;;         (update-modal m :m :7 5))
;;     m))
;; (add-code! :m5 m5 [])

(def-code m5 [])
(add-message! :m5 (fn [m a e] "Stopping spindle"))

(defn t [word-args]
  (fn [m args e]
    (message (str "Tool change: " word-args))
    (update-tool m word-args word-args)))
(add-code! :t t [])

(defn s [word-args]
  (fn [m args e]
    (message (str "Spindle speed: " word-args))
    (update-speed m word-args)))
(add-code! :s s [])

;; can we put the message in the def-code easily?
(def-code g99 [x y z] (assoc m :foo 1))
(add-message! :g99 (fn [m a e] "SATAN!!!")) 
