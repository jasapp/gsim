(defproject gsim "1.0.0-SNAPSHOT"
  :description "A web based gcode simulator"
  :dependencies [[org.clojure/clojure "1.2.0-master-SNAPSHOT"]
				 [org.clojure/clojure-contrib "1.2.0-SNAPSHOT"]
				 [compojure "0.6.0"]
				 [clj-json "0.3.1" ]
				 [ring/ring-core "0.2.0"]
				 [ring/ring-jetty-adapter "0.2.0"]]
  :dev-dependencies [[swank-clojure "1.2.1"]
					 [ring/ring-devel "0.2.0"]])
