


var width = window.innerWidth;
var height = window.innerHeight;
var controls;
var objects = [];
var rainCloud;
var rainCloud2;
var raycaster;
var ambientMusic;
var vinyl;
//check if the browser supports pointerlockAPI

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document ||  'webkitPointerLockElement' in document;
var screenBlock = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
	//pointer lock code block used from thje pointerLock threeJS example
	if ( havePointerLock ) {
				var element = document.body;
				var pointerlockchange = function ( event ) {
					if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
						controlsEnabled = true;
						controls.enabled = true;
						screenBlock.style.display = 'none';
					} else {
						controls.enabled = false;
						screenBlock.style.display = '-webkit-box';
						screenBlock.style.display = '-moz-box';
						screenBlock.style.display = 'box';
						instructions.style.display = '';
					}
				};
				var pointerlockerror = function ( event ) {
					instructions.style.display = '';
				};
				
				document.addEventListener( 'pointerlockchange', pointerlockchange, false );
				document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
				document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
				document.addEventListener( 'pointerlockerror', pointerlockerror, false );
				document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
				document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
				instructions.addEventListener( 'click', function ( event ) {
					instructions.style.display = 'none';
					// Ask the browser to lock the pointer
					element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
					if ( /Firefox/i.test( navigator.userAgent ) ) {
						var fullscreenchange = function ( event ) {
							if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
								document.removeEventListener( 'fullscreenchange', fullscreenchange );
								document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
								element.requestPointerLock();
							}
						};
						document.addEventListener( 'fullscreenchange', fullscreenchange, false );
						document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
						element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
						element.requestFullscreen();
					} else {
						element.requestPointerLock();
					}
				}, false );
			} else {
				instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
			
	}
	var controlsEnabled = false;
			var moveForward = false;
			var moveBackward = false;
			var moveLeft = false;
			var moveRight = false;
			var canJump = false;
			var prevTime = performance.now();
			var velocity = new THREE.Vector3();
	//end code block
	
