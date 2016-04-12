/*global angular,FB */

app.controller('RootCtrl', ['$scope', '$location', '$q', 'FacebookService', 'Users', function ($scope, $location, $q, FacebookService, Users) {

    $scope.Users = Users;

    $scope.signOut = function () {
        if ($scope.logoutBusy) {
            return;
        }
		$scope.logoutBusy = true;
		$q.all([
			Users.signout(),
			FacebookService.logout()
		]).then(function(data) {
			$location.path('/splash');
		}, function(error) {
			console.log('signOut.error', error);
		}).finally(function() {
			$scope.logoutBusy = false;
		});
    };

    $scope.goStream = function () {
        $location.path('/stream');
    };

    $scope.goPost = function () {
        $location.path('/post');
    };

    $scope.goDish = function (dishId) {
        $location.path('/dishes/' + dishId);
    };

    $scope.goCategory = function (categoryId) {
        $location.path('/categories/' + categoryId);
    };

    $scope.goUser = function (userRoute) {
        $location.path('/users/' + userRoute);
    };

    $scope.goSettings = function () {
        $location.path('/settings');
    };

}]);

app.controller('SplashCtrl', ['$scope', '$location', '$timeout', '$window', 'FacebookService', 'Users', function ($scope, $location, $timeout, $window, FacebookService, Users) {

    $scope.splashBusy = true;

	$timeout(function() {
		FacebookService.getLoginStatus().then(function(success) {
			console.log('SplashCtrl.getLoginStatus.success', success.authResponse);
			signinOrSignup(success.authResponse);

		}, function(error) {
			console.log('SplashCtrl.getLoginStatus.error', error);
			$scope.showFacebookLoginButton = true;

		}).finally(function() {
			$scope.splashBusy = false;
		});
	}, 1000);

    function signinOrSignup(auth) {
        $scope.splashBusy = true;
        Users.signInWithFacebook(auth).then(function(success) {
            $location.path('/stream');
        }, function(error) {
            $location.path('/signup');
        }).finally(function() {
            $scope.splashBusy = false;
        });
    }

    $scope.onFacebookLogin = function() {
        $scope.splashBusy = true;
        FacebookService.login().then(function(success) {
            signinOrSignup(success.authResponse);
        }, function(error) {
            console.log('onFacebookLogin', error);
        }).finally(function() {
            $scope.splashBusy = false;
        });
    };

}]);

app.controller('SigninCtrl', ['$scope', '$location', 'Users', 'FacebookService', function ($scope, $location, Users, FacebookService) {

    $scope.model = {};

    $scope.signin = function () {
        $scope.signinFormError = null;
        $scope.signinFormBusy = true;
        Users.signin($scope.model).then(function (user) {
            $location.path('/stream');
        }, function (error) {
            $scope.signinFormError = error.message;
        }).finally(function () {
            $scope.signinFormBusy = false;
        });
    };

}]);

app.controller('SignupCtrl', ['$scope', '$location', 'FacebookService', 'Users', function ($scope, $location, FacebookService, Users) {

    FacebookService.getFacebookMe().then(function(me) {
        console.log('SignupCtrl.getFacebookMe', me);
        $scope.model = {
            userName : me.name,
            email : me.email,
            firstName : me.first_name,
            lastName : me.last_name,
            facebookId : me.id,
            facebookPicture : me.picture.data.url,
            facebookToken : FacebookService.authResponse.accessToken,
        };
    }, function(error) {
        console.log('SignupCtrl.getFacebookMe.error', error);
    });

    $scope.signup = function () {
        console.log('SignupCtrl.signup', $scope.model);
        $scope.signupFormError = null;
        $scope.signupFormBusy = true;
        Users.signup($scope.model).then(function (user) {
            $location.path('/stream');
        }, function (error) {
            $scope.signupFormError = error.data.message;
        }).finally(function () {
            $scope.signupFormBusy = false;
        });
    };

}]);

