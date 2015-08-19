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

    window.Plugins = {
        resize: resize,
        fill: fill,
        canvasToDataUrl: canvasToDataUrl
    };
});
