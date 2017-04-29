App = function(window, document) {

    this.N = 10;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.prevTime = performance.now();
    this.velocity = vec3();
    
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

    this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    this.hemiLight.color.setHSL( 0.6, 1, 0.6 );
    this.hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    this.hemiLight.position.set( 0, 500, 0 );
    this.scene.add( this.hemiLight );

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


    this.group.add(Scene.makeAxes());
    this.world = new Scene(this.N);
    this.points = this.world.makePointsAndFunctionLines();
    //this.points = this.world.makeCustomPoints(Scene.CustomPoints.example1);
    this.fill = this.world.fillInGrid();
    //this.functionLines = this.world.functionLines;
    
    this.group.add(this.points);
    this.group.add(this.fill);
    if (this.functionLines) {
	this.group.add(this.functionLines);
    }
    var icosphere = this.world.makeIcosphere(5);
    icosphere.applyMatrix((new THREE.Matrix4()).makeScale(0.2, 0.2, 0.2));
    icosphere.translateX(-0.5);
    icosphere.translateY(1);
    icosphere.translateZ(0);
    icosphere.updateMatrix();
    this.group.add(icosphere);

    this.group.scale = vec3(this.N * 10, this.N * 10, this.N * 10);
    this.group.translateX(-1/2);
    this.group.translateZ(-1/2);
    this.group.translateY(-1/4);
    
    this.scene.add(this.group);

    this.controls.getObject().translateX();
    this.controls.getObject().translateY(-this.N);
    this.controls.getObject().translateZ(+this.N-4);

    this.renderFunction = this.makeRenderFunction();
    this.renderFunction();
    
    document.body.appendChild(this.renderer.domElement);
    
};

App.prototype.vec3 = function(x, y, z) {
    return vec3(x, y, z);
};

App.prototype.makeRenderFunction = function() {
    return _.bind(function() {	
	requestAnimationFrame(this.renderFunction);
	this.render();
    }, this);
};


App.prototype.render = function() {
    var acc = 50.0;
    var time = performance.now();
    var delta = ( time - this.prevTime ) / 1000;
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


		
