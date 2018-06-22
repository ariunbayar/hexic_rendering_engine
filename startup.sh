#!/bin/sh
dir='/var/www/hexic_rendering_engine'


# Load livereload
gnome-terminal -t 'grunt' -e "grunt --gruntfile $dir/Gruntfile.coffee"

# Load gvim
gvim "$dir/index.html"

# Load index page
google-chrome
sleep 1
google-chrome "http://localhost:8080#1"
google-chrome "http://localhost:8080#2"
