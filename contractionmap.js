function App(project, canvasSize) {

    // Fix a size large enough so that I would show the potential values, and then go through and verify that all teh correct cells are in fact having values computed. I believe the problem is somewhere in getColorFromPoint or in an off-by-one indexing issue elsewhere.

    // Figure out why some points are Red that shouldn't be Red, in the bottom right corner of the square in the standard default function.

    this.totalSize = canvasSize;
    this.textMargin = 3;
    this.margin = 10;
    this.setSize(48);
    this.maxPoint = new Point(1, 1);
    this.minPoint = new Point(0, 0);
    this.currentFunction = null;
    this.boundClampToSquare = _.bind(this.clampToSquare, this);

    this.nightMode = true;
    this.showFunctionLines = true;
    this.addBorder = true;

    this.project = project;
    this.project.view.transform(new Matrix(1, 0, 0, -1, 0, this.totalSize));
    this.backgroundLayer = new Layer();
    this.background = new Path.Rectangle(new Point(0, 0), new Size(this.totalSize, this.totalSize));
    this.background.fillColor = this.getBackgroundColor();
    this.background.strokeColor = this.getBackgroundColor();

    this.gridLayer = new Layer();
    this.makeGrid();

    this.functionLineLayer = new Layer();
    this.pointLayer = new Layer();
    this.colorPoints(App.StartingFunctions.contractionmap);

    this.showPotential = true;
    this.potentialValueLayer = new Layer();
    this.drawPotentials();
};

App.prototype.getMargin = function() {
    return new Point(this.margin, this.margin);
};

App.prototype.getUsedMargin = function() {
    return this.getMargin().add((this.totalAvailableSize() - this.totalUsedSize()) / 2);
};

App.prototype.getUsedContentMargin = function() {
    return this.addBorder ? this.getUsedMargin().add(this.size) : this.getUsedMargin();
};

App.prototype.totalAvailableSize = function() {
    return this.totalSize - 2 * this.margin;
};

App.prototype.totalUsedSize = function() {
    return this.size * this.numCols();
};

App.prototype.totalUsedContentSize = function() {
    return this.size * this.numContentCols();
};

App.prototype.contentCoord = function(x, y) {
    return new Point(x * this.size, y * this.size).add(this.getUsedContentMargin());
};

App.prototype.gridCoord = function(x, y) {
    return new Point(x * this.size, y * this.size).add(this.getUsedMargin());
};

App.prototype.setSize = function(size) {
    this.size = size;    
};

App.prototype.numContentCols = function() {
    return this.addBorder ? this.numCols() - 2 : this.numCols();
};

App.prototype.numCols = function() {
    return Math.floor(this.totalAvailableSize() / this.size);
};

App.prototype.getFunctionLineWidth = function() {
    return Math.min(5, Math.max(1, Math.ceil(this.size - 20) / 4));
};

App.prototype.getPointRadius = function() {
    return Math.min(10, Math.max(4, Math.ceil(this.size - 20) / 4));
};

App.prototype.getColorFromPoint = function(x, y, inGridCoord) {
    var color = null;
    if (!inGridCoord) {
	color = this.getContentColorFromPoint(x, y); 
	if (typeof color == "boolean") {
	    throw 'Bad color';
	}
	return color;
    }
    
    if (this.addBorder) {
	if (!this.isBorderPoint(x, y)) {
	    color = this.getContentColorFromPoint(x - 1, y - 1);
	    if (typeof color == "boolean") {
		throw 'Bad color';
	    }
	    return color;
	} else {	    
	    color = this.getBorderColorFromPoint(x, y);
	    if (typeof color == "boolean") {
		throw 'Bad color';
	    }
	    return color;
	}
    } else {
	color = this.getContentColorFromPoint(x, y);
	if (typeof color == "boolean") {
	    throw 'Bad color';
	}
	return color;
    }
};

App.prototype.isBorderPoint = function(x, y) {
    if (!this.addBorder) {
	throw 'Should only call this when a border is added.';
    }
    return x == 0 || x == this.numCols() || y == 0 || y == this.numCols();
};

App.prototype.getBorderColorFromPoint = function(x, y) {
    if (y == 0 && x < this.numCols()) {
	return 'yellow';
    } else if (y > 0 && x == 0) {
	return 'red';
    } else {
	return 'blue';
    }
};

