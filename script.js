const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

fetch(GEOJSON_URL)
    .then(res => res.json())
    .then(countries => {

        let lastClicked = null;
        let isAnimating = false;
        let tradePartners = {};

        const world = Globe()
            (document.getElementById('globe-container'))
            .showAtmosphere(false)
            .polygonsData(countries.features)
            .polygonAltitude(0.01)

            // 🎨 Colors
            .polygonCapColor(d => {
                const iso = d.properties.ISO_A3;

                if (iso === lastClicked?.properties?.ISO_A3) {
                    return '#4d79ff'; // clicked country
                }

                if (tradePartners[iso]) {
                    return '#ff4d4d'; // partners
                }

                return '#ffffff';
            })

            .polygonSideColor(() => '#cccccc')
            .polygonStrokeColor(() => '#000')
            .polygonLabel(({ properties: d }) => `<div>${d.ADMIN}</div>`)

            .onPolygonHover(hoverD => {
                world.polygonAltitude(d => d === hoverD ? 0.05 : 0.01);
            })

            .onPolygonClick((polygon) => {
                if (isAnimating) return;

                const isSame = lastClicked === polygon;
                const iso = polygon.properties.ISO_A3;

                console.log("Clicked:", iso);

                // 🔥 Fetch partners
                fetch(`http://localhost:3000/trade-partners?country=${iso}`)
                    .then(res => res.json())
                    .then(data => {
                        if (!Array.isArray(data)) {
                            console.warn("Invalid data:", data);
                            tradePartners = {};
                            world.polygonsData(countries.features);
                            return;
                        }

                        tradePartners = {};

                        data.forEach(p => {
                            tradePartners[p.country] = p.value;
                        });

                        console.log("Partners:", tradePartners);

                        world.polygonsData(countries.features);
                    })
                    .catch(err => console.error(err));

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

                if (isSame) {
                    world.pointOfView({ lat, lng, altitude: 1.0 }, 500);
                    setTimeout(() => {
                        controls.enabled = true;
                        isAnimating = false;
                    }, 500);
                    return;
                }

                lastClicked = polygon;

                world.pointOfView({ lat, lng, altitude: 1.5 }, 1000);

                setTimeout(() => {
                    controls.enabled = true;
                    isAnimating = false;
                }, 1000);
            })
            .polygonsTransitionDuration(300);

        // Globe style
        world.globeMaterial().color.set('#2e86fa');
        world.pointOfView({ altitude: 2.5 });

        const controls = world.controls();
        controls.minDistance = 120;
        controls.maxDistance = 400;
        controls.enableDamping = true;

        // Reset
        world.onGlobeClick(() => {
            tradePartners = {};
            lastClicked = null;
            world.polygonsData(countries.features);
            world.pointOfView({ altitude: 2.5 }, 1000);
        });
    });