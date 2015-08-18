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
//                        document.body.appendChild(file.canvas)
                        var context = file.canvas.getContext("2d");
                        var img = document.createElement("img");
                        img.onload = function() {
                            file.canvas.width = img.width;
                            file.canvas.height = img.height;
                            context.drawImage(img, 0, 0, img.width, img.height);
                            console.log(file, "loaded");
                            var output = Pipeline.execute(file);
                            console.log("output", output);
                            output.then(function(value) {
                                console.log("output value: ", value)
                                file.url = value.url; 
                            });
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
    .factory('Pipeline', [function(){
        var service = {};
        var result;
        service.pipeline = [
            //             { plugin: fill, options: {color: 'red'}},
            // { plugin: resize, options: {width: 20, height: 25} }, 
            { plugin: canvasToDataUrl, options: {mimeType: 'image/png'} }, 
        ];
        service.execute = function(file) {
            console.log("execute", file);
            result = {
                canvas: file.canvas,
                width: file.canvas.width,
                height: file.canvas.height
            };

            // http://www.html5rocks.com/en/tutorials/es6/promises/
            return service.pipeline.reduce(function(chain, item) {
                console.log('reduce', chain, item);
                return chain.then(function() {
                    console.log(chain, item);
                    return item.plugin.func(result, item.options);
                });
            }, Promise.resolve());
        };
    
        return service;
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
            return new Promise(function(resolve, reject) {
                var combinedOptions = angular.extend({}, resize.opts, options);
                Caman(input.canvas, function () {
                    this.resize({
                        width: options.width,
                        height: options.height
                    });

                    // You still have to call render!
                    this.render(function() {
                        console.log('Resize', options);
                        resolve({ 
                            canvas: input.canvas,
                            width: input.width,
                            height: input.height,
                        });
                    });                                      
                });
            });
        }
    }; 

    var fill = {
        inputType: 'canvas',
        outputType: 'canvas',
        name: 'Fill',
        func: function(data, options) {
            return new Promise(function(resolve, reject) {
                var canvas = data.canvas;
                var ctx = canvas.getContext('2d');
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = options.color;
                ctx.fill();
                console.log('Fill', options.color);
                resolve({
                    width: data.width,
                    height: data.height,
                    mimeType: null,
                    canvas: canvas 
                }); 
            });
        }
    };

    var canvasToDataUrl = {
        inputType: PluginIoTypes.Canvas,
        outputType: PluginIoTypes.Url,
        name: 'Canvas to Data URL',
        func: function(data, options) {
            return new Promise(function(resolve, reject) {            
                var canvas = data.canvas;
                var mimeType =  options.mimeType || "image/png";
                var url = canvas.toDataURL(mimeType, options.quality || 1.0);
                console.log('canvasToDataUrl', url);
                resolve({
                    width: data.width,
                    height: data.height,
                    mimeType: mimeType,
                    canvas: canvas,
                    url: url 
                });                 
            });
        }
    };

})(window.angular);
