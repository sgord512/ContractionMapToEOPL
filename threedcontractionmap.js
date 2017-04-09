function vec3(x, y, z) { return new THREE.Vector3(x, y, z); }
function mat4() { return new THREE.Matrix4(); }

App = function(window, document) {    
    this.N = 10;
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
    var distance = 1.6;
    this.camera.position.set(distance, distance, distance);
    this.camera.lookAt(vec3(0, 0, 0));

    this.scene.add(this.camera);

    this.light = new THREE.DirectionalLight(0xffffff, 0.5);
    this.light.position.set(0, 1, 1);
    this.scene.add(this.light);


    // RENDERER
    if ( Detector.webgl ) { 
	this.renderer = new THREE.WebGLRenderer( {antialias:true} );
    } else {
	this.renderer = new THREE.CanvasRenderer();
    }
    this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    document.body.appendChild(this.renderer.domElement);
    
    this.axes = this.makeAxes();
    this.grid = this.makeGrid(this.N);
    
    this.points = new THREE.Group();
    this.functionArrows = new THREE.Group();

    //this.makePoints(this.N);
    
    this.planes = this.makePlanes();

    this.group = new THREE.Group();
    
    //this.group.add(this.grid);
    this.group.add(this.axes);
    //this.group.add(this.points);
    this.group.add(this.planes);
    //this.group.add(this.functionArrows);
    this.group.add(this.makeIcosphere(5));

    this.group.scale = this.vec3(this.N, this.N, this.N);
    this.group.translateX(-1/2);
    this.group.translateZ(-1/2);
    this.group.translateY(-1/4);
    
    this.scene.add(this.group);

    this.renderFunction = this.makeRenderFunction();
    this.renderFunction();
};

App.prototype.vec3 = function(x, y, z) {
    return vec3(x, y, z);
};

App.prototype.makeGrid = function(n) {
    var material = new THREE.LineBasicMaterial({ color: 0xffffff });
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
    var xArrow = new THREE.ArrowHelper(this.vec3(1, 0, 0), origin, 2, App.COLOR_RED);
    var yArrow = new THREE.ArrowHelper(this.vec3(0, 1, 0), origin, 2, App.COLOR_YELLOW);
    var zArrow = new THREE.ArrowHelper(this.vec3(0, 0, 1), origin, 2, App.COLOR_BLUE);
    var wArrow = new THREE.ArrowHelper(this.vec3(-1, -1, -1).normalize(), origin, 2, App.COLOR_GREEN);

    group.add(xArrow, yArrow, zArrow, wArrow);
    return group;
};

App.prototype.makePoints = function(n) {
    var geometry = new THREE.SphereGeometry(0.02, 24, 24);
    var materialGreen = new THREE.MeshLambertMaterial({color: App.COLOR_GREEN });
    var materialRed = new THREE.MeshLambertMaterial({color: App.COLOR_RED });
    var materialBlue = new THREE.MeshLambertMaterial({color: App.COLOR_BLUE });
    var materialYellow = new THREE.MeshLambertMaterial({color: App.COLOR_YELLOW });
    
    var materials = {};
    materials[App.COLOR_GREEN] = materialGreen;
    materials[App.COLOR_YELLOW] = materialYellow;
    materials[App.COLOR_RED] = materialRed;
    materials[App.COLOR_BLUE] = materialBlue;
    
    var sphereMesh = new THREE.Mesh(geometry, materialGreen);
    
    if (!this.points) {
	this.points = new THREE.Group();
    }

    if (!this.functionArrows) {
	this.functionArrows = new THREE.Group();
    }

    var lineGeometry = new THREE.Geometry();
    
    for (var i = 0; i <= n; i++) {
	for (var j = 0; j <= n; j++) {
	    for (var k = 0; k <= n; k++) {
		
		var inputPoint = this.vec3(i/n, j/n, k/n);
		var outputPoint = App.StartingFunctions.contractionmap(inputPoint.clone());
		var displacementDir = vec3().subVectors(outputPoint, inputPoint).normalize();
		var color = this.colorPointFromDisplacement(displacementDir);

		var sphere = sphereMesh.clone();
		sphere.position.set(i/n, j/n, k/n);
		sphere.material = materials[color];
		this.points.add(sphere);
		
		
		lineGeometry.vertices.push(inputPoint);
		lineGeometry.vertices.push(outputPoint);
	    }
	}
    }

    var functionLines = new THREE.LineSegments(
	lineGeometry,
	new THREE.LineBasicMaterial({ color: App.COLOR_GREEN }));
    this.functionArrows.add(functionLines);
};

