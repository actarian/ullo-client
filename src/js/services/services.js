/*global angular,FB */

app.factory('FacebookService', ['$q', 'APP', function ($q, APP) {

    function FacebookService() {

    }

    function onFacebookStatus(response, deferred) {
        FacebookService.authResponse = null;
        if (response.status === 'connected') {
            FacebookService.authResponse = response.authResponse;
            deferred.resolve(response);
        } else if (response.status === 'not_authorized') {
            deferred.reject(response);
        } else {
            deferred.reject(response);
        }
    }

    FacebookService.FB = function () {
        var deferred = $q.defer();
        if (window['FB'] !== undefined) {
            deferred.resolve(window['FB']);
        } else {
            FacebookService.init().then(function (success) {
                deferred.resolve(window['FB']);
            }, function (error) {
                deferred.reject(error);
            })
        }
        return deferred.promise;
    }

    FacebookService.getFacebookMe = function () {
        var deferred = $q.defer();
        FacebookService.FB().then(function (facebook) {
            facebook.api('/me', { fields: 'id,name,first_name,last_name,email,gender,picture,cover,link' }, function (response) {
                if (!response || response.error) {
                    deferred.reject('Error occured');
                } else {
                    deferred.resolve(response);
                }
            });
        })
        return deferred.promise;
    };

    FacebookService.getPictureMe = function () {
        var deferred = $q.defer();
        FacebookService.FB().then(function (facebook) {
            facebook.api('/me/picture', { width: 300, height: 300, type: 'square' }, function (response) {
                if (!response || response.error) {
                    deferred.reject('Error occured');
                } else {
                    deferred.resolve(response);
                }
            });
        })
        return deferred.promise;
    };

    FacebookService.login = function () {
        var deferred = $q.defer();
        var isMobile = false;
        try {
            isMobile = window.navigator.standalone; // (window.location.href == top.location.href && window.location.href.indexOf("/mobile/") !== -1);
        } catch (e) { }
        if (!isMobile) {
            FacebookService.FB().then(function (facebook) {
                facebook.login(function (response) {
                    onFacebookStatus(response, deferred);
                }, {
                        scope: 'public_profile,email' // publish_stream,
                    });
            });
        } else {
            var permissionUrl = "https://m.facebook.com/dialog/oauth?client_id=" + APP.FACEBOOK_APP_ID + "&response_type=code&redirect_uri=" + APP.CLIENT + "&scope=" + 'public_profile,email';
            window.location.href = permissionUrl;
            return;
        }
        /*
        FacebookService.FB().then(function(facebook) {
            facebook.login(function(response) {
                onFacebookStatus(response, deferred);
            }, {
                scope: 'public_profile,email' // publish_stream,
                , redirect_uri: APP.CLIENT
            });
        });
        */
        return deferred.promise;
    }

    FacebookService.logout = function () {
        var deferred = $q.defer();
        FacebookService.FB().then(function (facebook) {
            facebook.logout(function (response) {
                deferred.resolve(response);
            });
        });
        return deferred.promise;
    }

    FacebookService.init = function () {
        var deferred = $q.defer();
        window.fbAsyncInit = function () {
            FB.init({
                appId: APP.FACEBOOK_APP_ID,
                status: true,
                cookie: true,
                xfbml: true,
                version: 'v2.5'
            });
            FB.getLoginStatus(function (response) {
                onFacebookStatus(response, deferred);
            });
        };

        try {
            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) { return; }
                js = d.createElement(s); js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            } (document, 'script', 'facebook-jssdk'));
        } catch (e) {
            deferred.reject(e);
        }
        return deferred.promise;
    }

    return FacebookService;

}]);

