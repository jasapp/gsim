(ns gsim.three)

(def renderer (js/THREE.WebGLRenderer. (js-obj "antialias" true)))
(def scene (js/THREE.Scene.))
(def camera nil)

(defn init [element-name]
  (let [canvas (.getElement goog.dom element-name)
	ratio (/ (.-offsetWidth canvas) (.-offsetHeight canvas))
	c (js/THREE.PerspectiveCamera. 35 ratio 0.1 10000)]
    (.setSize renderer (.-offsetWidth canvas) (.-offsetHeight canvas))
    (.appendChild canvas (. renderer -domElement))
    (.set (. c -position) -15 10 10)
    (.lookAt c (. scene -position))
    (.add scene c)
    (set! camera c)))

(defn geometry [& points]
  (let [g (js/THREE.Geometry.)]
    (doseq [[x y z] points]
      (.push (. g -vertices) (js/THREE.Vector3. x y z)))
    g))

(defn rand-vector [x y z]
  (vector (rand-int x) (rand-int y) (rand-int z)))

(defn rand-line [points x y z]
  (let [g (apply geometry (take points (repeatedly #(rand-vector x y z))))
	m (js/THREE.LineBasicMaterial. (js-obj "color" 0xff00ff "linewidth" 2))]
    (js/THREE.Line. g m)))

(defn add-line []
  (.add scene (rand-line 10 10 10 10))
  (.render renderer scene camera))

