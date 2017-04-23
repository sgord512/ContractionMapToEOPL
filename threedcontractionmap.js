function vec3(x, y, z) { return new THREE.Vector3(x, y, z); }
function mat4() { return new THREE.Matrix4(); }

App = function(window, document) {

    // Add a floor.

    // Add FPS controls:
    // I: forward, K: back, J: left, L: right, U: up, O: down
    // scroll forward to zoom in, scroll backward to zoom out
    // move mouse to look around.

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.prevTime = performance.now();
    this.velocity = vec3();
    
    this.N = 10;
    this.M = this.N + 2;
    this.addBoundary = false;
    this.pointRadius = 0.012;
    this.keyboard = new KeyboardState();
    this.clock = new THREE.Clock();

    // SCENE
    this.scene = new THREE.Scene();
    // CAMERA
    this.SCREEN_WIDTH = window.innerWidth;
    this.SCREEN_HEIGHT = window.innerHeight;
    this.VIEW_ANGLE = 45;
    this.ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
    this.NEAR = 0.1;
    this.FAR = 20000;
    this.camera = new THREE.PerspectiveCamera( this.VIEW_ANGLE, this.ASPECT, this.NEAR, this.FAR);


    this.controls = new THREE.PointerLockControls( this.camera );
    var controls = this.controls;

    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );
    // http://www.html5rocks.com/en/tutorials/pointerlock/intro/
    var havePointerLock = 'pointerLockElement' in document ||
	'mozPointerLockElement' in document ||
	'webkitPointerLockElement' in document;
    if ( havePointerLock ) {
	var element = document.body;
	var pointerlockchange = function ( event ) {
	    if ( document.pointerLockElement === element ||
		 document.mozPointerLockElement === element ||
		 document.webkitPointerLockElement === element ) {
		controls.enabled = true;
		blocker.style.display = 'none';
	    } else {
		controls.enabled = false;
		blocker.style.display = '-webkit-box';
		blocker.style.display = '-moz-box';
		blocker.style.display = 'box';
		instructions.style.display = '';
	    }
	};
	var pointerlockerror = function ( event ) {
	    instructions.style.display = '';
	};
	// Hook pointer lock state change events
	document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
	instructions.addEventListener( 'click', function ( event ) {
	    instructions.style.display = 'none';
	    // Ask the browser to lock the pointer
	    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
	    element.requestPointerLock();
	}, false );
    } else {
	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }

    document.body.addEventListener( 'click', function ( event ) {
	element.requestPointerLock = element.requestPointerLock ||
	    element.mozRequestPointerLock ||
	    element.webkitRequestPointerLock;
	element.requestPointerLock();
    }, false );
    
    this.scene.add( this.controls.getObject() );

    this.light = new THREE.DirectionalLight(0xffffff, 0.5);
    this.light.position.set(0, 1, 1);
    var ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    this.scene.add(this.light);

    document.addEventListener( 'keydown', _.bind(this.onKeyDown, this), false );
    document.addEventListener( 'keyup', _.bind(this.onKeyUp, this), false );
    
    // RENDERER
    if ( Detector.webgl ) { 
	this.renderer = new THREE.WebGLRenderer( {antialias:true} );
    } else {
	this.renderer = new THREE.CanvasRenderer();
    }
    this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

    this.group = new THREE.Group();    
    this.group.add(this.makeAxes());
    //this.group.add(this.makeGrid(this.addBoundary ? this.M : this.N));
    
    this.points = new THREE.Group();
    this.functionArrows = new THREE.Group();

    this.makePoints(this.addBoundary ? this.M : this.N);
    
    this.planes = this.makePlanes();

    this.group.add(this.points);
    //this.group.add(this.planes);
    this.group.add(this.functionArrows);
    var icosphere = this.makeIcosphere(5);
    icosphere.applyMatrix((new THREE.Matrix4()).makeScale(0.2, 0.2, 0.2));
    icosphere.translateX(-0.5);
    icosphere.translateY(1);
    icosphere.translateZ(0);
    icosphere.updateMatrix();
    this.group.add(icosphere);
    //this.group.add(this.makeIcosphere(5));

    this.group.scale = this.vec3(this.N * 10, this.N * 10, this.N * 10);
    this.group.translateX(-1/2);
    this.group.translateZ(-1/2);
    this.group.translateY(-1/4);
    
    this.scene.add(this.group);

    this.controls.getObject().translateX();
    this.controls.getObject().translateY(-this.N);
    this.controls.getObject().translateZ(+this.N);

    this.renderFunction = this.makeRenderFunction();
    this.renderFunction();
    
    document.body.appendChild(this.renderer.domElement);
    
};

