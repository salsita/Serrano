module.exports = function(grunt) {

	grunt.initConfig({

	  pkg: grunt.file.readJSON('package.json'),

	  run_grunt: {
  	  options: {
  	    minimumFiles: 2
  	  },
  	  simple_target: {
  	    options: {
  	      log: true,
          concurrent: 1
  	    },
        src: ['serrano-library/Gruntfile.js', 'simple-extension/Gruntfile.js']
      }
    }
});

  grunt.loadNpmTasks('grunt-run-grunt');
  grunt.registerTask('default', ['run_grunt']);


};
