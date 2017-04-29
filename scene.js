var Scene = function(N) {
    this.N = N;
    this.points = null;
    this.functionLines = null;
    this.sphere = null;

    this.colorGrid = null;
};

Scene.POINT_RADIUS = 0.012;

Scene.prototype.getPlane = function(x,y,z) {
    if (!this.planes) {
	this.xyPlane = new THREE.Mesh(
	    Scene.makePlaneGeometry(vec3(0,1,0), vec3(0,0,0),vec3(1,1,0), vec3(1,0,0)),
	    Scene.MATERIALS[Scene.COLOR_GREEN]);
	this.xzPlane = new THREE.Mesh(
	    Scene.makePlaneGeometry(vec3(0,0,0), vec3(0,0,1),vec3(1,0,0), vec3(1,0,1)),
	    Scene.MATERIALS[Scene.COLOR_GREEN]);

	this.yzPlane = new THREE.Mesh(
	    Scene.makePlaneGeometry(vec3(0,1,1), vec3(0,1,0),vec3(0,0,1), vec3(0,0,0)),
	    Scene.MATERIALS[Scene.COLOR_GREEN]);

    }

    if (x && y && z) {
	throw 'Only two should be on!';
    } else if (x && y) {
	return this.xyPlane.clone();
    } else if (x && z) {
	return this.xzPlane.clone();
    } else if (y && z) {
	return this.yzPlane.clone();
    }

    throw 'At least two must be on!';
};

Scene.prototype.getColor = function(i, j, k) {
    if (!this.colorGrid) {
	throw 'Need a colorgrid!';
    }
    return this.colorGrid[k][j][i];
}

Scene.prototype.nXYZ = function() {
    if (!this.colorGrid) {
	throw 'Need a colorgrid!';
    }
    return vec3(this.colorGrid[0][0].length - 1,
		this.colorGrid[0].length - 1,
		this.colorGrid.length - 1);
}

