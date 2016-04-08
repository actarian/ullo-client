/*global angular,FB */

var LESSON = true;

var app = angular.module('ullo', ['ngRoute', 'ngMessages', 'ngAnimate', 'relativeDate', 'ngFileUpload']);

app.constant('APP', {
    CLIENT: window.location.href.indexOf('http://ulloclient.wslabs.it') === 0 ? 'http://ulloclient.wslabs.it' : 'http://dev.ullowebapp:8081',
    API: LESSON || window.location.href.indexOf('http://ulloclient.wslabs.it') === 0 ? 'http://ulloapi.wslabs.it' : 'https://localhost:44302',
    FACEBOOK_APP_ID: window.location.href.indexOf('http://ulloclient.wslabs.it') === 0 ? '1054303094614120' : '1062564893787940',
    assetTypeEnum: {
        Unknown: 0,
        Picture: 1,
    },
    IOS: (navigator.userAgent.match(/iPad|iPhone|iPod/g) ? true : false),
});

app.config(['$httpProvider', '$routeProvider', '$locationProvider', function ($httpProvider, $routeProvider, $locationProvider) {

    $httpProvider.defaults.withCredentials = true;
    
    $routeProvider.when('/test', {

        title: 'Test',
        templateUrl: 'templates/dishes.html',
        controller: 'TestCtrl',
        controllerAs: 'testCtrl',

    }).when('/', {

        title: 'Stream',
        templateUrl: 'templates/stream.html',
        controller: 'StreamCtrl',
        controllerAs: 'streamCtrl',
        resolve: {
            user: ['Users', function(Users){
                return Users.isLoggedOrGoTo('/splash');
            }]
        },

    }).when('/stream', {

        title: 'Stream',
        templateUrl: 'templates/stream.html',
        controller: 'StreamCtrl',
        controllerAs: 'streamCtrl',
        resolve: {
            user: ['Users', function(Users){
                return Users.isLoggedOrGoTo('/splash');
            }]
        },

    }).when('/splash', {

        title: 'Splash',
        templateUrl: 'templates/splash.html',
        controller: 'SplashCtrl',
        controllerAs: 'splashCtrl',

    }).when('/signin', {

        title: 'Sign In',
        templateUrl: 'templates/signin.html',
        controller: 'SigninCtrl',
        controllerAs: 'signinCtrl',

    }).when('/signup', {

        title: 'Sign Up',
        templateUrl: 'templates/signup.html',
        controller: 'SignupCtrl',
        controllerAs: 'signupCtrl',

    }).when('/dishes/:dishId', {

        title: 'Dish',
        templateUrl: 'templates/dish.html',
        controller: 'DishCtrl',
        controllerAs: 'dishCtrl',
        resolve: {
            user: ['Users', function(Users){
                return Users.isLoggedOrGoTo('/splash');
            }]
        },
        isForward: true,

    }).when('/categories/:categoryId', {

        title: 'Category',
        templateUrl: 'templates/category.html',
        controller: 'CategoryCtrl',
        controllerAs: 'categoryCtrl',
        resolve: {
            user: ['Users', function(Users){
                return Users.isLoggedOrGoTo('/splash');
            }]
        },
        isForward: true,

    }).when('/users/:userRoute', {

        title: 'User',
        templateUrl: 'templates/user.html',
        controller: 'UserCtrl',
        controllerAs: 'userCtrl',
        resolve: {
            user: ['Users', function(Users){
                return Users.isLoggedOrGoTo('/splash');
            }]
        },
        isForward: true,

    }).when('/post', {

        title: 'Add Post',
        templateUrl: 'templates/post.html',
        controller: 'PostCtrl',
        controllerAs: 'postCtrl',
        resolve: {
            user: ['Users', function(Users){
                return Users.isLoggedOrGoTo('/splash');
            }]
        },
        isForward: true,

    }).when('/settings', {

        title: 'Settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsCtrl',
        controllerAs: 'settingsCtrl',
        resolve: {
            user: ['Users', function(Users){
                return Users.isLoggedOrGoTo('/splash');
            }]
        },
        isForward: true,

    }).when('/404', {

        title: 'Error 404',
        templateUrl: '404.html',

    });

    $routeProvider.otherwise('/stream');

    // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
    $locationProvider.html5Mode(true);

}]);

