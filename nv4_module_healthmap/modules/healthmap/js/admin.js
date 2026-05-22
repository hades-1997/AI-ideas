/* ============================================
   Admin Panel – NukeViet Version
   ============================================ */

(function () {
    'use strict';

    // ───── State ─────
    let stations = [];
    let map = null;
    let mapMarkers = {};
    let clickMarker = null;
    let editingId = null;
    let searchTimeout = null;

    // NukeViet API endpoint
    const api_url = nv_base_adminurl + 'index.php?nv=' + module_name + '&op=api';

    // ───── DOM ─────
    const searchInput = document.getElementById('search-input');
    const btnSearch = document.getElementById('btn-search');
    const searchResults = document.getElementById('search-results');

    const form = document.getElementById('station-form');
    const fName = document.getElementById('f-name');
    const fAddress = document.getElementById('f-address');
    const fLat = document.getElementById('f-lat');
    const fLng = document.getElementById('f-lng');
    const fPhone = document.getElementById('f-phone');
    const fRating = document.getElementById('f-rating');
    const fReviews = document.getElementById('f-reviews');
    const fImage = document.getElementById('f-image');
    const fImageFile = document.getElementById('f-image-file');
    const btnImagePick = document.getElementById('btn-image-pick');
    const btnImageClear = document.getElementById('btn-image-clear');
    const fImagePreview = document.getElementById('f-image-preview');
    const fImagePreviewImg = document.getElementById('f-image-preview-img');
    const fImageUploading = document.getElementById('f-image-uploading');
    const fIsCenter = document.getElementById('f-isCenter');

    const btnAdd = document.getElementById('btn-add');
    const btnUpdate = document.getElementById('btn-update');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const btnClear = document.getElementById('btn-clear');
    const btnClearAll = document.getElementById('btn-clear-all');

    const savedListEl = document.getElementById('saved-list');
    const countBadge = document.getElementById('station-count-badge');
    const coordDisplay = document.getElementById('coord-display');
    const coordText = document.getElementById('coord-text');
    const crosshair = document.getElementById('map-crosshair');

    // ═══════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════
    async function init() {
        await loadStations();
        initMap();
        renderSavedList();
        renderMapMarkers();
        bindEvents();
        updateCount();
    }

    async function reloadData() {
        await loadStations();
        renderSavedList();
        renderMapMarkers();
        updateCount();
    }

    // ═══════════════════════════════════════════
    //  IMAGE URL / UPLOAD
    // ═══════════════════════════════════════════
    function imageDisplaySrc(path) {
        if (!path) return nv_base_siteurl + 'modules/' + module_name + '/images/placeholder.svg';
        if (/^https?:\/\//i.test(path)) return path;
        if (path.startsWith(nv_base_siteurl)) return path;
        if (path.indexOf('uploads/') === 0) {
            return nv_base_siteurl + path;
        }
        if (path.indexOf('images/') === 0) {
            return nv_base_siteurl + 'modules/' + module_name + '/' + path;
        }
        return nv_uploads_url + path.replace(/^\//, '');
    }

    function updateImagePreview() {
        const path = fImage.value.trim();
        if (!path) {
            fImagePreview.classList.add('hidden');
            btnImageClear.classList.add('hidden');
            fImagePreviewImg.removeAttribute('src');
            return;
        }
        fImagePreviewImg.src = imageDisplaySrc(path);
        fImagePreview.classList.remove('hidden');
        btnImageClear.classList.remove('hidden');
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('action', 'upload_image');
        formData.append('image', file);

        fImageUploading.classList.remove('hidden');

        try {
            const res = await fetch(api_url, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.status === 'success') {
                fImage.value = data.path;
                fImagePreviewImg.src = data.url || imageDisplaySrc(data.path);
                fImagePreview.classList.remove('hidden');
                btnImageClear.classList.remove('hidden');
                showToast('Đã tải ảnh lên', 'success');
            } else {
                showToast(data.msg || 'Lỗi tải ảnh', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng khi tải ảnh', 'error');
        } finally {
            fImageUploading.classList.add('hidden');
            fImageFile.value = '';
        }
    }

    // ═══════════════════════════════════════════
    //  API / DATA LOADING
    // ═══════════════════════════════════════════
    async function loadStations() {
        try {
            const formData = new FormData();
            formData.append('action', 'get_all');
            const res = await fetch(api_url, { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    stations = data;
                    return;
                }
            }
        } catch (e) {
            console.error(e);
            showToast('Lỗi tải dữ liệu', 'error');
        }
        stations = [];
    }

    function updateCount() {
        if (countBadge) countBadge.textContent = `${stations.length} trạm`;
    }

    // ═══════════════════════════════════════════
    //  MAP
    // ═══════════════════════════════════════════
    function initMap() {
        map = L.map('admin-map', { zoomControl: true, scrollWheelZoom: true })
            .setView([21.2090, 105.1880], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd', maxZoom: 19
        }).addTo(map);

        map.zoomControl.setPosition('bottomright');
        map.on('click', onMapClick);
        map.on('mousemove', onMapMouseMove);
        map.on('mouseout', () => crosshair.classList.add('hidden'));
    }

    function onMapClick(e) {
        const { lat, lng } = e.latlng;
        fLat.value = lat.toFixed(6);
        fLng.value = lng.toFixed(6);
        coordText.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        coordDisplay.classList.add('has-coords');

        if (clickMarker) {
            clickMarker.setLatLng(e.latlng);
        } else {
            const icon = L.divIcon({
                className: 'click-marker-icon',
                html: `<svg width="32" height="42" viewBox="0 0 32 42"><path d="M16 0C7.16 0 0 7.16 0 16c0 11.2 16 26 16 26s16-14.8 16-26C32 7.16 24.84 0 16 0z" fill="#dc2626" stroke="white" stroke-width="2.5"/><circle cx="16" cy="15" r="6.5" fill="white"/><circle cx="16" cy="15" r="3" fill="#dc2626"/></svg>`,
                iconSize: [32, 42], iconAnchor: [16, 42]
            });
            clickMarker = L.marker(e.latlng, { icon, draggable: true }).addTo(map);
            clickMarker.on('dragend', function () {
                const pos = clickMarker.getLatLng();
                fLat.value = pos.lat.toFixed(6);
                fLng.value = pos.lng.toFixed(6);
                coordText.textContent = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
            });
        }

        reverseGeocode(lat, lng);
        flashField(fLat); flashField(fLng);
    }

    function onMapMouseMove(e) {
        const rect = map.getContainer().getBoundingClientRect();
        crosshair.style.left = (e.originalEvent.clientX - rect.left) + 'px';
        crosshair.style.top = (e.originalEvent.clientY - rect.top) + 'px';
        crosshair.classList.remove('hidden');
    }

    function flashField(el) {
        el.style.borderColor = '#22a96e';
        setTimeout(() => { el.style.borderColor = ''; }, 1500);
    }

    // ═══════════════════════════════════════════
    //  GEOCODING (Nominatim – free, no key needed)
    // ═══════════════════════════════════════════
    async function reverseGeocode(lat, lng) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { 'Accept-Language': 'vi' } });
            const data = await res.json();
            if (data && data.display_name) {
                fAddress.value = data.display_name;
                flashField(fAddress);
            }
        } catch (e) {}
    }

    async function searchLocation(query) {
        if (!query || query.length < 2) { searchResults.classList.add('hidden'); return; }

        searchResults.innerHTML = '<div class="search-loading">Đang tìm kiếm...</div>';
        searchResults.classList.remove('hidden');

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=vn`, { headers: { 'Accept-Language': 'vi' } });
            const results = await res.json();

            if (results.length === 0) {
                searchResults.innerHTML = '<div class="search-empty">Không tìm thấy kết quả</div>';
                return;
            }

            searchResults.innerHTML = '';
            results.forEach(r => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div class="result-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                    <div class="result-text">
                        <div class="result-name">${r.display_name.split(',')[0]}</div>
                        <div class="result-detail">${r.display_name}</div>
                    </div>`;
                item.addEventListener('click', () => applySearchResult(r));
                searchResults.appendChild(item);
            });
        } catch (e) {
            searchResults.innerHTML = '<div class="search-empty">Lỗi kết nối. Vui lòng thử lại.</div>';
        }
    }

    function applySearchResult(r) {
        const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
        fLat.value = lat.toFixed(6);
        fLng.value = lng.toFixed(6);
        fAddress.value = r.display_name;
        if (!fName.value) fName.value = r.display_name.split(',')[0];

        map.flyTo([lat, lng], 16, { duration: 0.8 });

        if (clickMarker) {
            clickMarker.setLatLng([lat, lng]);
        } else {
            const icon = L.divIcon({
                className: 'click-marker-icon',
                html: `<svg width="32" height="42" viewBox="0 0 32 42"><path d="M16 0C7.16 0 0 7.16 0 16c0 11.2 16 26 16 26s16-14.8 16-26C32 7.16 24.84 0 16 0z" fill="#dc2626" stroke="white" stroke-width="2.5"/><circle cx="16" cy="15" r="6.5" fill="white"/><circle cx="16" cy="15" r="3" fill="#dc2626"/></svg>`,
                iconSize: [32, 42], iconAnchor: [16, 42]
            });
            clickMarker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
            clickMarker.on('dragend', function () {
                const pos = clickMarker.getLatLng();
                fLat.value = pos.lat.toFixed(6);
                fLng.value = pos.lng.toFixed(6);
            });
        }

        coordText.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        coordDisplay.classList.add('has-coords');
        searchResults.classList.add('hidden');
        searchInput.value = r.display_name.split(',')[0];
    }

    // ═══════════════════════════════════════════
    //  MAP MARKERS
    // ═══════════════════════════════════════════
    function renderMapMarkers() {
        Object.values(mapMarkers).forEach(m => map.removeLayer(m));
        mapMarkers = {};

        stations.forEach(station => {
            const color = station.isCenter ? '#dc2626' : '#2078c4';
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<svg width="28" height="36" viewBox="0 0 30 38"><path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.72 23.28 0 15 0z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/></svg>`,
                iconSize: [28, 36], iconAnchor: [14, 36]
            });

            const marker = L.marker([station.lat, station.lng], { icon })
                .addTo(map)
                .bindTooltip(station.name, { direction: 'top', offset: [0, -36] });
            mapMarkers[station.id] = marker;
        });
    }

    // ═══════════════════════════════════════════
    //  SAVED LIST
    // ═══════════════════════════════════════════
    function renderSavedList() {
        if (stations.length === 0) {
            savedListEl.innerHTML = '<div class="empty-state">Chưa có trạm nào. Hãy thêm trạm mới!</div>';
            return;
        }

        savedListEl.innerHTML = '';
        stations.forEach(s => {
            const item = document.createElement('div');
            item.className = 'saved-item';
            item.dataset.id = s.id;
            item.innerHTML = `
                <div class="saved-item__marker ${s.isCenter ? 'saved-item__marker--center' : 'saved-item__marker--point'}"></div>
                <div class="saved-item__info">
                    <div class="saved-item__name">${s.name}</div>
                    <div class="saved-item__coords">${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</div>
                </div>
                <div class="saved-item__actions">
                    <button class="btn-locate-item" title="Xem trên bản đồ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></button>
                    <button class="btn-edit-item" title="Sửa"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="btn-delete-item" title="Xóa"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>`;

            item.querySelector('.btn-locate-item').addEventListener('click', () => map.flyTo([s.lat, s.lng], 16, { duration: 0.8 }));
            item.querySelector('.btn-edit-item').addEventListener('click', () => startEditing(s.id));
            item.querySelector('.btn-delete-item').addEventListener('click', () => {
                if (confirm(`Bạn có chắc muốn xóa "${s.name}"?`)) deleteStation(s.id);
            });

            savedListEl.appendChild(item);
        });
    }

    // ═══════════════════════════════════════════
    //  CRUD
    // ═══════════════════════════════════════════
    async function addStation() {
        if (!fName.value || !fAddress.value || !fLat.value || !fLng.value) {
            showToast('Vui lòng điền đầy đủ thông tin bắt buộc (*)', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('name', fName.value.trim());
        formData.append('address', fAddress.value.trim());
        formData.append('phone', fPhone.value.trim());
        formData.append('lat', fLat.value);
        formData.append('lng', fLng.value);
        formData.append('image', fImage.value.trim() || '');
        formData.append('rating', fRating.value);
        formData.append('reviews', fReviews.value);
        formData.append('isCenter', fIsCenter.checked ? 1 : 0);

        try {
            const res = await fetch(api_url, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`✅ Đã thêm trạm`, 'success');
                clearForm();
                await reloadData(); // Reload and render
            } else {
                showToast(data.msg || 'Lỗi server', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng', 'error');
        }
    }

    function startEditing(id) {
        const station = stations.find(s => s.id === id);
        if (!station) return;

        editingId = id;
        fName.value = station.name;
        fAddress.value = station.address;
        fLat.value = station.lat;
        fLng.value = station.lng;
        fPhone.value = station.phone || '';
        fRating.value = station.rating || '';
        fReviews.value = station.reviews || '';
        fImage.value = station.image || '';
        if (station.image_src) {
            fImagePreviewImg.src = station.image_src;
            fImagePreview.classList.remove('hidden');
            btnImageClear.classList.remove('hidden');
        } else {
            updateImagePreview();
        }
        fIsCenter.checked = station.isCenter == 1;

        btnAdd.classList.add('hidden');
        btnUpdate.classList.remove('hidden');
        btnCancelEdit.classList.remove('hidden');

        map.flyTo([station.lat, station.lng], 15, { duration: 0.8 });
        document.getElementById('form-panel').scrollTo({ top: 0, behavior: 'smooth' });
        showToast(`📝 Đang sửa "${station.name}"`, 'info');
    }

    async function updateStation() {
        if (editingId === null) return;
        if (!fName.value || !fAddress.value || !fLat.value || !fLng.value) {
            showToast('Vui lòng điền đầy đủ thông tin bắt buộc (*)', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'update');
        formData.append('id', editingId);
        formData.append('name', fName.value.trim());
        formData.append('address', fAddress.value.trim());
        formData.append('phone', fPhone.value.trim());
        formData.append('lat', fLat.value);
        formData.append('lng', fLng.value);
        formData.append('image', fImage.value.trim() || '');
        formData.append('rating', fRating.value);
        formData.append('reviews', fReviews.value);
        formData.append('isCenter', fIsCenter.checked ? 1 : 0);

        try {
            const res = await fetch(api_url, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`✅ Đã cập nhật`, 'success');
                cancelEditing();
                await reloadData();
            } else {
                showToast(data.msg || 'Lỗi', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng', 'error');
        }
    }

    function cancelEditing() {
        editingId = null;
        btnAdd.classList.remove('hidden');
        btnUpdate.classList.add('hidden');
        btnCancelEdit.classList.add('hidden');
        clearForm();
    }

    async function deleteStation(id) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);
        try {
            const res = await fetch(api_url, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`🗑️ Đã xóa`, 'info');
                await reloadData();
            } else {
                showToast(data.msg || 'Lỗi', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng', 'error');
        }
    }

    function clearForm() {
        fName.value = '';
        fAddress.value = '';
        fLat.value = '';
        fLng.value = '';
        fPhone.value = '';
        fRating.value = '';
        fReviews.value = '';
        fImage.value = '';
        fImagePreview.classList.add('hidden');
        btnImageClear.classList.add('hidden');
        fImagePreviewImg.removeAttribute('src');
        fIsCenter.checked = false;
        if (clickMarker) { map.removeLayer(clickMarker); clickMarker = null; }
        coordText.textContent = 'Click vào bản đồ để lấy tọa độ';
        coordDisplay.classList.remove('has-coords');
    }

    async function clearAll() {
        if (!confirm('Bạn có chắc muốn XÓA TẤT CẢ trạm? Hành động này không thể hoàn tác.')) return;
        const formData = new FormData();
        formData.append('action', 'clear_all');
        try {
            const res = await fetch(api_url, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('🗑️ Đã xóa tất cả', 'info');
                await reloadData();
            } else {
                showToast('Lỗi', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng', 'error');
        }
    }

    // ═══════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════
    function bindEvents() {
        btnAdd.addEventListener('click', e => { e.preventDefault(); addStation(); });
        btnUpdate.addEventListener('click', updateStation);
        btnCancelEdit.addEventListener('click', cancelEditing);
        btnClear.addEventListener('click', () => { cancelEditing(); clearForm(); });
        if(btnClearAll) btnClearAll.addEventListener('click', clearAll);

        btnSearch.addEventListener('click', () => searchLocation(searchInput.value));
        searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchLocation(searchInput.value); } });
        searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => searchLocation(searchInput.value), 500); });

        document.addEventListener('click', e => {
            if (!searchResults.contains(e.target) && e.target !== searchInput && e.target !== btnSearch) {
                searchResults.classList.add('hidden');
            }
        });

        if (btnImagePick && fImageFile) {
            btnImagePick.addEventListener('click', () => fImageFile.click());
            fImageFile.addEventListener('change', () => {
                const file = fImageFile.files && fImageFile.files[0];
                if (file) uploadImage(file);
            });
        }
        if (btnImageClear) {
            btnImageClear.addEventListener('click', () => {
                fImage.value = '';
                fImageFile.value = '';
                updateImagePreview();
            });
        }
        if (fImage) {
            fImage.addEventListener('input', () => updateImagePreview());
            fImage.addEventListener('blur', () => updateImagePreview());
        }
    }

    // ═══════════════════════════════════════════
    //  TOAST
    // ═══════════════════════════════════════════
    function showToast(message, type = 'success') {
        const existing = document.querySelector('.admin-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = `admin-toast admin-toast--${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
    }

    // ═══════════════════════════════════════════
    //  BOOT
    // ═══════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', init);
})();
