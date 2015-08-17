(function(angular) {
    'use strict';
    angular.module('DataUrlMaker', ['ngMaterial'])
    .controller('Controller', ['$scope', 'FileList', 'Pipeline', function($scope, FileList, Pipeline) {
        $scope.Pipeline = Pipeline;
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
                        file.originalDataUrl = e.target.result;
                        file.canvas = document.createElement("canvas");
                        var context = file.canvas.getContext("2d");
                        var img = document.createElement("img");
                        img.onload = function() {
                            file.canvas.width = img.width;
                            file.canvas.height = img.height;
                            context.drawImage(img, 0, 0, img.width, img.height);
                            console.log(file, "loaded");
                            var output = Pipeline.execute(file);
                            console.log("output", output);
                            file.url = output.url; 
                        };
                        img.src = file.originalDataUrl;
                    }
                })(file);
                reader.readAsDataURL(file);
            });
            var reader = new FileReader();
        };
        return service;
    }])
    .factory('Pipeline', ['$q', function($q){
        var service = {};
        service.pipeline = [
//            { plugin: fill, options: {color: 'red'}},
//            { plugin: resize, options: {} }, 
            { plugin: canvasToDataUrl, options: {mimeType: 'image/png'} }, 
        ];
        service.execute = function(file) {
            console.log("execute", file);
            // var result = $q();
            // service.functions.splice(1).forEach(function (f) {
            //     console.log(f);
            //     result = result.then(f);
            // });
            var result = {
                canvas: file.canvas,
                width: file.canvas.width,
                height: file.canvas.height
            };
            service.pipeline.forEach(function(item, i) {
                result = item.plugin.func(result, item.options);
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
            scope: true,
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
            scope: true,
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
            scope: true
        };
    }])
    .directive('selectOnClick', function() {
        function link(scope, element, attrs) { 
            scope.$watch(function() {return attrs.selectOnClick; },
                         function(newValue){
                             preview();
                         });
                         element.on("blur", function() { 
                             preview();
                         });
                         element.on("click", function() { 
                             element.val(attrs.selectOnClick);
                             this.select();
                         });
                         function preview() {
                             // for perf reasons don't show whole string unless needed
                             element.val(attrs.selectOnClick.substr(0, 40)); 
                         }
        }
        return {link:link};
    });

    var PluginIoTypes = {
        Canvas: 'canvas',
        Base64: 'base64',
        Url: 'url',
        ArrayBuffer: 'arrayBuffer'
    };

    var pluginDataExample = {
        mimeType: 'image/png',
        inputType: 'canvas',
        outputType: 'canvas',
        data: 'base 64 str or ArrayBuffer',
        width: 0,
        height: 0
    };

    var resize = { 
        inputType: 'canvas',
        outputType: 'canvas',
        name: 'Resize',
        func: function (input, options) {
            var combinedOptions = angular.extend({}, resize.opts, options);
            Caman(input.canvas, function () {
                this.resize({
                    width: 20,
                    height: 20
                });

                // You still have to call render!
                this.render();
            });
            var resized = canvasToArrayBuffer(canvas);
            return { 
                width: input.width,
                height: input.height,
                mimeType: '??',
                data: resized
            };
        }
    }; 

    var fill = {
        inputType: 'canvas',
        outputType: 'canvas',
        name: 'Fill',
        func: function(data, options) {
            var canvas = data.canvas;
            var ctx = canvas.getContext('2d');
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = options.color;
            ctx.fill();
            return {
                width: data.width,
                height: data.height,
                mimeType: null,
                canvas: canvas 
            };
        }
    };

    var canvasToDataUrl = {
        inputType: PluginIoTypes.Canvas,
        outputType: PluginIoTypes.Url,
        name: 'Canvas to Data URL',
        func: function(data, options) {
            var canvas = data.canvas;
            var mimeType =  options.mimeType || "image/png";
            var url = canvas.toDataURL(mimeType, options.quality || 1.0);
            return {
                width: data.width,
                height: data.height,
                mimeType: mimeType,
                canvas: canvas,
                url: url 
            }; 
        }
    };

})(window.angular);
