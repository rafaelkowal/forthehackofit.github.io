module.exports = function(grunt) {
	// configure tasks
	grunt.initConfig({
		copy: {
			build: {
				cwd: 'source',
				src: ['**', '!sass/'],
				dest: 'dist',
				expand: true
			}
		},
		clean: {
			build: {
				src: ['dist']
			},
			stylesheets: {
				src: ['dist/**/*.css', '!dist/main.css']
			}
		},
		compass: {
			dist: {
				options: {
					sassDir: 'source/sass/',
					specify: ['source/sass/main.scss'],
					cssDir: 'dist/css/',
					environment: 'production' 
				}
			}
		},
		autoprefixer: {
			build: {
				expand: true,
				cwd: 'dist',
				src: ['**/*.css'],
				dest: 'dist'
			}
		},
		cssmin: {
			build: {
				files: {
					'dist/main.css': ['dist/**/*.css']
				}
			}
		},
		watch: {
			stylesheets: {
				files: 'source/**/*.scss',
				tasks: ['compass']
			},
			copy: {
				files: ['source/**', '!source/**/*.scss'],
				tasks: ['copy']
			}
		}
	});

	// load tasks
	grunt.loadNpmTasks('grunt-contrib-compass');
  	grunt.loadNpmTasks('grunt-contrib-copy');
  	grunt.loadNpmTasks('grunt-contrib-clean');
  	grunt.loadNpmTasks('grunt-autoprefixer');
  	grunt.loadNpmTasks('grunt-contrib-cssmin');
  	grunt.loadNpmTasks('grunt-contrib-watch');

  	// define tasks
  	grunt.registerTask(
  		'build',
  		'compiles all assets and copies files to dist directory',
  		['clean:build', 'copy', 'minifycss']
  	);

  	grunt.registerTask(
  		'stylesheets',
  		'compiles the stylesheets',
  		['compass', 'autoprefixer']
  	);

  	grunt.registerTask(
  		'minifycss',
  		'minifies the stylesheets',
  		['compass', 'autoprefixer', 'cssmin', 'clean:stylesheets']
  	);

  	grunt.registerTask(
  		'default',
  		'watches for changes and updates combo files',
  		['build', 'watch']
  	);
};