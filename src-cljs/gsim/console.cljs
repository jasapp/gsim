(ns gsim.console
  (:use [crate.core :only [html]]))

(defn gsim-console
  "Get the console object."
  []
  (.getElement goog.dom "console"))

(defn scroll-to-bottom
  "Scroll the console to the bottom."
  []
  (let [c (gsim-console)]
    (set! (.-scrollTop c) (.-scrollHeight c))))

(defn message
  "Append a message to the end of the console."
  [m]
  (let [p (crate.core/html [:p m])]
    (.appendChild (gsim-console) p)
    (scroll-to-bottom)))
