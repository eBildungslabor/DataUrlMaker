(function(angular) {
    'use strict';
    angular.module('dataUrlMaker', [])
    .controller('Controller', ['$scope', 'FileList', function($scope, FileList) {
    }])
    .factory('FileList', function() {
        var service = {};
        service.files = [];
        return service;
    })
    .directive('files', ['FileList', function(FileList) {

        function controller($scope) {
            console.log("files", FileList.files);
            $scope.files = FileList.files;
        }

        return {
            controller: controller,
            scope: {
            },
            template: "<ul><li ng-repeat='file in files'>File: {{file.name}} {{file.type}} {{file.size}} bytes</li></ul>"
        };
    }])
    .directive('uploader', ['FileList', function(FileList) {

        function link(scope, element, attrs) {
            
            var input = element.find("input");
            input[0].addEventListener('change', handleFileSelect);

            function handleFileSelect(e) {
                scope.$apply(function() {
                    FileList.files.push.apply(FileList.files, e.target.files);
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
    }]);
})(window.angular);
