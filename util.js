// Polar coordinate functions (in degrees)
function cart2pol(x, y) {
    var r = Math.sqrt(x ** 2 + y ** 2);
    var theta = Math.atan2(y, x) * 180 / Math.PI;
    return [r, theta];
}

function pol2cart(r, theta) {
    var x = r * Math.cos(theta * Math.PI / 180);
    var y = r * Math.sin(theta * Math.PI / 180);
    return [x, y];
}

// Distance between two points (as arrays)
function distance_points(pa, pb) {
    var dx = Math.abs(pa[0] - pb[0]);
    var dy = Math.abs(pa[1] - pb[1]);
    return Math.sqrt(dx ** 2 + dy ** 2);
}

// Calculate a spiral
function spiral(gap, rotation, theta) {
    var r = gap * theta;
    var cart = pol2cart(r, theta + rotation);
    return cart;
}

class SpiralState {
    constructor(gap, rotation, theta, step_degrees, center_pos, aspect_ratio) {
        this.gap = gap;
        this.rotation = rotation;
        this.theta = theta;
        this.step_degrees = step_degrees;
        this.center_pos = center_pos;
        this.aspect_ratio = aspect_ratio;

        this.update();
    }

    update() {
        this.pos = spiral(this.gap, this.rotation, this.theta);
        this.pos = [this.pos[0] * this.aspect_ratio, this.pos[1]];
        this.pos = [this.pos[0] + this.center_pos[0], this.pos[1] + this.center_pos[1]];
        this.angle = 360 - ((this.theta + this.rotation) % 360);
        this.theta -= this.step_degrees;
    }
}

// Stretch in the x dimension to match the greater width of the torus,
// and then add the center to the Cartesian coordinates
function adjustCoords(x, y) {
    widthToHeightRatio = torusInnerWidth / torusInnerHeight

    x = widthToHeightRatio * x + worldCenter[0]
    y = y + worldCenter[1]

    return [x, y]
}
