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
    (.beginPath ctx)
    (.moveTo ctx last-x last-y)
    (.lineTo ctx x y)
    (.stroke ctx)
    (new-xy x y)))

(defn line-x [x]
  (let [[last-x last-y] @last-point]
    (line x last-y)))

(defn line-y [y]
  (let [[last-x last-y] @last-point]
    (line last-x y)))

(def canvas (by-id :tutorial))
(def ctx (context canvas))
