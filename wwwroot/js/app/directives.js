/*global angular,FB,dynamics */

app.directive('onTap', ['$window', '$timeout', function ($window, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes, model) {
            function onTap(e) {
                /*
                var down = Utils.getTouch(e);
                var r = Utils.getRelativeTouch(element, down);
                console.log('onTap', down, r);
                */
                element.addClass('tapped');
                $timeout(function(){
                    element.removeClass('tapped');
                }, 500)
            };
            function addListeners() {
                element.on('touchstart mousedown', onTap);
            };
            function removeListeners() {
                element.off('touchstart mousedown', onTap);
            };
            scope.$on('$destroy', function () {
                removeListeners();
            });
            addListeners();
        }
    }
}]);

app.directive('animate', ['$window', '$timeout', function ($window, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes, model) {
            element.addClass('animated');
            var animate = ['fadeIn'], delays = ['1'];
            if (attributes.animate !== undefined) {
                animate = attributes.animate.split(',');
            } 
            if (attributes.delay !== undefined) {
                delays = attributes.delay.split(',');
            }
            angular.forEach(delays, function(d, i) {
                delays[i] = parseInt(d);
            });
            while(delays.length < animate.length) {
                delays.push(delays[delays.length-1] + 50);
            }
            var removeClasses = animate.join(' '); 
            if (animate[0].indexOf('In') !== -1) {
                element.addClass('invisible');
                removeClasses += ' invisible';
            }
            while(animate.length) {
                var d = delays.shift();
                var a = animate.shift();
                $timeout(function(){
                    element.removeClass(removeClasses);
                    element.addClass(a);
                    if (animate.length === 0 && a.indexOf('Out') !== -1) {
                        $timeout(function(){
                            element.addClass('invisible');
                        }, 1000);
                    }
                }, d);
            }
            /* 
            $timeout(function() {
                element.removeClass('animated');
                dynamics.animate(element[0], {
                    translateX: 350
                }, {
                    type: dynamics.spring
                });
                console.log('dynamics', dynamics);                
            }, 5000);
            */           
        }
    }
}]);

app.directive('validateType', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attributes, model) {
            var type = attributes.validateType;
            switch (type) {
                case 'number':
                    model.$parsers.unshift(function (value) {
                        // console.log('validateType', type, value, Number(value).toString() == String(value), angular.isNumber(Number(value)));
                        model.$setValidity(type, String(value).indexOf(Number(value).toString()) !== -1);
                        return value;
                    });
                    break;
            }
        }
    };
});