App.prototype.getContentColorFromPoint = function(x, y) {
    if (!this.currentFunction) {
	throw 'Need a function to get a color';
    }
    
    var inputPoint = (new Point(x, y)).divide(this.numContentCols());
    var outputPoint = this.currentFunction(inputPoint, this.boundClampToSquare);
    displacement = outputPoint.subtract(inputPoint);
    return this.getColorFromDisplacementAndPoint(displacement, x, y);
};

App.prototype.getColorFromDisplacementAndPoint = function(displacement, x, y) {
    var angle = displacement.angleInRadians;
    if (angle < 0) {
	angle = angle + 2 * Math.PI;
    }
    if (x >= this.numContentCols()/2 && y >= this.numContentCols()/2) {
	console.log("(" + x + ", " + y + "): " + (angle * 180/Math.PI));
    }
    
    if (angle >= 0 && angle <= Math.PI/2) {
	if (angle == 0 && y == this.numContentCols()) {
	    return 'red';
	} else if (angle == Math.PI/2 && x == this.numContentCols()) {
	    return 'blue';	    
	} else { 
	    return 'yellow';
	}
    } else if (angle > Math.PI/2 && angle <= 5*Math.PI/4) {
	return 'blue';
    } else {
	return 'red';
    }
};

App.prototype.canMakeTriangle = function(x, y) {
    return y > 0 && x >= 0 && y <= this.numCols() && x < this.numCols();
};

App.prototype.makeTriangle = function(x, y, isTopRight) {
    if (y > 0 && x >= 0 && y <= this.numCols() && x < this.numCols()) {
	return {x: x, y: y, isTopRight: !!isTopRight, isBottomLeft: !isTopRight};
    } else { 
	throw 'Invalid triangle provided';
    }
}

App.prototype.getTriangleAbove = function(tri) {
    if (tri.isBottomLeft) {
	throw 'No triangle above bottom-left corner triangle'
    }

    return this.canMakeTriangle(tri.x, tri.y + 1) ?
	this.makeTriangle(tri.x, tri.y + 1, !tri.isTopRight) :
	tri;
};

App.prototype.getTriangleRightOf = function(tri) {
    if (tri.isBottomLeft) {
	throw 'No triangle to the right of bottom-left corner triangle'
    }
    return this.canMakeTriangle(tri.x + 1, tri.y) ?
	this.makeTriangle(tri.x + 1, tri.y, !tri.isTopRight) :
	tri;
};

App.prototype.getTriangleBelowLeftOf = function(tri) {
    if (tri.isBottomLeft) {
	throw 'No triangle below and to the left of bottom-left corner triangle'
    }
    return this.canMakeTriangle(tri.x, tri.y) ?
	this.makeTriangle(tri.x, tri.y, !tri.isTopRight) :
	tri;
};

App.prototype.getTriangleBelow = function(tri) {
    if (tri.isTopRight) {
	throw 'No triangle below top-right corner triangle'
    }
    return this.canMakeTriangle(tri.x, tri.y - 1) ?
	this.makeTriangle(tri.x, tri.y - 1, !tri.isTopRight) :
	tri;
};

App.prototype.getTriangleLeftOf = function(tri) { 
    if (tri.isTopRight) {
	throw 'No triangle to the left of top-right corner triangle'
    }
    return this.canMakeTriangle(tri.x - 1, tri.y) ?
	this.makeTriangle(tri.x - 1, tri.y, !tri.isTopRight) :
	tri;
};

App.prototype.getTriangleAboveRightOf = function(tri) {
    if (tri.isTopRight) {
	throw 'No triangle above and to the right of top-right corner triangle'
    }
    return this.canMakeTriangle(tri.x, tri.y) ?
	this.makeTriangle(tri.x, tri.y, !tri.isTopRight) :
	tri;
};

App.prototype.getTriangleVertices = function(tri) {
    if (tri.isTopRight) {
	return [{x: tri.x, y: tri.y}, {x: tri.x + 1, y: tri.y}, {x: tri.x + 1, y: tri.y - 1}];
    } else {
	return [{x : tri.x, y: tri.y}, {x: tri.x + 1, y: tri.y - 1}, {x: tri.x, y: tri.y - 1}];
    }
};

