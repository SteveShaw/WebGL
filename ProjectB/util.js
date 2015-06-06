const EQN_EPS = 1e-10;
const INV3 = .3333333333333333;
const INV2 = .5;
const INV4           = .25;
const INV8           = .125;
const INV16          = .0625;
const PI_OVER_3      = 1.0471975511965976;
const TWO_OVER_27    = .07407407407407407;
const THREE_OVER_8   = .375;
const THREE_OVER_256 = 0.01171875;

function cbrt(x)
{
    return (x < 0 ? -1.0 : 1.0) * Math.pow(Math.abs(x), INV3);
}

function isZero(n)
{
    return (n > -EQN_EPS) && (n<EQN_EPS);
}

function solveQuadric(c0, c1, c2, roots)
{
    var p = c1 / (2 * c2);
    var q = c0 / c2;
    var d = p * p - q;

    //normal form: x^2 + px + q = 0
    if (isZero(d))
    {
        roots[0] = -p;
        return 1;
    }
    else
        if (d < 0)
            return 0;
        else
        {
            var sqrt_d = Math.sqrt(d);
            roots[0] = sqrt_d - p;
            roots[1] =-sqrt_d - p;
            return 2;
        }
}
function solveCubic(c0, c1, c2, c3, roots)
{
    var k = 0;


    //normal form: x^3 + Ax^2 + Bx + C = 0
    var a = c2 / c3;
    var b = c1 / c3;
    var c = c0 / c3;


    //substitute x = y - a/3 to eliminate quadric term
    var sqa = a * a;
    var p = INV3 * (-INV3 * sqa + b);
    var q = INV2 * (TWO_OVER_27 * a * sqa - INV3 * a * b + c);

    //use Cardano's formula
    var cbp = p * p * p;
    var d = q * q + cbp;
	
	

    if (isZero(d))
    {
        if (isZero(q)) //one triple solution
        {
            roots[0] = 0;
            k = 1;
        }
        else //one single and one double solution
        {
            var u = cbrt(-q);
            roots[0] = 2 * u;
            roots[1] =-u;
            k = 2;
        }
    }
    else if (d < 0.0) //casus irreducibilis: three real solutions
        {
            var phi = INV3 * Math.acos(-q / Math.sqrt(-cbp));
            var t = 2 * Math.sqrt(-p);
            roots[0] =  t * Math.cos(phi);
            roots[1] = -t * Math.cos(phi + PI_OVER_3);
            roots[2] = -t * Math.cos(phi - PI_OVER_3);
            k = 3;
        }
        else //one real solution
        {
            var rtD = Math.sqrt(d);
            var u = cbrt(Math.sqrt(d) - q);
            var v =-cbrt(Math.sqrt(d) + q);
            roots[0] = u + v;
            k = 1;
        }

    var sub = INV3 * a;
    for(var i =0;i<k;++i)
    {
        roots[i] -= sub;
    }
    return k;
}
function solveQuartic(c0, c1, c2, c3, c4,roots)
{
    var tc0, tc1, tc2, tc3, k;
    var i;

    //normal form: x^4 + Ax^3 + Bx^2 + Cx + D = 0
    var a = c3 / c4;
    var b = c2 / c4;
    var c = c1 / c4;
    var d = c0 / c4;

    //substitute x = y - A/4 to eliminate cubic term: x^4 + px^2 + qx + r = 0
    var sqa = a * a;
    var p = -THREE_OVER_8 * sqa + b;
    var q = INV8 * sqa * a - INV2 * a * b + c;
    var r = -THREE_OVER_256 * sqa * sqa + INV16 * sqa * b - INV4 * a * c + d;
	


    if (isZero(r))
    {
        //no absolute term: y(y^3 + py + q) = 0
        tc0 = q;
        tc1 = p;
        tc2 = 0;
        tc3 = 1;
        k = solveCubic(tc0, tc1, tc2, tc3, roots);
        roots[k++] = 0;
    }
    else
    {
        //solve the resolvent cubic...
        tc0 = INV2 * r * p - INV8 * q * q;
        tc1 = -r;
        tc2 = -INV2 * p;
        tc3 = 1;

        solveCubic(tc0, tc1, tc2, tc3, roots);

        //and take the one real solution...
        var z = roots[0];

        //...to build two quadric equations
        var u = z * z - r;
        var v = 2 * z - p;

        if (isZero(u))
            u = 0;
        else
            if (u > 0)
                u = Math.sqrt(u);
            else
                return 0;

        if (isZero(v))
            v = 0;
        else
            if (v > 0)
                v = Math.sqrt(v);
            else
                return 0;

        tc0 = z - u;
        tc1 = q < 0 ? -v : v;
        tc2 = 1;
        k = solveQuadric(tc0, tc1, tc2, roots);

        tc0 = z + u;
        tc1 = q < 0 ? v : -v;
        tc2 = 1;

        //first save
        var tempRoots =[];

        for(i =0;i<k;++i)
        {
            tempRoots.push(roots[i]);
        }

        var k1 = solveQuadric(tc0,tc1,tc2,roots);
        for(i = 0;i<k1;++i)
        {
            tempRoots.push(roots[i]);
        }

        roots.length = 0;

        k += k1;
        for(i = 0;i<k;++i)
        {
            roots.push(tempRoots[i]);
        }
    }

    //resubstitute
    var sub = INV4 * a;
    for(i = 0;i<k;++i)
    {
        roots[i] -= sub;
    }

    return k;
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}