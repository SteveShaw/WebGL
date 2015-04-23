function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function normRnd(mean,std) {
    if(this.extra == undefined){        
        var u,v;var s = 0;
        while(s >= 1 || s == 0){
	    u = Math.random()*2 - 1; v = Math.random()*2 - 1;
            s = u*u + v*v;
        }
        var n = Math.sqrt(-2 * Math.log(s)/s);
        this.extra = v*n;
        return mean+u*n*std;
    } else{
        var r = mean+this.extra*std;
        this.extra = undefined;
        return r;
    }
}

function randomFloat(start,end) {
  if (end === undefined)
    return randomFloat(0,start);
  else
    return Math.random() * (end-start) + start;;
}

function randomSpread(center,spread) {
  return randomFloat(center-spread,center+spread);
}


function transfomHSV2RGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: r,
        g: g,
        b: b
    };
}

function convertHue(hue) {
  hue /= 360.0;
  if (hue < 0)
    hue += 1.0;
  return hue;
}


function createTexture(gl){
    var ctx = document.getElementById('image-texture').getContext('2d');
    ctx.beginPath();
    var edgecolor1 = "rgba(255,255,255,1)";
    var edgecolor2 = "rgba(255,255,255,0)";
    var gradblur = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradblur.addColorStop(0,edgecolor1);
    gradblur.addColorStop(1,edgecolor2);
    ctx.fillStyle = gradblur;
    ctx.arc(64, 64, 64, 0, Math.PI*2, false);
    ctx.fill();
    var data = ctx.getImageData(0, 0, 128, 128).data;

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    var pixels = new Uint8Array(128*128*4);
    for(var i = 0; i < 128*128*4; i++){
        pixels[i] = data[i];
    }
    ctx.clearRect(0,0,128,128);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    texture = tex;
}