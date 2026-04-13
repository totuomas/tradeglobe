const GEOJSON_URL =
  'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

fetch(GEOJSON_URL)
  .then(res => res.json())
  .then(countries => {

    let lastClicked = null;
    let isAnimating = false;
    let tradePartners = {};

    const countryNameEl = document.getElementById("country-name");
    const partnerListEl = document.getElementById("partner-list");

    const world = Globe()(document.getElementById('globe-container'))
      .showAtmosphere(false)
      .polygonsData(countries.features)
      .polygonAltitude(0.01)

      // 🎨 Color logic
      .polygonCapColor(d => {
        const iso = d.properties.ISO_A3;

        // 🟢 selected country
        if (iso === lastClicked?.properties?.ISO_A3) {
          return '#00cc66';
        }

        // 🔴 trade partners (with better scaling)
        if (tradePartners[iso] !== undefined) {
          const p = tradePartners[iso];

          // sqrt scaling + minimum visibility
          const intensity = Math.max(0.08, Math.min(1, Math.sqrt(p / 20)));

          const red = 255;
          const gb = Math.floor(255 * (1 - intensity));

          return `rgb(${red}, ${gb}, ${gb})`;
        }

        // ⚪ default
        return '#e5e7eb';
      })

      .polygonSideColor(() => '#888')
      .polygonStrokeColor(() => '#111')

      // 🏷️ Tooltip
      .polygonLabel(({ properties: d }) => {
        const iso = d.ISO_A3;

        if (tradePartners[iso] !== undefined) {
          return `
            <div>
              <b>${d.ADMIN}</b><br/>
              ${tradePartners[iso].toFixed(2)}% of exports
            </div>
          `;
        }

        return `<div>${d.ADMIN}</div>`;
      })

      // hover effect
      .onPolygonHover(hoverD => {
        world.polygonAltitude(d =>
          d === hoverD ? 0.05 :
          d === lastClicked ? 0.08 :
          0.01
        );
      })

      // 🖱️ click
      .onPolygonClick((polygon) => {
        if (isAnimating) return;

        const isSame = lastClicked === polygon;
        const iso = polygon.properties.ISO_A3;

        // 📡 fetch trade data
        fetch(`http://localhost:3000/trade-partners?country=${iso}`)
          .then(res => res.json())
          .then(data => {

            tradePartners = {};

            data.forEach(p => {
              if (p.value > 0.05) {
                tradePartners[p.country] = p.value;
              }
            });

            // 📊 update side panel
            countryNameEl.textContent = polygon.properties.ADMIN;
            partnerListEl.innerHTML = "";

            data.slice(0, 10).forEach(p => {
              const li = document.createElement("li");
              li.textContent = `${p.country} — ${p.value.toFixed(2)}%`;
              partnerListEl.appendChild(li);
            });

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

      .polygonsTransitionDuration(600);

    // 🌍 globe style
    world.globeMaterial().color.set('#0b1e2d');
    world.globeMaterial().emissive.set('#112244');
    world.globeMaterial().emissiveIntensity = 0.2;

    world.pointOfView({ altitude: 2.5 });

    const controls = world.controls();
    controls.minDistance = 120;
    controls.maxDistance = 400;
    controls.enableDamping = true;

    // 🔄 reset
    world.onGlobeClick(() => {
      tradePartners = {};
      lastClicked = null;

      document.getElementById("country-name").textContent = "Select a country";
      document.getElementById("partner-list").innerHTML = "";

      world.polygonsData(countries.features);
      world.pointOfView({ altitude: 2.5 }, 1000);
    });

  });