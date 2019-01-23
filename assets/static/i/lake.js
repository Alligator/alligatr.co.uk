(function($) {
    jQuery.fn.lake = function(options) {
        var settings = $.extend({
            'speed':    0.25
        }, options);

        var ca = $(settings['canvas']).get(0);
        var c = ca.getContext('2d');

        var img = this.get(0);
        var img_loaded = false;

        var w, h, dw, dh;

        var offset = 0;
        var speed = settings['speed']
        var frame = 0;
        var max_frames = 0;
        var frames = [];

        img.onload = function() {
            c.save();

            c.canvas.width  = this.width;
            c.canvas.height = this.height*2;

            c.drawImage(this, 0,  0);

            c.scale(1, -1);
            c.drawImage(this, 0,  -this.height*2);

            img_loaded = true;

            c.restore();

            w = c.canvas.width;
            h = c.canvas.height;
            dw = w;
            dh = h/2;

            var id = c.getImageData(0, h/2, w, h).data;
            var end = false;

            // precalc frames
            // image displacement
            c.save();
            while (!end) {
                // var odd = c.createImageData(dw, dh);
                var odd = c.getImageData(0, h/2, w, h);
                var od = odd.data;
                var pixel = 0;
                var scale = 0.5;
                for (var y = 4; y < dh; y++) {
                    for (var x = 0; x < dw; x++) {
                        // var displacement = (scale * dd[pixel]) | 0;
                        var displacement = /*(y/dh) */ (scale * 10 * (Math.sin((dh/(y/10)) + (-offset)))) | 0;
                        var j = ((displacement + y) * w + x + displacement)*4;
                        if (id[j+3] != 0) {
                            od[pixel]   = id[j];
                            od[++pixel] = id[++j];
                            od[++pixel] = id[++j];
                            od[++pixel] = id[++j];
                            ++pixel;
                        } else {
                            pixel += 4;
                        }
                    }
                }

                if (offset > speed * (6/speed)) {
                    offset = 0;
                    max_frames = frame - 1;
                    // frames.pop();
                    frame = 0;
                    end = true;
                } else {
                    offset += speed;
                    frame++;
                }
                frames.push(odd);
            }
            c.restore();
        };


        setInterval(function() {
            // reset transformations
            c.setTransform(1,0,0,1,0,0);

            if (img_loaded) {
                c.putImageData(frames[frame], 0, h/2);
                if (frame < max_frames) {
                    frame++;
                } else {
                    frame = 0;
                }
            }
        }, 33);
        return this;
    }
})(jQuery);
