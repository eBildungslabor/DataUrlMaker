(function() {
    var PluginIoTypes = {
        Canvas: 'canvas',
        Base64: 'base64',
        Url: 'url',
        ArrayBuffer: 'arrayBuffer'
    };

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
        }
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
        }
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
        }
    };

    window.Plugins = [
        resize,
        fill,
        canvasToDataUrl
    ];
})();