App.prototype.getSuccessor = function(tri) { 
    var vertices = this.getTriangleVertices(tri);
    for (var i = 0; i <= 2; i++) {
	vertices[i].color = this.getColorFromPoint(vertices[i].x, vertices[i].y, true);
    }
    var redIndex = null;
    for (var i = 0; i <= 2; i++) {
	if (vertices[i].color == 'red' && vertices[(i + 1) % 3].color == 'yellow') {
	    redIndex = i;
	    break;
	}
    }

    if (_.isNull(redIndex)) {
	return tri;
    }

    if (tri.isTopRight) {
	if (redIndex == 0) {
	    return this.getTriangleAbove(tri);
	} else if (redIndex == 1) {
	    return this.getTriangleRightOf(tri);	    
	} else {
	    return this.getTriangleBelowLeftOf(tri);
	}
    } else {
	if (redIndex == 0) {
	    return this.getTriangleAboveRightOf(tri);
	} else if (redIndex == 1) {
	    return this.getTriangleBelow(tri);
	} else {
	    return tri; // Make a self-loop instead of an edge to the left.
	}
    }
};

App.prototype.getPredecessor = function(tri) { 
    var vertices = this.getTriangleVertices(tri);
    for (var i = 0; i <= 2; i++) {	
	vertices[i].color = this.getColorFromPoint(vertices[i].x, vertices[i].y, true);
    }
    var redIndex = null;
    for (var i = 0; i <= 2; i++) {
	if (vertices[i].color == 'yellow' && vertices[(i + 1) % 3].color == 'red') {
	    redIndex = i;
	    break;
	}
    }

    if (_.isNull(redIndex)) {
	return tri;
    }

    if (tri.isTopRight) {
	if (redIndex == 0) {
	    return this.getTriangleAbove(tri);
	} else if (redIndex == 1) {
	    return tri; // Make a self-loop instead of an edge.
	} else {
	    return this.getTriangleBelowLeftOf(tri);
	}
    } else {
	if (redIndex == 0) {
	    return this.getTriangleAboveRightOf(tri);
	} else if (redIndex == 1) {
	    return this.getTriangleBelow(tri);
	} else {
	    return this.getTriangleLeftOf(tri); 
	}
    }
};

App.prototype.getPotentialValue = function(tri) {
    var succ = this.getSuccessor(tri);
    var pred = this.getPredecessor(tri);
    var n = this.numCols();

    if (this.isSameTriangle(tri, succ) && this.isSameTriangle(tri, pred)) {
	return 0;
    }

    if (!this.isSameTriangle(tri, succ)) {
	if (tri.isBottomLeft) {
	    if (tri.x == succ.x && tri.y == succ.y) { // Up
		return 2 * n * tri.x + 2 * (tri.y - 1);
	    } else { // Down
		return 2 * n * tri.x + 2 * (n - tri.y) + 1;
	    }
	} else {
	    if (tri.x == succ.x && tri.y == succ.y) { // Down
		return 2 * n * tri.x + 2 * (n - tri.y);
	    } else if (tri.y == succ.y - 1) { // Up
		return 2 * n * tri.x + 2 * (tri.y - 1) + 1;
	    }
	}
    }

    if (!this.isSameTriangle(tri, pred)) {
	if (tri.isBottomLeft) {
	    if (tri.x == pred.x && tri.y == pred.y) { // Down
		return 2 * n * tri.x + 2 * (n - tri.y) + 1;
	    } else { // Up
		return 2 * n * tri.x + 2 * tri.y;
	    }
	} else {
	    if (tri.y == pred.y - 1) { // Down
		return 2 * n * tri.x + 2 * (n - tri.y);
	    } else { // Up
		return 2 * n * tri.x + 2 * (tri.y - 1) + 1;
	    }
	}
    }

    return 0;
};

App.prototype.isSameTriangle = function(tri1, tri2) {
    return tri1.x == tri2.x && tri1.y == tri2.y && tri1.isTopRight == tri2.isTopRight;
};