app.directive('control', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        replace: true,
        template: function (element, attributes) {
            var form = attributes.form || 'Form';
            var title = attributes.title || 'Untitled';
            var placeholder = attributes.placeholder || title;
            var name = title.replace(/[^0-9a-zA-Z]/g, "").split(' ').join('');
            var formKey = form + '.' + name;
            var formFocus = ' ng-focus="' + formKey + '.hasFocus=true" ng-blur="' + formKey + '.hasFocus=false"';
            var required = '';
            var label = (attributes.label ? attributes.label : 'name');
            var key = (attributes.key ? attributes.key : 'id');
            var model = attributes.model;
            if (attributes.required) {
                required = '<span ng-messages="' + (attributes.readonly ? '' : '(' + form + '.$submitted || ' + formKey + '.$touched) && ') + form + '.' + name + '.$error" role="alert"><span ng-message="required" class="label-error animated flash"> &larr; required</span>';
                switch (attributes.control) {
                    case 'password':
                        required = required + '<span ng-message="minlength" class="label-error animated flash"> &larr; at least 6 chars</span>';
                        break;
                    case 'email':
                        required = required + '<span ng-message="email" class="label-error animated flash"> &larr; incorrect</span>';
                        break;
                    case 'number':
                        required = required + '<span ng-message="number" class="label-error animated flash"> &larr; enter a valid number</span>';
                        break;
                }
                if (attributes.match !== undefined) {
                    required = required + '<span ng-message="match" class="label-error animated flash"> &larr; not matching</span>';
                }
                required = required + '</span>';
            } else {
                required = ' (optional)';
            }
            var template = '<div ' + (attributes.readonly ? ' class="readonly" ' : '' ) + ' ng-class="{ focus: '+formKey+'.hasFocus, success: '+formKey+'.$valid, error: '+formKey+'.$invalid && (form.$submitted || '+formKey+'.$touched), empty: !'+formKey+'.$viewValue }"><label for="' + name + '" class="control-label">' + title + required + '</label>';
            switch (attributes.control) {
                case 'checkbox':                
                    template = '<div class="checkbox">';
                    template += '<span class="checkbox-label">' + title + required + '</span>';
                    template += '<span class="switch"><input id="' + name + '" name="' + name + '" type="checkbox" ng-model="' + model + '" ' + (attributes.required ? 'required="true"' : '') + ' class="toggle toggle-round-flat"><label for="' + name + '"></label></span>';
                    template += '</div>';
                    break;
                case 'select':
                    var options = attributes.number
                        ? 'item.' + key + ' as item.' + label + ' for item in ' + attributes.source
                        : 'item.' + label + ' for item in ' + attributes.source + ' track by item.' + key;
                    template += '<select name="' + name + '" class="form-control" ng-model="' + model + '" ng-options="' + options + '" ' + (attributes.number ? 'convert-to-number' : '') + ' ' + (attributes.required ? 'required="true"' : '') + '><option value="" disabled selected hidden>' + placeholder + '</option></select>';
                    break;
                case 'autocomplete':
                    var canCreate = (attributes.canCreate ? attributes.canCreate : false);
                    var flatten = (attributes.flatten ? attributes.flatten : false);
                    var queryable = (attributes.queryable ? attributes.queryable : false);
                    var onSelected = (attributes.onSelected ? ' on-selected="' + attributes.onSelected + '"' : '');
                    template += '<input name="' + name + '" ng-model="' + model + '" type="hidden" ' + (attributes.required ? 'required' : '') + '>';
                    template += '<div control-autocomplete="' + attributes.source + '" model="' + model + '" label="' + label + '"  key="' + key + '" can-create="' + canCreate + '" flatten="' + flatten + '" queryable="' + queryable + '" placeholder="' + placeholder + '" on-focus="' + formKey + '.hasFocus=true" on-blur="' + formKey + '.hasFocus=false"' + onSelected + '></div>';
                    break;
                case 'textarea':
                    template += '<textarea name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" ' + (attributes.required ? 'required' : '') + ' rows="' + (attributes.rows ? attributes.rows : '1') + '"' + formFocus + '></textarea>';
                    break;
                case 'datetime-local':
                    placeholder == title ? placeholder = 'yyyy-MM-ddTHH:mm:ss' : null;                    
                    // placeholder="yyyy-MM-ddTHH:mm:ss" min="2001-01-01T00:00:00" max="2013-12-31T00:00:00" 
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="datetime-local"' + (attributes.required ? ' required' : '') + (attributes.readonly ? ' readonly' : '') + formFocus + '>';
                    break;
                case 'password':
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="password" ng-minlength="6" ' + (attributes.required ? 'required' : '') + formFocus + '>';
                    break;
                case 'email':
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="email" ' + (attributes.required ? 'required' : '') + formFocus + '>';
                    break;
                case 'number':
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="text"' + (attributes.required ? ' required' : '') + (attributes.readonly ? ' readonly' : '') + formFocus + ' validate-type="number">'; // ' validator="{ number: isNumber }">';
                    break;
                case 'text':
                default:
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="text"' + (attributes.required ? ' required' : '') + (attributes.readonly ? ' readonly' : '') + formFocus + '>';
                    break;
            }
            return template + '</div>';
        },
        link: function (scope, element, attributes, model) {

        },
    };
}]);

