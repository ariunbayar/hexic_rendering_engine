module.exports = (grunt) ->
  grunt.initConfig
    coffee:
      compile:
        options:
          sourceMap: true
        files:
          # TODO specify full path for js file
          'js/compiled/RenderEngine.js': [
            'coffee/requirements.coffee',
            'coffee/Cache.coffee',
            'coffee/Graphics.coffee',
            'coffee/Cell.coffee',
            'coffee/RenderEngine.coffee',
          ]
          'js/compiled/main.js': 'coffee/main.coffee'

    watch:
      livereload:
        options:
          livereload: true
        files: ['index.html', 'css/*', 'js/*.js', 'js/compiled/*']
      coffee:
        tasks: 'coffee:compile'
        files: 'coffee/*.coffee'
      jshint:
        tasks: 'jshint'
        files: 'js/*.js'

    connect:
      options:
        port: 8080
      server:
        options:
          livereload: true
          base: ["."]

    jshint:
      files: ['js/*.js']
      options:
        jshintrc: '.jshintrc'

  grunt.registerTask("default",
    ['connect', 'watch'])

  grunt.loadNpmTasks("grunt-contrib-watch")
  grunt.loadNpmTasks("grunt-contrib-coffee")
  grunt.loadNpmTasks("grunt-contrib-connect")
  grunt.loadNpmTasks('grunt-contrib-jshint')
