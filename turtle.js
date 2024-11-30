export function TurtlePathLengthArea(TurtlePath) {
    /**
     * Calculates the length, area, end point, final angle, and centroid of a shape formed by arc segments.
     * 
     * @param {Array} TurtlePath - An array of arrays, where each inner array contains [arc_length, arc_angle].
     * @return {Array} An array containing:
     *   - Total length
     *   - Total area
     *   - End point of the last arc as an array [x, y]
     *   - Final angle after all rotations in radians
     *   - Centroid [x, y] of the shape
     */
    let totalLength = 0; // Total length
    let totalArea = 0; // Total area
    let firstMoment = [0, 0]; // 1st moment around x and y axis
    let arcStartPoint = [0, 0]; // Starting point of each arc segment
    let arcStartAngle = 0; // Starting angle of each arc
    let arcEndAngle = 0; // Ending angle of each arc
    for (let [arcLength, arcAngle] of TurtlePath) {
        // Pre-calculate frequently used terms:
        const halfArcAngle = arcAngle / 2;
        const chordAngle = arcStartAngle + halfArcAngle;
		const cosChordAngle = Math.cos(chordAngle);
        const sinChordAngle = Math.sin(chordAngle);
         
        
        // Calculate length
        totalLength += arcLength;
		let chordLength;
        if (arcAngle !== 0) {
            if (arcLength !== 0) { // No need to update areas for sharp turns
                const radius = arcLength / arcAngle;
                const sinHalfArcAngle = Math.sin(halfArcAngle);
                chordLength	= radius * sinHalfArcAngle * 2; // Chord length
                const arcSegmentArea = 0.5 * radius ** 2 * (arcAngle - Math.sin(arcAngle)); // Arc segment's area
                const y_a = (2/3) * (radius * sinHalfArcAngle) ** 3;
                totalArea += arcSegmentArea;
                firstMoment[0] += arcSegmentArea * (arcStartPoint[0] - radius * Math.sin(arcStartAngle)) + y_a * sinChordAngle;
                firstMoment[1] += arcSegmentArea * (arcStartPoint[1] + radius * Math.cos(arcStartAngle)) - y_a * cosChordAngle;
            } else {
                chordLength = 0;
            }
        } else {
            chordLength = arcLength;
        }

        // Calculate the end point of this arc segment
        const arcEndPoint = [
            arcStartPoint[0] + chordLength * cosChordAngle,
            arcStartPoint[1] + chordLength * sinChordAngle
        ];
        arcEndAngle = arcStartAngle + arcAngle;

        // Shoelace formula for area
        const triangleArea = (arcStartPoint[0] * arcEndPoint[1] - arcEndPoint[0] * arcStartPoint[1]) / 2;
        totalArea += triangleArea;
        firstMoment[0] += triangleArea * (arcStartPoint[0] + arcEndPoint[0]) / 3;
        firstMoment[1] += triangleArea * (arcStartPoint[1] + arcEndPoint[1]) / 3;

        // Update for next iteration
        arcStartPoint = arcEndPoint;
        arcStartAngle = arcEndAngle;
    }

    const centroid = [firstMoment[0] / totalArea, firstMoment[1] / totalArea];
    return [totalLength, totalArea, arcStartPoint, arcEndAngle, centroid];
}

export function SegmentsLengthArea(Segs) {
    let l = 0; // Total length
    let area = 0; // Total area
    let prevPoint = [0, 0]; // Starting point
    let prevAngle = 0; // Starting angle (rotation)

    for (let i = 0; i < Segs.length; i++) {
        let [dl, dang] = Segs[i];
		let dang_2=dang/2;
        // Calculate length
        l += dl;

        let chordLength;

        if (dang !== 0) {
			let r=dl/dang;
            chordLength = r*Math.sin(dang_2)*2 ; // Chord length
            let correction = 0.5*r*r * (dang - Math.sin(dang));
            area += correction;
        } else {
            chordLength = dl;
        }

        // Calculate the end point of this segment
        let currentPoint = [
            prevPoint[0] + chordLength * Math.cos(prevAngle + dang_2),
            prevPoint[1] + chordLength * Math.sin(prevAngle + dang_2)
        ];

        // Shoelace formula for area
        area += (prevPoint[0] * currentPoint[1] - currentPoint[0] * prevPoint[1]) / 2;

        // Update for next iteration
        prevPoint = currentPoint;
        prevAngle += dang;
    }

    return [l, Math.abs(area),prevPoint,prevAngle];
}