app.directive('controlAutocomplete', ['$parse', '$window', '$timeout', function ($parse, $window, $timeout) {
    
    var MAX_ITEMS = 5;
    
    return {
        restrict: 'A',
        scope: {
            service: '=controlAutocomplete',
            canCreate: '=',
            flatten: '=',
            queryable: '=',
            model: '=',
            label: '@',
            key: '@',
        },
        template: function (element, attributes) {
            var template = '<div>';
            template += '   <input class="form-control" ng-model="phrase" ng-model-options="{ debounce: 150 }" placeholder="' + attributes.placeholder + '" type="text" ng-focus="onFocus()">';
            template += '   <ul class="form-autocomplete" ng-show="items.length">';
            template += '       <li ng-repeat="item in items" ng-class="{ active: active == $index }" ng-click="onSelect(item)">';
            template += '           <span>{{item.NameA}}<span class="token">{{item.NameB}}</span>{{item.NameC}}</span>';
            template += '       </li>';
            template += '   </ul>';
            template += '</div>';
            return template;
        },
        link: function (scope, element, attributes, model) {
            
            var onSelected = $parse(attributes.onSelected);
            
            // console.log ('onSelected', onSelected);
            
            var input = element.find('input');            
            var label = (scope.label ? scope.label : 'name');
            var key = (scope.key ? scope.key : 'id');

            function getPhrase() {
                if (scope.model) {
                    return scope.flatten ? scope.model : scope.model[label];   
                } else {
                    return null;
                }
            }

            scope.phrase = getPhrase();
            scope.count = 0;
            scope.items = [];
            scope.active = -1;
            scope.maxItems = scope.maxItems || Number.POSITIVE_INFINITY;

            function Clear(phrase) {
                scope.items.length = 0;
                scope.count = 0;
                scope.phrase = phrase || null;
                input.val(scope.phrase);
            }

            function Current() {
                var current = null;
                if (scope.active != -1 && scope.items.length > scope.active) {
                    current = scope.items[scope.active];
                }
                return current;
            }

            scope.onFocus = function () {
                if (attributes.onFocus !== undefined) {
                    scope.$parent.$eval(attributes.onFocus);
                }
                if (input.val() === getPhrase()) {
                    input.val(null);
                }
            };

            scope.onBlur = function () {
                if (attributes.onBlur !== undefined) {
                    scope.$parent.$eval(attributes.onBlur);
                }
                Clear(getPhrase());
            };

            scope.onSelect = function (item) {
                if (scope.queryable) {
                    scope.service.setItem(item).then(function (parsedItem) {
                        onSelected({ $item : parsedItem }, scope.$parent, { $event: {} });
                        $timeout(function () {
                            if (scope.flatten) {
                                scope.model = parsedItem[key];
                            } else {
                                scope.model = scope.model || {};
                                angular.extend(scope.model, parsedItem);
                            }
                            scope.onBlur();
                        }, 1);
                    });
                } else {                    
                    onSelected({ $item : item }, scope.$parent, { $event: {} });
                    if (scope.flatten) {
                        scope.model = item[key];
                    } else {
                        scope.model = scope.model || {};                                
                        angular.extend(scope.model, item);
                    }
                    scope.onBlur();
                }
            };
            
            function onTyping(phrase) {
                if (scope.canCreate) {                
                    if (scope.flatten) {
                        if (key === label) {
                            scope.model = phrase;
                        }
                    } else {
                        scope.model = {};
                        scope.model[label] = phrase;
                    }            
                }
                // console.log(scope.model);
            };

            function Enter() {
                var item = Current();
                if (item) {
                    scope.onSelect(item);
                }
                scope.$apply();
            }

            function Up() {
                scope.active--;
                if (scope.active < 0) {
                    scope.active = scope.items.length - 1;
                }
                scope.$apply();
            }

            function Down() {
                scope.active++;
                if (scope.items.length == 0) {
                    scope.active = -1;
                } else if (scope.active >= scope.items.length) {
                    scope.active = 0;
                }
                scope.$apply();
            }

            function Parse(data) {
                scope.items = data.items;
                scope.count = data.count;
                angular.forEach(scope.items, function (value, index) {
                    var name = value[label]; 
                    var i = name.toLowerCase().indexOf(scope.phrase.toLowerCase());
                    value.NameA = name.substr(0, i);
                    value.NameB = name.substr(i, scope.phrase.length);
                    value.NameC = name.substr(i + scope.phrase.length, name.length - (i + scope.phrase.length));
                });                
            }

            function Filter(data) {
                var c = 0, i = [];
                if (scope.phrase.length > 1) {
                    angular.forEach(data.items, function (value, index) {
                        var name = value[label]; 
                        if (name.toLowerCase().indexOf(scope.phrase.toLowerCase()) !== -1) {
                            if (i.length < MAX_ITEMS) {
                                i.push(value);
                            }
                            c++;
                        }
                    });
                }
                Parse({
                    count: c,
                    items: i
                });
            }

            function Search() {
                scope.phrase = input.val();
                scope.active = -1;
                onTyping(scope.phrase);
                if (scope.queryable) {
                    scope.service.setPhrase(scope.phrase).then(function (success) {
                        scope.items = success.items;
                        scope.count = success.count;
                    }, function (error) {
                        console.log('Search.queryable.error', scope.phrase, error);
                    }).finally(function () {

                    });
                } else {
                    Filter({
                        count: scope.service.length,
                        items: scope.service
                    });
                    scope.$apply();
                }
            }

            function onKeyDown(e) {
                switch (e.keyCode) {
                    case 9: // Tab
                    case 13: // Enter                        
                        Enter();
                        if (scope.items.length) {
                            e.preventDefault ? e.preventDefault() : null;
                            return false;
                        }
                        break;
                    case 38:
                        // Up
                        Up();
                        break;
                    case 40:
                        // Down
                        Down();
                        break;
                }
            }
            function onKeyUp(e) {
                switch (e.keyCode) {
                    case 9: // Tab
                    case 13: // Enter     
                        break;
                    case 39:
                        // Right
                        break;
                    case 37:
                        // Left
                        break;
                    case 38:
                        // Up
                        break;
                    case 40:
                        // Down
                        break;
                    default:
                        // Text
                        Search.call(this);
                        break;
                }
            }
            function onUp(e) {
                if (Utils.getClosest(e.target, '[control-autocomplete]') === null) {
                    scope.$apply(function () {
                        // console.log('onUp');
                        scope.onBlur();
                    });
                }
                return true;
            }
            
            function addListeners() {
                input.on('keydown', onKeyDown);
                input.on('keyup', onKeyUp);
                angular.element($window).on('mouseup touchend', onUp);
            };
            function removeListeners() {
                input.off('keydown', onKeyDown);
                input.off('keyup', onKeyUp);
                angular.element($window).off('mouseup touchend', onUp);

            };
            scope.$on('$destroy', function () {
                removeListeners();
            });

            var init = false;
            function Init() {
                if (!init) {
                    addListeners();
                    init = true;
                }
            }

            scope.$watch('service', function (newValue) {
                if (newValue && (newValue.length || scope.queryable)) {
                    Init();
                }
            });
            
            scope.$watchCollection('model', function (newValue) {
                // console.log('controlAutocomplete.$watchCollection.model', newValue);
                if (newValue) {
                    if (scope.flatten && label === key) {
                        scope.phrase = newValue;
                        input.val(scope.phrase);    
                    } else if (newValue[label]) {
                        scope.phrase = newValue[label];
                        input.val(scope.phrase); 
                    }
                }
            });

        },
    };
}]);