function init() {
	//setup the renderer including shadow map
	renderer =  new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(width,height);
	renderer.shadowMap.enabled = true;
	document.getElementById("scene").appendChild(renderer.domElement);
	scene = new THREE.Scene();
   //standard
    scene.background = new THREE.Color(0xc7d1e0 );
    scene.fog = new THREE.Fog(0xc7d1e0, 0.015, 600);
	//debug
   // scene.background = new THREE.Color(0x000000 );
    
    //camera setup
    //was 60 fov now 45
	camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
    controlsEnabled = false;
    //camera.rotation.y = 90  * (Math.PI /180);
    
    // debug logging
    console.log(camera.position);
    
    //setup meshes
	var floorplane = new THREE.BoxBufferGeometry(100,1,200);
	var floorMesh = createNormalMesh(floorplane,"./textures/finewood1.jpg","./textures/floor.png",15,15,0.1,true)
	floorMesh.rotation.x = 180 * (Math.PI /180);
    objects.push(floorMesh);
    
    var ceilingGeo = new THREE.BoxBufferGeometry(100,1,200);
	var ceilingMesh = createNormalMesh(ceilingGeo,"./textures/plaster.jpg","./textures/plaster.png",5,5,1,true)
	ceilingMesh.rotation.x = 180 * (Math.PI /180);
    ceilingMesh.position.set(0,20,0);
    objects.push(ceilingMesh);
    
    var walls = []
    var shortWallGeo = new THREE.BoxBufferGeometry(1,20,100);
    shortWallGeo.computeBoundingSphere()
    var longWallGeo = new THREE.BoxBufferGeometry(1,20,200);
    longWallGeo.computeBoundingSphere()
    longWallGeo.computeFaceNormals();
       
    walls[0] = createNormalMesh(longWallGeo,"./textures/window.png","./textures/windowNormal.png",4,1,10,true);
    walls[0].position.set(-50.5,10.5,0);
   // walls[1] = createNormalMesh(longWallGeo,"./textures/plaster.jpg","./textures/plaster.png",4,1,4, true);
    walls[1] = new THREE.Mesh(longWallGeo,new THREE.MeshPhongMaterial({color:0xe8eff9}));
    walls[1].position.set(50.5,10.5,0);
    //walls[2] = createNormalMesh(shortWallGeo,"./textures/plaster.jpg","./textures/plaster.png",4,1,4, true);
//    walls[2] =  new THREE.Mesh(shortWallGeo,new THREE.MeshPhongMaterial({color:0xe8eff9}));
//    walls[2].position.set(0,10.5,-50.5);
//    walls[2].rotation.set(0,90 * (Math.PI / 180),0)
    walls[2] = createNormalMesh(shortWallGeo,"./textures/window.png","./textures/windowNormal.png",2,1,10, true);
    walls[2].position.set(0,10.5,100.5);
    walls[2].rotation.set(0,90 * (Math.PI / 180),0)
    //walls[4] = createNormalMesh(shortWallGeo,"./textures/plaster.jpg","./textures/plaster.png",4,2, true);
    walls[3] = new THREE.Mesh(shortWallGeo,new THREE.MeshPhongMaterial({color:0xe8eff9}));
    walls[3].position.set(0,10.5,-100.5);
    walls[3].rotation.set(0,90 * (Math.PI / 180),0)
               
    for (var i = 0; i < walls.length;i++) {
                scene.add(walls[i]);
        walls[i].receiveShadow = true;
        walls[i].frustumCulled = false;
        
                objects.push(walls[i]);
    }
        //light blocking beam boxes
    var doubleBeamGeo = new THREE.BoxBufferGeometry(0.1,20,12.5);
    var singleBeamGeo = new THREE.BoxBufferGeometry(0.1,20,6.25);
    var simpleMat = new THREE.MeshLambertMaterial({color:0x000000 ,alpha:0});
    var blockers = [];
    blockers[0] = new THREE.Mesh(doubleBeamGeo,simpleMat);
    blockers[0].position.set(-50.2,10.5,0);
    blockers[1] = new THREE.Mesh(doubleBeamGeo,simpleMat);
    blockers[1].position.set(-50.2,10.5,50);
    blockers[2] = new THREE.Mesh(doubleBeamGeo,simpleMat);
    blockers[2].position.set(0,10.5,100.2);
    blockers[2].rotation.y = 90 * (Math.PI/180);
    blockers[3] = new THREE.Mesh(singleBeamGeo,simpleMat);
    blockers[3].position.set(-47,10.5,100.1);
    blockers[3].rotation.y = 90 * (Math.PI/180);
    blockers[4] = new THREE.Mesh(singleBeamGeo,simpleMat);
    blockers[4].position.set(-50.2,10.5,97);
    blockers[5] = new THREE.Mesh(singleBeamGeo,simpleMat);
    blockers[5].position.set(-50.2,10.5,-47);
    blockers[6] = new THREE.Mesh(singleBeamGeo,simpleMat);
    blockers[6].position.set(-50.2,10.5,-53
                            );
    
    for(var i = 0;i<blockers.length;i++) {
        scene.add(blockers[i]);
        blockers[i].castShadow = true;
        blockers[i].frustumCulled = false;
    }
    
    
    //import models
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.load("./models/desk.mtl", function( materials ) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/desk.obj", function ( object ) {
        object.position.set(-25,0,90);
        object.rotation.y += 180 * (Math.PI /180)
        object.scale.set(0.5,0.5,0.5)
        object.castShadow = true;
            object.name = "desk";
            object.add(ambientMusic);
				scene.add( object );
            object.traverse(function (obj) {
            if (obj instanceof THREE.Mesh) {
                obj.receiveShadow = true;
                obj.castShadow = true;
                obj.geometry.computeVertexNormals();
                
            }
        })
        });

   
   
    });
    
   var desk = scene.getObjectByName("desk")
    console.log("desk:"+desk);
    var vinylGeo = new THREE.CylinderBufferGeometry(1.2,1.2,0.05,32);
    vinyl = createNormalMesh(vinylGeo,"./textures/vinyl.png","./textures/vinylNormal.png",1,1,0.1,true);
    vinyl.position.set(-21.2,6.2,89.93);
    
    
    //randomly generate skyline buildings
 var buildings = [];
    for (var i = 0; i < 10;i++) {
        
        var r = Math.floor( Math.random() * 90)
        console.log(r);
        var geo = new THREE.BoxBufferGeometry(100 ,500 + r,100);
        var material = new THREE.MeshLambertMaterial({color: 0xffffff});
        buildings[i] = new THREE.Mesh(geo,material);
        if (i>0){
            var j = i-1;
            console.log(j);
            console.log(buildings[j]);
            console.log(buildings[i]);
            var newR = Math.floor( Math.random() * 120);
            buildings[i].position.set(buildings[j].position.x + 100 + newR, -300,buildings[j].position.z + 100 +newR);
        }
        else {
            buildings[i].position.set(r -800, -300 ,r -200);
        }
        scene.add(buildings[i]);
    }
    
    
    var rainTexture = THREE.ImageUtils.loadTexture("./textures/raindrop.png");
    var rainMat = new THREE.PointCloudMaterial( {size:2, 
                                                transparent:true, 
                                                opacity:true,
                                                map:rainTexture, 
                                                blending:THREE.AdditiveBlending,
                                                sizeAtennuation:true, 
                                                color: 0xffffff})
    var area = 600;
    var rainGeo = new THREE.Geometry
    for(var i=0;i<1500;i++) {
        var particle = new THREE.Vector3(Math.random() * area - area/2,Math.random() * 2000 - 1000/*Math.random() * area * 1.5*/,Math.random() * area - area/2);
        particle.velocityX = (Math.random() -0.5) / 3;
        particle.velocityY = 0.02 + (Math.random() / 5);
         rainGeo.vertices.push(particle);
    }
    rainGeo.computeBoundingSphere();
     rainCloud = new THREE.Points(rainGeo,rainMat);
     rainCloud.sortParticles = true;
   
    rainCloud.frustumCulled = false;
    rainCloud.position.set(-400,0,0)
    rainCloud2 = new THREE.Points(rainGeo,rainMat);
    rainCloud2.position.set(0,0,400)
    rainCloud2.frustumCulled = false;
    camera.add(rainCloud);
    camera.add(rainCloud2);
    // sounds
    
    var listener =  new THREE.AudioListener();
    camera.add(listener);
    var audioLoader = new THREE.AudioLoader();
     ambientMusic = new THREE.PositionalAudio( listener );
				audioLoader.load( "./sounds/Winterlude.mp3", function( buffer ) {
					ambientMusic.setBuffer( buffer );
					ambientMusic.setRefDistance( 20 );
                    ambientMusic.setLoop(true);
					ambientMusic.play();
				});
