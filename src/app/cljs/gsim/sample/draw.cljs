(ns ^{:doc "Defines animations which are used in the sample
  application."}
  gsim.sample.draw
  (:use [gsim.core :only (start)]
        [domina :only (by-id set-html! set-styles! destroy-children! append! single-node)]
        [domina.xpath :only (xpath)])
  (:require [goog.dom.forms :as gforms]
            [goog.style :as style]))

(def start-x 780)
(def start-y 10)
(def last-point (atom [start-x start-y]))

(defn new-xy [x y]
  (swap! last-point (fn [_] [x y])))

(defn clear []
  (set! (.-width canvas) (.-width canvas)))

(defn reset []
  (clear)
  (new-xy start-x start-y))

(defn context []
  (.getContext canvas "2d"))

(defn line [x y]
  (let [[last-x last-y] @last-point]
    (. ctx -beginPath)
    (.moveTo ctx last-x last-y)
    (.lineTo ctx x y)
    (. ctx -stroke)
    (new-xy x y)))

(defn line-x [x]
  (let [[last-x last-y] @last-point]
    (line x last-y)))

(defn line-y [y]
  (let [[last-x last-y] @last-point]
    (line last-x y)))

(defn arc [x2 y2 r]
  (let [[x1 x2] @last-point]
    nil))


(defn test []
  (let [scene (js/THREE.Scene.)
	camera (js/THREE.PerspectiveCamera. 75 (/ 800 300) 1 10000)
	renderer (js/THREE.WebGLRenderer.)
	cube-geo (js/THREE.CubeGeometry. 5 5 5)
	material (js/THREE.MeshLambertMaterial. { :color 0xFF0000})
	cube (js/THREE.Mesh. cube-geo material)
	light (js/THREE.PointLight. 0xFFFF00)]
    (.set (. light -position) 10 0 10)
    (.setSize renderer 800 600)
    (.appendChild document.body (. renderer -domElement))
    (.set (. camera -position) -15 10 10)
    (.lookAt camera (. scene -position))
    (.add scene camera)
    (.add scene cube)
    (.add scene light)
    (.render renderer scene camera)))
  
;; //points (x1,y1) and (x2,y2)
;; //radius r
;; var mx = (x1+x2)/2;
;; var my = (y1+y2)/2;

;; var leg1x = mx-x1;
;; var leg1y = my-y1;
;; var leg1 = Math.sqrt(leg1x*leg1x + leg1y*leg1y);

;; if(leg1 > Math.abs(r))
;; 	return; //no solution

;; var leg2 = Math.sqrt(r*r - leg1*leg1);
;; var leg2x = leg1y*leg2/leg1;
;; var leg2y = -leg1x*leg2/leg1;

;; var c1x = mx+leg2x;
;; var c1y = my+leg2y;

;; var c2x = mx-leg2x;
;; var c2y = my-leg2y;

(def canvas (by-id :tutorial))
(def ctx (context canvas))