app.directive('scrollable', ['$parse', '$compile', '$window', '$timeout', function ($parse, $compile, $window, $timeout) {

    return {
        restrict: 'A',
        link: function (scope, element, attributes, model) {
            window.ondragstart = function() { return false; }; 
            
            // CONSTS;
            var padding = 150;
            
            // FLAGS;            
            var dragging, wheeling, busy;
            
            // MOUSE;
            var down, move, prev, up;
            
            // COORDS;
            var sy = 0, ey = 0, cy = 0, ltop = 0, lbottom = 0, speed = 0, ix = 45, iy = 0;
            
            // ANIMATION KEY;
            var aKey;
            
            var onTop, onBottom, showIndicatorFor;
            if (attributes.onTop !== undefined) {
                onTop = $parse(attributes.onTop, /* interceptorFn */ null, /* expensiveChecks */ true);
            }
            if (attributes.onBottom !== undefined) {
                onBottom = $parse(attributes.onBottom, /* interceptorFn */ null, /* expensiveChecks */ true);
            }
            if (attributes.showIndicatorFor !== undefined) {
                showIndicatorFor = scope.$eval(attributes.showIndicatorFor); // $parse(attributes.showIndicatorFor, /* interceptorFn */ null, /* expensiveChecks */ true);
            }
            // console.log('showIndicatorFor', showIndicatorFor);
            
            // ELEMENTS & STYLESHEETS;
            element.attr('unselectable', 'on').addClass('unselectable');
            var inner = element.find('div');
            var innerStyle = new Utils.Style();
            var indicator = null, indicatorStyle;
            if (showIndicatorFor) {
                indicator = angular.element('<div class="indicator"></div>');
                indicatorStyle = new Utils.Style();
                element.append(indicator);   
                $compile(indicator.contents())(scope);
                indicatorStyle.transform('translate3d('+ix.toFixed(2)+'px,'+iy.toFixed(2)+'px,0)');
                indicatorStyle.set(indicator[0]);
            }            
            
            function doTop() {
                if (busy) {
                    return;
                }
                if (!onTop) { 
                    return; 
                }                
                busy = true;
                scope.$apply(onTop).then().finally(function(){
                    sy = ey = 0;
                    setTimeout(function() {
                        undrag ();
                        busy = false;
                    }, 500);
                });
            }
            
            function doBottom() {
                if (busy) {
                    return;
                }
                if (!onBottom) { 
                    return; 
                }                
                busy = true;
                scope.$apply(onBottom).then().finally(function(){
                    var lbottom2 = element[0].offsetHeight - inner[0].offsetHeight;
                    if (lbottom2 > lbottom) {                     
                        sy = ey = lbottom;   
                    } else {
                        sy = ey = lbottom + padding;
                    }
                    setTimeout(function() {
                        undrag ();
                        busy = false;
                    }, 500);
                });
            }
            
            function undrag() {
                // console.log('undrag');
                dragging = false;
                wheeling = false;
                move = null;
                down = null;
                removeDragListeners();       
            }
            
            function bounce() {
                ltop += padding;
                lbottom -= padding;
                if (ey > ltop) {
                    doTop();
                } else if (ey < lbottom) {
                    doBottom();
                }
            }
            
            function redraw(time) {
                // if (!busy) {
                    ltop = 0;
                    lbottom = element[0].offsetHeight - inner[0].offsetHeight;                    
                    if (dragging) {
                        ey = sy + move.y - down.y;
                        bounce();                        
                    } else if (speed) {
                        ey += speed;
                        speed *= .75;
                        if (wheeling) {
                            bounce();
                        }
                        if (Math.abs(speed) < 0.05) {
                            speed = 0;                                         
                            ey = sy = cy;
                            wheeling = false;
                            pause();
                        }                                                
                    }
                // }
                ey = Math.min(ltop, ey);
                ey = Math.max(lbottom, ey);
                cy += (ey - cy) / 4;
                innerStyle.transform('translate3d(0,'+cy.toFixed(2)+'px,0)');
                innerStyle.set(inner[0]);
                if (showIndicatorFor) {
                    if (dragging || wheeling || speed) {
                        var percent = cy / ( element[0].offsetHeight - inner[0].offsetHeight );
                        percent = Math.max(0, Math.min(1, percent));
                        iy = (element[0].offsetHeight - indicator[0].offsetHeight) * (percent);                        
                        ix += (0-ix) / 4;                        
                        // var count = Math.round(inner[0].offsetHeight / 315);
                        var i = Math.max(1, Math.round(percent * showIndicatorFor.rows.length));
                        indicator.html(i + '/' + showIndicatorFor.count);
                        // indicator.html((percent * 100).toFixed(2).toString());
                    } else {
                        ix += (45-ix) / 4;
                    }
                    indicatorStyle.transform('translate3d('+ix.toFixed(2)+'px,'+iy.toFixed(2)+'px,0)');
                    indicatorStyle.set(indicator[0]);
                }
            }

            function play() {
                function loop(time) {
                    redraw(time);
                    aKey = window.requestAnimationFrame(loop, element);
                }
                if (!aKey) {
                    loop();
                }
            }

            function pause() {
                if (aKey) {
                    window.cancelAnimationFrame(aKey);
                    aKey = null;
                    // console.log('Animation.paused');
                }
            }
            
            function onDown(e) {
                if (!busy) {
                    sy = ey = cy;
                    speed = 0;
                    down = Utils.getTouch(e);
                    wheeling = false;
                    // console.log(down);
                    addDragListeners();
                    play();
                }
            }
            
            function onMove(e) {
                prev = move;
                move = Utils.getTouch(e);
                dragging = true;
                // console.log(move);
            }
            
            function onUp(e) {
                if (move && prev) {
                    speed += (move.y - prev.y) * 4;
                }
                sy = ey = cy;
                dragging = false;
                move = null;
                down = null;
                prev = null;
                up = Utils.getTouch(e);
                // console.log(up);
                removeDragListeners();                
            }
            
            function _onWheel(e) {
                if (!busy) {          
                    if (!e) e = event;
                    var dir = (((e.deltaY <0 || e.wheelDelta>0) || e.deltaY < 0) ? 1 : -1)                
                    /*
                    var evt = window.event || e;
                    var delta = evt.detail ? evt.detail * -120 : evt.wheelDelta
                    speed += delta;
                    */
                    speed += dir * 5;
                    wheeling = true;
                    play();
                }
            }
            
            var onWheel = Utils.throttle(_onWheel, 25);
            
            function addListeners() {
                element.on('touchstart mousedown', onDown);
                element.on('wheel', onWheel);
                // element.addEventListener('DOMMouseScroll',handleScroll,false); // for Firefox
                // element.addEventListener('mousewheel',    handleScroll,false); // for everyone else
            };
            function removeListeners() {
                element.off('touchstart mousedown', onDown);
                element.off('wheel', onWheel);
            };
            function addDragListeners() {
                angular.element($window).on('touchmove mousemove', onMove);
                angular.element($window).on('touchend mouseup', onUp);
            };
            function removeDragListeners() {
                angular.element($window).off('touchmove mousemove', onMove);
                angular.element($window).off('touchend mouseup', onUp);
            };
            scope.$on('$destroy', function () {
                removeListeners();
            });

            addListeners();

        },
    };
}]);

