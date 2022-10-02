/*

OpenCommerce Group 404 interactive visual 2022

Author: https://github.com/IamTung-0000
Contributor: https://github.com/juskteez
origin: https://github.com/IamTung-0000/OCG-404

*/

import "./build/three.js"
import "./jsm/loaders/GLTFLoader.js"
import "./jsm/controls/OrbitControls.js"

let camera, scene, renderer, model;
let clock, topLight, light;
// let last_cameraPositionX;
// let frontLight, leftLight, rightLight, topLight, ambientLight, light;

const defaultCameraPosition = new THREE.Vector3( 0.766, 1.392, 1.603 );
const mouse       = new THREE.Vector2();
const accelerator = new THREE.Vector2();
const target      = new THREE.Vector2();
const windowHalf  = new THREE.Vector2( window.innerWidth / 2, window.innerHeight / 2 );

renderer          = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
camera            = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 20 );

const controls    = new THREE.OrbitControls( camera, renderer.domElement );
const container   = document.getElementById("container_404");

let motionSensed  = false;
let nudger        = 0;

const Light = () => {

    light = new THREE.PointLight(0xffffff);
    // We want it to be very close to our character
    light.position.set(-5,-2,3);
    light.intensity = 0.1;
    scene.add(light);

    const light_helper = new THREE.PointLightHelper( light, 1 );
    scene.add( light_helper );

    topLight = new THREE.SpotLight( 0x005BFF );
    topLight.position.set( 0, 600, 200 );
    topLight.intensity = 10;
    scene.add( topLight );

    // const top_helper = new THREE.SpotLightHelper( topLight, 20 );
    // scene.add( top_helper );

    // ambientLight = new THREE.AmbientLight( 0x005BFF );
    // ambientLight.intensity = 5;
    // scene.add( ambientLight );

}

const onMouseMove = ( event ) => {
    if (!motionSensed) {
        mouse.x = ( event.clientX - windowHalf.x );
        mouse.y = ( event.clientY - windowHalf.y );
    }
}

const viewAdjust = () => {
    if (window.innerWidth < 1024) {
        camera.zoom = .56;
        nudger = .5;
    } else {
        camera.zoom = 1;
        nudger = .22;
    }
}

const init = () => {

    container.classList.add("backdrop_container");

    camera.position.set(defaultCameraPosition.x,defaultCameraPosition.y,defaultCameraPosition.z);

    scene = new THREE.Scene();

    const loader = new THREE.GLTFLoader().setPath( 'https://tuananhbeeketing.github.io/OCG-404/Models/' );
    loader.load( '404.gltf', function ( gltf ) {
        model = gltf;
        scene.add( model.scene );
        //move model down.
        model.scene.position.y = -1;
        //merge light with custom shader
        var uniforms = THREE.UniformsUtils.merge(
            [THREE.UniformsLib['lights'],
            {
                lightIntensity: {type: 'f', value: 1.0},
            }
            ]
        )
        //new custom shader
        var material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    lightIntensity: {type: 'f', value: 0.6},
                    textureSampler: {type: 't', value: null},
                    color1: {
                        value: new THREE.Color(0x005BFF) //top
                        },
                        color2: {
                        value: new THREE.Color(0x00000) //bottom
                        }
                }
            ]),
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vecPos;
                varying vec3 vecNormal;
                void main() {
                    vUv = uv;
                    vecPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    vecNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;
                    gl_Position = projectionMatrix * vec4(vecPos, 1.0);
                }`,//vertShader,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                precision highp float;
                varying vec2 vUv;
                varying vec3 vecPos;
                varying vec3 vecNormal;
                uniform float lightIntensity;
                uniform sampler2D textureSampler;
                struct PointLight {
                    vec3 color;
                    vec3 position;
                    float distance;
                };
                uniform PointLight pointLights[NUM_POINT_LIGHTS];
                void main(void) {
                    vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);
                    for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
                        vec3 lightDirection = normalize(vecPos - pointLights[l].position);
                        addedLights.rgb += clamp(dot(-lightDirection, vecNormal), 0.0, 1.0)
                                            * pointLights[l].color * lightIntensity;
                    }
                    vec4 gradient = vec4(mix(color1, color2, vUv.y), 1.0);
                    gl_FragColor = gradient + (addedLights - 0.2);
                }`,//fracShader,
            //enable light
            lights: true

            });

        model.scene.traverse( function(node) {
            if (node.isMesh){
                if (node.material.name == "side") { node.material = material; }
            }
        });

        viewAdjust();
        camera.updateProjectionMatrix();

        render();
    } );

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.id = "backdrop_404"
    renderer.domElement.classList.add("backdrop_canvas")
    container.appendChild( renderer.domElement );

    controls.enabled = false;
    controls.enableDamping = true;
    controls.target.set( 0, 0, - 0.2 );

    controls.update();

    document.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'resize', onWindowResize );

    clock = new THREE.Clock();

    Light();

}

const deviceMotionRequest = () => {
    container.classList.add("requested")
    if ( typeof( window.DeviceMotionEvent ) !== "undefined" && typeof( window.DeviceMotionEvent.requestPermission ) === "function" ) {
        // Before API request prompt.
        window.DeviceMotionEvent.requestPermission()
        .then( response => {
            // After API prompt dismissed.
            if ( response == "granted" ) {
                motionSensed = true;
                window.addEventListener( "deviceorientation", (e) => {
                    accelerator.x = Number(e.gamma / 96);
	                accelerator.y = Number(e.beta / 128);
                });
            }
        }).catch( console.error );
    } else {
        // DeviceMotionEvent is not supported
        motionSensed = false;

    }
}

const onWindowResize = () => {

    const width = window.innerWidth;
	const height = window.innerHeight;

    windowHalf.set( width / 2, height / 2 );

    viewAdjust();
    camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize( width, height );
    render();

}

const animate = () => {

    // console.log(clock.getElapsedTime());
    if (model!= null ) {
        // console.log(model.scene.children[0]);
        model.scene.children[0].position.y = Math.sin(clock.getElapsedTime()*4)*0.05;
        model.scene.children[2].position.y = Math.sin((clock.getElapsedTime()*4)-1)*0.05;
        model.scene.children[1].position.y = Math.sin((clock.getElapsedTime()*4)-2)*0.05;

    }

    if (motionSensed) {
        target.x = accelerator.x;
        target.y = nudger + accelerator.y;
    } else {
        target.x = ( 1 - mouse.x*.3 ) * 0.001;
        target.y = nudger + ( 1 - mouse.y*.3 ) * 0.001;
    }

    controls.target.set( target.x, target.y, - 0.2 );
    controls.update();
    requestAnimationFrame( animate );
    render();
}


const render = () => { renderer.render( scene, camera ) }

init();
animate();
render();

let backBtn = document.querySelectorAll(".button-5.w-button")[0]
if (backBtn) {
    console.log(backBtn)
    backBtn.addEventListener("mouseenter", () => {
        if (!document.body.classList.contains("goinghome")) document.body.classList.add("goinghome")
    });
    backBtn.addEventListener("mouseleave", () => {
        if (document.body.classList.contains("goinghome")) document.body.classList.remove("goinghome")
    });
}

window.onload = () => {
    document.body.addEventListener("click", deviceMotionRequest)
}
