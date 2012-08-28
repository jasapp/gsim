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
         {:args args :fn f}))

(defn- args-used [code]
  (-> @codes code :args))

(defn- has-fn? [code]
  (-> @codes code)) ;; why is this not returning the value of :fn?

(defn add-message! [code-name f]
  (swap! codes #(assoc-in % [(keyword code-name) :message-fn] f)))

(defn message-fn [code]
  (get-in @codes [code :message-fn] (fn [m args e] nil)))

(defn add-modal! [code-name n p]
  (swap! codes #(assoc-in % [(keyword code-name) :modal] n))
  (swap! codes #(assoc-in % [(keyword code-name) :precedence] p)))

(defn modal-group [group-num & code-pairs]
  (doseq [[code precedence] code-pairs]
    (add-modal! code group-num precedence)))

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
(def-code g0 [:x :y :z :f] 
  (let [new-m (-> m
                  (g0-inside (select-keys args [:x]))
                  (g0-inside (select-keys args [:y]))
                  (g0-inside (select-keys args [:z]))	
                  (update-modal :g :1 0))]
    (redraw-location (location new-m))
    new-m))
(add-message! :g0 (fn [m a e] 
                    (format "Rapid to: %s" (location-str (merge-locations (location m) a)))))

(def-code g1 [:f :x :y :z]
  (let [new-m (-> m
                  (update-location (merge (location m) args))
                  (update-modal :g :1 1))]
    (line (location m) (location new-m) "color" 0x00ff00)
    (redraw-location (:location new-m))
    new-m))
(add-message! (fn [m args e]
                (format "Linear interpolation to: %s" (location-str (location m)))))

(def-code g2 [:f :x :y :z :r]
  (let [new-m (-> m
                  (update-location (merge (location m) args))
                  (update-modal :g :1 2))]
    (cw-arc (location m) (location new-m) (:r args) "color" 0x00ff00)
    (redraw-location (:location new-m))
    new-m))
(add-message! (fn [m a e] 
                (format "Clockwise circular interpolation: %s" (location-str (location m)))))

(def-code g3 [:f :x :y :z :r]
  (let [new-m (-> m (update-location (merge (location m) args)) (update-modal :g :1 3))]
    (ccw-arc (location m) (location new-m) (:r args) "color" 0x00ff00)
    (redraw-location (:location new-m))
    new-m))
(add-message! (fn [m a e] 
                (format "Counter-clockwise circular interpolation: %s" 
                        (location-str (location m)))))
(modal-group 1 [:g0 20.0] [:g1 20.1] [:g2 20.2] [:g3 20.3])


;; what about a with-modal-group macro that wraps 
;; the defined codes with a modal group and precedence based on definition order?

;; much better, but still not quite right
;; let's make the messages defined in def-code somehow
;; what about binding to variables into a string?
(def-code g96 [] (update-modal m :g :5 96))
(add-message! :g96 (fn [m a e] "Spindle CSS Mode"))

(def-code g97 [] (update-modal m :g :5 97))
(add-message! :g97 (fn [m a e] "Spindle RPM Mode"))
(modal-group 5 [:g97 1.1] [:g96 1.0])

(def-code m3 [] (update-modal m :m :7 3))
(add-message! :m3 (fn [m a e] "Starting spindle"))

(def-code m4 [] (update-modal m :m :7 4))
(add-message! :m4 (fn [m a e] "Starting spindle CCW"))

(def-code m5 [] (update-modal m :m :7 5))
(add-message! :m5 (fn [m a e] "Stopping spindle"))
(modal-group 7 [:m3 1.0] [:m4 1.0] [:m5 1.0])

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







