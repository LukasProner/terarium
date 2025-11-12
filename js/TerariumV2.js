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
    scene.background = new THREE.Color(0xf5f5f5);

    // LIGHTS
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

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
    const glassMat = new THREE.MeshPhongMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    glassBox = new THREE.Mesh(glassGeo, glassMat);
    scene.add(glassBox);

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

    for (let i = 0; i < 8; i++) {
        let angle = (i / 10) * Math.PI * 2;
        if(i>4) angle += (2 / 10) * Math.PI * 2;
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

    angle = (1/2) * Math.PI * 2 + (1/20)* Math.PI * 2;
    body.position.set(Math.cos(angle) * 0.2, 0.07, Math.sin(angle) * 0.2);
    spider.add(body);

    spider.position.y = -0.1;
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

    // Pohyb pavúka pomocou klávesnice
    if (keyboard.pressed("W")) spider.translateZ(-moveDistance);
    if (keyboard.pressed("S")) spider.translateZ(moveDistance);
    if (keyboard.pressed("A")) spider.translateX(-moveDistance);
    if (keyboard.pressed("D")) spider.translateX(moveDistance);

    if (keyboard.pressed("E")) {
        for(i=0; i<spider.legs.length; i++) {
            spider.legs[i].upper.rotation.z += 0.05; // alebo rotation.x/y podľa osi
        }
    }

    if(keyboard.pressed("W")){
        const t = clock.elapsedTime;
        const speed = 5;
        const amplitudeZ = Math.PI/8;

        for(let i=0; i<spider.legs.length; i++){
            const leg = spider.legs[i];

            // fáza: pravá a ľavá strana nôh idú opačne
            let phase = (i % 2 === 0) ? 0 : Math.PI;

            // horná časť
            const theta = -Math.PI/3 + Math.sin(t*speed + i + phase) * amplitudeZ;
            leg.upper.rotation.z = theta;

            // dolná časť sleduje hornú
            leg.lower.rotation.z = Math.PI/3 + Math.sin(t*speed + i + phase) * (amplitudeZ/2);
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