//    var shadowSphereGeo = new THREE.SphereBufferGeometry(4,16,16)
//    var mat = new THREE.MeshPhongMaterial();
//    var mesh =  new THREE.Mesh(shadowSphereGeo,mat);
//    mesh.position.set(0,0,89)
//    mesh.castShadow = true;
//    mesh.add(ambientMusic);
    
	  //lighting
    
	var ambient = new THREE.AmbientLight( 0xFfffff, 0.1);
	pointLight = new THREE.PointLight(0xffffff, 0.6);
    pointLight.castShadow = true;
	 var directionalLight = new THREE.DirectionalLight(0xc7d1e0,0.7);
   // directionalLight.position.set(-200,500,-200)
    directionalLight.position.set(0,2,0)
        directionalLight.castShadow = true;
       console.log(directionalLight.shadow);
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = camera.far;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
       
        directionalLight.visible = true;
        //directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 50); 
        directionalLight.position.set(-200,10,70)
        scene.add(directionalLight);
     directionalLight.shadow.camera.visible = true;
    //scene.add(directionalLightHelper);
	floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    scene.add(ceilingMesh);
	scene.add(ambient);
    scene.add(pointLight);
    scene.add(mesh);
    scene.add(rainCloud);
    scene.add(rainCloud2);
	//positioning
	pointLight.position.set(-35,8,70);
	
	//pointLight.lookAt(floorMesh.position);
	
	
	
	
	
	
	
	/*
	*
	*controls
	*/
	
	controls = new THREE.PointerLockControls(camera);
  var controller = controls.getObject();
    controller.rotation.y = 180  * (Math.PI /180);
    controller.position.set(0,10,-80)
    controller.frustumCulled = false;
	scene.add(controls.getObject());
	var onKeyDown = function ( event ) {
					switch ( event.keyCode ) {
						case 38: // up
						case 87: // w
							moveForward = true;
							break;
						case 37: // left
						case 65: // a
							moveLeft = true; 
                            break;
						case 40: // down
						case 83: // s
							moveBackward = true;
							break;
						case 39: // right
						case 68: // d
							moveRight = true;
							break;
						case 32: // space
							//if ( canJump === true ) velocity.y += 100;
							canJump = false;
							break;
					}
				};
				var onKeyUp = function ( event ) {
					switch( event.keyCode ) {
						case 38: // up
						case 87: // w
							moveForward = false;
							break;
						case 37: // left
						case 65: // a
							moveLeft = false;
							break;
						case 40: // down
						case 83: // s
							moveBackward = false;
							break;
						case 39: // right
						case 68: // d
							moveRight = false;
							break;
                        case 88:
                            if(ambientMusic.isPlaying) {
                                ambientMusic.pause();
                            }
                            else {
                                ambientMusic.play();
                            }
                            break;
					}
				};
				document.addEventListener( 'keydown', onKeyDown, false );
				document.addEventListener( 'keyup', onKeyUp, false );
				raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

	
	
	
	
	
	window.addEventListener( 'resize', onResize, false );
}


