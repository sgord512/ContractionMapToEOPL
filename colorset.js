var ColorSet = function() {
    this.c = 15;
    this.marked = false;
};

ColorSet.prototype.mark = function() {
    this.marked = true;
};

ColorSet.prototype.removeRaw = function(removedColor) {
    this.c = this.c & ~removedColor;
};

ColorSet.prototype.set = function(color) {
    this.c = c2b(color);
};

ColorSet.prototype.get = function() {
    return this.c;
};

ColorSet.prototype.setRaw = function(color) {
    this.c = color;
};

ColorSet.prototype.isSingleton = function() {
    var colors = this.getColors();
    return colors.length == 1 && colors[0] != '#000000';
};

ColorSet.prototype.getColors = function(raw) {
    var colorNum = this.c
    var colors = [];
    if (colorNum & 1) { 
	colors.push(raw ? 1 : '#00ff00');
    }
    if (colorNum & 2) { 
	colors.push(raw ? 2 : '#0000ff');
    }
    if (colorNum & 4) { 
	colors.push(raw ? 4 : '#ff0000');
    }
    if (colorNum & 8) { 
	colors.push(raw ? 8 : '#ffff00');
    }

    if (colors.length == 0 && !raw) {
	return ['#000000'];
    } else {
	return colors;
    }
};

ColorSet.prototype.isEmpty = function() {
    return this.c == 0;
};
