(function(angular) {
    'use strict';
    angular.module('DataUrlMaker', ['ngMaterial'])
    .controller('Controller', ['$scope', 'FileList', function($scope, FileList) {
    }])
    .factory('FileList', ['Pipeline', function(Pipeline) {
        var service = {};
        service.files = [];
        service.getThumbs = function() {
            // do this automatically!!, also confusing name, doesnt return files!
            service.files.forEach(function(file) {
                if(file.status) return;
                file.status = "loading";
                file.output = [];
                var reader = new FileReader();
                reader.onload = (function(theFile) {
                    return function(e) {
                        file.status = "loaded";
                        file.buffer = e.target.result;
                        console.log(file, "loaded");
                        file.url = Pipeline.execute(file).data;
                    }
                })(file);
                reader.readAsArrayBuffer(file);
            });
            var reader = new FileReader();
        };
        return service;
    }])
    .factory('Pipeline', ['$q', function($q){
        var service = {};
        service.pipeline = [arrayBufferToBase64, base64ToDataUri];
        service.execute = function(file) {
            console.log("execute", file);
            // var result = $q();
            // service.functions.splice(1).forEach(function (f) {
            //     console.log(f);
            //     result = result.then(f);
            // });
            var result = {
                mimeType: file.type,
                data: file.buffer
            };
            service.pipeline.forEach(function(item, i) {
                result = item.func(result);
                file.output.push(result);
                console.log(i, angular.isString(result) ? result.substr(0, 100) : result);
            });
            return result;
        };
        return service;


        function makePromise(fn) {
            return new Promise(function(resolve, reject) {
                var r = fn(file);
                if (true) {
                    resolve(r);
                }
                else {
                    reject(Error("It broke"));
                }
            })
        }
    }])
    .directive('files', ['FileList', '$interval', function(FileList, $interval) {

        function controller($scope) {
            console.log("files", FileList.files);
            $scope.FileList = FileList;

            $scope.$watch('files', function() { console.log("files changed"); }, true);
            $interval(function() { // uh quick hack 
            }, 100); 
        }

        return {
            controller: controller,
            scope: {
            },
            templateUrl: 'file.tmpl.html'
        };
    }])
    .directive('uploader', ['FileList', function(FileList) {

        function link(scope, element, attrs) {

            var input = element.find("input");
            input[0].addEventListener('change', handleFileSelect);

            function handleFileSelect(e) {
                scope.$apply(function() {
                    FileList.files.push.apply(FileList.files, e.target.files);
                    FileList.getThumbs();
                    console.log(FileList.files); 
                });
            }
        }

        return {
            link: link,
            scope: {
            },
            template: "<input type='file' multiple>"
        };
    }])
    .directive('dragDropUploader', ['FileList', function(FileList) {

        function link(scope, element, attrs) {

            element[0].addEventListener('dragover', handleDragOver);
            element[0].addEventListener('drop', handleFileSelect);

            function handleFileSelect(e) {
                e.stopPropagation();
                e.preventDefault();
                scope.$apply(function() {
                    FileList.files.push.apply(FileList.files, e.dataTransfer.files);
                    FileList.getThumbs();
                    console.log(FileList.files); 
                });
            }

            function handleDragOver(e) {
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
        }

        return {
            link: link,
            scope: {
            },
            template: "<div style=padding:10px;background:gray;border:dotted>Drop files here</div>"
        };
    }])
    .directive('selectOnClick', function() {
        function link(scope, element, attrs) { 
            scope.$watch(function() {return attrs.selectOnClick; },
                         function(newValue){
                            element.val(attrs.selectOnClick.substr(0, 40)); 
                         });
            element.on("click", function() { 
                element.val(attrs.selectOnClick);
                this.select();
            });
        }
        return {link:link};
    });


    var pluginDataPassExample = {
        mimeType: 'image/png',
        data: 'base 64 str or ArrayBuffer'
    }

    var plugin = {
        name: "Base Plugin",
        func: function (input, options) {
            return input;
        },
        opts: {}
    };

    var arrayBufferToBase64 = angular.extend({}, plugin, {
        name: 'arrayBufferToBase64',
        func: function (input, options) {
            // http://stackoverflow.com/a/9458996
            var binary = '';
            var bytes = new Uint8Array( input.data );
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode( bytes[ i ] );
            }
            return {
                mimeType: input.mimeType,
                data: window.btoa( binary )
            };
        }
    });

    var base64ToDataUri = angular.extend({}, plugin, {
        name: 'base64ToDataUri',
        func: function (input, options) {
            var combinedOptions = angular.extend({}, base64ToDataUri.opts, options);
            return { 
                mimeType: 'text/plain',
                data: 'data:' + input.mimeType + ';base64,' + input.data 
            };
        }});
})(window.angular);
