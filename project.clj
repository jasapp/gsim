(defproject gsim "1.0.0-SNAPSHOT"
  :description "A web based gcode simulator"
  :dependencies [[org.clojure/clojure "1.2.0"]
				 [org.clojure/clojure-contrib "1.2.0"]
				 [compojure "0.6.4"]
				 [hiccup "0.3.6"]
				 [clj-json "0.3.1" ]]
  :dev-dependencies [[swank-clojure "1.2.1"]
					 [lein-ring "0.4.5"]
					 [ring-serve "0.1.1"]]
  :ring {:handler gsim.core/app})
