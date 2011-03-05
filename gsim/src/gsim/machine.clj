(ns gsim.machine
  (:use [ring.handler.dump])
  (:require [gsim.gcode :as gcode]))

(defn new-machine []
  {:config {}
   :code "FOO BAR BAZ"})

(def *machine* (new-machine))

(defn machine-state [ code ]
  "FOO BAR BAZ")

(defn machine-eval [ code ]
  (print-str (handle-dump code)))

