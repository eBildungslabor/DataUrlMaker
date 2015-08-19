(function() {
    var PluginIoTypes = {
        Canvas: 'canvas',
        Base64: 'base64',
        Url: 'url',
        ArrayBuffer: 'arrayBuffer'
    };
    //todo: caman generic plugin
    var resize = { 
        inputType: 'canvas',
        outputType: 'canvas',
        id: 'resize',
        name: 'Resize',
        func: function (data, options) {
            return new Promise(function(resolve, reject) {
                var combinedOptions = angular.extend({}, resize.opts, options);
                var canvas = data.canvas;
                var newCanvas = document.createElement("canvas");
                newCanvas.width = options.width;
                newCanvas.height = options.height;
                canvasResize(canvas, newCanvas, function() {
                    data.width = options.width;
                    data.height = options.height;
                    data.canvas = newCanvas;
                    resolve(data);
                });
            });
        },
        template: "<div><input type=number ng-model='options.width'>x<input type=number ng-model='options.height'></div>"
    }; 

    var fill = {
        inputType: 'canvas',
        outputType: 'canvas',
        id: 'fill',
        name: 'Fill',
        func: function(data, options) {
            return new Promise(function(resolve, reject) {
                var canvas = data.canvas;
                var ctx = canvas.getContext('2d');
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = options.color;
                ctx.fill();
                console.log('Fill', options.color);
                resolve(data); 
            });
        },
        template: "<div><input type=color ng-model='options.color'></div>"
       //1) load template into plugin cache, then use ng-include 
        // 2) build up a directive built upon the template--- easiest? just compile that temlate as the directive  
    };

    var canvasToDataUrl = {
        inputType: PluginIoTypes.Canvas,
        outputType: PluginIoTypes.Url,
        id: 'canvasToDataUrl',
        name: 'Canvas to Data URL',
        func: function(data, options) {
            return new Promise(function(resolve, reject) {            
                var canvas = data.canvas;
                var mimeType =  options.mimeType || "image/png";
                var url = canvas.toDataURL(mimeType, options.quality || 1.0);
                data.mimeType = mimeType;
                data.url = url;
                resolve(data); 
            });
        },
        template: "<div><select type='text' ng-model='options.mimeType'><option value='image/png'>image/png</option><option value='image/jpeg'>image/jpeg</option></select></div>"
    };

    window.Plugins = [
        resize,
        fill,
        canvasToDataUrl
    ];
})();