app.run(['$rootScope', '$window', 'APP', function ($rootScope, $window, APP) {

    $rootScope.standalone = $window.navigator.standalone;

    document.ontouchmove = function (event) {
        event.preventDefault();
        // event.stopPropagation();
        // return false;
    }

    window.oncontextmenu = function (event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    };

    /*
    $rootScope.$on('$routeChangeSuccess', function($scope, nextRoute, lastRoute) {
        console.log('app.$routeChangeSuccess', 'nextRoute', nextRoute, 'lastRoute', lastRoute);
    });
    */

    function Picture(route, size) {
        if (route.indexOf('http') === 0) {
            return route;
        } else if (size) {
            return APP.API + route + '?media=' + size;
        } else {
            return APP.API + route;
        }
    }

    $rootScope.getPictures = function (model, size) {
        size;
        var src = '/img/preview.png';
        if (!model) {
            return src;
        }
        if (model.pictures) {
            for (var i = 0; i < model.pictures.length; i++) {
                var media = model.pictures[i];
                if (media.route) {
                    src = Picture(media.route, size);
                    i = 100000;
                }
            }
        } else if (model.route) {
            src = Picture(model.route, size);
        }
        return src;
    };

    $rootScope.getPicture = function (model, size) {
        size;
        var src = '/img/preview.png';
        if (!model) {
            return src;
        }
        if (model.picture && model.picture.route) {
            src = Picture(model.picture.route, size);
        } else if (model.route) {
            src = Picture(model.route, size);
        }
        return src;
    };

    // BROADCAST LISTENER
    $rootScope.broadcast = function (event, params) {
        $rootScope.$broadcast(event, params);
    };

    // WOW ANIMATION
    /*
    new WOW({
        boxClass: 'wow',
        animateClass: 'animated',
        offset: -20,
        mobile: true,
        live: true
    }).init();
    */

    /*
    // FONT PRELOADER
    setTimeout(function () {

        var fontAkzidenz400 = new FontFaceObserver("Akzidenz", {
            weight: 400
        });
        var fontAkzidenz500 = new FontFaceObserver("Akzidenz", {
            weight: 500
        });
        var fontAkzidenzCondensed = new FontFaceObserver("Akzidenz Condensed", {
            weight: 700
        });
        Promise.all([
            fontAkzidenz400.check(),
            fontAkzidenz500.check(null, 1000),
            fontAkzidenzCondensed.check(),
        ]).then(function () {
            document.documentElement.className += " fonts-loaded";
        }, function () {
            document.documentElement.className += " fonts-timeout";
        });

    }, 0);
    */

}]);

/*
app.provider('user', function userProvider() {        
    // In the provider function, you cannot inject any
    // service or factory. This can only be done at the
    // "$get" method.
    this.$get = ['$q', '$location', 'Users', function ($q, $location, Users) {
        return {
            isLoggedOrGoTo: function(redirect) {
                var deferred = $q.defer();
                Users.isLogged().then(function (user) {
                    console.log('isLogged.success', user);
                    deferred.resolve(user);
                }, function (error) {
                    console.log('isLogged.error', error);
                    deferred.reject();
                    $location.path(redirect);
                });
                return deferred.promise;
            },
            isAdminOrGoTo: function(redirect) {
                var deferred = $q.defer();
                Users.isAdmin().then(function (user) {
                    deferred.resolve(user);
                }, function () {
                    deferred.reject();
                    $location.path(redirect);
                });
                return deferred.promise;
            },
            isLogged: function() {
                return this.isLoggedOrGoTo('/splash');
            },
            isAdmin: function() {
                return this.isAdminOrGoTo('/splash');
            }
        }
    }];
});
*/