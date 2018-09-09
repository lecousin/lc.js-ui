module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.initConfig({
		concat: {
			options: {
				sourceMap: 'true',
			},
			dist: {
				src: ['src/main/javascript/**/*.js'],
				dest: 'dist/lc-ui.js/lc-ui.js',
			},
			themes: {
				src: ['src/main/theme/classic/**/*.js'],
				dest: 'dist/lc-ui.js/themes/classic/theme-classic.js',
			}
		},
		uglify: {
			options: {
				sourceMap: true
			},
			all: {
				files: {
					'dist/lc-ui.js/lc-ui.min.js': ['dist/lc-ui.js/lc-ui.js'],
					"dist/lc-ui.js/themes/classic/theme-classic.min.js": ["dist/lc-ui.js/themes/classic/theme-classic.js"]
				}
			}
		},
		less: {
			ui: {
				options: {
					compress: true,
					sourceMap:true
				},
				files: {
					'dist/lc-ui.js/lc-ui.css': ['src/main/javascript/**/*.less','src/main/less/default-style.less']
				}
			},
			themes: {
				options: {
					compress: true,
					sourceMap:true
				},
				files: {
					'dist/lc-ui.js/themes/classic/theme-classic.css': 'src/main/theme/classic/theme.less'
				}
			}
		},
		jasmine: {
			src: 'src/main/javascript/**/*.js',
			options: {
				specs: 'src/test/specs/**/*.js',
				noSandbox: true
			}
		}
    });
    grunt.registerTask('default', ['jasmine','newer:concat','newer:uglify','less:ui','less:themes']);
    grunt.registerTask('release', ['jasmine','concat','uglify','less:ui','less:themes']);
};