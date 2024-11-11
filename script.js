window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    ((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()
));

var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;

    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');

    var width = canvas.width = koef * window.innerWidth;
    var height = canvas.height = koef * window.innerHeight;

    var rand = Math.random;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    var i;
    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var targetPoints = [];
    var heartPointsCount;

    var heartPosition = function (rad) {
        return [
            Math.pow(Math.sin(rad), 3),
            -(
                15 * Math.cos(rad) -
                5 * Math.cos(2 * rad) -
                2 * Math.cos(3 * rad) -
                Math.cos(4 * rad)
            ),
        ];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    // Generate heart points
    var dr = mobile ? 0.3 : 0.1;
    for (i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
    heartPointsCount = pointsOrigin.length;

    function updateTargetPoints(kx, ky) {
        targetPoints = [];

        // Heart points
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints.push([
                kx * pointsOrigin[i][0] + width / 2,
                ky * pointsOrigin[i][1] + height / 2 + 50, // Adjust position if needed
            ]);
        }
    }

    updateTargetPoints(1, 1);

    var totalPointsCount = targetPoints.length;

    // Initialize particles
    var e = [];
    for (i = 0; i < totalPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: i,
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: "rgba(106,66,194,0.3)", // Heart color (#6A42C2) with transparency
            trace: [],
        };
        for (var k = 0; k < traceCount; k++)
            e[i].trace[k] = { x: x, y: y };
    }

    // Configuration
    var config = {
        traceK: 0.4,
        timeDelta: 0.01,
    };

    var time = 0;

    // Animation loop
    var loop = function () {
        var n = -Math.cos(time);
        updateTargetPoints((1 + n) * 0.5, (1 + n) * 0.5);
        time +=
            ((Math.sin(time)) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, 0, width, height);
        for (i = e.length; i--; ) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    u.q = ~~(rand() * totalPointsCount);
                } else {
                    if (0.99 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= totalPointsCount;
                    if (u.q < 0) {
                        u.q += totalPointsCount;
                    }
                }
            }
            u.vx += (-dx / length) * u.speed;
            u.vy += (-dy / length) * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (var k = 0; k < u.trace.length - 1; ) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            ctx.fillStyle = u.f;
            for (k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }
        window.requestAnimationFrame(loop, canvas);
    };

    loop();

    // Resize handler
    window.addEventListener('resize', function () {
        width = canvas.width = koef * window.innerWidth;
        height = canvas.height = koef * window.innerHeight;
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);

        // Update target points on resize
        updateTargetPoints(1, 1);
    });
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
