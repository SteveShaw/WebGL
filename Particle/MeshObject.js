meshObject = function(num,cont){
	this.num = num;
	this.vertices = cont.meshes.curVert.subarray(cont.nextOff,num*PART_MAXVAR);
	this.startOff = cont.nextOff;
	this.faces = null;
	cont.nextOff += this.num*PART_MAXVAR;
}


meshObject.prototype.constructor = meshObject;

meshObject.prototype.setData = function(vertArr,colorArr,faceArr){
	for(var i = 0;i<vertArr.length/3;++i)
	{
		var offset = i*PART_MAXVAR;
		this.vertices[offset+PART_XPOS] = vertArr[3*i];
		this.vertices[offset+PART_YPOS] = vertArr[3*i+1];
		this.vertices[offset+PART_ZPOS] = vertArr[3*i+2];
		this.vertices[offset+PART_DIAM] = 1;
	}
	
	if(colorArr!=undefined)
	{
		for(var i=0;i<colorArr.length/3;++i)
		{
			var offset = i*PART_MAXVAR;
			this.vertices[offset+PART_R] = colorArr[3*i];
			this.vertices[offset+PART_G] = colorArr[3*i+1];
			this.vertices[offset+PART_B] = colorArr[3*i+2];}
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