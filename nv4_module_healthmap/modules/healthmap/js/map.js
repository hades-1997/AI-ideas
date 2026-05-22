/* ============================================
   Health Station Map – Main Application Logic
   ============================================ */

(function () {
    'use strict';

    const STORAGE_KEY = 'healthmap_stations';

    // ───── Default Station Data (fallback if localStorage is empty) ─────
    const DEFAULT_STATIONS = [
        {
            id: 1,
            name: 'Trung Tâm Y Tế Thanh Sơn',
            address: '659H+FXQ, QL32, Thanh Sơn, Phú Thọ, Việt Nam',
            phone: '1800.888.668',
            lat: 21.20917,
            lng: 105.18806,
            image: 'images/station3.png',
            rating: 3.6,
            reviews: 46,
            isCenter: true
        },
        {
            id: 2,
            name: 'Điểm y tế Sơn Hùng',
            address: 'Khu Đồng Lão, xã Sơn Hùng, huyện Thanh Sơn, tỉnh Phú Thọ',
            phone: '0966.093.368',
            lat: 21.2155,
            lng: 105.2010,
            image: 'images/station1.png',
            rating: 4.0,
            reviews: 12,
            isCenter: false
        },
        {
            id: 3,
            name: 'Điểm y tế Giáp Lai',
            address: 'Khu 5, xã Thanh Sơn, tỉnh Phú Thọ',
            phone: '0936.937.147',
            lat: 21.2250,
            lng: 105.1755,
            image: 'images/station2.png',
            rating: 3.8,
            reviews: 8,
            isCenter: false
        },
        {
            id: 4,
            name: 'Điểm y tế Thạch Khoán',
            address: 'Khu Cầu, xã Thanh Sơn, tỉnh Phú Thọ',
            phone: null,
            lat: 21.2340,
            lng: 105.2100,
            image: 'images/station4.png',
            rating: 3.5,
            reviews: 5,
            isCenter: false
        },
        {
            id: 5,
            name: 'Điểm y tế Thục Luyện',
            address: 'Khu Đồng Lão, xã Thanh Sơn, tỉnh Phú Thọ',
            phone: '0963.760.055',
            lat: 21.1960,
            lng: 105.1660,
            image: 'images/station5.png',
            rating: 4.2,
            reviews: 15,
            isCenter: false
        }
    ];

    // ───── Resolve image URL (fallback khi API/static dùng path tương đối) ─────
    function resolveImageUrl(path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
        if (path.startsWith(nv_base_siteurl)) return path;
        if (path.indexOf('images/') === 0) {
            return nv_base_siteurl + 'modules/' + module_name + '/' + path;
        }
        if (path.indexOf('uploads/') === 0) {
            return nv_base_siteurl + path;
        }
        return (typeof nv_uploads_url !== 'undefined' ? nv_uploads_url : nv_base_siteurl + 'uploads/' + module_name + '/') + path.replace(/^\//, '');
    }

    function normalizeStationImages(list) {
        return list.map(s => ({
            ...s,
            image: resolveImageUrl(s.image || '')
        }));
    }

    // ───── Load stations from NukeViet API ─────
    async function loadStations() {
        const api_url = (typeof healthmap_api_url !== 'undefined' && healthmap_api_url)
            ? healthmap_api_url
            : nv_base_siteurl + 'index.php?language=vi&nv=' + module_name + '&op=api';

        try {
            const res = await fetch(api_url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    return normalizeStationImages(data);
                }
            }
        } catch (e) {
            console.error('Fetch error:', e);
        }

        return normalizeStationImages(DEFAULT_STATIONS);
    }

    let stations = [];



    // ───── State ─────
    let map = null;
    let markers = {};
    let activeStationId = null;

    // ───── DOM References ─────
    const stationListEl = document.getElementById('station-list');
    const stationSelectEl = document.getElementById('station-select');
    const btnFindNearest = document.getElementById('btn-find-nearest');
    const infoCard = document.getElementById('info-card');
    const infoName = document.getElementById('info-name');
    const infoAddress = document.getElementById('info-address');
    const infoRating = document.getElementById('info-rating');
    const infoLinkExternal = document.getElementById('info-link-external');
    const infoLinkDirections = document.getElementById('info-link-directions');

    // ───── SVG Templates ─────
    function markerSVG(color) {
        return `<svg viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.72 23.28 0 15 0z"
                  fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/>
        </svg>`;
    }

    const phoneSVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 22 16.92z"></path>
    </svg>`;

    const navSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
    </svg>`;

    // ───── Initialize ─────
    async function init() {
        stations = await loadStations();
        initMap();
        renderStationList();
        populateDropdown();
        addMarkers();
        bindEvents();

        // Select first station by default
        if (stations.length > 0) {
            selectStation(stations[0].id);
        }
    }

    // ───── Map Init ─────
    function initMap() {
        map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: true,
            attributionControl: true
        }).setView([21.2090, 105.1880], 13);

        // CartoDB Voyager – Clean, modern look
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Move zoom control to top right
        map.zoomControl.setPosition('topright');
    }

    // ───── Render Station Cards ─────
    function renderStationList() {
        stationListEl.innerHTML = '';

        stations.forEach(station => {
            const card = document.createElement('div');
            card.className = 'station-card';
            card.dataset.stationId = station.id;
            card.setAttribute('role', 'listitem');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', station.name);

            const phoneBtn = station.phone
                ? `<a href="tel:${station.phone.replace(/\./g, '')}" class="btn-phone" onclick="event.stopPropagation();" title="Gọi ${station.phone}">
                       ${phoneSVG} ${station.phone}
                   </a>`
                : `<span class="btn-phone btn-phone--disabled" title="Chưa có số điện thoại">
                       ${phoneSVG} Chưa có
                   </span>`;

            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;

            card.innerHTML = `
                <img src="${station.image}" alt="${station.name}" class="station-card__img" loading="lazy" />
                <div class="station-card__body">
                    <div class="station-card__name">${station.name}</div>
                    <div class="station-card__address">${station.address}</div>
                    <div class="station-card__actions">
                        ${phoneBtn}
                        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
                           class="btn-directions" onclick="event.stopPropagation();" title="Chỉ đường trên Google Maps">
                            ${navSVG} Chỉ đường
                        </a>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => selectStation(station.id));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectStation(station.id);
                }
            });

            stationListEl.appendChild(card);
        });
    }

    // ───── Populate Dropdown ─────
    function populateDropdown() {
        stations.forEach(station => {
            const opt = document.createElement('option');
            opt.value = station.id;
            opt.textContent = station.name;
            stationSelectEl.appendChild(opt);
        });
    }

    // ───── Add Map Markers ─────
    function addMarkers() {
        stations.forEach(station => {
            const color = station.isCenter ? '#dc2626' : '#2078c4';

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-pin" data-station-id="${station.id}">
                           ${markerSVG(color)}
                       </div>`,
                iconSize: [30, 38],
                iconAnchor: [15, 38],
                popupAnchor: [0, -40]
            });

            const marker = L.marker([station.lat, station.lng], { icon: icon })
                .addTo(map)
                .on('click', () => selectStation(station.id));

            markers[station.id] = marker;
        });
    }

    // ───── Select Station ─────
    function selectStation(stationId) {
        const station = stations.find(s => s.id === stationId);
        if (!station) return;

        activeStationId = stationId;

        // 1. Update card active state
        document.querySelectorAll('.station-card').forEach(card => {
            const id = parseInt(card.dataset.stationId, 10);
            card.classList.toggle('active', id === stationId);

            if (id === stationId) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        // 2. Update dropdown
        stationSelectEl.value = stationId;

        // 3. Pan map
        map.flyTo([station.lat, station.lng], 15, {
            duration: 0.8,
            easeLinearity: 0.5
        });

        // 4. Update marker styles (bounce active)
        Object.keys(markers).forEach(id => {
            const el = document.querySelector(`.marker-pin[data-station-id="${id}"]`);
            if (el) {
                el.classList.remove('marker-pin--active');
                // Remove existing pulse
                const existingPulse = el.querySelector('.marker-pulse');
                if (existingPulse) existingPulse.remove();
            }
        });

        const activePin = document.querySelector(`.marker-pin[data-station-id="${stationId}"]`);
        if (activePin) {
            activePin.classList.add('marker-pin--active');
            // Add pulse ring
            const pulse = document.createElement('div');
            pulse.className = 'marker-pulse';
            activePin.appendChild(pulse);
        }

        // 5. Update info card
        updateInfoCard(station);
    }

    // ───── Update Info Card ─────
    function updateInfoCard(station) {
        infoName.textContent = station.name;
        infoAddress.textContent = station.address;

        // Rating
        const starsHtml = generateStars(station.rating);
        infoRating.innerHTML = `
            <span class="rating-score">${station.rating.toFixed(1)}</span>
            <span class="rating-stars">${starsHtml}</span>
            <span class="rating-count">(${station.reviews})</span>
            <svg class="rating-info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;

        // Links
        const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
        infoLinkExternal.href = gmapsUrl;
        infoLinkDirections.href = directionsUrl;

        // Show card with animation
        infoCard.classList.remove('hidden');
        infoCard.style.animation = 'none';
        // Trigger reflow to restart animation
        void infoCard.offsetHeight;
        infoCard.style.animation = 'slideInCard 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    }

    // ───── Stars Helper ─────
    function generateStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.3 ? 1 : 0;
        const empty = 5 - full - half;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    }

    // ───── Bind Events ─────
    function bindEvents() {
        // Dropdown change
        stationSelectEl.addEventListener('change', (e) => {
            const val = parseInt(e.target.value, 10);
            if (val) selectStation(val);
        });

        // Find nearest
        btnFindNearest.addEventListener('click', findNearest);
    }

    // ───── Find Nearest Station ─────
    function findNearest() {
        if (!navigator.geolocation) {
            showToast('Trình duyệt không hỗ trợ định vị', 'error');
            return;
        }

        // Show loading state
        const originalHTML = btnFindNearest.innerHTML;
        btnFindNearest.disabled = true;
        btnFindNearest.innerHTML = `<span class="loading-spinner"></span> Đang tìm...`;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Calculate distances
                let nearest = null;
                let minDist = Infinity;

                stations.forEach(station => {
                    const dist = haversineDistance(userLat, userLng, station.lat, station.lng);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = station;
                    }
                });

                if (nearest) {
                    selectStation(nearest.id);
                    const distText = minDist < 1
                        ? `${Math.round(minDist * 1000)}m`
                        : `${minDist.toFixed(1)}km`;
                    showToast(`📍 ${nearest.name} — cách ${distText}`, 'success');
                }

                // Reset button
                btnFindNearest.disabled = false;
                btnFindNearest.innerHTML = originalHTML;
            },
            (error) => {
                let msg = 'Không thể xác định vị trí';
                if (error.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí';
                else if (error.code === 2) msg = 'Vị trí không khả dụng';
                else if (error.code === 3) msg = 'Hết thời gian chờ định vị';

                showToast(msg, 'error');
                btnFindNearest.disabled = false;
                btnFindNearest.innerHTML = originalHTML;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    // ───── Haversine Distance (km) ─────
    function haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(deg) {
        return deg * (Math.PI / 180);
    }

    // ───── Toast Notification ─────
    function showToast(message, type = 'success') {
        // Remove existing
        const existing = document.querySelector('.geo-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `geo-toast geo-toast--${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // ───── Boot ─────
    document.addEventListener('DOMContentLoaded', init);
})();