App.prototype.vec3 = function(x, y, z) {
    return vec3(x, y, z);
};

App.prototype.makeGrid = function(n) {
    var material = new THREE.LineDashedMaterial({ color: 0xffffff, scale: 0.14 });
    var geometry = new THREE.Geometry();
    // All the lines    
    for (var i = 0; i <= n; i++) {
	for (var j = 0; j <= n; j++) {
	    geometry.vertices.push(this.vec3(i, j, 0).multiplyScalar(1/n));
	    geometry.vertices.push(this.vec3(i, j, n).multiplyScalar(1/n));

	    geometry.vertices.push(this.vec3(0, j, i).multiplyScalar(1/n));
	    geometry.vertices.push(this.vec3(n, j, i).multiplyScalar(1/n));

	    geometry.vertices.push(this.vec3(i, 0, j).multiplyScalar(1/n));
	    geometry.vertices.push(this.vec3(i, n, j).multiplyScalar(1/n));
	}
    }
    return new THREE.LineSegments(geometry, material);
};

App.prototype.makeAxes = function() {
    var group = new THREE.Group();
    var origin = this.vec3(0, 0, 0);
    var xArrow = new THREE.ArrowHelper(this.vec3(1, 0, 0), origin, 2, App.COLOR_WHITE);
    var yArrow = new THREE.ArrowHelper(this.vec3(0, 1, 0), origin, 2, App.COLOR_WHITE);
    var zArrow = new THREE.ArrowHelper(this.vec3(0, 0, 1), origin, 2, App.COLOR_WHITE);

    group.add(xArrow, yArrow, zArrow);
    return group;
};

App.prototype.makePoints = function(n) {
    var geometry = new THREE.SphereGeometry(this.pointRadius, 5, 5);
    var materialGreen = new THREE.MeshBasicMaterial({color: App.COLOR_GREEN });
    var materialRed = new THREE.MeshBasicMaterial({color: App.COLOR_RED });
    var materialBlue = new THREE.MeshBasicMaterial({color: App.COLOR_BLUE });
    var materialYellow = new THREE.MeshBasicMaterial({color: App.COLOR_YELLOW });
    var materialWhite = new THREE.MeshBasicMaterial({color: App.COLOR_WHITE });
    
    var materials = {};
    materials[App.COLOR_GREEN] = materialGreen;
    materials[App.COLOR_YELLOW] = materialYellow;
    materials[App.COLOR_RED] = materialRed;
    materials[App.COLOR_BLUE] = materialBlue;
    materials[App.COLOR_WHITE] = materialWhite;
    
    var sphereMesh = new THREE.Mesh(geometry, materialGreen);
    
    if (!this.points) {
	this.points = new THREE.Group();
    }

    if (!this.functionArrows) {
	this.functionArrows = new THREE.Group();
    }

    for (var i = 0; i <= n; i++) {
	for (var j = 0; j <= n; j++) {
	    for (var k = 0; k <= n; k++) {

		var color = null;
		var inputPoint = null;
		var point = vec3(i/n, j/n, k/n);
		if (this.addBoundary) {
		    if (this.isBoundaryPoint(point)) {
			color = App.COLORS[this.colorBoundaryPoint(point)];
		    } else {
			inputPoint = this.vec3(i - 1, j - 1, k - 1).multiplyScalar(1/(n-2));

		    }			
		} else {
		    inputPoint = point;
		}

		if (!_.isNull(inputPoint)) {
		    var outputPoint = App.StartingFunctions.contractionmap4(inputPoint.clone());
		    if (this.addBoundary) {
			outputPoint.multiplyScalar((n-2)/n).addScalar(1/n);
		    }
		    
		    var displacement = vec3().subVectors(outputPoint, inputPoint);
		    color = App.COLORS[this.colorPointFromDisplacementAndPoint(displacement, inputPoint)];
		    
		    var lineGeometry = new THREE.Geometry();
		    lineGeometry.vertices.push(inputPoint);
		    lineGeometry.vertices.push(outputPoint);
		    this.functionArrows.add(new THREE.LineSegments(
		    	lineGeometry,
		    	new THREE.LineBasicMaterial({ color: color, linewidth: 5 })
		    ));
		}
		
		var sphere = sphereMesh.clone();
		sphere.position.set(i/n, j/n, k/n);
		sphere.material = materials[color];
		this.points.add(sphere);
	    }
	}
    }

    //this.functionArrows.add(functionLines);
};

