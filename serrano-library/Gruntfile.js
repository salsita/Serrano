module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('./package.json'),

    jshint: {
      options: grunt.file.readJSON('lint-options.json'), // see http://www.jshint.com/docs/options/
      all: {
        // http://gruntjs.com/configuring-tasks#globbing-patterns
        src: ['package.json', 'lint-options.json', 'Gruntfile.js',
              'code/js/modules/*.js', 'code/js/modules/commandSets/*.js', 'code/js/main.js']
      }
    },

    mochaTest: {
      options: { colors: true, reporter: 'spec' },
      files: ['code/**/*.spec.js']

    },

    browserify: {
      build: {
        files: { 'build/<%= pkg.name %>-<%= pkg.version %>.js': 'code/js/main.js' },
        options: { bundleOptions: {
          debug: true,  // for source maps
          standalone: '<%= pkg["export-symbol"]%>'
        } }
      }
    },

    uglify: {
      min: { files: { 'build/<%= pkg.name %>-<%= pkg.version %>.min.js': 'build/<%= pkg.name %>-<%= pkg.version %>.js' } }
    },

    copy: {
      artifact: { files: [ {
        expand: true,
        cwd: 'build/',
        src: [ '<%= pkg.name %>-<%= pkg.version %>.js',
               '<%= pkg.name %>-<%= pkg.version %>.min.js' ],
        dest: process.env.CIRCLE_ARTIFACTS
      } ] }
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
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['jshint', 'mochaTest', 'browserify',
    'uglify', 'symlink', 'circleci']);

  grunt.registerTask('circleci', 'Store built libraries as CircleCI arfitacts', function() {
    if (process.env.CIRCLE_ARTIFACTS) { grunt.task.run('copy:artifact'); }
    else { grunt.log.ok('not on CircleCI, skipped'); }
  });

};
