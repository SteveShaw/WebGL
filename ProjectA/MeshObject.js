MeshObject = function(num,cont){
	this.num = num;
	this.startOff = cont.nextOff;
    this.vertices = cont.vertices.subarray(cont.nextOff,cont.nextOff+num*PART_MAXVAR);
	this.startOff = cont.nextOff;
	this.faces = null;
	this.isUpdate = false;
	cont.nextOff += this.num*PART_MAXVAR;
}


MeshObject.prototype.constructor = MeshObject;

MeshObject.prototype.setData = function(vertArr,faceArr,colorArr){
	
    var offset = 0;
	for(var i = 0;i<vertArr.length/3;++i)
	{
        offset = i*PART_MAXVAR;
		this.vertices[offset+PART_XPOS] = vertArr[3*i];
		this.vertices[offset+PART_YPOS] = vertArr[3*i+1];
		this.vertices[offset+PART_ZPOS] = vertArr[3*i+2];
		this.vertices[offset+PART_DIAM] = 1;
		
	}
	
	if(colorArr!=undefined)
	{
		var step = 3;

		for(var i=0;i<colorArr.length/step;++i)
		{
			offset = i*PART_MAXVAR;
			this.vertices[offset+PART_R] = colorArr[step*i];
			this.vertices[offset+PART_G] = colorArr[step*i+1];
			this.vertices[offset+PART_B] = colorArr[step*i+2];
            this.vertices[offset+PART_A] = 0.0;
		}
	}
	else{
		
		for(var i=0;i<this.num;++i)
		{
			offset = i*PART_MAXVAR;
			this.vertices[offset+PART_R] = 0.0;
			this.vertices[offset+PART_G] = 1.0;
			this.vertices[offset+PART_B] = 1.0;
            this.vertices[offset+PART_A] = 0.0;
		}
	}
	
	if(faceArr!=undefined)
	{
		this.faces = new Uint16Array(faceArr.length);
		for(var i=0;i<faceArr.length;++i)
		{
			this.faces[i] = faceArr[i];
		}
	}
}

MeshObject.prototype.update = function(delta){
	
	var i, offset,pos;
	
	for(i = 0;i<this.num;++i)
	{
		offset = i*PART_MAXVAR;
		pos = this.vertices.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
		vec3.add(pos,pos,delta);
//		vec3.copy(pos,delta);
	}
}

BoundingCube = function(center, width, height, depth)
{
	//generate 8 points for the boundingCube
	this.parameters = {
		width: width,
		height: height,
		depth: depth,
	};
	
	
	this.vertices = new Array();
	this.faces = new Array();
	var offset = 0;
	
	this.vertices.push(-width/2,height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(-width/2,height/2,depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,height/2,depth/2);
	this.faces.push(offset++);
	this.vertices.push(-width/2,height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(-width/2,height/2,depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,height/2,depth/2);
	this.faces.push(offset++);
	

	this.vertices.push(-width/2,-height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(-width/2,height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,-height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(-width/2,-height/2,depth/2);
	this.faces.push(offset++);
	this.vertices.push(-width/2,height/2,depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,-height/2,depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,height/2,depth/2);
	this.faces.push(offset++);
	
	this.vertices.push(-width/2,-height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(-width/2,-height/2,depth/2);
	this.faces.push(offset++);

	this.vertices.push(width/2,-height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,-height/2,depth/2);
	this.faces.push(offset++);

	this.vertices.push(-width/2,-height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,-height/2,-depth/2);
	this.faces.push(offset++);

	this.vertices.push(-width/2,-height/2,-depth/2);
	this.faces.push(offset++);
	this.vertices.push(width/2,-height/2,-depth/2);
	this.faces.push(offset++);
	
	
	var i;
	for(i=0;i<this.vertices.length/3;++i)
	{
		this.vertices[3*i] += center[0];
		this.vertices[3*i+1] += center[1];
		this.vertices[3*i+2] += center[2];
	}
}

BoundingCube.prototype.constructor = BoundingCube;




