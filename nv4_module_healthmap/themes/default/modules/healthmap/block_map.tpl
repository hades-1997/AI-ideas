<!-- BEGIN: main -->
<link rel="stylesheet" href="{NV_BASE_SITEURL}themes/{TEMPLATE}/modules/{MODULE_NAME}/libs/leaflet/leaflet.css" />
<link rel="stylesheet" href="{NV_BASE_SITEURL}themes/{TEMPLATE}/css/{MODULE_NAME}.css">
<style>
/* Fix: NukeViet theme sets img{max-width:100%} which breaks Leaflet tiles */
.leaflet-container img {
    max-width: none !important;
    max-height: none !important;
}
.leaflet-tile-pane {
    opacity: 1 !important;
}
</style>

<div id="hm-block-{BLOCK_ID}" class="hm-app-container hm-is-block" style="--hm-height: {MAP_HEIGHT}px;">
    <!-- ===== LEFT SIDEBAR ===== -->
    <aside class="hm-sidebar">
        <!-- Header -->
        <div class="hm-sidebar-header">
            <h2 class="hm-sidebar-title">Danh sách trạm</h2>
            <button id="hm-b-find-{BLOCK_ID}" type="button" class="hm-btn-find-nearest" title="Tìm trạm gần nhất theo vị trí của bạn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                <span>Tìm gần nhất</span>
            </button>
        </div>

        <!-- Dropdown Filter -->
        <div class="hm-dropdown-wrapper">
            <select id="hm-b-select-{BLOCK_ID}" class="hm-station-select" aria-label="Chọn trạm y tế">
                <option value="">-- Chọn trạm y tế --</option>
            </select>
            <svg class="dropdown-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </div>

        <!-- Station List -->
        <div id="hm-b-list-{BLOCK_ID}" class="hm-station-list" role="list" aria-label="Danh sách các trạm y tế">
            <!-- Cards rendered by JS -->
        </div>
    </aside>

    <!-- ===== MAP AREA ===== -->
    <main class="hm-map-area">
        <div id="hm-b-map-{BLOCK_ID}" class="hm-map" style="width:100%;height:100%" role="application" aria-label="Bản đồ các trạm y tế"></div>

        <!-- Info overlay card -->
        <div id="hm-b-info-{BLOCK_ID}" class="info-card hidden" aria-live="polite">
            <div>
                <div class="info-card-header">
                    <h2 id="hm-b-info-name-{BLOCK_ID}"></h2>
                    <div class="info-card-actions">
                        <a id="hm-b-info-ext-{BLOCK_ID}" href="#" target="_blank" rel="noopener noreferrer"
                           title="Xem trên Google Maps" class="info-action-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                        <a id="hm-b-info-dir-{BLOCK_ID}" href="#" target="_blank" rel="noopener noreferrer"
                           title="Chỉ đường" class="info-action-btn info-action-btn--primary hm-info-link-directions">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                            </svg>
                        </a>
                    </div>
                </div>
                <p id="hm-b-info-addr-{BLOCK_ID}" class="info-address"></p>
                <div id="hm-b-info-rating-{BLOCK_ID}" class="info-rating"></div>
            </div>
        </div>
    </main>
</div>