App.prototype.makeGrid = function() {
    this.gridLayer.removeChildren();
    this.gridLayer.activate();
    
    for (var x = 0; x <= this.numCols(); x++) {

	// Vertical line
	var fromPoint = this.gridCoord(x, 0);
	var toPoint = this.gridCoord(x, this.numCols());
	var gridline = new Path.Line(fromPoint, toPoint);
	gridline.strokeColor = this.getGridColor();

	// Horizontal line
	fromPoint = this.gridCoord(0, x)
	toPoint = this.gridCoord(this.numCols(), x);
	gridline = new Path.Line(fromPoint, toPoint);
	gridline.strokeColor = this.getGridColor();

	if (x < this.numCols()) { 
	    // Lower diagonal 
	    fromPoint = this.gridCoord(x, 0);
	    toPoint = this.gridCoord(0, x);
	    gridline = new Path.Line(fromPoint, toPoint);
	    gridline.strokeColor = this.getGridColor();

	    // Upper diagonal
	    if (x > 0) { 
		fromPoint = this.gridCoord(x, this.numCols());
		toPoint = this.gridCoord(this.numCols(), x);
		gridline = new Path.Line(fromPoint, toPoint);
		gridline.strokeColor = this.getGridColor();
	    }
	}
    }

    var fromPoint = this.gridCoord(0, this.numCols());
    var toPoint = this.gridCoord(this.numCols(), 0);
    var gridline = new Path.Line(fromPoint, toPoint);
    gridline.strokeColor = this.getGridColor();
};
    
App.prototype.clampToSquare = function(point) {
    return Point.max(Point.min(point, this.maxPoint), this.minPoint);
}

App.prototype.colorPoints = function(f) {
    this.currentFunction = f;
    this.pointLayer.removeChildren();
    this.functionLineLayer.removeChildren();

    for (var x = 0; x <= this.numContentCols(); x++) {
	for (var y = 0; y <= this.numContentCols(); y++) {
	    var center = this.contentCoord(x, y);
	    this.pointLayer.activate();
	    var circ = new Path.Circle({
		center: center,
		radius: this.getPointRadius()
	    });
	    
	    var inputPoint = (new Point(x, y)).divide(this.numContentCols());
	    var outputPoint = this.currentFunction(inputPoint, this.boundClampToSquare);
	    var toPoint = outputPoint.multiply(this.totalUsedContentSize()).add(this.getUsedContentMargin());

	    var fromPoint = inputPoint.multiply(this.totalUsedContentSize()).add(this.getUsedContentMargin());

	    displacement = outputPoint.subtract(inputPoint);
	    //var color = this.getColorFromPoint(x, y);
	    var color = this.getColorFromDisplacementAndPoint(displacement, x, y);
	    
	    circ.fillColor = color;
	    circ.strokeColor = 'black';
	    this.functionLineLayer.activate();
	    var vector = new Path.Line(fromPoint, toPoint);
	    vector.strokeColor = color;
	    vector.strokeWidth = this.getFunctionLineWidth();
	}
    }
    
    if (this.addBorder) {
	this.pointLayer.activate();
	for (var x = 0; x <= this.numCols(); x++) {
	    if (x == 0 || x == this.numCols()) {
		for (var y = 0; y <= this.numCols(); y++) {
		    var center = this.gridCoord(x, y);
		    var circ = new Path.Circle({
			center: center,
			radius: this.getPointRadius()
		    });

		    circ.fillColor = this.getBorderColorFromPoint(x, y);
		    circ.strokeColor = 'black';
		}
	    } else {
		var center = this.gridCoord(x, 0);
		var circ = new Path.Circle({
		    center: center,
		    radius: this.getPointRadius()
		});

		circ.fillColor = this.getBorderColorFromPoint(x, 0);
		circ.strokeColor = 'black';

		center = this.gridCoord(x, this.numCols());
		circ = new Path.Circle({
		    center: center,
		    radius: this.getPointRadius()
		});

		circ.fillColor = this.getBorderColorFromPoint(x, this.numCols());
		circ.strokeColor = 'black';

	    }
	}
    }
};

App.prototype.drawPotentials = function() {
    this.potentialValueLayer.removeChildren();
    this.potentialValueLayer.activate();

    if (this.size < 40 || _.isNull(this.currentFunction)) {
	return;
    }

    var radius = this.getPointRadius();
    for (var x = 0; x < this.numCols(); x++) {
	for (var y = 1; y <= this.numCols(); y++) {
	    var bottomLeftTri = this.makeTriangle(x, y, false);
	    var topRightTri = this.makeTriangle(x, y, true);

	    var bottomLeftPotentialValue = this.getPotentialValue(bottomLeftTri);
	    var topRightPotentialValue = this.getPotentialValue(topRightTri);

	    var bottomLeftText = new PointText(this.gridCoord(x, y).subtract(new Point(0, this.size)));
	    bottomLeftText.content = bottomLeftPotentialValue.toString();
	    bottomLeftText.strokeColor = this.getGridColor();
	    bottomLeftText.scale(1, -1);
	    bottomLeftText.fontFamily = "monospace";
	    
	    bottomLeftText.translate(new Point(radius + this.textMargin, radius + this.textMargin));

	    var topRightText = new PointText(this.gridCoord(x, y));
	    topRightText.content = topRightPotentialValue.toString();
	    topRightText.strokeColor = this.getGridColor();
	    topRightText.scale(1, -1);
	    topRightText.fontFamily = "monospace";

	    var width = topRightText.bounds.width;
	    var height = topRightText.bounds.height;
	    
	    topRightText.translate(new Point(this.size - width - radius, 0 - radius)); 

	}
    }
};

