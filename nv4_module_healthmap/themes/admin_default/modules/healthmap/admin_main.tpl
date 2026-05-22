<!-- BEGIN: main -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<link rel="stylesheet" href="{NV_BASE_SITEURL}themes/{TEMPLATE}/css/{MODULE_NAME}.css">

<div id="admin-container">
    <!-- ===== LEFT: Form Panel ===== -->
    <aside id="form-panel">
        <!-- Search Box -->
        <div class="panel-section">
            <label class="section-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Tìm kiếm địa điểm
            </label>
            <div class="search-box">
                <input type="text" id="search-input" placeholder="VD: Trạm y tế Giáp Lai, Thanh Sơn..." autocomplete="off" />
                <button id="btn-search" type="button" title="Tìm kiếm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </div>
            <div id="search-results" class="search-results hidden"></div>
            <p class="hint-text">💡 Hoặc <strong>click vào bản đồ</strong> để lấy tọa độ tự động</p>
        </div>

        <hr class="divider" />

        <!-- Add/Edit Form -->
        <div id="station-form" class="station-form-wrapper">
            <div class="panel-section">
                <label class="section-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Thông tin trạm y tế
                </label>

                <div class="form-group">
                    <label for="f-name">Tên trạm <span class="required">*</span></label>
                    <input type="text" id="f-name" placeholder="VD: Điểm y tế Giáp Lai" required />
                </div>

                <div class="form-group">
                    <label for="f-address">Địa chỉ <span class="required">*</span></label>
                    <input type="text" id="f-address" placeholder="VD: Khu 5, xã Giáp Lai, huyện Thanh Sơn" required />
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="f-lat">Vĩ độ (Lat) <span class="required">*</span></label>
                        <input type="number" id="f-lat" step="any" placeholder="21.2250" required />
                    </div>
                    <div class="form-group">
                        <label for="f-lng">Kinh độ (Lng) <span class="required">*</span></label>
                        <input type="number" id="f-lng" step="any" placeholder="105.1755" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="f-phone">Số điện thoại</label>
                        <input type="text" id="f-phone" placeholder="VD: 0936.937.147" />
                    </div>
                    <div class="form-group">
                        <label for="f-rating">Đánh giá</label>
                        <input type="number" id="f-rating" step="0.1" min="0" max="5" placeholder="4.0" />
                    </div>
                </div>

                <div class="form-group">
                    <label for="f-reviews">Số lượt đánh giá</label>
                    <input type="number" id="f-reviews" min="0" placeholder="10" />
                </div>

                <div class="form-group form-group--image">
                    <label>Ảnh trạm</label>
                    <div class="image-field">
                        <input type="text" id="f-image" placeholder="Chọn ảnh hoặc dán link..." />
                        <input type="file" id="f-image-file" accept="image/jpeg,image/png,image/gif,image/webp" hidden />
                        <button type="button" id="btn-image-pick" class="btn btn--ghost btn--sm" title="Chọn ảnh từ máy">Chọn ảnh</button>
                        <button type="button" id="btn-image-clear" class="btn btn--ghost btn--sm hidden" title="Xóa ảnh">Xóa</button>
                    </div>
                    <div id="f-image-preview" class="image-preview hidden">
                        <img id="f-image-preview-img" src="" alt="Xem trước ảnh" />
                        <span id="f-image-uploading" class="image-preview__loading hidden">Đang tải lên...</span>
                    </div>
                    <p class="hint-text">Hỗ trợ JPG, PNG, GIF, WebP. Có thể nhập link ảnh thủ công.</p>
                </div>

                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="f-isCenter" />
                        <span class="checkmark"></span>
                        Đây là trung tâm y tế (marker đỏ)
                    </label>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" id="btn-add" class="btn btn--primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Thêm trạm
                </button>
                <button type="button" id="btn-update" class="btn btn--warning hidden">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Cập nhật
                </button>
                <button type="button" id="btn-cancel-edit" class="btn btn--ghost hidden">Hủy</button>
                <button type="reset" id="btn-clear" class="btn btn--ghost">Xóa form</button>
            </div>
        </div>

        <hr class="divider" />

        <!-- Saved Stations -->
        <div class="panel-section">
            <label class="section-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Danh sách đã lưu
            </label>
            <div id="saved-list" class="saved-list">
                <div class="empty-state">Chưa có trạm nào. Hãy thêm trạm mới!</div>
            </div>
        </div>

        <hr class="divider" />

        <!-- Actions Footer -->
        <div class="panel-section actions-footer">
            <button type="button" id="btn-clear-all" class="btn btn--danger" title="Xóa hết tất cả trạm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Xóa hết
            </button>
        </div>
    </aside>

    <!-- ===== RIGHT: Map ===== -->
    <main id="map-area">
        <div id="admin-map"></div>
        <!-- Coordinate Display -->
        <div id="coord-display" class="coord-display">
            <span id="coord-text">Click vào bản đồ để lấy tọa độ</span>
        </div>
        <!-- Crosshair -->
        <div id="map-crosshair" class="map-crosshair hidden">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 3" opacity="0.6"/>
                <circle cx="16" cy="16" r="4" fill="#dc2626" opacity="0.8"/>
                <line x1="16" y1="0" x2="16" y2="10" stroke="#dc2626" stroke-width="1.5" opacity="0.5"/>
                <line x1="16" y1="22" x2="16" y2="32" stroke="#dc2626" stroke-width="1.5" opacity="0.5"/>
                <line x1="0" y1="16" x2="10" y2="16" stroke="#dc2626" stroke-width="1.5" opacity="0.5"/>
                <line x1="22" y1="16" x2="32" y2="16" stroke="#dc2626" stroke-width="1.5" opacity="0.5"/>
            </svg>
        </div>
    </main>
</div>

<script>
    var nv_base_adminurl = '{NV_BASE_ADMINURL}';
    var nv_base_siteurl = '{NV_BASE_SITEURL}';
    var nv_uploads_url = '{UPLOADS_URL}';
    var module_name = '{MODULE_NAME}';
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script src="{NV_BASE_SITEURL}modules/{MODULE_NAME}/js/admin.js"></script>
<!-- END: main -->