app.controller('StreamCtrl', ['$scope', '$location', '$timeout', 'DataSource', 'Posts', 'Upload', function ($scope, $location, $timeout, DataSource, Posts, Upload) {

    $scope.filters = {
        search: {
        }
    };

    $scope.source = new DataSource({
        service: Posts,
        filters: $scope.filters
    });

    $scope.source.paging();

    $scope.onUploadFileSelected = function(file, newFiles) {
        if (!file) {
            return;
        }
        $scope.$root.pictureBase64 = null;
        Upload.dataUrl(file, true).then(function (url) {
            $scope.$root.pictureBase64 = url;
            $location.path('/post');
        });
    };

}]);

app.controller('PostCtrl', ['$scope', '$timeout', '$location', 'Upload', 'Categories', 'Posts', 'DishesAutocomplete', function ($scope, $timeout, $location, Upload, Categories, Posts, DishesAutocomplete) {

    Categories.get().then(function(categories) {
        $scope.categories = categories;
    })

    $scope.dishesAutocomplete = new DishesAutocomplete();

    $scope.model = {
        pictureBase64: $scope.$root.pictureBase64 || null,
        dish: {
            categories: [],
        }
    };

    $scope.onUploadFileSelected = function(file, newFiles) {
        $scope.model.pictureBase64 = null;
        Upload.dataUrl(file, true).then(function (url) {
            $scope.model.pictureBase64 = url;
        });
    };

    $scope.hasPicture = function () {
        var has = $scope.model.pictureBase64 !== null;
        $scope.pictureError = true;
        $timeout(function () {
            $scope.pictureError = false;
        }, 1000);
        return has;
    };

    $scope.onDishSelected = function(item) {
        console.log('onDishSelected', item);
        $scope.model.dish.id = item.id;
        $scope.model.dish.price = item.price;
        $scope.model.dish.categories = item.categories;
        $scope.model.dish.isVeganFriendly = item.isVeganFriendly;
    };

    $scope.submitPost = function () {
        console.log('PostCtrl.submitPost', $scope.model);
        $scope.postFormBusy = true;
        $scope.postFormError = null;
        $timeout(function () {
            Posts.add($scope.model).then(function(post) {
                $scope.model.id = post.id;
                $location.path('/stream');
            }, function(error) {
                $scope.postFormError = error.config.url + ' ' + error.status + ' ' + error.statusText;
            }).finally(function(){
                $scope.postFormBusy = false;
            });
        }, 1);
    };

}]);

app.controller('DishCtrl', ['$scope', '$routeParams', 'Dishes', function ($scope, $routeParams, Dishes) {

    Dishes.detail($routeParams.dishId).then(function(item) {
       $scope.item = item;
    });

}]);

app.controller('CategoryCtrl', ['$scope', '$routeParams', 'Categories', 'DataSource', 'Dishes', function ($scope, $routeParams, Categories, DataSource, Dishes) {

    Categories.detail($routeParams.categoryId).then(function(category) {
       $scope.category = category;

       $scope.filters = {
            search: {
                Category: category.name
            }
        };

        $scope.source = new DataSource({
            service: Dishes,
            filters: $scope.filters
        });

        $scope.source.paging();

    });

}]);

app.controller('UserCtrl', ['$scope', '$routeParams', 'Users', 'DataSource', 'Dishes', function ($scope, $routeParams, Users, DataSource, Dishes) {

    Users.detail($routeParams.userRoute).then(function(user) {
       $scope.user = user;

       $scope.filters = {
            search: {
                UserName: user.userName
            }
        };

        $scope.source = new DataSource({
            service: Dishes,
            filters: $scope.filters
        });

        $scope.source.paging();

    });

}]);

app.controller('SettingsCtrl', ['$scope', '$routeParams', 'Users', function ($scope, $routeParams, Users) {

    $scope.user = Users.currentUser();

}]);

app.controller('TestCtrl', ['$scope', '$location', '$timeout', 'DataSource', 'DishesTest', function ($scope, $location, $timeout, DataSource, DishesTest) {

    $scope.filters = {
        search: {
        }
    };

    $scope.source = new DataSource({
        service: DishesTest,
        filters: $scope.filters
    });

    $timeout(function() {
        $scope.source.paging();
    }, 1000);

}]);
