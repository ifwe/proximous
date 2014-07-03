module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.initConfig({
        // Server-side mocha tests
        mochaTest: {
            // Runs all tests
            test: {
                options: {
                    require: './test/test_runner',
                    reporter: 'spec',
                    ui: 'bdd',
                    timeout: 2000,
                    recursive: true,
                    clearRequireCache: true
                },
                src: ['test/**/*_test.js']
            },

            // Instruments code for reporting test coverage
            instrument: {
                options: {
                    require: './test/test_runner',
                    reporter: 'spec',
                    ui: 'bdd',
                    timeout: 2000,
                    recursive: true,
                },
                src: ['test/**/*_test.js']
            },

            // Reports test coverage
            coverage: {
                options: {
                    require: './test/test_runner',
                    reporter: 'html-cov',
                    ui: 'bdd',
                    timeout: 2000,
                    recursive: true,
                    quiet: true,
                    captureFile: 'coverage.html'
                },
                src: ['test/**/*_test.js']
            }
        },

        // Watches filesystem for changes to run tasks automatically
        watch: {
            test: {
                options: {
                    spawn: false
                },
                files: [
                    'lib/**/*.js',
                    'test/**/*.js'
                ],
                tasks: ['mochaTest:test']
            }
        }
    });

    // Runs all unit tests
    grunt.registerTask('test', ['mochaTest:test']);

    // Generates test coverage report
    grunt.registerTask('coverage', ['mochaTest:instrument', 'mochaTest:coverage']);
};