app.directive('ngImg', ['$parse', '$timeout', function ($parse, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes, model) {            
            /**
            * documentMode is an IE-only property
            * http://msdn.microsoft.com/en-us/library/ie/cc196988(v=vs.85).aspx
            */
            // var msie = document.documentMode;
            // on IE, if "ng:src" directive declaration is used and "src" attribute doesn't exist
            // then calling element.setAttribute('src', 'foo') doesn't do anything, so we need
            // to set the property as well to achieve the desired effect.
            // we use attr[attrName] value since $set can sanitize the url.
            // if (msie) element.prop('src', attributes['src']);          
            var src = $parse(attributes.ngImg, /* interceptorFn */ null, /* expensiveChecks */ true);
            var image = new Image();
            image.onload = function() {
                attributes.$set('src', this.src);
                setTimeout(function() {                  
                    element.addClass('loaded');  
                }, 10);                
            }  
            image.load = function(src) {
                element.removeClass('loaded');
                this.src = src;
            }
            scope.$watch(src, function (newValue) {
                // console.log('ngImg', newValue);
                if (!newValue) {
                    attributes.$set('src', null);
                } else {                    
                    image.load(newValue);
                }                
            });
        }
    };
}]);

app.directive('ngImgWorker', ['$parse', 'WebWorker', function ($parse, WebWorker) {
    
    /*
    var load;
    if (WebWorker.isSupported) {
        var worker = new WebWorker('/js/workers/loader.js');        
        load = function(src, callback) {
            worker.post({url: src}).then(function(data) {
                callback(data.url);
            }, function(error) {
                callback(null);
            });            
        };
    } else {
        load = function(src, callback) {
            // console.log('ngImgWorker', src);
            var image = new Image();
            image.onload = function() {
                callback(src);
            };
            image.src = src;
        };
    }
    */
    
    var worker = new WebWorker('/js/workers/loader.js');        
    
    return {
        restrict: 'A',
        link: function (scope, element, attributes, model) {
            function doWork(src) {
                element.removeClass('loaded');
                function onImageLoaded(src) {
                    // console.log('ngImgWorker.onLoad', src);
                    attributes.$set('src', src);
                    setTimeout(function () {
                        element.addClass('loaded');
                    }, 100);
                }
                worker.post({url: src}).then(function(data) {
                    onImageLoaded(data.url);
                }, function(error) {
                    onImageLoaded(null);
                });   
                /*
                load(src, function (success) {
                    // console.log('ngImgWorker.onLoad', src);
                    attributes.$set('src', src);
                    setTimeout(function () {
                        element.addClass('loaded');
                    }, 100);
                });
                */
            }            
            var src = scope.$eval(attributes.ngImgWorker);
            if (!src) {
                attributes.$set('src', null);
            } else {
                doWork(src);
            }          
        }
    };
    
}]);
