module.exports = function(grunt) {

  grunt.initConfig({

    clean: ['build/*.js'],

    jshint: {
      options: grunt.file.readJSON('lint-options.json'), // see http://www.jshint.com/docs/options/
      all: { src: ['package.json', 'lint-options.json', 'Gruntfile.js', 'code/**/*.js'] }
    },

    mochaTest: {
      options: { colors: true, reporter: 'spec' },
      files: ['code/**/*.spec.js']
    },

    copy: {
      main: { files: [ {
        expand: true,
        cwd: 'code/',
        src: ['*.js'],
        dest: 'build/'
      } ] }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['clean', 'jshint', 'mochaTest', 'copy']);

};
