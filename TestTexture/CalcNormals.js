function vecCross(v1,v2,dest) {

	if(dest===undefined) dest = new Float32Array(3);
	
	var ax = v1[0], ay = v1[1], az = v1[2];
	var bx = v2[0], by = v2[1], bz = v2[2];

    dest[0] = ay * bz - az * by;
    dest[1] = az * bx - ax * bz;
    dest[2] = ax * by - ay * bx;

}

function vecSub(a,b,dest) {

	if(dest===undefined) dest = new Float32Array(3);
	dest[0] = a[0] - b[0];
    dest[1] = a[1] - b[1];
    dest[2] = a[2] - b[2];
}

function vecAdd(a, b, out) {
	if(out===undefined) out = new Float32Array(3);
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
};
function calculateVertexNormals(vertices,indices){
    var vertexVectors=[];
    var normalVectors=[];
    var normals=[];
    var j;
	console.log(vertices.length/3);
    for(var i=0;i<vertices.length;i=i+3){
        var vector=new Vector3([vertices[i],vertices[i+1],vertices[i+2]]);
        var normal=new Vector3([0,0,0]);
        normalVectors.push(normal);
        vertexVectors.push(vector);
    }
	
    // try{
        for(j=0;j<indices.length;j=j+3)//Since we are using triads of indices to represent one primitive
        {

            //v1-v0
            var vector1=new Vector3();
            // vec3.subtract(vector1,vertexVectors[indices[j+1]],vertexVectors[indices[j]]);
			vecSub(vertexVectors[indices[j+1]].elements,vertexVectors[indices[j]].elements,vector1.elements);
			// console.log(vector1.elements);

            //v2-v1
            var vector2=new Vector3();
			vecSub(vertexVectors[indices[j+2]].elements,vertexVectors[indices[j+1]].elements,vector1.elements);
            // vec3.subtract(vector2,vertexVectors[indices[j+2]],vertexVectors[indices[j+1]]);
            var normal=new Vector3();
            //cross product of two vector
            vecCross(vector1.elements, vector2.elements,normal.elements);
            //Since the normal caculated from three vertices is same for all the three vertices(same face/surface), the contribution from each normal to the corresponding vertex  is the same
            vecAdd(normalVectors[indices[j]].elements,normal.elements,normalVectors[indices[j]].elements);
            vecAdd(normalVectors[indices[j+1]].elements,normal.elements,normalVectors[indices[j+1]].elements);
            vecAdd(normalVectors[indices[j+2]].elements,normal.elements,normalVectors[indices[j+2]].elements);

        }

    for(var j=0;j<normalVectors.length;j=j+1){
		normalVectors[j].normalize();
        normals.push(normalVectors[j].elements[0]);
        normals.push(normalVectors[j].elements[1]);
        normals.push(normalVectors[j].elements[2]);

    }
    return normals;
}
