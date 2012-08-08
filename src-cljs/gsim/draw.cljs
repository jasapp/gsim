(ns gsim.draw)

(def renderer (js/THREE.WebGLRenderer. (js-obj "antialias" true)))
(def scene (js/THREE.Scene.))
(def camera nil)

(defn three-vector [x y z]
  (js/THREE.Vector3. x y z))

(defn from-three [o]
  {:x (.-x o) :y (.-y o) :z (.-z o)})

(defn render []
  (.render renderer scene camera))

(defn default-options []
  {"color" 0x000000 "linewidth" 1})

(defn make-geometry [& points]
  (let [g (js/THREE.Geometry.)]
    (doseq [{x :x y :y z :z} points]
      (.push (. g -vertices) (three-vector x y z)))
    g))

(defn make-line-material [& args]
  (js/THREE.LineBasicMaterial.
   (apply js-obj (mapcat identity
			 (into [] (merge (default-options)
					 (apply hash-map args)))))))

;; used for the current location
(defn sphere [p]
  (let [geometry (js/THREE.SphereGeometry. 0.02 16 16)
	material (js/THREE.MeshBasicMaterial. (js-obj "color" 0x000000))
	s (js/THREE.Mesh. geometry material)]
    (.set (.-position s) (:x p) (:y p) (:z p))
    s))

(defn remove-current-location []
  (doseq [child (.-children scene)]
    (if (.-location child)
      (.remove scene child))))

(defn current-location [p]
  (remove-current-location)
  (let [s (sphere p)]
    (set! (.-location s) true)
    (.add scene s)
    (render)))

(defn sq [x]
  (js/Math.pow x 2))

(defn sqrt [x]
  (js/Math.sqrt x))

;; not sure if we want to do this in clojure or to use Three.js's vector distance stuff
(defn distance [p1 p2]
  (sqrt (+ (sq (- (:x p2) (:x p1)))
	   (sq (- (:y p2) (:y p1))))))

;; http://paulbourke.net/geometry/2circle/
(defn find-circles [p1 p2 r]
  (let [dist (distance p1 p2)
	{x1 :x y1 :y} p1
	{x2 :x y2 :y} p2
	[x3 y3] [(/ (+ x1 x2) 2) (/ (+ y1 y2 ) 2)]
	[x4 y4] [(/ (* (sqrt (- (sq r) (sq (/ dist 2)))) (- y1 y2)) dist)
		 (/ (* (sqrt (- (sq r) (sq (/ dist 2)))) (- x2 x1)) dist)]]
    (cond (> dist (* r 2)) []
	  (= dist (* r 2)) [{:x (+ x3 x4) :y (+ y3 y4)}]
	  (< dist (* r 2)) [{:x (+ x3 x4) :y (+ y3 y4)}
			    {:x (- x3 x4) :y (- y3 y4)}])))

(defn degrees [r]
  (* (/ 180 js/Math.PI) r))

(defn radians [d]
  (* (/ js/Math.PI 180) d))

(defn dot [p1 p2]
  (apply + (map #(* (% p1) (% p2)) [:x :y :z])))

(defn len [p]
  (sqrt (apply + (map sq (vals p)))))

;; eck!
(defn sub [p1 p2]
  (select-keys
   {:x (- (:x p2) (:x p1))
    :y (- (:y p2) (:y p1))
    :z (- (:z p2) (:z p1))}
   (keys p1)))

(defn angle-to [p1 p2]
  (let [{x1 :x y1 :y} p1
	{x2 :x y2 :y} p2]
    (mod (js/Math.atan2 (- (* x1 y2) (* x2 y1))
			(+ (* x1 x2) (* y1 y2)))
	 (* 2 js/Math.PI))))

;; maybe we should leave everything in radians?
;; (defn find-angles [center & points]
;;  (let [radius (distance center (first points))
;;	zero-vector (merge center {:x (+ radius (:x center))})]
;;    zero-vector))
;;
(defn find-angles [center & points]
  (let [dist (distance center (first points))
	reference {:x dist :y 0}]
    (map #(degrees (angle-to reference (sub center %))) points)))

;; this is going to be different for lathes / mills
;; With a mill, and change in Z will produce a helical motion
;; with a lathe changes on Y will be ignored and curves will only be along a plane
;; determine the number of points by the length of the curve maybe?
(defn arc-geometry [x y z start-angle end-angle r]
  (let [a (js/THREE.ArcCurve. x y r (radians start-angle) (radians end-angle) false)
	g (js/THREE.Geometry.)]
    (doseq [p (.getPoints a 64)]
      (.push (. g -vertices) (three-vector (.-x p) (.-y p) z)))
    g))
	
(defn arc [p1 p2 r cw & options]
  (let [{x1 :x y1 :y} p1 {x2 :x y2 :y} p2
	[circle1 circle2] (find-circles p1 p2 r)
	[start-angle1 end-angle1] (find-angles circle1 p1 p2)
	[start-angle2 end-angle2] (find-angles circle2 p1 p2)
	geometry1 (arc-geometry (:x circle1) (:y circle1) 0 start-angle1 end-angle1 r)
	geometry2 (arc-geometry (:x circle2) (:y circle2) 0 start-angle2 end-angle2 r)
	line-material (apply make-line-material options)
	l1 (js/THREE.Line. geometry1 line-material)
	l2 (js/THREE.Line. geometry2 line-material)]
    (.add scene (sphere (merge circle1 {:z 0})))
    (.add scene (sphere (merge circle2 {:z 0})))    
    (.add scene (sphere {:x 1 :y 1 :z 0}))
;;    (set! (.-line l1) true)
;;    (set! (.-line l2) true)    
    (.add scene l1)
    (.add scene l2)    
    (render))) ;; just render everything now, maybe later we should only render selectively

;; should this return a function to highlight the line on mouseOver?
;; (later of course)
(defn line [p1 p2 & options]
  (let [geometry (make-geometry p1 p2)
	line-material (apply make-line-material options)
	l (js/THREE.Line. geometry line-material)]
    (set! (.-line l) true)
    (.add scene l)
    (render))) ;; just render everything now, maybe later we should only render selectively

(defn cw-curve [p1 p2 r & options]
  )

(defn ccw-curve [p1 p2 r & options]
  )

;; there must be a better way to clear the scene?
(defn clear []
  (doseq [o (reverse (drop 1 (-> scene .-children)))]
    (if o
      (.remove scene o)))
  (render))

(defn line-count []
  (count (filter #(.-line %) (.-children scene))))

(defn drop-line
  ([] (drop-line 1))
  ([num]
     (doseq [o (take num (filter #(and % (.-line %)) (reverse (.-children scene))))]
       (.remove scene o))
     (render)))

;; (defn sample [change]
;;   (if (pos? change)
;;     (doseq [_ (range 0 change)] (add-line))
;;     (doseq [_ (range change 0)] (drop-last-line)))
;;   (.render renderer scene camera))

(defn init [element-name]
  (let [canvas (.getElement goog.dom element-name)
	ratio (/ (.-offsetWidth canvas) (.-offsetHeight canvas))
	c (js/THREE.PerspectiveCamera. 35 ratio 0.1 10000)]
    (.setSize renderer (.-offsetWidth canvas) (.-offsetHeight canvas))
    (.appendChild canvas (. renderer -domElement))
    (.set (. c -position) 0 0 10)
    (.lookAt c (. scene -position))
    (.add scene c)
    (set! camera c)
    (current-location {:x 0 :y 0 :z 0})))
