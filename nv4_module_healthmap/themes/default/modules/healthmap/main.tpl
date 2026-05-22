<!-- BEGIN: main -->
<link rel="stylesheet" href="{NV_BASE_SITEURL}themes/{TEMPLATE}/modules/{MODULE_NAME}/libs/leaflet/leaflet.css" />
<link rel="stylesheet" href="{NV_BASE_SITEURL}themes/{TEMPLATE}/css/{MODULE_NAME}.css">

<div id="app-container" class="hm-app-container">
    <!-- ===== LEFT SIDEBAR ===== -->
    <aside id="sidebar" class="hm-sidebar">
        <!-- Header -->
        <div id="sidebar-header" class="hm-sidebar-header">
            <h1 id="sidebar-title" class="hm-sidebar-title">Danh sách trạm</h1>
            <button id="btn-find-nearest" type="button" class="hm-btn-find-nearest" title="Tìm trạm gần nhất theo vị trí của bạn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                <span> Tìm gần nhất</span>
            </button>
        </div>

        <!-- Dropdown Filter -->
        <div id="dropdown-wrapper" class="hm-dropdown-wrapper">
            <select id="station-select" class="hm-station-select" aria-label="Chọn trạm y tế">
                <option value="">-- Chọn trạm y tế --</option>
            </select>
            <svg class="dropdown-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </div>

        <!-- Station List -->
        <div id="station-list" class="hm-station-list" role="list" aria-label="Danh sách các trạm y tế">
            <!-- Cards rendered by JS -->
        </div>
    </aside>

    <!-- ===== MAP AREA ===== -->
    <main id="map-area" class="hm-map-area">
        <div id="map" class="hm-map" role="application" aria-label="Bản đồ các trạm y tế"></div>

        <!-- Info overlay card -->
        <div id="info-card" class="info-card hidden" aria-live="polite">
            <div id="info-card-content">
                <div class="info-card-header">
                    <h2 id="info-name">Trung Tâm Y Tế Thanh Sơn</h2>
                    <div class="info-card-actions">
                        <a id="info-link-external" href="#" target="_blank" rel="noopener noreferrer"
                           title="Xem trên Google Maps" class="info-action-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                        <a id="info-link-directions" href="#" target="_blank" rel="noopener noreferrer"
                           title="Chỉ đường" class="info-action-btn info-action-btn--primary hm-info-link-directions">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                            </svg>
                        </a>
                    </div>
                </div>
                <p id="info-address" class="info-address">659H+FXQ, QL32, Thanh Sơn, Phú Thọ</p>
                <div id="info-rating" class="info-rating">
                    <span class="rating-score">3.6</span>
                    <span class="rating-stars">★</span>
                    <span class="rating-count">(46)</span>
                    <svg class="rating-info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>
            </div>
        </div>
    </main>
</div>

<script>
    var nv_base_siteurl = '{NV_BASE_SITEURL}';
    var nv_uploads_url = '{UPLOADS_URL}';
    var healthmap_api_url = '{API_URL}';
    var module_name = '{MODULE_NAME}';
</script>
<script src="{NV_BASE_SITEURL}themes/{TEMPLATE}/modules/{MODULE_NAME}/libs/leaflet/leaflet.js" ></script>
<script src="{NV_BASE_SITEURL}modules/{MODULE_NAME}/js/map.js"></script>
<!-- END: main -->
