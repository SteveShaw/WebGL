SmokePS = function(num,numEnv)
{
	ParticleSystemBase.prototype.constructor.call(this,num,numEnv);
}
SmokePS.prototype = Object.create(ParticleSystemBase.prototype);
SmokePS.prototype.constructor = SmokePS;

SmokePS.prototype.initSystem = function()
{
	ParticleSystemBase.prototype.initSystem.call(this);
	for(var i=0;i<this.num;++i)
	{
		var offset = i*PART_MAXVAR;
//		this.curStat[offset+PART_XPOS] = getRandomArbitrary(0,1) - getRandomArbitrary(0,1);
//		this.curStat[offset+PART_YPOS] = 5;
//		this.curStat[offset+PART_ZPOS] = 20;
		this.curStat[offset+PART_XPOS] = randomSpread(0,10);
		this.curStat[offset+PART_YPOS] = randomSpread(0,10);
		this.curStat[offset+PART_ZPOS] = randomSpread(0,10);
		var speed = randomSpread(200,160);
		var angle = randomSpread(Math.PI/2,0.42);
		this.curStat[offset+PART_XVEL] = Math.cos(angle)*speed;
		this.curStat[offset+PART_YVEL] = Math.sin(angle)*speed;
		this.curStat[offset+PART_ZVEL] = speed*Math.random();
//		this.curStat[offset+PART_XVEL] = (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007) - (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007);
//		this.curStat[offset+PART_YVEL] = ((((((5) * getRandomArbitrary(0,10)) + 5)) * getRandomArbitrary(0,10)) + 1) * 0.02;
//		this.curStat[offset+PART_ZVEL] = (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007) - (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007);
		var hue = randomSpread(25,15);
		var rgbColor = transfomHSV2RGB(convertHue(hue),1.0,1.0);
		this.curStat[offset+PART_R] = rgbColor.r;
		this.curStat[offset+PART_G] = rgbColor.g; 
		this.curStat[offset+PART_B] = rgbColor.b;
		this.curStat[offset+PART_A] = 1;
		
//		this.curStat[offset+PART_R] = Math.random()*0.5+0.5;
//		this.curStat[offset+PART_G] = Math.random()*0.5;
//		this.curStat[offset+PART_B] = Math.random()*0.5;
		
		
		this.curStat[offset+PART_SPRITE_SIZE] = randomSpread(40,40); 
		this.curStat[offset+PART_DIAM] = randomSpread(40,40);
		this.curStat[offset+PART_MOVEABLE]=1;
		this.curStat[offset+PART_MASS]=1.0;
		this.curStat[offset+PART_AGE] = 0;
		this.curStat[offset+PART_LIFESPAN] = (getRandomArbitrary(0,9)+1)/10;

		var dotOff = i*DOT_PART_TOTAL;
		this.dotStat[dotOff+DOT_PART_XVEL] = 0.005;
		this.dotStat[dotOff+DOT_PART_YVEL] = 0;
		this.dotStat[dotOff+DOT_PART_ZVEL] = 0;
	}
}

SmokePS.prototype.dotFinder = function(){
}

SmokePS.prototype.solver = function(t)
{
	for(var i = 0;i<this.num;++i)
	{
		var offset = i*PART_MAXVAR;
		var dotOff = i*DOT_PART_TOTAL;
		var curS = this.curStat.subarray(offset,offset+PART_MAXVAR);
		var nextS = this.nextStat.subarray(offset,offset+PART_MAXVAR);
		var dotS = this.dotStat.subarray(dotOff,dotOff+DOT_PART_TOTAL);
		
		//update particle age
		curS[PART_AGE] += 0.02;
		//calc vel
		var curVel = vec3.fromValues(curS[PART_XVEL],curS[PART_YVEL],curS[PART_ZVEL]);
//		console.log('curVel='+vec3.str(curVel));
		var curAcc = vec3.fromValues(dotS[DOT_PART_XVEL],dotS[DOT_PART_YVEL],dotS[DOT_PART_ZVEL]);
//		console.log('curAcc='+vec3.str(curAcc));
		var nextVel = vec3.scaleAndAdd(curVel,curVel,curAcc,t);
//		console.log('nextVel='+vec3.str(nextVel));
    nextS[PART_XVEL] = nextVel[0];
		nextS[PART_YVEL] = nextVel[1];
		nextS[PART_ZVEL] = nextVel[2];
		//implicit Euler
//		vec3.scaleAndAdd(nextVel,nextVel,curVel,0.5);
		
		//update pos
		var pos = vec3.fromValues(curS[PART_XPOS],curS[PART_YPOS],curS[PART_ZPOS]);
		vec3.scaleAndAdd(pos,pos,nextVel,t);
		nextS[PART_XPOS] = pos[0];
		nextS[PART_YPOS] = pos[1];
		nextS[PART_ZPOS] = pos[2];
		
		nextS[PART_DIAM] = curS[PART_DIAM] - 13*t;
	}
}

