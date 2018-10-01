module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.initConfig({
		concat: {
			options: {
				sourceMap: 'true',
			},
			dist: {
				src: ['src/main/javascript/**/*.js'],
				dest: 'dist/lc-ui.js',
			},
			themes: {
				src: ['src/main/theme/classic/**/*.js'],
				dest: 'dist/themes/classic/theme-classic.js',
			}
		},
		uglify: {
			options: {
				sourceMap: true
			},
			all: {
				files: {
					'dist/lc-ui.min.js': ['dist/lc-ui.js'],
					"dist/themes/classic/theme-classic.min.js": ["dist/themes/classic/theme-classic.js"]
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
					'dist/lc-ui.css': ['src/main/javascript/**/*.less','src/main/less/default-style.less']
				}
			},
			themes: {
				options: {
					compress: true,
					sourceMap:true
				},
				files: {
					'dist/themes/classic/theme-classic.css': 'src/main/theme/classic/theme.less'
				}
			}
		},
		copy: {
			all: {
				files: [
				  { cwd: 'src/main/javascript', src: ['**/locale/*.*'], dest: 'dist/locale/', expand: true, flatten: true }
				]
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
    grunt.registerTask('default', ['jasmine','newer:concat','newer:uglify','less:ui','less:themes','newer:copy:all']);
    grunt.registerTask('release', ['jasmine','concat','uglify','less:ui','less:themes','copy:all']);
};