App.prototype.isBoundaryPoint = function(point) {
    return this.addBoundary && (point.x == 0 || point.y == 0 || point.z == 0 ||
				point.x == 1 || point.y == 1 || point.z == 1);
};

App.prototype.colorBoundaryPoint = function(point) {
    if (point.x == 1 || point.y == 1 || point.z == 1) {
	if (point.x > 0) {
	    return 1;
	}
    }

    if (point.x == 0) {
	if (point.y > 0) {
	    return 3;
	}
    }

    if (point.y == 0) {
	if (point.z > 0) {
	    return 2;
	}
    }

    if (point.z == 0) {
	return 0;
    }

    return 4;
};

App.prototype.colorPointFromDisplacement = function(displacement, point) {
    if (!point) {
	point = vec3(0.5, 0.5, 0.5);
    }

    // For interior points, assign ties in a consistent way to one of the available options.
    // For border points, keep track of all the subsets that are available, and pick one of the points from the subset. 
    // So I should probably have two branches, one for interior, and one for border points.
    var possible_colors = [];    
    var dots = this.getDotProducts(displacement);
    if (dots.XY >= 0 && dots.XZ >= 0 && dots.YZ >= 0) {
	possible_colors.push(App.COLOR_GREEN);
	if (point.x < 1 && point.y < 1 && point.z < 1) {
    	    return 0;
	}
    }

    if (dots.YZ <= 0 && dots.YW >= 0 && dots.ZW <= 0) {
	possible_colors.push(App.COLOR_YELLOW);
	if (point.x > 0) { 
    	    return 1;
	}
    }

    if (dots.XY <= 0 && dots.XW >= 0 && dots.YW <= 0) {
	possible_colors.push(App.COLOR_RED);
	if (point.z > 0) {
	    return 2;
	}
    }

    if (dots.XZ <= 0 && dots.XW <= 0 && dots.ZW >= 0) {
	possible_colors.push(App.COLOR_BLUE);
	if (point.y > 0) { 
	    return 3;
	}
    }

    return 0xFFFFFF;
};

App.prototype.makePlaneGeometry = function(topLeft, bottomLeft, topRight, bottomRight) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
	this.vec3().copy(topLeft),
	this.vec3().copy(bottomRight),
	this.vec3().copy(bottomLeft),
	this.vec3().copy(topLeft),
	this.vec3().copy(topRight),
	this.vec3().copy(bottomRight)
    );
    geometry.faces.push(
	new THREE.Face3(0, 1, 2),
	new THREE.Face3(3, 4, 5)
    );

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    return geometry;
};

App.prototype.makeBasicMaterial = function(color, side) {
    return new THREE.MeshPhongMaterial({color: color || App.COLOR_RED, side: side || THREE.DoubleSide});
};