App.prototype.setFunction = function(theFunction) {
    this.currentFunction = theFunction;
    this.redrawPoints();
};

App.prototype.redrawPoints = function() {
    if (this.currentFunction) {
	this.colorPoints(this.currentFunction);
	this.drawPotentials();
    }
};

App.prototype.toggleNightMode = function() {
    this.nightMode = !this.nightMode;
    this.gridLayer.strokeColor = this.getGridColor();
    this.backgroundLayer.strokeColor = this.getBackgroundColor();
    this.backgroundLayer.fillColor = this.getBackgroundColor();
    this.potentialValueLayer.strokeColor = this.getGridColor();
};

App.prototype.getGridColor = function() {
    return this.nightMode ? 'white' : 'black';
};

App.prototype.getBackgroundColor = function() {
    return this.nightMode ? 'black' : 'white';
};

App.prototype.toggleFunctionLines = function() {
    this.showFunctionLines = !this.showFunctionLines;
    this.functionLineLayer.visible = this.showFunctionLines;
};

App.prototype.toggleAddBorder = function() {
    this.addBorder = !this.addBorder;
    this.redrawPoints();
};

App.prototype.toggleShowPotential = function() {
    this.showPotential = !this.showPotential;
    this.potentialValueLayer.visible = this.showPotential;
};

App.StartingFunctions = {    
    contractionmap: function(inPoint, clampToSquare) {	 
	var xold = inPoint.x - 1/2;
	var yold = inPoint.y - 1/2;
	var r = Math.sqrt((xold ** 2) + (yold ** 2));
	var theta = Math.atan2(yold, xold);
	var rnew = 0.92 * r;
	var thetanew = (theta - 0.2) % (2 * Math.PI);
	var xnew = rnew * Math.cos(thetanew);
	var ynew = rnew * Math.sin(thetanew);
	
	var outPoint = clampToSquare(new Point(xnew + 1/2, ynew + 1/2));
	
	return outPoint;
    },
    
    contractionmap2: function(inPoint, clampToSquare) {	 
	var xold = inPoint.x - 1/2;
	var yold = inPoint.y - 1/2;
	var r = Math.sqrt((xold ** 2) + (yold ** 2));
	var theta = Math.atan2(yold, xold);
	var rnew = 0.95 * r;
	var thetanew = theta;
	var xnew = rnew * Math.cos(thetanew);
	var ynew = rnew * Math.sin(thetanew);
	
	var outPoint = clampToSquare(new Point(xnew + 1/2, ynew + 1/2));
	
	return outPoint;
    },
    
    contractionmap3: function(inPoint, clampToSquare) {	 
	var xold = inPoint.x - 1/2;
	var yold = inPoint.y - 1/2;
	var r = Math.sqrt((xold ** 2) + (yold ** 2));
	var theta = Math.atan2(yold, xold);
	var rnew = 0.95 * r;
	var thetanew = (theta - 2.0) % (2 * Math.PI);
	var xnew = rnew * Math.cos(thetanew);
	var ynew = rnew * Math.sin(thetanew);
	
	var outPoint = clampToSquare(new Point(xnew + 1/3, ynew + 1/4))
	
	return outPoint;
    },

    contractionmap4: function(inPoint, clampToSquare) {
	var xold = inPoint.x;
	var yold = inPoint.y;
	var leftOutputPoint = new Point(0.6, yold - 0.01);
	var midOutputPoint = new Point(0.58, yold);
	var outPoint; 
	if (xold <= 0.5) {
	    outPoint = leftOutputPoint.multiply(1 - 2 * xold).add(midOutputPoint.multiply(2 * xold));
	} else {
	    outPoint = new Point(xold + 0.08, yold);
	}

	outPoint = clampToSquare(outPoint);
	
	return outPoint;
    },
    
};