function createNormalMesh(geom, texturePath, normalPath, repeatScaleX,repeatScaleY,NormalScale, transparent) {
    
    
    var texture = THREE.ImageUtils.loadTexture(texturePath);
    if (!isNaN(repeatScaleX) & !isNaN(repeatScaleY)) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
       
        texture.repeat.set(repeatScaleX, repeatScaleY);
}
    else {
         texture.wrapS = THREE.RepeatWrapping;
         texture.wrapT = THREE.RepeatWrapping;
         texture.repeat.set(repeatScaleX);
    }
  
    var normal = THREE.ImageUtils.loadTexture(normalPath);
    if (!isNaN(repeatScaleX) & !isNaN(repeatScaleY)) {
        normal.wrapS = THREE.RepeatWrapping;
        normal.wrapT = THREE.RepeatWrapping;
        normal.repeat.set(repeatScaleX, repeatScaleY);
    }
    var material = new THREE.MeshPhongMaterial({map:texture,normalMap:normal});
     if (!isNaN(NormalScale)) {
        material.normalScale.set(NormalScale,2);
     }
    
   
    if(transparent) material.transparent = true;
    material.minFilter = THREE.NearestFilter;
    
    mesh = new THREE.Mesh(geom,material)


   
    return mesh;
    
}


//camera and lighting

function onResize() {
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.aspect = ( window.innerWidth / window.innerHeight );
	camera.updateProjectionMatrix();
}

function animate() {
	requestAnimationFrame(animate);
   // console.log(camera.position);
    if(ambientMusic.isPlaying) {
        vinyl.rotation.y += Math.sin(2) * (Math.PI  / 180) * 0.8;
        
    }
  	if ( controlsEnabled ) {
					raycaster.ray.origin.copy( controls.getObject().position );
					raycaster.ray.origin.y -= 10;
					var intersections = raycaster.intersectObjects( objects );
					var isOnObject = intersections.length > 0;
					var time = performance.now();
					var delta = ( time - prevTime ) / 1000;
					velocity.x -= velocity.x * 5.0 * delta;
					velocity.z -= velocity.z * 5.0 * delta;
					velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
					if ( moveForward ) velocity.z -= 200.0 * delta;
					if ( moveBackward ) velocity.z += 200.0 * delta;
					if ( moveLeft ) velocity.x -= 200.0 * delta;
					if ( moveRight ) velocity.x += 200.0 * delta;
					if ( isOnObject === true ) {
						velocity.y = Math.max( 0, velocity.y );
						canJump = true;
					}
					controls.getObject().translateX( velocity.x * delta );
					controls.getObject().translateY( velocity.y * delta );
					controls.getObject().translateZ( velocity.z * delta );
					if ( controls.getObject().position.y < 10 ) {
						velocity.y = 0;
						controls.getObject().position.y = 10;
						canJump = true;
					}
					prevTime = time;
	}
    var rain = rainCloud.geometry.vertices;
            rain.forEach(function (v) {
                v.y = v.y - (v.velocityY);
                v.x = v.x - (v.velocityX);
                if (v.y <= 0) v.y = 60;
                if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
            });
            rainCloud.geometry.verticesNeedUpdate = true;
       var rain2 = rainCloud2.geometry.vertices;
            rain2.forEach(function (v) {
                v.y = v.y - (v.velocityY);
                v.x = v.x - (v.velocityX);
                if (v.y <= 0) v.y = 60;
                if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
            });
            rainCloud2.geometry.verticesNeedUpdate = true;
    
    
	//console.log("I rendered");
	
	render();
  
   }

function render() {
	renderer.render(scene,camera);
}
init();
animate();