Scene.prototype.fillInGrid = function() {
    this.fill = new THREE.Group();
    var nXYZ = this.nXYZ();
    var nX = nXYZ.x;
    var nY = nXYZ.y;
    var nZ = nXYZ.z;

    //var geometry = new THREE.geometry();
    
    for (var i = 0; i <= nX; i++) {
	for (var j = 0; j <= nY; j++) {
	    for (var k = 0; k <= nZ; k++) {
		var color = this.getColor(i, j, k);
		if (i < nX && j < nY) {
		    if (this.getColor(i + 1, j, k) == color &&
			this.getColor(i, j + 1, k) == color &&
			this.getColor(i + 1, j + 1, k) == color) {
			var plane = this.getPlane(1, 1, 0);
			plane.scale.set(1/nX, 1/nY, Scene.POINT_RADIUS/2);
			plane.position.set(i/nX, j/nY, k/nZ);
			plane.material = Scene.MATERIALS[Scene.COLORS[color]];
			geometry.merge(plane, this.fill.add(plane);
		    }
		}

		if (j < nY && k < nZ) {
		    if (this.getColor(i, j + 1, k) == color &&
			this.getColor(i, j, k + 1) == color &&
			this.getColor(i, j + 1, k + 1) == color) {
			var plane = this.getPlane(0, 1, 1);
			plane.scale.set(Scene.POINT_RADIUS/2, 1/nY, 1/nZ);
			plane.position.set(i/nX, j/nY, k/nZ);
			plane.material = Scene.MATERIALS[Scene.COLORS[color]];
			this.fill.add(plane);
		    }
				}

		if (i < nX && k < nZ) {
		    if (this.getColor(i + 1, j, k) == color &&
			this.getColor(i, j, k + 1) == color &&
			this.getColor(i + 1, j, k + 1) == color) {
			var plane = this.getPlane(1, 0, 1);
			plane.scale.set(1/nX, Scene.POINT_RADIUS/2, 1/nZ);
			plane.position.set(i/nX, j/nY, k/nZ);
			plane.material = Scene.MATERIALS[Scene.COLORS[color]];
			this.fill.add(plane);
		    }
		}


	    }
	}
    }
    return this.fill;
};

Scene.makeGrid = function(n) {
    var material = new THREE.LineDashedMaterial({ color: 0xffffff, scale: 0.14 });
    var geometry = new THREE.Geometry();
    // All the lines
    for (var i = 0; i <= n; i++) {
	for (var j = 0; j <= n; j++) {
	    geometry.vertices.push(vec3(i, j, 0).multiplyScalar(1/n));
	    geometry.vertices.push(vec3(i, j, n).multiplyScalar(1/n));

	    geometry.vertices.push(vec3(0, j, i).multiplyScalar(1/n));
	    geometry.vertices.push(vec3(n, j, i).multiplyScalar(1/n));

	    geometry.vertices.push(vec3(i, 0, j).multiplyScalar(1/n));
	    geometry.vertices.push(vec3(i, n, j).multiplyScalar(1/n));
	}
    }
    return new THREE.LineSegments(geometry, material);
};

Scene.makeAxes = function() {
    var group = new THREE.Group();
    var origin = vec3(0, 0, 0);
    var xArrow = new THREE.ArrowHelper(vec3(1, 0, 0), origin, 2, Scene.COLOR_WHITE);
    var yArrow = new THREE.ArrowHelper(vec3(0, 1, 0), origin, 2, Scene.COLOR_WHITE);
    var zArrow = new THREE.ArrowHelper(vec3(0, 0, 1), origin, 2, Scene.COLOR_WHITE);

    group.add(xArrow, yArrow, zArrow);
    return group;
};

Scene.prototype.makePoint = function(color, position, scaleFactor) {
    if (!this.sphere) {
	this.sphere = new THREE.Mesh(
	    new THREE.BoxGeometry(2 * Scene.POINT_RADIUS, 2 * Scene.POINT_RADIUS, 2 * Scene.POINT_RADIUS, 2, 2),
	    Scene.MATERIALS[Scene.COLOR_GREEN]
	);
    }

    if (!scaleFactor) {
	scaleFactor = 1;
    }
    var sphere = this.sphere.clone();
    sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);
    sphere.position.set(position.x, position.y, position.z);
    sphere.material = Scene.MATERIALS[Scene.COLORS[color]];
    return sphere;
}

Scene.prototype.makeCustomPoints = function(pointArray, flipY, scaleFactor) {
    if (!!flipY) {
	for (var z = 0; z < pointArray.length; z++) {
	    for (var y = 0; y < pointArray[0].length; y++) {
		pointArray[z][y].reverse();
	    }
	}
    }
    
    if (!this.colorGrid) {
	this.colorGrid = pointArray;
    }
    var nZ = pointArray.length - 1;
    var nY = pointArray[0].length - 1;
    var nX = pointArray[0][0].length - 1;

    if (!this.points) {
	this.points = new THREE.Group();
    }

    for (var k = 0; k <= nZ; k++) {
	for (var j = 0; j <= nY; j++) {
	    for (var i = 0; i <= nX; i++) {
		var point = this.makePoint(
		    pointArray[k][j][i],
		    vec3(i/nX, j/nY, k/nZ),
		    scaleFactor || 1
		);
		this.points.add(point);
	    }
	}
    }
    return this.points;
};

