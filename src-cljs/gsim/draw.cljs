(ns gsim.draw)

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

(defn render []
  (.render renderer scene camera))

(defn default-options []
  {"color" 0x000000 "linewidth" 1})

(defn make-geometry [& points]
  (let [g (js/THREE.Geometry.)]
    (doseq [{x :x y :y z :z} points]
      (.push (. g -vertices) (js/THREE.Vector3. x y z)))
    g))

(defn make-line-material [& args]
  (js/THREE.LineBasicMaterial.
   (apply js-obj
	  (mapcat identity (into [] (merge (default-options)
					   (apply hash-map args)))))))

(defn line [p1 p2 & options]
  (let [geometry (make-geometry p1 p2)
	line-material (apply make-line-material options)]
    (.add scene (js/THREE.Line. geometry line-material))))

(defn cw-curve [x y z r options]
  )

(defn ccw-curve [x y z r options]
  )

;; there must be a better way to clear the scene?
(defn clear []
  (doseq [o (reverse (drop 1 (-> scene .-children)))]
    (if o
      (.remove scene o)))
  (render))

(defn drop-lines [num]
  (doseq [_ (range 0 num)]
    (let [last-line (last (. scene -children))]
      (.remove scene last-line)))
  (render))

(defn drop-line []
  (drop-lines 1))

;; (defn sample [change]
;;   (if (pos? change)
;;     (doseq [_ (range 0 change)] (add-line))
;;     (doseq [_ (range change 0)] (drop-last-line)))
;;   (.render renderer scene camera))
