var Configuration = {};
Configuration.initialize = function(project, canvasHeight, canvasWidth) {
    Configuration.canvasWidth = canvasWidth;
    Configuration.canvasHeight = canvasHeight;
    Configuration.project = project;
    Configuration.radius = 5;
    Configuration.spacing = 40;
    Configuration.markedStrokeWidth = 2;
    Configuration.strokeWidth = 1;
    Configuration.project.view.transform(new Matrix(1, 0, 0, -1, 0, Configuration.canvasHeight));
    Configuration.backgroundLayer = new Layer();
    Configuration.background = new Path.Rectangle(new Point(0, 0), new Size(Configuration.canvasWidth, Configuration.canvasHeight));
    Configuration.background.fillColor = 'white';
    Configuration.gridColor = '#999999';
    Configuration.mainLayer = new Layer();
    Configuration.xOffsetFactor = new Point(1/3, 1/2);
};

var c2b = function(color) {
    return Math.pow(2, color);
};

Configuration.drawPoint = function(point, color, marked) {
    Configuration.mainLayer.activate();
    return new Path.Circle({
	center: point,
	radius: Configuration.radius,
	strokeColor: '#000000',
	strokeWidth: marked ? Configuration.markedStrokeWidth : Configuration.strokeWidth,
	fillColor: color
    });
};

Configuration.drawWedge = function(coord, color, startAngle, endAngle, marked) {
    Configuration.mainLayer.activate();
    if (startAngle == endAngle % (2 * Math.PI)) {
	return Configuration.drawPoint(coord, color, marked);
    }
    
    var startOffset = new Point(Configuration.radius * Math.cos(startAngle),
				Configuration.radius * Math.sin(startAngle));
    var endOffset = new Point(Configuration.radius * Math.cos(endAngle),
			      Configuration.radius * Math.sin(endAngle));

    var midOffset = new Point(Configuration.radius * Math.cos((startAngle + endAngle)/2),
			      Configuration.radius * Math.sin((startAngle + endAngle)/2));

    var path = new Path.Arc(coord.add(startOffset), coord.add(midOffset), coord.add(endOffset));
    path.lineTo(coord);
    path.closePath();
    path.strokeColor = '#000000';
    path.strokeWidth = marked ? Configuration.markedStrokeWidth : Configuration.strokeWidth,
    path.fillColor = color;
    return path;
};

Configuration.drawMultiPoint = function(coord, point) {
    var colors = point.getColors();
    var marked = point.marked;
    var angle = Math.PI * 2 / colors.length;
    for (var i = 0; i < colors.length; i++) {
	var startAngle = i * angle;
	var endAngle = startAngle + angle;
	Configuration.drawWedge(coord, colors[i], startAngle, endAngle, marked);
    }
};

var Coloring = function(x, y, z, colors) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.entries = [];
    for (var i = 0; i < this.x; i++) {
	var xarr = [];
	for (var j = 0; j < this.y; j++) {
	    var yarr = [];
	    for (var k = 0; k < this.z; k++) {
		yarr.push(new ColorSet());
	    }
	    xarr.push(yarr);
	}
	this.entries.push(xarr);
    }
};

Coloring.prototype.getCoord = function(point) {
    var x = point[0], y = point[1], z = point[2];
    return new Point(z * Configuration.spacing,
		     y * Configuration.spacing).add(Configuration.xOffsetFactor.multiply(x * Configuration.spacing));
};

Coloring.prototype.drawColoring = function(blPoint, flatten) {
    var ex = new Point(1, 0, 0), ey = new Point(0, 1, 0), ez = new Point(0, 0, 1);
    var triples = this.getAllTriples();
    Configuration.gridLayers = [];
    for (var i = 0; i < this.x; i++) {
	Configuration.gridLayers.unshift(new Layer());
    }
    Configuration.mainLayer.bringToFront();
    for (var ix = 0; ix < triples.length; ix++) {
	var point = triples[ix];
	var i = point[0], j = point[1], k = point[2];
	Configuration.mainLayer.activate();
	Configuration.drawMultiPoint(this.getCoord(point).add(blPoint), this.get(point));
	Configuration.gridLayers[i].activate();
	if (i + 1 < this.x && !flatten) {
	    var line = new Path.Line(this.getCoord(point).add(blPoint), this.getCoord([i+1,j,k]).add(blPoint));
	    line.strokeColor = Configuration.gridColor;
	    //line.dashArray = [10, 4];
	}
	if (j + 1 < this.y) { 
	    line = new Path.Line(this.getCoord(point).add(blPoint), this.getCoord([i,j+1,k]).add(blPoint));
	    line.strokeColor = Configuration.gridColor;
	    if (this.get(point).marked && this.get([i,j+1,k]).marked) {
		line.strokeWidth = Configuration.markedStrokeWidth;
		line.strokeColor = 'black';
	    }
	    if (i > 0) { 
		line.dashArray = [10, 4];
	    }
	}
	if (k + 1 < this.z) {
	    line = new Path.Line(this.getCoord(point).add(blPoint), this.getCoord([i,j,k+1]).add(blPoint));
	    line.strokeColor = Configuration.gridColor;
	    if (this.get(point).marked && this.get([i,j,k+1]).marked) {
		line.strokeWidth = Configuration.markedStrokeWidth;
		line.strokeColor = 'black';
	    }
	    if (i > 0) { 
		line.dashArray = [10, 4];
	    }
	}		    
    }
};

