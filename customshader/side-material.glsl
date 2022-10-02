let vertShader = `

    varying vec2 vUv;
    varying vec3 vecPos;
    varying vec3 vecNormal;
        
    void main() {
        vUv = uv;
        // Since the light is in camera coordinates,
        // I'll need the vertex position in camera coords too
        vecPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
        // That's NOT exacly how you should transform your
        // normals but this will work fine, since my model
        // matrix is pretty basic
        vecNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;
        gl_Position = projectionMatrix *
                    vec4(vecPos, 1.0);
    }

`

let fracShader = `

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
    vec3 position; // light position, in camera coordinates
    float distance; // used for attenuation purposes. Since
                    // we're writing our own shader, it can
                    // really be anything we want (as long as
                    // we assign it to our light in its
                    // "distance" field
    };
    
    uniform PointLight pointLights[NUM_POINT_LIGHTS];
    
    void main(void) {
    // Pretty basic lambertian lighting...
    vec4 addedLights = vec4(0.0,
                            0.0,
                            0.0,
                            1.0);
    for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
        vec3 lightDirection = normalize(vecPos
                                - pointLights[l].position);
        addedLights.rgb += clamp(dot(-lightDirection,
                                    vecNormal), 0.0, 1.0)
                            * pointLights[l].color
                            * lightIntensity;
    }
    // gl_FragColor = addedLights;
    vec4 gradient = vec4(mix(color1, color2, vUv.y), 1.0);
    gl_FragColor = gradient + (addedLights - 0.2);
    }

`