// Example usage:
// let Segs = [[10, Math.PI/2], [10, 0], [10, Math.PI/2]]; // Mixed arc and straight line segments
// let [length, area] = SegmentsLengthArea(Segs);
// console.log("Length:", length, "Area:", area);

function* Segments2Complex({ p0_a0_segs = [[[0, 0], [1, 0]], []], scale = 1.0, tol = 0.05, offs = 0, loops = 1, return_start = false }) {
    const [p0, a0] = p0_a0_segs[0];
    const Segs = p0_a0_segs[1];
    let a = a0.slice();
    let p = p0.slice();
    p[0] = p[0] - a[0] * offs; // Real part
    p[1] = p[1] - a[1] * offs; // Imaginary part
    let L = 0;

    if (return_start) {
        yield { point: p, angle: a, length: L, segmentIndex: -1 };
    }

    let loopcount = 0;
    while (loops === null || loops === Infinity || loopcount < loops) {
        loopcount++;
        for (let X = 0; X < Segs.length; X++) {
            let [l, da, ..._] = Segs[X];
            l *= scale;
            let n;
			let v;
			let dda;
            if (da !== 0) {  // If da is not zero
                let r = l / da;
                r += offs;
                if (r !== 0) {
                    l = r * da;
                    let dl = 2 * Math.sqrt(2 * Math.abs(r) * tol);
                    n = Math.max(Math.ceil(6 * Math.abs(da / (2 * Math.PI))), Math.floor(l / dl) + 1);
                    let dda2 = [Math.cos(0.5*da / n), Math.sin(0.5*da / n)];
                    v = [2 * r* dda2[1] * dda2[0], 2 * r* dda2[1] * dda2[1]];
                    v = [v[0] * a[0] - v[1] * a[1], v[0] * a[1] + v[1] * a[0]];
                } else {
                    n = 1;
                    v = [0,0];
                }
				dda = [Math.cos(da / n), Math.sin(da / n)];
                for (let i = 0; i < n; i++) {
                    L += l / n;
                    p[0] += v[0];
                    p[1] += v[1];
					a = [a[0] * dda[0] - a[1] * dda[1], a[0] * dda[1] + a[1] * dda[0]];
                    yield { point: p.slice(), angle: a, length: L, segmentIndex: X };
                    v = [v[0] * dda[0] - v[1] * dda[1], v[0] * dda[1] + v[1] * dda[0]];
                }
            } else {
                n = 1; // Set n to 1 for the zero case
                // Handle the case when da is zero
                L += l;
                p[0] += l * a[0];
                p[1] += l * a[1];
                yield { point: p.slice(), angle: a, length: L, segmentIndex: X };
            }
        }
    }
}

// Usage example:

export function plot_segments(ctx,{p0=[0,0],a0=[1,0],segs=[],scale=1.0,tol=0.05,offs=0,loops=1,return_start=true}={}){
//	debugLog("segs: "+segs);
	let gen = Segments2Complex({
    p0_a0_segs: [[p0, a0],segs],
    scale: scale,
    tol: tol,
    offs: 0,
    loops: loops,
    return_start: return_start
});
//    segs.forEach((x,i)=>{debugLog(i+x);});
    ctx.beginPath();
    let {value:{point,angle:[cos_ang,sin_ang]}}=gen.next();
//	let point=value.point;
//	debugLog("point: "+point);
    ctx.moveTo(point[0]-offs*sin_ang,point[1]+offs*cos_ang);
	for (let {point,angle:[cos_ang,sin_ang]} of gen){
//		debugLog("point: "+point);
		ctx.lineTo(point[0]-offs*sin_ang,point[1]+offs*cos_ang);
	}
	ctx.stroke()
}