App.prototype.colorPointFromDisplacement = function(displacement) {
    // Need to figure out tie-breaking, and what to do at the boundaries.
    var dots = this.getDotProducts(displacement);
    
    if (dots.XY >= 0 &&	dots.YZ >= 0 &&	dots.XZ <= 0) {
	return App.COLOR_GREEN;
    } else if (dots.YZ <= 0 && dots.YW >= 0 && dots.ZW <= 0) {
	return App.COLOR_YELLOW;
    } else if (dots.XY <= 0 && dots.XW >= 0 && dots.YW <= 0) {
	return App.COLOR_RED;
    } else if (dots.YZ <= 0 && dots.YW >= 0 && dots.ZW <= 0) {    
	return App.COLOR_BLUE;
    } else {
	throw 'At least one of the above conditions should have been true!';
    }
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
    return new THREE.MeshBasicMaterial({color: color || App.COLOR_RED, side: side || THREE.DoubleSide});
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

    var wvec = vec3(-1, -1, -1).multiplyScalar(1/Math.sqrt(3));
    
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
	vec3(1, 0, 0).add(wvec),
	vec3().copy(wvec)
    );
    planesGroup.add(new THREE.Mesh(xwPlane, this.makeBasicMaterial(App.COLOR_RED, THREE.FrontSide)),
		    new THREE.Mesh(xwPlane, this.makeBasicMaterial(App.COLOR_BLUE, THREE.BackSide)));

    var ywPlane = plane(
	vec3(0, 1, 0),
	vec3(0, 0, 0),
	vec3(0, 1, 0).add(wvec),
	vec3().copy(wvec)
    );
    planesGroup.add(new THREE.Mesh(ywPlane, this.makeBasicMaterial(App.COLOR_YELLOW, THREE.FrontSide)),
		    new THREE.Mesh(ywPlane, this.makeBasicMaterial(App.COLOR_RED, THREE.BackSide)));

    var zwPlane = plane(
	vec3(0, 0, 0),
	vec3(0, 0, 1),
	vec3().copy(wvec),
	vec3(0, 0, 1).add(wvec)
    );
    planesGroup.add(new THREE.Mesh(zwPlane, this.makeBasicMaterial(App.COLOR_YELLOW, THREE.FrontSide)),
		    new THREE.Mesh(zwPlane, this.makeBasicMaterial(App.COLOR_BLUE, THREE.BackSide)));

    return planesGroup;
};

App.prototype.makeIcoplanes = function() {
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
    var group = new THREE.Group();
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
	return new THREE.Face3(t.a, t.b, t.c);
    });

    geometry.mergeVertices();

    var icoSphereWireframe = new THREE.LineSegments(new THREE.WireframeGeometry(geometry), this.makeBasicMaterial(0xFFFFFF));

    var icoSphere = new THREE.Mesh(geometry, this.makeBasicMaterial(App.COLOR_PINK));
    group.add(icoSphere);
    group.add(icoSphereWireframe);

    return group;
};

App.prototype.getDotProducts = function(point) {
    return {
	XY: App.XY_NORMAL.dot(point),
	XZ: App.XZ_NORMAL.dot(point),
	XW: App.XW_NORMAL.dot(point),
	YZ: App.YZ_NORMAL.dot(point),
	YW: App.YW_NORMAL.dot(point),
	ZW: App.ZW_NORMAL.dot(point),
    };
};

App.prototype.makeRenderFunction = function() {
    return _.bind(function() {	
	this.render();
	requestAnimationFrame(this.renderFunction);
    }, this);
};


App.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
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

	var outputPoint = vec3(xnew + 1/2, ynew + 1/2, inputPoint.z);
	outputPoint.clampScalar(0, 1);
	return outputPoint;
    },

    contractionmap2: function(point) {
	var offset = vec3(1/2, 1/2, 1/2);
	var centeredPoint = point.sub(offset);
	centeredPoint.multiplyScalar(0.85);
	return centeredPoint.add(offset).clampScalar(0, 1);
    },

    contractionmap3: function(point) {
	return vec3(0, 0, 0);
    }
};

App.COLOR_YELLOW = 0xffff00;
App.COLOR_RED = 0xff0000;
App.COLOR_BLUE = 0x0000ff;
App.COLOR_GREEN = 0x00ff00;
App.COLOR_ORANGE = 0xff9900;
App.COLOR_PINK = 0xffbad2;

App.X_DIR = vec3(1, 0, 0); // Positive X
App.Y_DIR = vec3(0, 1, 0); // Positive Y
App.Z_DIR = vec3(0, 0, 1); // Positive Z
App.W_DIR = vec3(-1, -1, -1).normalize(); // Extra axis: W

App.XY_NORMAL = vec3().crossVectors(App.X_DIR, App.Y_DIR);
App.XZ_NORMAL = vec3().crossVectors(App.X_DIR, App.Z_DIR);
App.XW_NORMAL = vec3().crossVectors(App.X_DIR, App.W_DIR);
App.YZ_NORMAL = vec3().crossVectors(App.Y_DIR, App.Z_DIR);
App.YW_NORMAL = vec3().crossVectors(App.Y_DIR, App.W_DIR);
App.ZW_NORMAL = vec3().crossVectors(App.Z_DIR, App.W_DIR);


		
