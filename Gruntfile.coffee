module.exports = (grunt) ->
  grunt.initConfig
    watch:
      livereload:
        options:
          livereload: true
        files: ['index.html', 'css/*', 'js/*.js']
      jshint:
        tasks: 'jshint'
        files: ['js/*.js', '!js/test.js']

    connect:
      options:
        port: 8080
      server:
        options:
          livereload: true
          base: ["."]

    jshint:
      files: ['js/*.js', '!js/test.js']
      options:
        jshintrc: '.jshintrc'

  grunt.registerTask("default",
    ['connect', 'watch'])

  grunt.loadNpmTasks("grunt-contrib-watch")
  #grunt.loadNpmTasks("grunt-contrib-coffee")
  grunt.loadNpmTasks("grunt-contrib-connect")
  grunt.loadNpmTasks('grunt-contrib-jshint')
