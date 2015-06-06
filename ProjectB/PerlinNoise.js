function lp(F,A,B)
{
	return A + F*(B-A);
}

function perm(index,a)
{
  return a[index % 256];
}
function tableIndex(x,y,z,a)
{
  var idx = perm(z,a);
  idx = perm(idx+y,a);
  idx = perm(idx+x,a);
  
  return idx;
}

PerlinNoise = function()
{
	this.index = [];
	
	for(var i = 0;i<256;++i)
	{
		this.index.push(i);
	}
	
	//shuffle
	var which = -1;
	var tmp = -1;
	
	for(i = 0;i<256;++i)
	{
		which = Math.floor((256-i)*Math.random()+i);
		tmp = this.index[which];
		this.index[which] = this.index[i];
		this.index[i] = tmp;
	}
	
	
	this.noiseTable = [];
	for(i = 0;i<256;++i)
	{
		this.noiseTable[i] = Math.random();
	}
	
	//fbm max and min
	this.num_turb = 3;
	this.s_max = Math.pow(0.5,this.num_turb-1);
	this.s_max = 1-this.s_max;
	this.s_max *= 2;

	this.s_min = -1.0*this.s_max;
}

PerlinNoise.prototype.constructor = PerlinNoise;

PerlinNoise.prototype.turb = function(pos)
{
	var amp = 0.5;
	var freq = 1.0;
	
	var turbulance = 0.0;
	
	for(var i = 0;i<this.num_turb;++i)
	{
		turbulance += this.noise(pos,freq);	
		amp *= 0.5;
		freq *= 2.0;
	}
	
	 //return turbulance;
	 turbulance = (turbulance-this.s_min)/(this.s_max-this.s_min);
	 
	 if(turbulance>1.0)
	 {
		 console.log(turbulance);
	 }
	return turbulance;
	
}

PerlinNoise.prototype.noise = function(pos,scale)
{
	var pp = vec3.clone(pos);
	vec3.scale(pp,pp,scale);
	vec3.add(pp,pp,[300,300,300]);
	
	var ix = Math.floor(pp[0]);
	var fx = pp[0] - ix;

	var iy = Math.floor(pp[1]);
	var fy = pp[1] - iy;
	
	var iz = Math.floor(pp[2]);
	var fz = pp[2] - iz;
	
	var d = [];
	
	var i,j,k;
	for(k = 0;k<=1;++k)
		for(j=0;j<=1;++j)
			for(i=0;i<=1;++i)
				d[(k*2+j)*2+i] = this.noiseTable[tableIndex(ix+i,iy+j,iz+k,this.index)];
	

	var x0 = lp(fx,d[0],d[1]);
	//var x1 = lerp(fx,d[0][1][0],d[0][1][1]);
	var x1 = lp(fx,d[2],d[3]);
	//var x2 = lerp(fx,d[1][0][0],d[1][0][1]);
	var x2 = lp(fx,d[4],d[5]);
	//var x3 = lerp(fx,d[1][1][0],d[1][1][1]);
	var x3 = lp(fx,d[6],d[7]);
	var y0 = lp(fy,x0,x1);
	var y1 = lp(fy,x2,x3);
	var z0 = lp(fz,y0,y1);
	
	
	return z0;
}
