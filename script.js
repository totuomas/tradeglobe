const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

fetch(GEOJSON_URL)
    .then(res => res.json())
    .then(countries => {

        let lastClicked = null;
        let isAnimating = false;

        const world = Globe()
            (document.getElementById('globe-container'))
            .showAtmosphere(false)
            .polygonsData(countries.features)
            .polygonAltitude(0.01)
            .polygonCapColor(() => '#ffffff')
            .polygonSideColor(() => '#cccccc')
            .polygonStrokeColor(() => '#000')
            .polygonLabel(({ properties: d }) => `<div>${d.ADMIN}</div>`)

            .onPolygonHover(hoverD => {
                world
                    .polygonAltitude(d => d === hoverD ? 0.05 : 0.01)
                    .polygonCapColor(d => d === hoverD ? '#777777' : '#ffffff');
            })

            .onPolygonClick((polygon) => {
                if (isAnimating) return;

                const isSame = lastClicked === polygon;

                const { properties: d, geometry } = polygon;

                let lat, lng;

                if (d.LABEL_Y && d.LABEL_X) {
                    lat = d.LABEL_Y;
                    lng = d.LABEL_X;
                } else {
                    const coords = geometry.type === 'Polygon'
                        ? geometry.coordinates[0]
                        : geometry.coordinates[0][0];

                    const lats = coords.map(c => c[1]);
                    const lngs = coords.map(c => c[0]);

                    lat = (Math.min(...lats) + Math.max(...lats)) / 2;
                    lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                }

                const controls = world.controls();

                controls.enabled = false;
                isAnimating = true;

                // 🌍 If clicking SAME country → twitch effect
                if (isSame) {
                    world.pointOfView({ lat, lng, altitude: 0.8 }, 250);

                    setTimeout(() => {
                        world.pointOfView({ lat, lng, altitude: 1.2 }, 250);
                    }, 250);

                    setTimeout(() => {
                        world.pointOfView({ lat, lng, altitude: 1.0 }, 250);
                    }, 500);

                    setTimeout(() => {
                        controls.enabled = true;
                        isAnimating = false;
                    }, 800);

                    return;
                }

                // 🌍 Normal click behavior
                lastClicked = polygon;

                world.pointOfView({ lat, lng, altitude: 1.5 }, 1000);

                setTimeout(() => {
                    controls.enabled = true;
                    isAnimating = false;
                }, 1000);
            })
            .polygonsTransitionDuration(300);

        // 🌍 Globe setup
        world.globeMaterial().color.set('#2e86fa');
        world.pointOfView({ altitude: 2.5 });

        // 🎯 Controls
        const controls = world.controls();

        controls.minDistance = 120;
        controls.maxDistance = 400;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;

        // Reset view when clicking ocean
        world.onGlobeClick(() => {
            if (isAnimating) return;

            controls.enabled = false;
            isAnimating = true;

            world.pointOfView({ altitude: 2.5 }, 1000);

            setTimeout(() => {
                controls.enabled = true;
                isAnimating = false;
                lastClicked = null;
            }, 1000);
        });
    });