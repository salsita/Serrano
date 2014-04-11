module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: grunt.file.readJSON('lint-options.json'), // see http://www.jshint.com/docs/options/
      all: {
        // http://gruntjs.com/configuring-tasks#globbing-patterns
        src: ['package.json', 'lint-options.json', 'Gruntfile.js',
              'code/**/*.js', '!code/helpers.js', '!code/commands.js' /*, 'tests/*.js' */]
        // code/helpers is a third part, code/commands is unfinished...

      }
    },

    mochaTest: {
      options: { colors: true, reporter: 'spec' },
      files: ['code/**/*.spec.js']
    },

    browserify: {
      build: {
        files: { 'build/<%= pkg.name %>-<%= pkg.version %>.js': 'code/main.js' },
        options: { bundleOptions: {
          debug: true,  // for source maps
          standalone: '<%= pkg["export-symbol"]%>'
        } }
      }
    },

    uglify: {
      min: { files: { 'build/<%= pkg.name %>-<%= pkg.version %>.min.js': 'build/<%= pkg.name %>-<%= pkg.version %>.js' } }
    },

    symlink: {
      options: { overwrite: true },
      develop: {
        src: 'build/<%= pkg.name %>-<%= pkg.version %>.js',
        dest: 'build/<%= pkg.name %>.js'
      },
      min: {
        src: 'build/<%= pkg.name %>-<%= pkg.version %>.min.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-symlink');

  grunt.registerTask('default', ['jshint', 'mochaTest', 'browserify', 'uglify', 'symlink']);

};