App.prototype.makePlanes = function() {
    var phi = (1 + Math.sqrt(5))/ 2;
    var x = Math.sqrt(1/(1 + (phi ** 2)));
    var y = phi * x;
    
    var planesGroup = new THREE.Group();
    var self = this;
    function plane(topLeft, bottomLeft, topRight, bottomRight) {
	return self.makePlaneGeometry(
	    topLeft,
	    bottomLeft,
	    topRight,
	    bottomRight
	);
	//return new THREE.PlaneGeometry(1, 1);
    }

    var wvec = vec3(-1, -1, -1).multiplyScalar(Math.sqrt(2/3));
    
    var xyPlane = plane(
	vec3(0, 1, 0),
	vec3(0, 0, 0),
	vec3(1, 1, 0),
	vec3(1, 0, 0)
    );
    planesGroup.add(new THREE.Mesh(xyPlane, this.makeBasicMaterial(App.COLOR_RED, THREE.FrontSide)),
		    new THREE.Mesh(xyPlane, this.makeBasicMaterial(App.COLOR_GREEN, THREE.BackSide)));
    
    var xzPlane = plane(
	vec3(0, 0, 0),
	vec3(0, 0, 1),
	vec3(1, 0, 0),
	vec3(1, 0, 1)
    );
    planesGroup.add(new THREE.Mesh(xzPlane, this.makeBasicMaterial(App.COLOR_BLUE, THREE.FrontSide)),
		    new THREE.Mesh(xzPlane, this.makeBasicMaterial(App.COLOR_GREEN, THREE.BackSide)));
    
    var yzPlane = plane(
	vec3(0, 1, 1),
	vec3(0, 0, 1),
	vec3(0, 1, 0),
	vec3(0, 0, 0)
    );
    planesGroup.add(new THREE.Mesh(yzPlane, this.makeBasicMaterial(App.COLOR_YELLOW, THREE.FrontSide)),
		    new THREE.Mesh(yzPlane, this.makeBasicMaterial(App.COLOR_GREEN, THREE.BackSide)));
    
    var xwPlane = plane(
	vec3(1, 0, 0),
	vec3(0, 0, 0),
	vec3(1, 0, 0).add(wvec).setX(1),
	vec3().copy(wvec)
    );
    planesGroup.add(new THREE.Mesh(xwPlane, this.makeBasicMaterial(App.COLOR_RED, THREE.FrontSide)),
		    new THREE.Mesh(xwPlane, this.makeBasicMaterial(App.COLOR_BLUE, THREE.BackSide)));

    var ywPlane = plane(
	vec3(0, 1, 0),
	vec3(0, 0, 0),
	vec3(0, 1, 0).add(wvec).setY(1),
	vec3().copy(wvec)
    );
    planesGroup.add(new THREE.Mesh(ywPlane, this.makeBasicMaterial(App.COLOR_YELLOW, THREE.FrontSide)),
		    new THREE.Mesh(ywPlane, this.makeBasicMaterial(App.COLOR_RED, THREE.BackSide)));

    var zwPlane = plane(
	vec3(0, 0, 0),
	vec3(0, 0, 1),
	vec3().copy(wvec),
	vec3(0, 0, 1).add(wvec).setZ(1)
    );
    planesGroup.add(new THREE.Mesh(zwPlane, this.makeBasicMaterial(App.COLOR_YELLOW, THREE.FrontSide)),
		    new THREE.Mesh(zwPlane, this.makeBasicMaterial(App.COLOR_BLUE, THREE.BackSide)));

    return planesGroup;
};

App.prototype.makeIcoplanes = function() {
    var group = new THREE.Group();
    var plane1 = this.makePlaneGeometry(
	vec3(x, y, 0),
	vec3(x, -y, 0),
	vec3(-x, y, 0),
	vec3(-x, -y, 0)
    );
    group.add(new THREE.Mesh(plane1, this.makeBasicMaterial(App.COLOR_RED)));

    var plane2 = this.makePlaneGeometry(
	vec3(0, x, y),
	vec3(0, x, -y),
	vec3(0, -x, y),
	vec3(0, -x, -y)
    );
    group.add(new THREE.Mesh(plane2, this.makeBasicMaterial(App.COLOR_GREEN)));
    
    var plane3 = this.makePlaneGeometry(
	vec3(y, 0, x),
	vec3(-y, 0, x),
	vec3(y, 0, -x),
	vec3(-y, 0, -x)
    );
    group.add(new THREE.Mesh(plane3, this.makeBasicMaterial(App.COLOR_BLUE)));
    return group;
};

