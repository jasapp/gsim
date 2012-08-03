(ns gsim.draw)

(def renderer (js/THREE.WebGLRenderer. (js-obj "antialias" true)))
(def scene (js/THREE.Scene.))
(def camera nil)

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
   (apply js-obj (mapcat identity
			 (into [] (merge (default-options)
					 (apply hash-map args)))))))

;; used for the current location
(defn sphere [p]
  (let [geometry (js/THREE.SphereGeometry. 0.02 16 16)
	material (js/THREE.MeshBasicMaterial. (js-obj "color" 0x000000))
	s (js/THREE.Mesh. geometry material)]
    (.set (.-position s) (:x p) (:y p) (:z p))
    (.add scene s)
    (render)))

;; should this return a function to highlight the line on mouseOver?
;; (later of course)
(defn line [p1 p2 & options]
  (let [geometry (make-geometry p1 p2)
	line-material (apply make-line-material options)]
    (.add scene (js/THREE.Line. geometry line-material))
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

(defn drop-obj [num]
  (doseq [_ (range 0 num)]
    (let [last-line (last (. scene -children))]
      (.remove scene last-line)))
  (render))

(defn drop-one []
  (drop-obj 1))

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
    (sphere {:x 0 :y 0 :z 0})))

