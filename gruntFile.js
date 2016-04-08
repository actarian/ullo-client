module.exports = function (grunt) {

    var SERVER_NAME = 'dev.ullowebapp';
    var SERVER_PORT = 8081;

    var rewrite = require('connect-modrewrite');

    grunt.initConfig({
        clean: {
            vendors: {
                src: ['wwwroot/vendors/**/*.*']
            },
        },
        concat: {
            app: {
                src: [
                    'src/app/utils/utils.js',
                    'src/app/app.js',
                    'src/app/models/models.js',
                    'src/app/services/services.js',
                    'src/app/controllers/controllers.js',
                    'src/app/directives/directives.js',
                    'src/app/animations/animations.js',
                ],
                dest: 'wwwroot/js/app.js',
            },
        },
        copy: {
            vendors: {
                cwd: 'node_modules',
                src:
                [
                    'dynamics.js/lib/dynamics.js',
                    'angular/angular.js',
                    'angular-route/angular-route.js',
                    'angular-messages/angular-messages.js',
                    'angular-animate/angular-animate.js',
                    'angular-relative-date/angular-relative-date.js',
                    'ng-file-upload/dist/ng-file-upload.js',
                ],
                dest: 'wwwroot/js/vendors',
                expand: true, flatten: true, filter: 'isFile',
            },
            workers: {
                cwd: 'src/app/workers',
                src:
                [
                    '*.*',
                ],
                dest: 'wwwroot/js/workers',
                expand: true, flatten: true, filter: 'isFile',
            },
        },
        uglify: {
            vendors: {
                options: {
                    mangle: false
                },
                files: {
                    'wwwroot/js/vendors.min.js':
                    [
                        'wwwroot/js/vendors/store.js',
                        'wwwroot/js/vendors/dynamics.js',
                        'wwwroot/js/vendors/uuid.js',
                        'wwwroot/js/vendors/angular.js',
                        'wwwroot/js/vendors/angular-route.js',
                        'wwwroot/js/vendors/angular-messages.js',
                        'wwwroot/js/vendors/angular-animate.js',
                        'wwwroot/js/vendors/angular-relative-date.js',
                        'wwwroot/js/vendors/ng-file-upload.js',
                    ]
                }
            },
            app: {
                options: {
                    mangle: false
                },
                files: {
                    'wwwroot/js/app.min.js':
                    [
                        'wwwroot/js/app.js',
                    ]
                }
            }
        },
        less: {
            vendors: {
                options: {
                    paths: ['./src/less/'],
                    yuicompress: true
                },
                files: [{
                    expand: true,
                    cwd: './src/less/',
                    dest: './wwwroot/css/',
                    src: ['bootstrap.less'],
                    ext: '.css'
                }]
            },
            app: {
                options: {
                    paths: ['./src/less/'],
                    yuicompress: true
                },
                files: [{
                    expand: true,
                    cwd: './src/less/',
                    dest: './wwwroot/css/',
                    src: ['app.less'],
                    ext: '.css'
                }]
            }
        },
        sass: {
            vendors: {
                options: {
                    loadPath: ['./src/sass/'],
                },
                files: [{
                    expand: true,
                    cwd: './src/sass/',
                    dest: './wwwroot/css/',
                    src: ['bootstrap.scss'],
                    ext: '-4.css'
                }]
            },
            app: {
                options: {
                    loadPath: ['./src/sass/'],
                },
                files: [{
                    expand: true,
                    cwd: './src/sass/',
                    dest: './wwwroot/css/',
                    src: ['app.scss'],
                    ext: '-4.css'
                }]
            }
        },
        cssmin: {
            app: {
                files: [{
                    expand: true,
                    cwd: './wwwroot/css/',
                    src: ['*.css', '!*.min.css'],
                    dest: './wwwroot/css',
                    ext: '.min.css'
                }]
            }
        },
        concurrent: {
            watchers: {
                tasks: ['watch:javascript', 'watch:less'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        watch: {
            javascript: {
                files: './src/app/**/*.js',
                tasks: ['copy:workers', 'concat:app', 'uglify:app'],
            },
            less: {
                files: './src/less/**/*.less',
                tasks: ['less:vendors', 'less:app', 'cssmin:app'],
            },
        },
        connect: {
            server: {
                options: {
                    port: SERVER_PORT,
                    hostname: SERVER_NAME,
                    base: {
                        path: 'wwwroot',
                        options: {
                            index: 'index.html',
                            maxAge: 300000
                        }
                    },
                    middleware: function (connect, options, middlewares) {
                        // inject a custom middleware into the array of default middlewares
                        middlewares.unshift(function (req, res, next) {
                            if (req.url !== '/hello') return next();
                            res.end('Hello, world from port #' + options.port + '!');
                        });
                        // the rules that shape our mod-rewrite behavior
                        var rules = [
                            '!\\.html|\\.js|\\.css|\\.svg|\\.jp(e?)g|\\.png|\\.gif$ /index.html'
                        ];		
                        // add rewrite as first item in the chain of middlewares
                        middlewares.unshift(rewrite(rules));
                        return middlewares;
                    },
                    onCreateServer: function (server, connect, options) {
						/*
						var io = require('socket.io').listen(server);
						io.sockets.on('connection', function(socket) {
							// do something with socket
						});
						*/
                    },
                    debug: true,
                    open: true,
                },
            }
        },
        open: {
            chrome: {
                path: 'http://' + SERVER_NAME + ':' + SERVER_PORT,
                app: 'Chrome'
            },
            googleChrome: {
                path: 'http://' + SERVER_NAME + ':' + SERVER_PORT,
                app: 'Google Chrome'
            },
        },
    });

    // MAIN TASKS
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.registerTask('browser', 'Launch browser.', function (arg) {
        var msg = 'Opening browser: ';
        function launch($browser, $callback) {
            try {
                grunt.verbose.write(msg + $browser);
                grunt.option('force', true);
                grunt.task.run('open:' + $browser);
                grunt.verbose.ok();
            } catch (e) {
                grunt.verbose.or.write(msg + $browser).error().error(e.message);
                grunt.fail.warn('Something went wrong.');
                $callback ? $callback() : null;
            }
        }
        launch('chrome', function () {
            launch('googleChrome');
        });
    });

    grunt.event.once('connect.server.listening', function (host, port) {
        var url = 'http://' + host + ':' + port + '/index.html';
        grunt.log.writeln('index available at: ' + url);
        grunt.task.run('browser');
    });

    grunt.registerTask('vendors', ['clean:vendors', 'copy:vendors', 'uglify:vendors']);
    grunt.registerTask('serve', ['connect:server:keepalive']);
    grunt.registerTask('start', ['vendors', 'serve']);
    grunt.registerTask('watchers', ['copy:workers', 'concat:app', 'uglify:app', 'sass:vendors', 'less:vendors', 'less:app', 'cssmin:app', 'concurrent:watchers']);
	
    //  && http-server ./wwwroot -a localhost -o -P http://localhost:8080/
	
};