Coloring.prototype.isSingleColor = function(point) {
    return this.get(point).isSingleton();
};

Coloring.prototype.set = function(point, color) {
    var x = point[0], y = point[1], z = point[2];
    this.entries[x][y][z].set(color);
};

Coloring.prototype.get = function(point) {
    var x = point[0], y = point[1], z = point[2];
    return this.entries[x][y][z];
};

Coloring.prototype.setRaw = function(point, color) {
    var x = point[0], y = point[1], z = point[2];
    this.entries[x][y][z].setRaw(color);
};

Coloring.prototype.removeRaw = function(point, removedColor) {
    var x = point[0], y = point[1], z = point[2];
    this.entries[x][y][z].removeRaw(removedColor);
};

Coloring.prototype.tryRemoveRaw = function(point, removedColor) {
    var x = point[0], y = point[1], z = point[2];
    return !!(this.entries[x][y][z].get() & ~removedColor);
};


Coloring.prototype.getAllTriples = function() {
    if (!this.triples) { 
	this.triples = [];
	for (var i = 0; i < this.x; i++) {
	    for (var j = 0; j < this.y; j++) {
		for (var k = 0; k < this.z; k++) {
		    this.triples.push([i, j, k]);
		}
	    }
	}
    }
    return this.triples;
}

Coloring.prototype.norm = function(point, otherPoint) {
    return Math.max(Math.abs(point[0] - otherPoint[0]),
		    Math.abs(point[1] - otherPoint[1]),
		    Math.abs(point[2] - otherPoint[2]));
};

Coloring.prototype.subtract = function(point, otherPoint) {
    return [point[0] - otherPoint[0],
	    point[1] - otherPoint[1],
	    point[2] - otherPoint[2]];
};

Coloring.prototype.update = function(point, dim, removedColors, otherPoint) {
    if (this.norm(otherPoint, point) == this.subtract(otherPoint, point)[dim]) {
	this.removeRaw(otherPoint, removedColors);			
    }
};

Coloring.prototype.tryUpdate = function(point, dim, removedColors, otherPoint) {
    if (this.norm(otherPoint, point) == this.subtract(otherPoint, point)[dim]) {
	return this.tryRemoveRaw(otherPoint, removedColors);
    } else {
	return true;
    }
};

Coloring.prototype.getDimFromColor = function(color) {
    if (color == 2) {
	return 0;
    } else if (color == 4) {
	return 1;
    } else if (color == 8) {
	return 2;
    }
    return -1;
};

Coloring.prototype.getLowerColors = function(color) {
    return (color ^ (color - 1)) & (~color);
};

Coloring.prototype.propagateConstraints = function() {
    var triples = this.getAllTriples();
    for (var i = 0; i < triples.length; i++) {
	var point = triples[i];
	if (!this.isSingleColor(point)) {
	    continue;
	}
	
	var colorSet = this.get(point);
	var dim = this.getDimFromColor(colorSet.c);
	var removedColors = this.getLowerColors(colorSet.c);
	
	for (var ix = 0; ix < triples.length; ix++) {
	    this.update(point, dim, removedColors, triples[ix]);
	}
    }

    
    // Test all assignments to unassigned points.
    for (i = 0; i < triples.length; i++) {
	point = triples[i];
	if (this.isSingleColor(point)) {
	    continue;
	}

	colorSet = this.get(point);
	// Get raw color numbers 
	var colors = colorSet.getColors(true);
	for (var c = 0; c < colors.length; c++) {
	    dim = this.getDimFromColor(colors[c]);
	    if (dim == -1) {
		continue;
	    }
	    removedColors = this.getLowerColors(colors[c]);
	    for (ix = 0; ix < triples.length; ix++) {
		if (!this.tryUpdate(point, dim, removedColors, triples[ix])) {
		    this.removeRaw(point, colors[c]);
		    break;
		}
	    }
	}
    }
};

Coloring.prototype.isLegal = function() {
    var triples = this.getAllTriples();
    for (var ix = 0; ix < triples.length; ix++) {
	if (this.get(triples[ix]).isEmpty()) {
	    return false;
	}
    }
    return true;
};

var Squares = {};
Squares.top = [[0,2,3,0],[0,2,2,3],[0,2,3,3]];
Squares.bottom = [[1,2,3,1],[1,2,2,3],[1,2,3,3]];

Squares.installInColoring = function(coloring, colors, blPoint) {
    var x = blPoint[0], y = blPoint[1], z = blPoint[2];
    var point = coloring.get([x, y, z]);
    point.set(colors[0]);
    point.mark();
    point = coloring.get([x, y + 1, z]);
    point.set(colors[1]);
    point.mark();
    point = coloring.get([x, y + 1, z + 1]);
    point.set(colors[2]);
    point.mark();
    point = coloring.get([x, y, z + 1]);
    point.set(colors[3]);
    point.mark();
};
