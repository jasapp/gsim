(ns gsim.console
  (:use [crate.core :only [html]]))

(defn gsim-console
  "Get the console object."
  []
  (.getElement goog.dom "console"))

(defn clear
  "Clear the console."
  []
  (.removeChildren goog.dom (gsim-console)))

(defn remove-first
  "Remove the first child."
  []
  (let [first-child (.getFirstElementChild goog.dom (gsim-console))]
    (.removeNode goog.dom first-child)))

(defn message-count
  "Count the number of messages we have."
  []
  (-> (gsim-console)
      .-childNodes
      .-length))

(defn scroll-to-bottom
  "Scroll the console to the bottom."
  []
  (let [c (gsim-console)]
    (set! (.-scrollTop c) (.-scrollHeight c))))

;; we should remove children from the top of the console if we've got more than X
(defn message
  "Append a message to the end of the console."
  [m]
  (let [p (crate.core/html [:p m])
	c (message-count)
	message-limit 100]
    (if (< message-limit c)
      (remove-first))
    (.appendChild (gsim-console) p)
    (scroll-to-bottom)
    c))