<script>
if (typeof L === 'undefined') {
    document.write('<scr' + 'ipt src="{NV_BASE_SITEURL}themes/{TEMPLATE}/modules/{MODULE_NAME}/libs/leaflet/leaflet.js"><\/scr' + 'ipt>');
}
</script>
<script>
(function() {
    'use strict';

    var BID = '{BLOCK_ID}';
    var stations = {STATIONS_JSON};
    var container = document.getElementById('hm-block-' + BID);

    // DOM
    var stationListEl   = document.getElementById('hm-b-list-' + BID);
    var stationSelectEl = document.getElementById('hm-b-select-' + BID);
    var btnFindNearest  = document.getElementById('hm-b-find-' + BID);
    var infoCard        = document.getElementById('hm-b-info-' + BID);
    var infoName        = document.getElementById('hm-b-info-name-' + BID);
    var infoAddress     = document.getElementById('hm-b-info-addr-' + BID);
    var infoRating      = document.getElementById('hm-b-info-rating-' + BID);
    var infoLinkExt     = document.getElementById('hm-b-info-ext-' + BID);
    var infoLinkDir     = document.getElementById('hm-b-info-dir-' + BID);

    var map = null;
    var markers = {};
    var activeStationId = null;

    // SVG
    function markerSVG(color) {
        return '<svg viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.72 23.28 0 15 0z" fill="' + color + '" stroke="white" stroke-width="2"/>' +
            '<circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/></svg>';
    }

    var phoneSVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 22 16.92z"></path></svg>';
    var navSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>';

    // Stars
    function generateStars(rating) {
        var full = Math.floor(rating);
        var half = (rating % 1 >= 0.3) ? 1 : 0;
        var empty = 5 - full - half;
        var s = '';
        for (var i = 0; i < full; i++) s += '\u2605';
        if (half) s += '\u00BD';
        for (var j = 0; j < empty; j++) s += '\u2606';
        return s;
    }

    // Init
    function init() {
        if (!container || typeof L === 'undefined') return;
        initMap();
        renderStationList();
        populateDropdown();
        addMarkers();
        bindEvents();
        if (stations.length > 0) selectStation(stations[0].id);
    }

    function initMap() {
        var center = [21.2090, 105.1880];
        if (stations.length > 0) center = [stations[0].lat, stations[0].lng];

        map = L.map('hm-b-map-' + BID, {
            zoomControl: true,
            scrollWheelZoom: true,
            attributionControl: true
        }).setView(center, 13);

        // Build tile URL safely: XTemplate replaces {s},{z},{x},{y} as variables
        // Use String.fromCharCode(123)='{' and (125)='}' to escape them
        var lb = String.fromCharCode(123), rb = String.fromCharCode(125);
        var tileUrl = 'https://' + lb + 's' + rb + '.basemaps.cartocdn.com/rastertiles/voyager/'
            + lb + 'z' + rb + '/' + lb + 'x' + rb + '/' + lb + 'y' + rb + lb + 'r' + rb + '.png';

        L.tileLayer(tileUrl, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        map.zoomControl.setPosition('topright');

        // Force Leaflet to recalculate tile positions after layout is ready
        setTimeout(function() {
            map.invalidateSize();
        }, 200);
    }

    function renderStationList() {
        stationListEl.innerHTML = '';
        for (var i = 0; i < stations.length; i++) {
            (function(station) {
                var card = document.createElement('div');
                card.className = 'station-card';
                card.setAttribute('data-station-id', station.id);
                card.setAttribute('role', 'listitem');
                card.setAttribute('tabindex', '0');
                card.setAttribute('aria-label', station.name);

                var phoneBtn = station.phone
                    ? '<a href="tel:' + station.phone.replace(/\./g, '') + '" class="btn-phone" onclick="event.stopPropagation();" title="Gọi ' + station.phone + '">' + phoneSVG + ' ' + station.phone + '</a>'
                    : '<span class="btn-phone btn-phone--disabled" title="Chưa có số điện thoại">' + phoneSVG + ' Chưa có</span>';

                var dirUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + station.lat + ',' + station.lng;

                card.innerHTML =
                    '<img src="' + (station.image || '') + '" alt="' + station.name + '" class="station-card__img" loading="lazy" />' +
                    '<div class="station-card__body">' +
                        '<div class="station-card__name">' + station.name + '</div>' +
                        '<div class="station-card__address">' + station.address + '</div>' +
                        '<div class="station-card__actions">' +
                            phoneBtn +
                            '<a href="' + dirUrl + '" target="_blank" rel="noopener noreferrer" class="btn-directions" onclick="event.stopPropagation();" title="Chỉ đường trên Google Maps">' + navSVG + ' Chỉ đường</a>' +
                        '</div>' +
                    '</div>';

                card.addEventListener('click', function() { selectStation(station.id); });
                card.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectStation(station.id); }
                });

                stationListEl.appendChild(card);
            })(stations[i]);
        }
    }

    function populateDropdown() {
        for (var i = 0; i < stations.length; i++) {
            var opt = document.createElement('option');
            opt.value = stations[i].id;
            opt.textContent = stations[i].name;
            stationSelectEl.appendChild(opt);
        }
    }

    function addMarkers() {
        for (var i = 0; i < stations.length; i++) {
            (function(station) {
                var color = station.isCenter ? '#dc2626' : '#2078c4';
                var icon = L.divIcon({
                    className: 'custom-marker',
                    html: '<div class="marker-pin" data-station-id="' + station.id + '">' + markerSVG(color) + '</div>',
                    iconSize: [30, 38],
                    iconAnchor: [15, 38],
                    popupAnchor: [0, -40]
                });

                var marker = L.marker([station.lat, station.lng], { icon: icon })
                    .addTo(map)
                    .on('click', function() { selectStation(station.id); });

                markers[station.id] = marker;
            })(stations[i]);
        }
    }

    function selectStation(stationId) {
        var station = null;
        for (var i = 0; i < stations.length; i++) {
            if (stations[i].id == stationId) { station = stations[i]; break; }
        }
        if (!station) return;

        activeStationId = stationId;

        // Update card active state (scoped to this block)
        var cards = container.querySelectorAll('.station-card');
        for (var j = 0; j < cards.length; j++) {
            var cid = cards[j].getAttribute('data-station-id');
            if (cid == stationId) {
                cards[j].classList.add('active');
                cards[j].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                cards[j].classList.remove('active');
            }
        }

        // Update dropdown
        stationSelectEl.value = stationId;

        // Pan map
        map.flyTo([station.lat, station.lng], 15, { duration: 0.8, easeLinearity: 0.5 });

        // Update marker styles
        var allPins = container.querySelectorAll('.marker-pin');
        for (var k = 0; k < allPins.length; k++) {
            allPins[k].classList.remove('marker-pin--active');
            var pulse = allPins[k].querySelector('.marker-pulse');
            if (pulse) pulse.remove();
        }

        var activePin = container.querySelector('.marker-pin[data-station-id="' + stationId + '"]');
        if (activePin) {
            activePin.classList.add('marker-pin--active');
            var pulseEl = document.createElement('div');
            pulseEl.className = 'marker-pulse';
            activePin.appendChild(pulseEl);
        }

        // Update info card
        updateInfoCard(station);
    }

    function updateInfoCard(station) {
        infoName.textContent = station.name;
        infoAddress.textContent = station.address;

        var starsHtml = generateStars(station.rating);
        infoRating.innerHTML =
            '<span class="rating-score">' + station.rating.toFixed(1) + '</span>' +
            '<span class="rating-stars">' + starsHtml + '</span>' +
            '<span class="rating-count">(' + (station.reviews || 0) + ')</span>' +
            '<svg class="rating-info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

        var gmapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + station.lat + ',' + station.lng;
        var dirUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + station.lat + ',' + station.lng;
        infoLinkExt.href = gmapsUrl;
        infoLinkDir.href = dirUrl;

        infoCard.classList.remove('hidden');
        infoCard.style.animation = 'none';
        void infoCard.offsetHeight;
        infoCard.style.animation = 'slideInCard 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    }

    function bindEvents() {
        stationSelectEl.addEventListener('change', function(e) {
            var val = parseInt(e.target.value, 10);
            if (val) selectStation(val);
        });

        btnFindNearest.addEventListener('click', findNearest);
    }

    function findNearest() {
        if (!navigator.geolocation) {
            showToast('Trình duyệt không hỗ trợ định vị', 'error');
            return;
        }

        var origHTML = btnFindNearest.innerHTML;
        btnFindNearest.disabled = true;
        btnFindNearest.innerHTML = '<span class="loading-spinner"></span> Đang tìm...';

        navigator.geolocation.getCurrentPosition(
            function(pos) {
                var uLat = pos.coords.latitude;
                var uLng = pos.coords.longitude;
                var nearest = null;
                var minDist = Infinity;

                for (var i = 0; i < stations.length; i++) {
                    var d = haversine(uLat, uLng, stations[i].lat, stations[i].lng);
                    if (d < minDist) { minDist = d; nearest = stations[i]; }
                }

                if (nearest) {
                    selectStation(nearest.id);
                    var distText = minDist < 1
                        ? Math.round(minDist * 1000) + 'm'
                        : minDist.toFixed(1) + 'km';
                    showToast('\uD83D\uDCCD ' + nearest.name + ' \u2014 cách ' + distText, 'success');
                }

                btnFindNearest.disabled = false;
                btnFindNearest.innerHTML = origHTML;
            },
            function(err) {
                var msg = 'Không thể xác định vị trí';
                if (err.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí';
                else if (err.code === 2) msg = 'Vị trí không khả dụng';
                else if (err.code === 3) msg = 'Hết thời gian chờ định vị';
                showToast(msg, 'error');
                btnFindNearest.disabled = false;
                btnFindNearest.innerHTML = origHTML;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }

    function haversine(lat1, lng1, lat2, lng2) {
        var R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function showToast(message, type) {
        var existing = document.querySelector('.geo-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'geo-toast geo-toast--' + (type || 'success');
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { toast.classList.add('show'); });
        });
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 400);
        }, 4000);
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
</script>
<!-- END: main -->