Scene.prototype.makePointsAndFunctionLines = function() {
    var n = this.N;

    if (!this.points) {
	this.points = new THREE.Group();
    }

    if (!this.functionLines) {
	this.functionLines = new THREE.Group();
    }

    var colorGrid = [];
    for (var k = 0; k <= n; k++) {
	var plane = [];
	for (var i = 0; i <= n; i++) {
	    var row = [];
	    for (var j = 0; j <= n; j++) {
		var color = null;
		var inputPoint = vec3(i/n, j/n, k/n);

		var outputPoint = Scene.StartingFunctions.contractionmap4(inputPoint.clone());

		var displacement = vec3().subVectors(outputPoint, inputPoint);
		color = Scene.colorPointFromDisplacementAndPoint(displacement, inputPoint);

		var lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(inputPoint);
		lineGeometry.vertices.push(outputPoint);
		this.functionLines.add(new THREE.LineSegments(
		    lineGeometry,
		    new THREE.LineBasicMaterial({ color: Scene.COLORS[color], linewidth: 5 })
		));

		row.push(color);

	    }
	    plane.push(row)
	}
	colorGrid.push(plane);
    }

    return this.makeCustomPoints(colorGrid);
};

Scene.makePlaneGeometry = function(topLeft, bottomLeft, topRight, bottomRight) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
	vec3().copy(topLeft),
	vec3().copy(bottomRight),
	vec3().copy(bottomLeft),
	vec3().copy(topRight)
    );
    geometry.faces.push(
	new THREE.Face3(0, 1, 2),
	new THREE.Face3(0, 3, 1)
    );

    //geometry.computeFaceNormals();
    //geometry.computeVertexNormals();
    return geometry;
};

Scene.prototype.makeIcosphere = function(depth) {

    var geometry = new THREE.IcosahedronGeometry(1, depth);

    var dummy = vec3(0.5, 0.5, 0.5);
    var vertices = geometry.vertices;
    for (var i = 0; i < geometry.faces.length; i++) {
	face = geometry.faces[i];
	face.vertexColors = [
	    new THREE.Color(Scene.COLORS[Scene.colorPointFromDisplacementAndPoint(vertices[face.a], dummy)]),
	    new THREE.Color(Scene.COLORS[Scene.colorPointFromDisplacementAndPoint(vertices[face.b], dummy)]),
	    new THREE.Color(Scene.COLORS[Scene.colorPointFromDisplacementAndPoint(vertices[face.c], dummy)])
        ];
    }

    var material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, vertexColors: THREE.VertexColors, side: THREE.DoubleSide});
    var icoSphere = new THREE.Mesh(geometry, material);
    return icoSphere;
};

Scene.COLOR_YELLOW = 0xffff00;
Scene.COLOR_RED = 0xff0000;
Scene.COLOR_BLUE = 0x0000ff;
Scene.COLOR_GREEN = 0x00ff00;
Scene.COLOR_ORANGE = 0xff9900;
Scene.COLOR_PINK = 0xffbad2;
Scene.COLOR_WHITE = 0xffffff;

Scene.COLORS = [Scene.COLOR_GREEN, Scene.COLOR_BLUE, Scene.COLOR_RED, Scene.COLOR_YELLOW, Scene.COLOR_WHITE];

Scene.MATERIALS = {};
Scene.MATERIALS[Scene.COLOR_GREEN] = new THREE.MeshPhongMaterial({color: Scene.COLOR_GREEN, side: THREE.DoubleSide });
Scene.MATERIALS[Scene.COLOR_YELLOW] = new THREE.MeshPhongMaterial({color: Scene.COLOR_YELLOW, side: THREE.DoubleSide });
Scene.MATERIALS[Scene.COLOR_RED] = new THREE.MeshPhongMaterial({color: Scene.COLOR_RED, side: THREE.DoubleSide });
Scene.MATERIALS[Scene.COLOR_BLUE] = new THREE.MeshPhongMaterial({color: Scene.COLOR_BLUE, side: THREE.DoubleSide });
Scene.MATERIALS[Scene.COLOR_WHITE] = new THREE.MeshPhongMaterial({color: Scene.COLOR_WHITE, side: THREE.DoubleSide });

