// Younes HAJJI
// youneshajji93@gmail.com

// la classe Graphe avec laquel on crée un graphe
// cam : la camera, color : la couleur d'arriere plan de graphe en hexa
// axes : afficher ou non les axes x et y
function Graphe(cam,color,grille ,axes) {

    // liste des noeuds des graphes
    this.noeuds = [];

    var camera, scene, renderer;
    var width = window.innerWidth, height = window.innerHeight;

    // objects contiendra les noeuds déplaçable
    // plane est utilisé pour determiner la position d'intersection
    var objects = [], plane;

    var raycaster = new THREE.Raycaster();

    var mouse = new THREE.Vector2(),
        offset = new THREE.Vector3(),
        INTERSECTED, SELECTED;

    // le matériel par default des noeuds et des arcs
    var material = new THREE.MeshBasicMaterial({color: 0x5FBAD9});

    //la methode qui crée des noeuds
    //un noeud est representé par un cercle
    //mat : c'est un matériel , deplacable : si on veut autoriser le deplacement de noeud ou pas
    this.noeud = function(x, y, mat, radiu, deplacable) {
        var radius = radiu || 2.5;
        var segments = 32;
        var circleGeometry = new THREE.CircleGeometry( radius, segments );
        var circle = new THREE.Mesh( circleGeometry, mat || material );
        circle.position.x=x||0;
        circle.position.y=y||0;
        // ajouter le noeud crée au liste des noeuds de graphe
        this.noeuds.push(circle);

        // si modifiable n'est pas desactivé on ajoute le noeud au liste des noeuds modifiable
        if(deplacable != false)
            objects.push(circle);

        return circle;
    }

    // la methode qui crée un arc entre 2 noeuds
    this.arc =  function(noeud1, noeud2, mat) {
        var geometry = new THREE.Geometry();
        // définir les vertices de ligne qui correspondent aux positions des 2 noeuds
        geometry.vertices.push(
            noeud1.position,
            noeud2.position
        ); 

        // un arc est representé par une ligne qui lie 2 noeuds
        line = new THREE.Line( geometry, mat || material );
        // la ligne est definie comme un enfant des noeuds pour faciliter le déplacement du ligne quand on déplace un noeud
        noeud1.children.push(line);
        noeud2.children.push(line);
        return line;
    }

    //la methode qui crée des arcs entre plusieurs noeuds
    this.arcToMultipleNoeud =  function(noeud1, noeud2, mat) {
        for(var i = 0 ; i < noeud2.length ; i ++) {
            this.arc(noeud1, noeud2[i], mat);
        }
    }


    // la methode qui crée le graphe
    this.creerGraphe= function() {
        init();
        creerNoeuds();
        animate();
    }

    // la methode qui ajoute les noeuds à la scène
    function creerNoeuds() {
        for(var i = 0 ; i < this.noeuds.length; i++){
            scene.add(this.noeuds[i]);
        }
    }
    function init() {


        // préparer la camera par defaut
        var VIEW_ANGLE = 100, ASPECT = width / height, NEAR = 1, FAR = 1000;
        var cameraDefault = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        cameraDefault.position.z=100;

        // si on a pas definie une camera lors de création de graphe alors on utilise celle par defaut
        camera = cam || cameraDefault;

        // créer la scène
        scene = new THREE.Scene();  

        // la grille
        var gridHelper = new THREE.GridHelper( width, 10 );
        gridHelper.rotation.x = Math.PI/2;

        // si lors de création de graphe on a pas definie la grille alors on utilise celle par defaut
        scene.add( grille || gridHelper );

        // si on a pas désactivé les axes on les ajoute a la scéne
        if (axes != false) {
            scene.add( new THREE.AxisHelper( width/2 ) );
        }

        // plane est utilisé pour determiner la position d'intersection
        plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry( width, height, 8, 8 ),
            new THREE.MeshBasicMaterial( { visible: false } )
        );
        scene.add( plane );

        // le renderer WEBGL
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setClearColor( color || 0xF0F0F0 );
        renderer.setSize( width, height );

        container = document.createElement( 'div' );
        document.body.appendChild( container );
        container.appendChild( renderer.domElement );

        // les événements souris
        renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
        renderer.sortObjects = false;

        //
        window.addEventListener( 'resize', onWindowResize, false );

    }
    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }


    // l'événement lors le deplacement de la souris
    function onDocumentMouseMove( event ) {

        // on recupére la position de la souris
        mouse.x = ( event.clientX / width ) * 2 - 1;
        mouse.y = - ( event.clientY / height ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );

        // si on a sélectionné un noeud
        if ( SELECTED ) {

            var intersects = raycaster.intersectObject( plane );
            if ( intersects.length > 0 ) {
                // on positione le noeud sélectionné sur la nouvelle position d'intersection
                SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );
                for(var i = 0 ; i < SELECTED.children.length ; i++){
                    // on active 'verticesNeedUpdate' celle qui permet la modification de la ligne (l'enfant) selon la nouvelle position des noeuds
                    SELECTED.children[i].geometry.verticesNeedUpdate=true;
                }
            }
            return;
        }

        var intersects = raycaster.intersectObjects( objects );

        if ( intersects.length > 0 ) {

            if ( INTERSECTED != intersects[ 0 ].object ) {

                if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
                INTERSECTED = intersects[ 0 ].object;
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                plane.position.copy( INTERSECTED.position );

            }

            container.style.cursor = 'pointer';

        } else {

            if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
            INTERSECTED = null;
            container.style.cursor = 'auto';

        }

    }
    // l'événement lors du clique sur la souris
    function onDocumentMouseDown( event ) {

        event.preventDefault();

        raycaster.setFromCamera( mouse, camera );

        // récupérer intersectObjects
        var intersects = raycaster.intersectObjects( objects );

        if ( intersects.length > 0 ) {
            // on sélectionne le noeud qu'on a cliqué dessus
            SELECTED = intersects[ 0 ].object;
            var intersects = raycaster.intersectObject( plane );

            if ( intersects.length > 0 ) {
                offset.copy( intersects[ 0 ].point ).sub( plane.position );
            }
            container.style.cursor = 'move';

        }

    }
    // l'événement lors l'enlèvement du clique sur la souris
    function onDocumentMouseUp( event ) {

        event.preventDefault();

        if ( INTERSECTED ) {
            plane.position.copy( INTERSECTED.position );
            // on désélectionne le noeud 
            SELECTED = null;
        }

        container.style.cursor = 'auto';

    }

    // animer la scène
    function animate() {
        requestAnimationFrame( animate );
        render();
    }

    // faire le rendu de la scène
    function render() {
        renderer.render( scene, camera );
    }
}