App.prototype.makeIcosphere = function(depth) {

    var phi = (1 + Math.sqrt(5))/ 2;
    var x = Math.sqrt(1/(1 + (phi ** 2)));
    var y = phi * x;

    var tri = function(a,b,c) {
	return {a:a,b:b,c:c};
    };

    var geometry = new THREE.Geometry();
    geometry.vertices.push(
	vec3(x, y, 0),
	vec3(x, -y, 0),
	vec3(-x, y, 0),
	vec3(-x, -y, 0),
	vec3(0, x, y),
	vec3(0, x, -y),
	vec3(0, -x, y),
	vec3(0, -x, -y),
	vec3(y, 0, x),
	vec3(-y, 0, x),
	vec3(y, 0, -x),
	vec3(-y, 0, -x)
    );

    var triangles = new Array();
    triangles.push(
	tri(0, 8, 4),
	tri(0, 4, 2),
	tri(0, 2, 5),
	tri(0, 5, 10),
	tri(0, 10, 8),
	tri(3, 1, 7),
	tri(3, 7, 11),
	tri(3, 11, 9),
	tri(3, 9, 6),
	tri(3, 6, 1),
	tri(2, 4, 9),
	tri(2, 9, 11),
	tri(2, 11, 5),
	tri(4, 6, 9),
	tri(4, 8, 6),
	tri(5, 11, 7),
	tri(5, 7, 10),
	tri(1, 8, 10),
	tri(1, 6, 8),
	tri(1, 10, 7)
    );

    for (var i = 0; i < depth; i++) {
	var newTriangles = new Array();
	_.each(triangles, function(t) {
	    var l = geometry.vertices.length;
	    var a = geometry.vertices[t.a];
	    var b = geometry.vertices[t.b];
	    var c = geometry.vertices[t.c];
	    geometry.vertices.push(vec3().lerpVectors(a, b, 1/2).normalize());
	    geometry.vertices.push(vec3().lerpVectors(b, c, 1/2).normalize());
	    geometry.vertices.push(vec3().lerpVectors(c, a, 1/2).normalize());
	    newTriangles.push(
		tri(t.a, l, l+2),
		tri(t.b, l+1, l),
		tri(t.c, l+2, l+1),
		tri(l, l+1, l+2)
	    );
	});
	triangles = newTriangles;
    }


    geometry.faces = _.map(triangles, function(t) {
	var face = new THREE.Face3(t.a, t.b, t.c);
	return face;
    }, this);
    geometry.mergeVertices();

    var dummy = vec3(0.5, 0.5, 0.5);
    var vertices = geometry.vertices;
    for (var i = 0; i < geometry.faces.length; i++) {
	face = geometry.faces[i];
	face.vertexColors = [ 
	    new THREE.Color(App.COLORS[this.colorPointFromDisplacementAndPoint(vertices[face.a], dummy)]),
	    new THREE.Color(App.COLORS[this.colorPointFromDisplacementAndPoint(vertices[face.b], dummy)]),
	    new THREE.Color(App.COLORS[this.colorPointFromDisplacementAndPoint(vertices[face.c], dummy)]) 
        ];
    }

    var material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, vertexColors: THREE.VertexColors, side: THREE.DoubleSide});
    var icoSphere = new THREE.Mesh(geometry, material);
    return icoSphere;
};

App.prototype.getDotProducts = function(point) {
    return {
	XY: App.XY_PLANE.normal.dot(point),
	XZ: App.XZ_PLANE.normal.dot(point),
	XW: App.XW_PLANE.normal.dot(point),
	YZ: App.YZ_PLANE.normal.dot(point),
	YW: App.YW_PLANE.normal.dot(point),
	ZW: App.ZW_PLANE.normal.dot(point)
    };
};

App.prototype.makeRenderFunction = function() {
    return _.bind(function() {	
	requestAnimationFrame(this.renderFunction);
	this.render();
    }, this);
};


App.prototype.render = function() {
    var acc = 200.0;
    var time = performance.now();
    var delta = ( time - this.prevTime ) / 1000;
    // this.velocity.x -= this.velocity.x * 10.0 * delta;
    // this.velocity.z -= this.velocity.z * 10.0 * delta;
    // this.velocity.y -= this.velocity.y * 10.0 * delta; 
    this.velocity = vec3();
    if ( this.moveForward ) this.velocity.z -= acc * delta;
    if ( this.moveBackward ) this.velocity.z += acc * delta;
    if ( this.moveLeft ) this.velocity.x -= acc * delta;
    if ( this.moveRight ) this.velocity.x += acc * delta;
    if ( this.moveUp ) this.velocity.y += acc * delta;
    if ( this.moveDown ) this.velocity.y -= acc * delta;
    this.controls.getObject().translateX( this.velocity.x * delta );
    this.controls.getObject().translateY( this.velocity.y * delta );
    this.controls.getObject().translateZ( this.velocity.z * delta );

    this.prevTime = time;
    this.renderer.render(this.scene, this.camera);
    
};

