(defproject gsim "1.0.0-SNAPSHOT"
  :description "A web based gcode simulator"
  :dependencies [[org.clojure/clojure "1.2.0"]
		 [org.clojure/clojure-contrib "1.2.0"]
		 [compojure "0.6.5"]
		 [clj-http "0.1.3"]
		 [clj-json "0.3.1" ]
		 [ring/ring-jetty-adapter "0.3.11"]]
  :dev-dependencies [[swank-clojure "1.2.1"]
		     [compojure "0.6.5"]
		     [cljs-devmode "0.1.0-SNAPSHOT"]]
  :git-dependencies [["https://github.com/clojure/clojurescript.git"
		      "886d8dc81812962d30a741d6d05ce9d90975160f"]
		     ["https://github.com/levand/domina.git"
		      "8933b2d12c44832c9bfaecf457a1bc5db251a774"]]
  :repl-init one.sample.repl
  :source-path "src/app/clj"
  :extra-classpath-dirs [".lein-git-deps/clojurescript/src/clj"
			 ".lein-git-deps/clojurescript/src/cljs"
			 ".lein-git-deps/domina/src/cljs"
			 "src/app/cljs"
			 "src/app/cljs-macros"
			 "src/lib/clj"
			 "src/lib/cljs"
			 "templates"])