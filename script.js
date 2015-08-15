(function(angular) {
    'use strict';
    angular.module('DataUrlMaker', ['ngMaterial'])
    .controller('Controller', ['$scope', 'FileList', function($scope, FileList) {
    }])
    .factory('FileList', function() {
        var service = {};
        service.files = [];
        service.getThumbs = function() {
            // do this automatically!!, also confusing name, doesnt return files!
            service.files.forEach(function(file) {
                if(file.status) return;
                file.status = "loading";
                var reader = new FileReader();
                reader.onload=(function(theFile) {
                    return function(e) {
                        console.log(file, "loaded");
                        file.url = e.target.result;
                        file.status = "loaded";
                    }
                })(file);
                reader.readAsDataURL(file);
            });
            var reader = new FileReader(); 
        };
        return service;
    })
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
            templateUrl: '_file.html'
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
            element.on("click", function() { this.select(); });
        }
        return {link:link};
    });
})(window.angular);