App.StartingFunctions = {
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

App.S = [vec3(1,1,1), vec3(-1,1,1), vec3(0,-1,1), vec3(0,0,-1)];
App.S[0].ix = 0;
App.S[1].ix = 1;
App.S[2].ix = 2;
App.S[3].ix = 3;

App.prototype.regions = function(colors, dir) {
    var isNonnegative = function(col) {
	return dir.x * col.x >= 0 && dir.y * col.y >= 0 && dir.z * col.z >= 0;
    };

    return _.filter(colors, isNonnegative);
};

App.prototype.allowed = function(colors, point) {
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

App.prototype.colorPointFromDisplacementAndPoint = function(displacement, point) {
    var options = this.allowed(this.regions(App.S, displacement), point);
    if (options.length == 0) {
	throw 'Error!';
    }
    return options[0].ix;
};

App.prototype.onKeyDown = function ( event ) {   
    switch ( event.keyCode ) {
    case 38: // up
    case 73:
    case 87: // w
	this.moveForward = true;
	break;
    case 37: // left
    case 74:
    case 65: // a
	this.moveLeft = true; break;
    case 40: // down
    case 75:
    case 83: // s
	this.moveBackward = true;
	break;
    case 39: // right
    case 76:
    case 68: // d
	this.moveRight = true;
	break;
    case 85: // u
    case 81:
	this.moveUp = true;
	break;	
    case 79: // o
    case 69:
	this.moveDown = true;
	break;
    }
};

App.prototype.onKeyUp = function ( event ) {
    switch( event.keyCode ) {
    case 38: // up
    case 73:
    case 87: // w
	this.moveForward = false;
	break;
    case 37: // left
    case 74:
    case 65: // a
	this.moveLeft = false;
	break;
    case 40: // down
    case 75:
    case 83: // s
	this.moveBackward = false;
	break;
    case 39: // right
    case 76:
    case 68: // d
	this.moveRight = false;
	break;
    case 85: // u
    case 81:
	this.moveUp = false;
	break;
    case 79: // o
    case 69:
	this.moveDown = false;
	break;
    }
};

    

App.COLOR_YELLOW = 0xffff00;
App.COLOR_RED = 0xff0000;
App.COLOR_BLUE = 0x0000ff;
App.COLOR_GREEN = 0x00ff00;
App.COLOR_ORANGE = 0xff9900;
App.COLOR_PINK = 0xffbad2;
App.COLOR_WHITE = 0xffffff;

App.COLORS = [App.COLOR_GREEN, App.COLOR_YELLOW, App.COLOR_RED, App.COLOR_BLUE, App.COLOR_WHITE];

App.ORIGIN = vec3();
App.X_DIR = vec3(1, 0, 0); // Positive X
App.Y_DIR = vec3(0, 1, 0); // Positive Y
App.Z_DIR = vec3(0, 0, 1); // Positive Z
App.W_DIR = vec3(-1, -1, -1).normalize(); // Extra axis: W

App.XY_PLANE = (new THREE.Plane()).setFromCoplanarPoints(App.ORIGIN, App.X_DIR, App.Y_DIR);
App.XZ_PLANE = (new THREE.Plane()).setFromCoplanarPoints(App.ORIGIN, App.Z_DIR, App.X_DIR);
App.YZ_PLANE = (new THREE.Plane()).setFromCoplanarPoints(App.ORIGIN, App.Y_DIR, App.Z_DIR);
App.XW_PLANE = (new THREE.Plane()).setFromCoplanarPoints(App.ORIGIN, App.X_DIR, App.W_DIR);
App.YW_PLANE = (new THREE.Plane()).setFromCoplanarPoints(App.ORIGIN, App.Y_DIR, App.W_DIR);
App.ZW_PLANE = (new THREE.Plane()).setFromCoplanarPoints(App.ORIGIN, App.Z_DIR, App.W_DIR);


		
