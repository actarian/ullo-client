/*global angular,FB */

app.value('UserRoles', [{
    name: 'Guest', id: 1
}, {
    name: 'User', id: 2
}, {
    name: 'Supervisor', id: 3
}, {
    name: 'Admin', id: 4
}]);

app.value('UserRolesEnum', {
    'Guest': 1,
    'User': 2,
    'Supervisor': 3,
    'Admin': 4,
});

app.factory('User', ['UserRolesEnum', function (UserRolesEnum) {
    function User(data) {
        // Extend instance with data
        data ? angular.extend(this, data) : null;
    }
    User.prototype = {
        // If user instance is in role Administrator
        isAdmin: function () {
            return this.role === UserRolesEnum.Admin;
        },
        // If user parameters equals user instance
        isUser: function (user) {
            return this.email === user.email;
        },
        picture: function (size) {
          size = size || 'sm';
          var w;
          switch(size) {
              case 'sm':
                w = 50;
              break;
              case 'md':
                w = 300;
              break;
              default:              
          }
          return this.facebookId ? 'https://graph.facebook.com/'+ this.facebookId +'/picture?width=' + w + '&height=' + w + '&type=square' : '/img/avatar-default.png';             
            // return this.facebookPicture ? this.facebookPicture : '/img/avatar-default.png';     
        },
        backgroundPicture: function(size) {
            return 'background-image: url(' + this.picture(size) + ');';   
        },
    };
    return User;
}]);

app.factory('Post', ['$q', '$http', '$timeout', 'APP', 'User', 'Dish', 'Upload', function($q, $http, $timeout, APP, User, Dish, Upload) {

	function Post(data) {
        data ? angular.extend(this, data) : null;
        this.user = new User(this.user);
        this.dish = new Dish(this.dish);
    }
    Post.prototype = {
		upload: function(file) {
            console.log('Post.upload', this.id, file);
            var self = this;
            var name = file.name.substr(0, file.name.lastIndexOf('.'));
            var extension = file.name.substr(file.name.lastIndexOf('.'));
            console.log('onUpload', name, extension);
            var uploadData = {
                model: this,
                id: this.id,
                assetType: 1,
                name: name,
                extension: extension,
                progress: 0,
            };
            this.uploads = this.uploads || [];
            this.uploads.push(uploadData);
            Upload.upload({
                url: APP.API + 'api/assets/',
                data: { file: file, uploadData: JSON.stringify(uploadData) }
            }).then(function (response) {
                console.log('Success ' + response.config.data.file.name + ' uploaded. Response: ' + response.data);
                self.pictures = (self.pictures || []).concat(response.data);
                uploadData.progress = 100;
                $timeout(function () {
                    var has = -1;
                    angular.forEach(self.uploads, function (upload, i) {
                        if (upload === uploadData) {
                            has = i;
                        }
                    });
                    if (has != -1) {
                        self.uploads.splice(has, 1);
                    }
                }, 2000);
            }, function (response) {
                console.log('Error status: ' + response.status);
                uploadData.progress = 0;
            }, function (event) {
                if (event.config.data.file) {
                    var progressPercentage = Math.round(100.0 * event.loaded / event.total);
                    uploadData.progress = progressPercentage;
                    console.log('progress: ' + progressPercentage + '% ' + event.config.data.file.name);
                }
            });
		},
		voteCount: function() {
			return this.yes + this.no;
		},
		rating: function() {
			var count = this.voteCount();
			return count > 0 ? this.yes / count : 0;
		},
        ratingToString: function() {
			var rating = this.rating();
			return rating > 0 ? Math.round( rating * 100 ) / 10 : '0.0';
		},
    };
    return Post;

}]);

app.factory('Dish', ['$q', '$http', '$timeout', 'APP', 'User', 'Upload', function($q, $http, $timeout, APP, User, Upload) {

	function Dish(data) {
        this.extend(data);
    }
    Dish.prototype = {
        extend: function(data) {
            data ? angular.extend(this, data) : null;
            this.user = new User(this.user);
            if (this.votes) {
                angular.forEach(this.votes, function(vote) {
                    vote.user = new User(vote.user);   
                });
            }
        },
		like: function(like) {
            var self = this;
            var deferred = $q.defer();
            $http.post(APP.API + '/api/dishes/vote', { dishId: this.id, like: like }).then(function success(response) {
                self.extend(response.data);
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
		},
		upload: function(file) {
            console.log('Dish.upload', this.id, file);
            var self = this;
            var name = file.name.substr(0, file.name.lastIndexOf('.'));
            var extension = file.name.substr(file.name.lastIndexOf('.'));
            console.log('onUpload', name, extension);
            var uploadData = {
                model: this,
                id: this.id,
                assetType: 1,
                name: name,
                extension: extension,
                progress: 0,
            };
            this.uploads = this.uploads || [];
            this.uploads.push(uploadData);
            Upload.upload({
                url: APP.API + 'api/assets/',
                data: { file: file, uploadData: JSON.stringify(uploadData) }
            }).then(function success(response) {
                console.log('Success ' + response.config.data.file.name + ' uploaded. Response: ' + response.data);
                self.pictures = (self.pictures || []).concat(response.data);
                uploadData.progress = 100;
                $timeout(function () {
                    var has = -1;
                    angular.forEach(self.uploads, function (upload, i) {
                        if (upload === uploadData) {
                            has = i;
                        }
                    });
                    if (has != -1) {
                        self.uploads.splice(has, 1);
                    }
                }, 2000);
            }, function error(response) {
                console.log('Error status: ' + response.status);
                uploadData.progress = 0;
            }, function progress(event) {
                if (event.config.data.file) {
                    var progressPercentage = Math.round(100.0 * event.loaded / event.total);
                    uploadData.progress = progressPercentage;
                    console.log('progress: ' + progressPercentage + '% ' + event.config.data.file.name);
                }
            });
		},
		voteCount: function() {
			return this.yes + this.no;
		},
		rating: function() {
			var count = this.voteCount();
			return count > 0 ? this.yes / count : 0;
		},
        ratingToString: function() {
			var rating = this.rating();
			return rating > 0 ? Math.round( rating * 100 ) / 10 : '0.0';
		},
    };
    return Dish;

}]);