SmokePS.prototype.applyContraints = function()
{
	var resetParticle = function(particle)
	{
		particle[PART_XPOS] = randomSpread(0,50);
		particle[PART_YPOS] = randomSpread(0,50);
		particle[PART_ZPOS] = randomSpread(0,20);
		var speed = randomSpread(200,160);
		var angle = randomSpread(Math.PI/2,0.42);
		particle[PART_XVEL] = Math.cos(angle)*speed;
		particle[PART_YVEL] = Math.sin(angle)*speed;
		particle[PART_ZVEL] = speed*Math.random();
//		particle[offset+PART_XPOS] = normRnd(0,0.015);
//		particle[offset+PART_YPOS] = normRnd(0,0.015);
//		particle[offset+PART_ZPOS] = normRnd(0,0.015);
//		particle[offset+PART_XVEL] = normRnd(0,0.2);
//		particle[offset+PART_YVEL] = normRnd(0,0.2);
//		particle[offset+PART_ZVEL] = normRnd(0,0.15);
//		particle[PART_XPOS] = getRandomArbitrary(0,1) - getRandomArbitrary(0,1);
//		particle[PART_YPOS] = 10;
//		particle[PART_ZPOS] = 20;
//		particle[PART_XVEL] = (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007) - (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007);
//		particle[PART_YVEL] = ((((((5) * getRandomArbitrary(0,10)) + 5)) * getRandomArbitrary(0,10)) + 1) * 0.02;
//		particle[PART_ZVEL] = (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007) - (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007);
		var hue = randomSpread(25,15);
		var rgbColor = transfomHSV2RGB(convertHue(hue),1.0,1.0);
		particle[PART_R] = rgbColor.r;
		particle[PART_G] = rgbColor.g; 
		particle[PART_B] = rgbColor.b;
		particle[PART_A] = 1;
		particle[PART_AGE] = 0;
		particle[PART_DIAM] = randomSpread(40,40);
		particle[PART_LIFESPAN] = (getRandomArbitrary(0,9)+1)/10;
	}
	for(var i=0;i<this.num;++i)
	{
		var offset = i*PART_MAXVAR;
		var curS = this.nextStat.subarray(offset,offset+PART_MAXVAR);
		
//         var temp = curS[PART_LIFESPAN]/curS[PART_AGE];
//         if((temp) < 1.75)
//         {//red
//					 curS[PART_R] = 1.0;
//					 curS[PART_G] = 0.25;
//					 curS[PART_B] = 0;
//         }
//         else if((temp) < 3.0)
//         {//gold
//					 curS[PART_R] = 1.0;
//					 curS[PART_G] = 0.9;
//					 curS[PART_B] = 0;
//         }
//         else if((temp) < 10.0)
//         {//yellow
//					 curS[PART_R] = 1.0;
//					 curS[PART_G] = 1.0;
//					 curS[PART_B] = 0;
//         }
//         else
//         {// initial light yellow
//					 curS[PART_R] = 1.0;
//					 curS[PART_G] = 0.95;
//					 curS[PART_B] = 0;
//         }
      	
      
//		curS[PART_DIAM]*=curS[PART_AGE]/curS[PART_LIFESPAN];
	

//		if(curS[PART_AGE]>curS[PART_LIFESPAN])
		if(curS[PART_DIAM]<0)
		{
//			console.log('Reset Particles');
			resetParticle(curS);
//			console.log(curS[PART_AGE]);
		}
	}
}