/** USERS SERVICE **/
app.factory('Users', ['$q', '$http', '$httpAsync', '$location', '$timeout', 'APP', 'LocalStorage', 'User', function ($q, $http, $httpAsync, $location, $timeout, APP, LocalStorage, User) {

    // PRIVATE VARIABLE FOR CURRENT USER
    var _currentUser = null;

    function Users() {
    }

    Users.prototype = {
    };

    // STATIC CLASS METHODS
    Users.currentUser = function () {
        return _currentUser;
    };

    Users.getCurrentUser = function () {
        var deferred = $q.defer();
        if (_currentUser) {
            deferred.resolve(_currentUser);
        } else {
            $http.get(APP.API + '/api/users/current/').then(function success(response) {
                if (response && response.data) {
                    _currentUser = new User(response.data);
                    deferred.resolve(_currentUser);
                } else {
                    deferred.resolve(null); // deferred.reject(null);
                }
            }, function error(response) {
                deferred.reject(response);
            });
        }
        return deferred.promise;
    };

    Users.isLogged = function () {
        var deferred = $q.defer();
        Users.getCurrentUser().then(function (user) {
            // console.log('Users.isLogged.success', user);
            user && user.isAuthenticated ? deferred.resolve(user) : deferred.reject();
        }, function error(response) {
            // console.log('Users.isLogged.error', data);
            deferred.reject(response);
        })
        return deferred.promise;
    };

    Users.isAdmin = function () {
        var deferred = $q.defer();
        Users.getCurrentUser().then(function (user) {
            user && user.isAuthenticated && user.isAdmin ? deferred.resolve(user) : deferred.reject();
        }, function error(response) {
            deferred.reject(response);
        })
        return deferred.promise;
    };

    Users.isLoggedOrGoTo = function(redirect) {
        var deferred = $q.defer();
        Users.getCurrentUser().then(function (user) {
            // console.log('Users.isLogged.success', user);
            if (user && user.isAuthenticated) {
                deferred.resolve(user);
            } else {
                deferred.reject();
                $location.path(redirect);
            }
        }, function error(response) {
            // console.log('Users.isLogged.error', data);
            deferred.reject(response);
            $location.path(redirect);
        })
        return deferred.promise;
    };

    Users.isAdminOrGoTo = function(redirect) {
        var deferred = $q.defer();
        Users.getCurrentUser().then(function (user) {
            // console.log('Users.isLogged.success', user);
            if (user && user.isAuthenticated && user.isAdmin) {
                deferred.resolve(user);
            } else {
                deferred.reject();
                $location.path(redirect);
            }
        }, function error(response) {
            // console.log('Users.isLogged.error', data);
            deferred.reject(response);
            $location.path(redirect);
        })
        return deferred.promise;
    },

    /** LOGIN METHODS **/
    Users.signup = function (model) {
        var deferred = $q.defer();
        $http.post(APP.API + '/api/users/signup/', model).then(function success(response) {
            _currentUser = new User(response.data);
            deferred.resolve(_currentUser);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Users.signin = function (model) {
        var deferred = $q.defer();
        $http.post(APP.API + '/api/users/signin/', model).then(function success(response) {
            _currentUser = new User(response.data);
            deferred.resolve(_currentUser);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Users.signInWithFacebook = function (auth) {
        var deferred = $q.defer();
        $http.post(APP.API + '/api/users/signinwithfacebook/', auth).then(function success(response) {
            _currentUser = new User(response.data);
            deferred.resolve(_currentUser);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Users.signout = function () {
        var deferred = $q.defer();
        $http.get(APP.API + '/api/users/signout/').then(function success(response) {
            _currentUser = null;
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Users.detail = function (userRoute) {
        var deferred = $q.defer();
        $http.get(APP.API + '/api/users/route/' + userRoute).then(function success(response) {
            deferred.resolve(new User(response.data));
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    return Users;
}]);

app.factory('Categories', ['$http', '$q', 'APP', function ($http, $q, APP) {

    function Categories() {
    }

    Categories.get = function () {
        var deferred = $q.defer();
        $http.get(APP.API + '/api/categories/').then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Categories.detail = function (categoryId) {
        var deferred = $q.defer();
        $http.get(APP.API + '/api/categories/' + categoryId).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    return Categories;
}]);

app.factory('DishesTest', ['APP', 'Dish', function (APP, Dish) {

    var uniqueId = 100;

    function getRandomItems() {
        var items = [];
        while (items.length < 10) {
            items.push({
                id: uniqueId,
                name: 'dish ' + uniqueId,
                price: 3.20,
                yes: Math.floor(Math.random() * 999),
                no: Math.floor(Math.random() * 999),
                pictures: [{
                    route: 'http://lorempixel.com/750/375/food/' + (1 + uniqueId % 10), // 'http://placehold.it/750x375',
                }],
                user: {
                    userName: 'User',
                }
            });
            uniqueId++;
        }
        return items;
    }

    function TestSource() {
    }
    TestSource.uri = {
        paging: false,
    };
    TestSource.resolve = function (rows) {
        var items = getRandomItems();
        angular.forEach(items, function (item) {
            this.push(new Dish(item));
        }, rows);
    };

    return TestSource;
}]);

app.factory('Posts', ['$http', '$q', 'APP', 'Post', function ($http, $q, APP, Post) {

    function Posts() {
    }
    Posts.uri = {
        paging: APP.API + '/api/stream/paged',
    };
    Posts.resolve = function (items, rows) {
        angular.forEach(items, function (item) {
            this.push(new Post(item));
        }, rows);
    };

    Posts.add = function (model) {
        var deferred = $q.defer();
        $http.post(APP.API + '/api/post/', model).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    return Posts;
}]);

app.factory('Dishes', ['$http', '$q', 'APP', 'Dish', function ($http, $q, APP, Dish) {

    function Dishes() {
    }
    Dishes.uri = {
        paging: APP.API + '/api/dishes/paged',
    };
    Dishes.resolve = function (items, rows) {
        angular.forEach(items, function (item) {
            this.push(new Dish(item));
        }, rows);
    };

    Dishes.detail = function (id) {
        var deferred = $q.defer();
        $http.get(APP.API + '/api/dishes/' + id).then(function success(response) {
            deferred.resolve(new Dish(response.data));
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Dishes.add = function (model) {
        var deferred = $q.defer();
        $http.post(APP.API + '/api/dishes/', model).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Dishes.get = function () {
        var deferred = $q.defer();
        $http.get(APP.API + '/api/dishes/').then(function success(response) {
            var rows = [];
            angular.forEach(response.data, function (item) {
                this.push(new Dish(item));
            }, rows);
            deferred.resolve(rows);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    return Dishes;
}]);

app.factory('DishesAutocomplete', ['$q', '$http', '$timeout', 'APP', function ($q, $http, $timeout, APP) {

    var MAX_ITEMS = 5;

    function DishesAutocomplete() {
    }

    DishesAutocomplete.prototype = {
        setPhrase: function (phrase) {
            // console.log('DishesAutocomplete.setPhrase', phrase);
            var deferred = $q.defer();
            $http.post(APP.API + '/api/dishes/autocomplete', { phrase: phrase }).then(function success(response) {
                var data = {
                    items: [],
                    count: response.data.length,
                };
                angular.forEach(response.data, function (v, i) {
                    if (i < MAX_ITEMS) {
                        var value = {
                            id: v.id,
                            name: v.name,
                        };
                        var offset = v.name.toLowerCase().indexOf(phrase.toLowerCase());
                        var length = phrase.length;
                        value.NameA = value.name.substr(0, offset);
                        value.NameB = value.name.substr(offset, length);
                        value.NameC = value.name.substr(offset + length, value.name.length - (offset + length));
                        data.items.push(value);
                    }
                });
                deferred.resolve(data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
        setItem: function (item) {
            var deferred = $q.defer();
            $http.get(APP.API + '/api/dishes/' + item.id).then(function success(response) {
                console.log('autoComplete.setItem', response.data);
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
    };

    return DishesAutocomplete;

}]);

app.factory('DataFilter', [function () {
    function DataFilter(data) {
        /*
        this.dateFrom = null;
        this.dateTo = null;
        this.search = null;
        this.status = null;
        */
        data ? angular.extend(this, data) : null;
    }
    DataFilter.prototype = {
        getSearchParams: function (search) {
            var a = [];
            if (search) {
                for (var p in search) {
                    a.push({ name: p, value: search[p] });
                }
            }
            return a;
        },
        getParams: function (source, infinite) {
            var post = {}, value;
            for (var p in this) {
                if (p === 'dateFrom' ||
                    p === 'dateTo' ||
                    p === 'status') {
                    value = this[p];
                    if (value !== undefined) {
                        post[p] = value;
                    }
                } else if (p === 'search') {
                    post[p] = JSON.stringify(this.getSearchParams(this[p]), null, '');
                }
            }
            post.page = source.page;
            post.size = source.size;
            post.infinite = infinite;
            return post;
        },
    };
    return DataFilter;
}]);

app.factory('DataSource', ['$q', '$http', '$httpAsync', '$timeout', '$rootScope', 'DataFilter', function ($q, $http, $httpAsync, $timeout, $rootScope, DataFilter) {

    var PAGES_MAX = Number.POSITIVE_INFINITY;

    function DataSource(data) {
        this.busy = false;
        this.error = false;
        this.size = 10;
        this.maxPages = 10;
        this.rows = [];
        this.filters = {};
        this.service = {
            url: '/api/items/paging',
            resolve: function (items, rows) {
                angular.forEach(items, function (item) {
                    this.push(item);
                }, rows);
            },
        };
        data ? angular.extend(this, data) : null;
        this.filters = new DataFilter(this.filters);
        // FAKE SERVICE FOR TEST !!!
        if (this.service.uri.paging === false) {
            this.get = function (deferred, infinite) {
                this.busy = true;
                this.error = false;
                $timeout(function () {
                    infinite ? null : this.rows.length = 0;
                    this.service.resolve(this.rows);
                    this.page = 1;
                    this.pages = 2;
                    this.count = this.rows.length;
                    this.pagination = this.getPages();
                    this.busy = false;
                    $rootScope.$broadcast('onDataSourceUpdate', this);
                    deferred.resolve(this.rows);
                    // console.log('DataSource.get');
                }.bind(this), 1000);
            };
        }
        this.flush();
    }
    DataSource.prototype = {
        flush: function () {
            this.pages = PAGES_MAX;
            this.page = 1;
            this.count = 0;
            this.opened = null;
        },
        resolve: function (response) {
            var responseHeader = response.headers('X-Pagination');
            var responseView = responseHeader ? JSON.parse(responseHeader) : null;
            // console.log('response', response, 'responseHeader', responseHeader, 'responseView', responseView);
            if (responseView) {
                this.page = responseView.page;
                this.size = responseView.size;
                this.pages = responseView.pages;
                this.count = responseView.count;
            } else {
                this.page = 0;
                this.size = responseView.size;
                this.pages = 0;
                this.count = 0;
            }
            this.pagination = this.getPages();
        },
        get: function (deferred, infinite) {
            this.busy = true;
            this.error = false;
            $httpAsync.get(this.service.uri.paging, { params: this.filters.getParams(this) }).then(function success(response) {
                this.resolve(response);
                infinite ? null : this.rows.length = 0;
                this.service.resolve(response.data, this.rows);
                $rootScope.$broadcast('onDataSourceUpdate', this);
                deferred.resolve(this.rows);
            }.bind(this), function error(response) {
                console.log('error.response', response);
                this.error = true;
                deferred.reject(response);
            }.bind(this))
                .finally(function () {
                    // console.log('DataSource.get');
                    $timeout(function () {
                        this.busy = false;
                    }.bind(this), 1000);
                }.bind(this));
        },
        paging: function () {
            var deferred = $q.defer();
            if (this.busy || this.page > this.pages) {
                deferred.reject();
            } else {
                // console.log('DataSource.paging');
                this.opened = null;
                this.get(deferred);
            }
            return deferred.promise;
        },
        refresh: function () {
            var deferred = $q.defer();
            if (this.busy) {
                deferred.reject();
            } else {
                // console.log('DataSource.refresh');
                this.flush();
                this.get(deferred);
            }
            return deferred.promise;
        },
        more: function () {
            var deferred = $q.defer();
            if (this.busy || this.page + 1 > this.pages) {
                deferred.reject();
            } else {
                // console.log('DataSource.more');
                this.page++;
                this.get(deferred, true);
            }
            return deferred.promise;
        },
        filter: function () {
            this.page = 1;
            this.pages = PAGES_MAX;
            this.paging();
        },
        prevPage: function () {
            var page = this.page - 1;
            if (page > 0 && page <= this.pages) {
                this.page = page;
                this.paging();
            }
        },
        nextPage: function () {
            var page = this.page + 1;
            if (page > 0 && page <= this.pages) {
                this.page = page;
                this.paging();
            }
        },
        gotoPage: function (page) {
            if (page > 0 && page <= this.pages) {
                this.page = page;
                this.paging();
            }
        },
        firstPage: function () {
            if (this.page !== 1) {
                this.page = 1;
                this.paging();
            }
        },
        lastPage: function () {
            if (this.page !== this.pages) {
                this.page = this.pages;
                this.paging();
            }
        },
        hasMany: function () {
            return this.count > 0 && this.pages > this.maxPages;
        },
        hasMorePagesBehind: function () {
            var startingIndex = Math.max(0, this.page - this.maxPages);
            return startingIndex > 0;
        },
        hasMorePagesNext: function () {
            var endingIndex = Math.max(0, this.page - this.maxPages) + this.maxPages;
            return endingIndex < this.pages;
        },
        isPage: function (number) {
            return this.page === number;
        },
        hasPages: function () {
            return this.pages > 0 && this.pages < PAGES_MAX;
        },
        getPages: function () {
            var a = [], i;
            if (this.hasPages()) {
                var startingIndex = Math.max(0, this.page - this.maxPages);
                var endingIndex = Math.min(this.pages, startingIndex + this.maxPages);
                i = startingIndex;
                while (i < endingIndex) {
                    a.push({ number: (i + 1) });
                    i++;
                }
            }
            return a;
        },
        openClose: function (index) {
            if (this.opened === index) {
                this.opened = null;
            } else {
                this.opened = index;
            }
        }
    };
    return DataSource;
}]);

app.factory('Cookie', ['$q', '$window', function ($q, $window) {
    function Cookie() {
    }
    Cookie.TIMEOUT = 5 * 60 * 1000; // five minutes
    Cookie._set = function (name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else {
            var expires = "";
        }
        $window.document.cookie = name + "=" + value + expires + "; path=/";
    }
    Cookie.set = function (name, value, days) {
        try {
            var cache = [];
            var json = JSON.stringify(value, function (key, value) {
                if (key === 'pool') {
                    return;
                }
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Circular reference found, discard key
                        return;
                    }
                    cache.push(value);
                }
                return value;
            });
            cache = null;
            Cookie._set(name, json, days);
        } catch (e) {
            console.log('Cookie.set.error serializing', name, value, e);
        }
    };
    Cookie.get = function (name) {
        var cookieName = name + "=";
        var ca = $window.document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(cookieName) == 0) {
                var value = c.substring(cookieName.length, c.length);
                var data = null;
                try {
                    data = JSON.parse(value);
                } catch (e) {
                    console.log('Cookie.get.error parsing', key, e);
                };
                return data;
            }
        }
        return null;
    };
    Cookie.delete = function (name) {
        Cookie._set(name, "", -1);
    };
    Cookie.on = function (name) {
        var deferred = $q.defer();
        var i, interval = 1000, elapsed = 0, timeout = Cookie.TIMEOUT;
        function checkCookie() {
            if (elapsed > timeout) {
                deferred.reject('timeout');
            } else {
                var c = Cookie.get(name);
                if (c) {
                    deferred.resolve(c);
                } else {
                    elapsed += interval;
                    i = setTimeout(checkCookie, interval);
                }
            }
        }
        checkCookie();
        return deferred.promise;
    };
    return Cookie;
}]);

app.factory('LocalStorage', ['$q', '$window', 'Cookie', function ($q, $window, Cookie) {
    function LocalStorage() {
    }
    function isLocalStorageSupported() {
        var supported = false;
        try {
            supported = 'localStorage' in $window && $window['localStorage'] !== null;
            if (supported) {
                $window.localStorage.setItem('test', '1');
                $window.localStorage.removeItem('test');
            } else {
                supported = false;
            }
        } catch (e) {
            supported = false;
        }
        return supported;
    }
    LocalStorage.isSupported = isLocalStorageSupported();
    if (LocalStorage.isSupported) {
        LocalStorage.set = function (name, value) {
            try {
                var cache = [];
                var json = JSON.stringify(value, function (key, value) {
                    if (key === 'pool') {
                        return;
                    }
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        cache.push(value);
                    }
                    return value;
                });
                cache = null;
                $window.localStorage.setItem(name, json);
            } catch (e) {
                console.log('LocalStorage.set.error serializing', name, value, e);
            }
        };
        LocalStorage.get = function (name) {
            var value = null;
            if ($window.localStorage[name] !== undefined) {
                try {
                    value = JSON.parse($window.localStorage[name]);
                } catch (e) {
                    console.log('LocalStorage.get.error parsing', name, e);
                }
            }
            return value;
        };
        LocalStorage.delete = function (name) {
            $window.localStorage.removeItem(name);
        };
        LocalStorage.on = function (name) {
            var deferred = $q.defer();
            var i, timeout = Cookie.TIMEOUT;
            function storageEvent(e) {
                // console.log('LocalStorage.on', name, e);
                clearTimeout(i);
                if (e.originalEvent.key == name) {
                    try {
                        var value = JSON.parse(e.originalEvent.newValue); // , e.originalEvent.oldValue
                        deferred.resolve(value);
                    } catch (e) {
                        console.log('LocalStorage.on.error parsing', name, e);
                        deferred.reject('error parsing ' + name);
                    }
                }
            }
            angular.element($window).on('storage', storageEvent);
            i = setTimeout(function () {
                deferred.reject('timeout');
            }, timeout);
            return deferred.promise;
        };
    } else {
        console.log('LocalStorage.unsupported switching to cookies');
        LocalStorage.set = Cookie.set;
        LocalStorage.get = Cookie.get;
        LocalStorage.delete = Cookie.delete;
        LocalStorage.on = Cookie.on;
    }
    return LocalStorage;
}]);

app.factory('Utils', ['Vector', function (Vector) {
    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                                       || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    }());

    var transformProperty = function detectTransformProperty() {
        var transformProperty = 'transform',
            safariPropertyHack = 'webkitTransform';
		var div = document.createElement("DIV");
        if (typeof div.style[transformProperty] !== 'undefined') {
            ['webkit', 'moz', 'o', 'ms'].every(function(prefix) {
                var e = '-' + prefix + '-transform';
                if (typeof div.style[e] !== 'undefined') {
                    transformProperty = e;
                    return false;
                }
                return true;
            });
        } else if (typeof div.style[safariPropertyHack] !== 'undefined') {
            transformProperty = '-webkit-transform';
        } else {
            transformProperty = undefined;
        }
        return transformProperty;
    } ();

    var _isTouch;
    function isTouch() {
        if (!_isTouch) {
            _isTouch = {
                value: ('ontouchstart' in window || 'onmsgesturechange' in window)
            }
        }
        // console.log(_isTouch);
        return _isTouch.value;
    }

    function getTouch(e, previous) {
        var t = new Vector();
        if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
            var touch = null;
            var event = e.originalEvent ? e.originalEvent : e;
            var touches = event.touches.length ? event.touches : event.changedTouches;
            if (touches && touches.length) {
                touch = touches[0];
            }
            if (touch) {
                t.x = touch.pageX;
                t.y = touch.pageY;
            }
        } else if (e.type == 'click' || e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover' || e.type == 'mouseout' || e.type == 'mouseenter' || e.type == 'mouseleave') {
            t.x = e.pageX;
            t.y = e.pageY;
        }
        if (previous) {
            t.s = Vector.difference(previous, t);
        }
        t.type = e.type;
        return t;
    }

    function getRelativeTouch(element, point) {
        var rect = element[0].getBoundingClientRect();
        var e = new Vector(rect.left,  rect.top);
        return Vector.difference(e, point);
    }

    function getClosest(el, selector) {
        var matchesFn, parent;
        ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
            if (typeof document.body[fn] == 'function') {
                matchesFn = fn;
                return true;
            }
            return false;
        });
        while (el !== null) {
            parent = el.parentElement;
            if (parent !== null && parent[matchesFn](selector)) {
                return parent;
            }
            el = parent;
        }
        return null;
    }


    var getNow = Date.now || function() {
        return new Date().getTime();
    };

    function throttle(func, wait, options) {
        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time. Normally, the throttled function will run
        // as much as it can, without ever going more than once per `wait` duration;
        // but if you'd like to disable the execution on the leading edge, pass
        // `{leading: false}`. To disable execution on the trailing edge, ditto.
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function () {
            previous = options.leading === false ? 0 : getNow();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function () {
            var now = getNow();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    }

    var Style = function() {
        function Style() {
            this.props = {
                scale: 1,
                hoverScale: 1,
                currentScale: 1,
            }
        }
        Style.prototype = {
            set: function (element) {
                var styles = [];
                angular.forEach(this, function (value, key) {
                    if (key !== 'props')
                        styles.push(key + ':' + value);
                });
                element.style.cssText = styles.join(';') + ';';
            },
            transform: function (transform) {
                this[Utils.transformProperty] = transform;
            },
            transformOrigin: function (x, y) {
                this[Utils.transformProperty + '-origin-x'] = (Math.round(x * 1000) / 1000) + '%';
                this[Utils.transformProperty + '-origin-y'] = (Math.round(y * 1000) / 1000) + '%';
            },
        };
        return Style;
    }();

    function Utils() {
    }

	Utils.transformProperty = transformProperty;
    Utils.getTouch = getTouch;
    Utils.getRelativeTouch = getRelativeTouch;
    Utils.getClosest = getClosest;
    Utils.throttle = throttle;
    Utils.Style = Style;

    return Utils;
}]);