Scene.S = [vec3(1,1,1), vec3(-1,1,1), vec3(0,-1,1), vec3(0,0,-1)];
Scene.S[0].ix = 0;
Scene.S[1].ix = 1;
Scene.S[2].ix = 2;
Scene.S[3].ix = 3;

Scene.regions = function(colors, dir) {
    var isNonnegative = function(col) {
	return dir.x * col.x >= 0 && dir.y * col.y >= 0 && dir.z * col.z >= 0;
    };

    return _.filter(colors, isNonnegative);
};

Scene.allowed = function(colors, point) {
    var inside = function(coord) {
	return coord > 0 && coord < 1;
    }
    var isAllowed = function(col) {
	return (inside(point.x) || col.x + point.x >= 0)
	    && (inside(point.y) || col.y + point.y >= 0)
	    && (inside(point.z) || col.z + point.z >= 0);
    };

    return _.filter(colors, isAllowed);
};

Scene.colorPointFromDisplacementAndPoint = function(displacement, point) {
    var options = Scene.allowed(Scene.regions(Scene.S, displacement), point);
    if (options.length == 0) {
	throw 'Error!';
    }
    return options[0].ix;
};

Scene.StartingFunctions = {
    contractionmap: function(inputPoint) {
	var point = inputPoint.clone();
	var offset = vec3(1/2, 1/2, 1/2);
	var centeredPoint = point.sub(offset);
	var r = Math.sqrt(centeredPoint.x ** 2 + centeredPoint.y ** 2);
	var theta = Math.atan2(centeredPoint.y, centeredPoint.x);
	var rnew = 0.92 * r;
	var thetanew = (theta - 0.2) % (2 * Math.PI);
	var xnew = rnew * Math.cos(thetanew);
	var ynew = rnew * Math.sin(thetanew);
	var znew = 0.88 * (inputPoint.z - 1/2);

	var outputPoint = vec3(xnew + 1/2, ynew + 1/2, znew + 1/2);
	outputPoint.clampScalar(0, 1);
	return outputPoint;
    },

    contractionmap2: function(inputPoint) {
	var point = inputPoint.clone();
	var offset = vec3(1/2, 1, 1/2);
	var centeredPoint = point.sub(offset);
	var r = Math.sqrt(centeredPoint.x ** 2 + centeredPoint.z ** 2);
	var theta = Math.atan2(centeredPoint.x, centeredPoint.z);
	var rnew = (0.92 - (0.6 * point.y)) * r;
	var thetanew = (theta - 0.4) % (2 * Math.PI);
	var znew = rnew * Math.cos(thetanew);
	var xnew = rnew * Math.sin(thetanew);
	var ynew = point.y + 0.05;
	var outputPoint = vec3(xnew, ynew, znew);
	return outputPoint.add(offset).clampScalar(0, 1);
    },

    contractionmap3: function(point) {
	return vec3(0, 0, 0);
    },

    contractionmap4: function(inputPoint) {
	var offset = vec3(1/2,1/2,1/2);
	var point = inputPoint.clone().sub(offset);
	return point.multiplyScalar(0.8).add(offset);
    }
};

Scene.CustomPoints = {
    example1: [
	[[2, 2, 2, 2, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 0, 2, 2, 2],
	 [1, 0, 0, 0, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 0]],

	[[2, 2, 2, 2, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 0, 2, 2, 2],
	 [1, 0, 0, 3, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 0]],

	[[2, 2, 2, 2, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 0, 2, 2, 2],
	 [1, 0, 0, 3, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 0]],

	[[2, 2, 2, 2, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 0, 2, 2, 2],
	 [1, 0, 0, 3, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 0]],

	[[2, 2, 2, 2, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 1, 2, 2, 2],
	 [1, 1, 1, 0, 2, 2, 2],
	 [1, 0, 0, 3, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 2],
	 [1, 0, 0, 0, 0, 0, 0]],

	[[3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3]],
	
	[[3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3],
	 [3, 3, 3, 3, 3, 3, 3]]
    ]
};
