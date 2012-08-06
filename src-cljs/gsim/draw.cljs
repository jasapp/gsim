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
	  (= dist (* r 2)) [[(+ x3 x4) (+ y3 y4)]]
	  (< dist (* r 2)) [[(+ x3 x4) (+ y3 y4)]
			    [(- x3 x4) (- y3 y4)]])))

;; maybe we should leave everything in radians?
(defn find-angle [p1 p2 r]
  (let [dist (/ (distance p1 p2) 2)
	angle (* (/ 180 js/Math.PI)
		 (* (js/Math.sin (/ r (/ dist 2))) 2))]
    (min angle (- 360 angle))))

;; this is going to be different for lathes / mills
;; With a mill, and change in Z will produce a helical motion
;; with a lathe changes on Y will be ignored and curves will only be along a plane
;; determine the number of points by the length of the curve maybe?
(defn arc-geometry [x y z angle r cw]
  (let [radians (* (/ js/Math.PI 180) angle)
	a (js/THREE.ArcCurve. x y r 0 radians cw)
	g (js/THREE.Geometry.)]
    (doseq [p (.getPoints a 8)]
      (.push (. g -vertices) (three-vector (.-x p) (.-y p) z)))
    g))
	
(defn arc [p1 p2 r cw & options]
  (let [{x1 :x y1 :y} p1 {x2 :x y2 :y} p2
	angle (find-angle p1 p2 r)
	geometry (arc-geometry x1 y1 0 angle r cw)
	line-material (apply make-line-material options)
	l (js/THREE.Line. geometry line-material)]
    (set! (.-line l) true)
    (.add scene l)
    (render))) ;; just render everything now, maybe later we should only render selectively

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
    (.set (. c -position) -10 5 5)
    (.lookAt c (. scene -position))
    (.add scene c)
    (set! camera c)
    (current-location {:x 0 :y 0 :z 0})))
