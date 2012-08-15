(ns gsim.routes
  (:use compojure.core
        gsim.views
	[gsim.storage.storage :only [save fetch list-files]]
	[gsim.storage.mongo :only [new-storage]]
	[gsim.logging :only [logging-middleware]]
	[gsim.users :only [load-user-record]]
	[ring.util.response :only [redirect]]
	[ring.middleware.params :only [wrap-params]]
	[ring.middleware.multipart-params :only [wrap-multipart-params]]	
        [hiccup.middleware :only [wrap-base-url]])
  (:require [compojure.route :as route]
	    [gsim.storage.mongo :only [new-storage]]
	    [compojure.core :as compojure]
            [compojure.handler :as handler]
            [compojure.response :as response]
	    [cemerick.friend :as friend]
            [cemerick.friend [workflows :as workflows]
	                     [credentials :as creds]]))

(def storage (atom (new-storage)))

(defn edit-file [request]
  (let [{filename :filename} (:params request)
	username (:current (friend/identity request))
	contents (fetch @storage username filename)]
    (edit-page filename contents)))

(defn view-files [request]
  (let [username (:current (friend/identity request))
	filenames (list-files @storage username)]
    (files-page filenames)))

(defn upload-file [request]
  (let [username (:current (friend/identity request))
	{filename :filename file :tempfile size :size} (:file (:params request))]
    (save @storage username filename (slurp file))
    (redirect "/")))

(defroutes main-routes
  (GET "/" request (friend/authorize #{:admin :user} (view-files request)))
  (GET "/login" request (login-page request))
  (GET "/admin" request (friend/authorize #{:admin} "admin page."))
  (GET "/edit/:filename" request (friend/authorize #{:user} (edit-file request)))
  (wrap-multipart-params
   (POST "/upload" request (friend/authorize #{:user} (upload-file request))))
  (friend/logout (ANY "/logout" request (redirect "/")))
  (route/resources "/")
  (route/not-found "Page not found"))

(def app
  (-> main-routes
      (wrap-base-url)
      (logging-middleware)
      (friend/authenticate
       {:credential-fn (partial creds/bcrypt-credential-fn load-user-record)
	:unauthorized-redirect-uri "/login"
	:login-uri "/login"
	:workflows [(workflows/interactive-form)]})
      (handler/site)))
