module.exports = (grunt) ->
  grunt.initConfig
    coffee:
      compile:
        options:
          sourceMap: true
        files:
          # TODO specify full path for js file
          'render_engine.js': 'coffee/RenderEngine.coffee'
    watch:
      coffee:
        files: 'coffee/*.coffee'
        tasks: 'coffee:compile'

  grunt.loadNpmTasks("grunt-contrib-watch")
  grunt.loadNpmTasks("grunt-contrib-coffee")
