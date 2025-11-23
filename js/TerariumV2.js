var camera, scene, renderer, controls;
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

var glassBox, base, spider;
var projector, mouse = { x: 0, y: 0 }, INTERSECTED;

init();
render();

function init() {
    // CAMERA
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 2, 4);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);


    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // OBJECTS
    addObjects();

    // PROJECTOR + MOUSE EVENTS
    projector = new THREE.Projector();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
}
function addObjects() {
    // GLASS BOX
    const glassGeo = new THREE.BoxGeometry(3.01, 1.2, 2.01);
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,    // svetlomodrá farba
        transparent: true,
        opacity: 0.25,
        roughness: 0.5,       // hladký povrch = lesk
        metalness: 0.5,       // sklo nie je kov
        side: THREE.DoubleSide
    });
    glassBox = new THREE.Mesh(glassGeo, glassMat);
    scene.add(glassBox);

    var spotlight = new THREE.SpotLight('rgb(248,248,248)');
    spotlight.angle = Math.PI/6;
    spotlight.position.set(-2.5, 2, 2);
    spotlight.intensity = 2;
    scene.add(spotlight);
    var spotLightHelper = new THREE.SpotLightHelper( spotlight );
    scene.add( spotLightHelper );
    var lightTarget = new THREE.Object3D();
    lightTarget.position.set(0,0,0);
    scene.add(lightTarget);
    spotlight.target = lightTarget;


    // BASE (SAND)
    var sandTexture = new THREE.ImageUtils.loadTexture('texture/sand.jpg');
    const baseGeo = new THREE.BoxGeometry(3, 0.1, 2);
    const baseMat = new THREE.MeshPhongMaterial({ map: sandTexture });
    base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.55;
    scene.add(base);

    // SPIDER GROUP
    spider = new THREE.Group();

    const headGeo = new THREE.SphereGeometry(0.1, 32, 32);
    const headMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = +0.05;
    spider.add(head);

    const bodyGeo = new THREE.SphereGeometry(0.15, 32, 32);
    const body = new THREE.Mesh(bodyGeo, headMat);

    const legMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    spider.legs = [];

    for (let i = 4; i < 12; i++) {
        let angle = (i / 10) * Math.PI * 2;
        // if(i>4) angle += (2 / 10) * Math.PI * 2;
        // const side = i < 4 ? 1 : -1;

        // horná noha
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        legGeo.translate(0, 0.1, 0); // pivot na dolnom konci
        const legMesh = new THREE.Mesh(legGeo, legMat);
        const legPivot = new THREE.Object3D();
        legPivot.position.set(Math.cos(angle)*0.1, 0, Math.sin(angle)*0.1);
        legPivot.rotation.y = -angle;
        legPivot.rotation.z = -Math.PI/3;
        legPivot.add(legMesh);

        // dolná noha
        const legGeo2 = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        legGeo2.translate(0, -0.15, 0); // pivot na vrchu hornej časti
        const legMesh2 = new THREE.Mesh(legGeo2, legMat);
        const legPivot2 = new THREE.Object3D();
        legPivot2.position.set(0, 0.2, 0); // naviažeme na koniec hornej časti
        legPivot.add(legPivot2);
        legPivot2.add(legMesh2);

        spider.add(legPivot);

        spider.legs.push({ upper: legPivot, lower: legPivot2, upperMesh: legMesh, lowerMesh: legMesh2 });
    }

    angle = Math.PI + (1/20)* Math.PI * 2;
    // body.position.set(Math.cos(angle) * 0.2, 0.07, Math.sin(angle) * 0.2);
    body.position.set(0, 0, 0.2);
    spider.add(body);

    spider.position.y = -0.1;
    spider.rotation.y = 0;
    scene.add(spider);

}



function render() {
    requestAnimationFrame(render);

    // Simple idle animation (rotation)
    // spider.rotation.y += 0.005;

    renderer.render(scene, camera);
    camera.lookAt(scene.position);

    update();
}
function update() {
    var delta = clock.getDelta();
    var moveDistance = 1 * delta;
    var rotateSpeed = 5; // rýchlosť otáčania pavúka
    // const modelOffset = Math.PI / 2;

    // --- Vypočítanie pohybového smeru ---
    let moveX = 0;
    let moveZ = 0;

    if (keyboard.pressed("W")) moveZ -= 1;
    if (keyboard.pressed("S")) moveZ += 1;
    if (keyboard.pressed("A")) moveX -= 1;
    if (keyboard.pressed("D")) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
        // Cieľový uhol pohybu (v svetových súradniciach)
        const targetAngle = Math.atan2(moveX, moveZ) + Math.PI ; // atan2(x, z)

        // Rozdiel medzi aktuálnym a cieľovým uhlom
        let angleDiff = targetAngle - spider.rotation.y;

        // Oprav rozdiel na interval [-PI, PI]
        angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;

        // Plynulé otáčanie pavúka
        spider.rotation.y += (angleDiff) * Math.min(1, rotateSpeed * delta);

        // Pohyb dopredu podľa lokálneho smeru pavúka
        spider.translateZ(-moveDistance);
    }

    // --- Animácia nôh pri pohybe ---
    if(moveX !== 0 || moveZ !== 0){
        const t = clock.elapsedTime;
        const speed = 5;
        const amplitudeZ = Math.PI/8;
        const amplitudeY = Math.PI / 16;  // dopredu/dozadu (menší uhol)

        for(let i=0; i<spider.legs.length; i++){
            const leg = spider.legs[i];
            let phase = (i % 2 === 0) ? 0 : Math.PI;

            leg.upper.rotation.z = -Math.PI/3 + Math.sin(t*speed + i + phase) * amplitudeZ;
            leg.lower.rotation.z = Math.PI/3 + Math.sin(t*speed + i + phase) * (amplitudeZ/2);
            // leg.upper.rotation. = Math.sin(t * speed + i + phase) * amplitudeY;
        }
    }

    controls.update();
}



function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
